const express = require('express');
const pool = require('../config/dbConfig');
const router = express.Router();

// Get list of users
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Could not get users' });
    }
});

module.exports = router;
