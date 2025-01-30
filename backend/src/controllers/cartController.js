const pool = require('../config/dbConfig');
const { v4: uuidv4 } = require('uuid'); // For generating cart_id

// Helper function to get cart_id from cookies or generate a new one
const getCartId = (req, res) => {
    console.log("Cookies:", req.cookies); // Debugging

    let cart_id = req.cookies?.cart_id;

    if (!cart_id) {
        cart_id = uuidv4();
        res.cookie('cart_id', cart_id, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    }

    return cart_id;
};

// Add product to cart (guest or logged-in user)
const addToCart = async (req, res) => {
    const { product_id, quantity } = req.body;
    const user_id = req.user ? req.user.id : null;
    const cart_id = user_id ? null : getCartId(req, res); // Get or set cart_id from cookie

    try {
        console.log("Incoming request:", { product_id, quantity, user_id, cart_id });

        // Check if product exists
        const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [product_id]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        // **Fix: Ensure we reuse the same guest cart**
        let cart = await pool.query("SELECT cart_id FROM cart WHERE user_id = $1 OR cart_id = $2::UUID", [user_id, cart_id]);

        let cart_id_to_use;
        if (cart.rows.length === 0) {
            console.log("Creating new cart...");
            cart_id_to_use = cart_id; // Use the same cart_id from the cookie
            await pool.query(
                "INSERT INTO cart (user_id, cart_id) VALUES ($1, $2)",
                [user_id, cart_id_to_use]
            );
        } else {
            cart_id_to_use = cart.rows[0].cart_id;
        }

        console.log("Cart ID to use:", cart_id_to_use);

        // Check if product is already in cart_items
        const cartItemCheck = await pool.query(
            "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
            [cart_id_to_use, product_id]
        );

        console.log("Existing cart item check:", cartItemCheck.rows);

        if (cartItemCheck.rows.length > 0) {
            const newQuantity = cartItemCheck.rows[0].quantity + quantity;
            console.log("Updating existing cart item to quantity:", newQuantity);

            await pool.query(
                "UPDATE cart_items SET quantity = $1 WHERE id = $2",
                [newQuantity, cartItemCheck.rows[0].id]
            );

            return res.json({ message: "Cart updated", product_id, quantity: newQuantity });
        }

        console.log("Inserting new item into cart_items...");
        await pool.query(
            "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)",
            [cart_id_to_use, product_id, quantity]
        );

        return res.status(201).json({ message: "Product added to cart", product_id, quantity });

    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ error: "Could not add to cart" });
    }
};

// View cart (guest or logged-in user)
const CART_EXPIRY_MINUTES = 5; // Cart expires after 5 minutes

