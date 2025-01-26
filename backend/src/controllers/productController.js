const pool = require('../config/dbConfig');

const getAllProducts = async (req, res) => {
    const { category, sort } = req.query; // Get query parameters
    let query = `SELECT p.id, p.name, p.description, p.price, p.stock, p.created_at, c.name AS category_name
                 FROM products p
                 JOIN categories c ON p.category_id = c.id`;
    let queryParams = [];

    // Filtering by category
    if (category) {
        queryParams.push(category);
        query += ` WHERE c.name = $${queryParams.length}`;
    }

    // Sorting
    if (sort) {
        let sortColumn = "p.price"; // Default sorting column
        let sortOrder = "ASC"; // Default order

        if (sort === "price_desc") sortOrder = "DESC";
        else if (sort === "name_asc") sortColumn = "p.name";
        else if (sort === "name_desc") {
            sortColumn = "p.name";
            sortOrder = "DESC";
        }
        else if (sort === "newest") {
            sortColumn = "p.created_at";
            sortOrder = "DESC"; // Newest first
        }
        else if (sort === "oldest") {
            sortColumn = "p.created_at";
            sortOrder = "ASC"; // Oldest first
        }

        query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    }

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.status(500).json({ error: "Could not get products" });
    }
};


const getProduct = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description, price, stock, category_id, created_at FROM products WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in getProduct', error);
        res.status(500).json({ error: 'Could not get product' });
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

const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Error in deleteProduct', error);
        res.status(500).json({ error: 'Could not delete product' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, category_id } = req.body;

    try {
        // Check if product exists
        const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [id]);

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Update only the provided fields
        const result = await pool.query(
            `UPDATE products
            SET 
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                price = COALESCE($3, price),
                stock = COALESCE($4, stock),
                category_id = COALESCE($5, category_id)
            WHERE id = $6
            RETURNING *`,
            [name, description, price, stock, category_id, id]
        );

        res.json({ message: "Product updated", product: result.rows[0] });
    } catch (error) {
        console.error("Error in updateProduct:", error);
        res.status(500).json({ error: "Could not update product" });
    }
};

module.exports = { getAllProducts, getProduct, addProduct, deleteProduct, updateProduct };