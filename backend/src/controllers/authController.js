const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/dbConfig');

const SECRET_KEY = process.env.JWT_SECRET || 'secretKey';

const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'user'] // Default 'user' if not assigned
        );

        const newUser = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            token: token
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ error: 'Could not create user' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid login information' });
        }

        // Generate JWT-token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, // Payload
            SECRET_KEY,                         // Secret key
            { expiresIn: '1h' }                 // Token expires after 1 hour
        );

        // Debugging: Log the user ID and token
        console.log("User logged in. User ID:", user.id, "Token:", token);

        res.json({ token });
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ error: 'Could not log in' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({ error: 'Could not get profile' });
    }
};

const searchUsers = async (req, res) => {
    const { email } = req.query;

    try {
        const query = `SELECT id, email FROM users WHERE email LIKE $1`;
        const result = await pool.query(query, [`%${email}%`]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Error in searchUsers:', error);
        res.status(500).json({ error: 'Could not complete search' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ error: 'Could not delete user' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    searchUsers,
    deleteUser
};
