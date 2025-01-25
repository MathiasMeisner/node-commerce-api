const pool = require('../config/dbConfig');

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ error: 'Could not get users' });
    }
};

module.exports = { getAllUsers };