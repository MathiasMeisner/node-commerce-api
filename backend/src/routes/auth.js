const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/dbConfig');
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'secretKey';

// Register user and return JWT token
router.post('/register', async (req, res) => {
    const { email, password} = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );

        const newUser = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Return user data + JWT token
        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            token: token
        });
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ error: 'Could not create user' });
    }
});

// Login + generate JWT-token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid login information' });
        }

        // Generate JWT-token
        const token = jwt.sign(
            { id: user.id, email: user.email }, // Payload
            SECRET_KEY,                         // Secret key
            { expiresIn: '1h' }                 // Token expires after 1 hour
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Could not log in' });
    }
});

const { authenticateToken, authorizeRole } = require('../middleware/auth'); // Import middleware

// Protected endpoint: Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Use users id from verified token
        const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]); // Return user id and email
    } catch (error) {
        res.status(500).json({ error: 'Could not get profile' });
    }
});


// Search function - find users based on email
router.get('/search', async (req, res) => {
    const { email } = req.query;

    try {
        // Secure code with parameterized queries
        const query = `SELECT id, email FROM users WHERE email LIKE $1`;
        const result = await pool.query(query, [`%${email}%`]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Could not complete search' });
    }
});

// Delete users (admins only)
router.delete('/delete/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Could not delete user' });
    }
});

module.exports = router;