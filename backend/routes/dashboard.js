const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

// Get dashboard data (authenticated - uses logged-in user)
router.get('/', authMiddleware, dashboardController.getDashboard);

// Get real-time stats
router.get('/stats', authMiddleware, dashboardController.getRealtimeStats);

module.exports = router;