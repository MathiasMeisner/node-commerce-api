const express = require('express');
const { addToCart, viewCart, removeFromCart, mergeGuestCart } = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', addToCart);
router.get('/', (req, res, next) => {
    if (req.headers.authorization) {
        // If Authorization header is present, authenticate the user
        authenticateToken(req, res, next);
    } else {
        // If no Authorization header, proceed as guest
        next();
    }
}, viewCart);
router.delete('/:id', removeFromCart);
router.post('/merge', authenticateToken, mergeGuestCart);

module.exports = router;