const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize, rateLimit } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', rateLimit(15 * 60 * 1000, 5), authController.register);
router.post('/login', rateLimit(15 * 60 * 1000, 10), authController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', rateLimit(60 * 60 * 1000, 3), authController.changePassword);
router.post('/logout', authController.logout);

// Admin only routes
router.get('/users', authorize('admin'), authController.getAllUsers);
router.put('/users/:userId/status', authorize('admin'), authController.updateUserStatus);

module.exports = router;


