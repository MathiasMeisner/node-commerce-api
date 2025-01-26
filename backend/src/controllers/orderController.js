const pool = require('../config/dbConfig');

const placeOrder = async (req, res) => {
    const user_id = req.user.id;

    try {
        // Get all cart items for the user
        const cartItems = await pool.query(
            `SELECT c.product_id, c.quantity, p.price 
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [user_id]
        );

        if (cartItems.rows.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // Calculate total order price
        let totalPrice = 0;
        cartItems.rows.forEach(item => {
            totalPrice += item.price * item.quantity;
        });

        // Insert into orders table (now includes total_price)
        const orderResult = await pool.query(
            "INSERT INTO orders (user_id, total_price) VALUES ($1, $2) RETURNING id",
            [user_id, totalPrice]
        );
        const order_id = orderResult.rows[0].id;

        // Insert each item into order_items table (now includes price)
        for (const item of cartItems.rows) {
            await pool.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                [order_id, item.product_id, item.quantity, item.price]
            );
        }

        // Clear the user's cart
        await pool.query("DELETE FROM cart WHERE user_id = $1", [user_id]);

        res.status(201).json({ message: "Order placed successfully", order_id, total_price: totalPrice });

    } catch (error) {
        console.error("Error in placeOrder:", error);
        res.status(500).json({ error: "Could not place order" });
    }
};

const getOrderHistory = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            "SELECT id, total_price, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error in getOrderHistory:", error);
        res.status(500).json({ error: "Could not retrieve orders" });
    }
};

const getOrderDetails = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Fetch the order
        const orderResult = await pool.query(
            "SELECT id, total_price, created_at FROM orders WHERE id = $1 AND user_id = $2",
            [id, user_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Fetch order items
        const itemsResult = await pool.query(
            `SELECT p.name, oi.quantity, oi.price
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        res.json({
            order: orderResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error("Error in getOrderDetails:", error);
        res.status(500).json({ error: "Could not retrieve order details" });
    }
};

module.exports = { placeOrder, getOrderHistory, getOrderDetails };
