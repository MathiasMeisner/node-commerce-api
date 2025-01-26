const pool = require('../config/dbConfig');

const addToCart = async (req, res) => {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;  // Extract user from JWT token

    try {
        // Check if product exists
        const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [product_id]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if the product is already in the cart
        const cartCheck = await pool.query(
            "SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2",
            [user_id, product_id]
        );

        if (cartCheck.rows.length > 0) {
            // If the product is already in the cart, update quantity
            const newQuantity = cartCheck.rows[0].quantity + quantity;
            await pool.query(
                "UPDATE cart SET quantity = $1 WHERE id = $2",
                [newQuantity, cartCheck.rows[0].id]
            );
            return res.json({ message: "Cart updated", product_id, quantity: newQuantity });
        }

        // Otherwise, insert new cart item
        await pool.query(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)",
            [user_id, product_id, quantity]
        );

        res.status(201).json({ message: "Product added to cart", product_id, quantity });

    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ error: "Could not add to cart" });
    }
};

const viewCart = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            `SELECT c.id, p.name, p.price, c.quantity, (p.price * c.quantity) AS total_price
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error in viewCart:", error);
        res.status(500).json({ error: "Could not get cart" });
    }
};

const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            "DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cart item not found" });
        }

        res.json({ message: "Item removed from cart", item: result.rows[0] });

    } catch (error) {
        console.error("Error in removeFromCart:", error);
        res.status(500).json({ error: "Could not remove item from cart" });
    }
};

module.exports = { addToCart, viewCart, removeFromCart };
