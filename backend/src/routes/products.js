const express = require('express');
const { getAllProducts, getProduct, addProduct, deleteProduct, updateProduct } = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProduct);
router.post('/', authenticateToken, authorizeRole('admin'), addProduct);
router.delete('/delete/:id', authenticateToken, authorizeRole('admin'), deleteProduct);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateProduct);

module.exports = router;