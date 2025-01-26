const pool = require('../config/dbConfig');

const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM categories');
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getCategories', error);
        res.status(500).json({ error: 'Could not get categories ' });
    }
}

module.exports = { getCategories };