const express = require('express');
const { placeOrder, getOrderHistory, getOrderDetails } = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, placeOrder);
router.get('/', authenticateToken, getOrderHistory);
router.get('/:id', authenticateToken, getOrderDetails);

module.exports = router;