const viewCart = async (req, res) => {
    const user_id = req.user?.id;

    try {
        console.log("Fetching cart for user_id:", user_id);

        let cart_id = null;

        if (user_id) {
            // Fetch the user's cart
            const userCart = await pool.query(
                "SELECT cart_id, created_at FROM cart WHERE user_id = $1",
                [user_id]
            );

            if (userCart.rows.length > 0) {
                const cart = userCart.rows[0];
                const created_at = new Date(cart.created_at).getTime();
                const now = Date.now();

                // Check if the cart has expired
                if (now - created_at > CART_EXPIRY_MINUTES * 60 * 1000) {
                    console.log("Cart has expired. Deleting...");
                    await pool.query("DELETE FROM cart WHERE cart_id = $1", [cart.cart_id]);
                    return res.json([]); // Return empty array if cart is expired
                }

                cart_id = cart.cart_id;
                console.log("User is logged in. Using user_cart_id:", cart_id);
            } else {
                console.log("No cart found for user_id:", user_id);
                return res.json([]); // Return empty array if no cart exists
            }
        } else {
            // Guest users: Get cart_id from cookies
            cart_id = getCartId(req, res);
            if (!cart_id) {
                console.log("No guest cart_id found in cookies.");
                return res.json([]); // No guest cart exists
            }

            // Fetch the guest cart and check if it has expired
            const guestCart = await pool.query(
                "SELECT created_at FROM cart WHERE cart_id = $1",
                [cart_id]
            );

            if (guestCart.rows.length > 0) {
                const created_at = new Date(guestCart.rows[0].created_at).getTime();
                const now = Date.now();

                // Check if the cart has expired
                if (now - created_at > CART_EXPIRY_MINUTES * 60 * 1000) {
                    console.log("Guest cart has expired. Deleting...");
                    await pool.query("DELETE FROM cart WHERE cart_id = $1", [cart_id]);
                    res.clearCookie("cart_id"); // Clear the guest cart cookie
                    return res.json([]); // Return empty array if cart is expired
                }
            }

            console.log("Guest user. Using guest cart_id:", cart_id);
        }

        console.log("Final cart_id used for fetching:", cart_id);

        const cartItems = await pool.query(
            `SELECT ci.id, ci.product_id, p.name, p.price, ci.quantity, (p.price * ci.quantity) AS total_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1::UUID`,
            [cart_id]
        );

        console.log("Cart items retrieved:", cartItems.rows);
        res.json(cartItems.rows);
    } catch (error) {
        console.error("Error in viewCart:", error);
        res.status(500).json({ error: "Could not retrieve cart" });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user ? req.user.id : null;
    const cart_id = user_id ? null : getCartId(req, res);

    try {
        const result = await pool.query(
            `DELETE FROM cart_items 
             USING cart 
             WHERE cart_items.id = $1 
             AND (cart.user_id = $2 OR cart.cart_id = $3) 
             RETURNING cart_items.*`,
            [id, user_id, cart_id]
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

// Merge guest cart into user cart on login
const mergeGuestCart = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
    }

    const user_id = req.user.id;
    const guest_cart_id = req.cookies.cart_id; // Guest cart_id from cookies

    if (!guest_cart_id) {
        return res.status(200).json({ message: "No guest cart to merge" });
    }

    try {
        console.log("Merging guest cart:", guest_cart_id, "into user cart for user_id:", user_id);

        // Step 1: Ensure the user has a cart
        let userCart = await pool.query(
            "SELECT cart_id FROM cart WHERE user_id = $1",
            [user_id]
        );

        let user_cart_id;
        if (userCart.rows.length === 0) {
            // If the user doesn't have a cart, assign the guest cart to the user
            console.log("Assigning guest cart to user...");
            await pool.query(
                "UPDATE cart SET user_id = $1 WHERE cart_id = $2",
                [user_id, guest_cart_id]
            );
            user_cart_id = guest_cart_id;
        } else {
            // If the user already has a cart, merge the guest cart items into the user's cart
            user_cart_id = userCart.rows[0].cart_id;
            console.log("User already has a cart. Merging items...");

            // Move Guest Cart Items to User Cart
            const cartItemsTransfer = await pool.query(
                `INSERT INTO cart_items (cart_id, product_id, quantity)
                 SELECT $1, product_id, quantity FROM cart_items WHERE cart_id = $2
                 ON CONFLICT (cart_id, product_id) 
                 DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
                 RETURNING *`,
                [user_cart_id, guest_cart_id]
            );

            console.log("Cart items transferred:", cartItemsTransfer.rows);

            if (cartItemsTransfer.rows.length === 0) {
                console.error("ERROR: No cart items were moved during merge!");
            }

            // Delete the Guest Cart Items
            await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [guest_cart_id]);
        }

        // Step 2: Delete the Guest Cart
        await pool.query("DELETE FROM cart WHERE cart_id = $1", [guest_cart_id]);

        console.log("Updated user_cart_id:", user_cart_id);

        // Step 3: Clear the guest cart cookie
        res.clearCookie("cart_id");

        res.json({ message: "Guest cart merged into user cart" });

    } catch (error) {
        console.error("Error in mergeGuestCart:", error);
        res.status(500).json({ error: "Could not merge guest cart" });
    }
};

module.exports = { addToCart, viewCart, removeFromCart, mergeGuestCart };
