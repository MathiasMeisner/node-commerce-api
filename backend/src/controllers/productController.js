const pool = require('../config/dbConfig');

const getAllProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT name, price, stock FROM products');
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getAllProducts', error);
        res.status(500).json({ error: 'Could not get products' });
    }
};

const addProduct = async (req, res) => {
    const { name, description, price, stock, category_id } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, stock, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, price, stock, category_id, created_at',
            [name, description, price, stock, category_id]      
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error in getCategories', error);
        res.status(500).json({ error: 'Could not get categories' });
    }
}

module.exports = { getAllProducts, addProduct };