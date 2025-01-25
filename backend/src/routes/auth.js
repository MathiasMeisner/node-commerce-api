const express = require('express');
const {
    registerUser,
    loginUser,
    getUserProfile,
    searchUsers,
    deleteUser
} = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticateToken, getUserProfile);
router.get('/search', searchUsers);
router.delete('/delete/:id', authenticateToken, authorizeRole('admin'), deleteUser);

module.exports = router;