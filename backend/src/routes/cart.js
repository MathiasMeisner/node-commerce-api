const express = require('express');
const { addToCart, viewCart, removeFromCart } = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, addToCart);
router.get('/', authenticateToken, viewCart);
router.delete('/:id', authenticateToken, removeFromCart);

module.exports = router;