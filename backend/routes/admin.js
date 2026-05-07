const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');

// PRODUCTION MODE - All security checks enforced

// Middleware to check admin role - no bypasses
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Case-insensitive role check
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin access'
    });
  }
};

// SECURITY: Always require proper authentication
router.use(authenticate);

router.use(requireAdmin);

// ============================================
// DASHBOARD OVERVIEW
// ============================================

// GET /api/admin/stats - System-wide statistics
router.get('/stats', adminController.getSystemStats);

// GET /api/admin/alerts - Global alerts stream
router.get('/alerts', adminController.getGlobalAlerts);

// GET /api/admin/analytics/alerts - Alert analytics for charts
router.get('/analytics/alerts', adminController.getAlertAnalytics);

// GET /api/admin/analytics/moods - Mood analytics for charts
router.get('/analytics/moods', adminController.getMoodAnalytics);

// GET /api/admin/analytics/activities - Activity analytics
router.get('/analytics/activities', adminController.getActivityAnalytics);

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - Get all users
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:userId - Get user details
router.get('/users/:userId', adminController.getUserDetails);

// PUT /api/admin/users/:userId/status - Update user status
router.put('/users/:userId/status', adminController.updateUserStatus);

// POST /api/admin/users/assign-patient - Assign patient to supervisor
router.post('/users/assign-patient', adminController.assignPatientToSupervisor);

// DELETE /api/admin/users/:userId - Delete user
router.delete('/users/:userId', adminController.deleteUser);

// ============================================
// EXPORT ROUTES
// ============================================

// GET /api/admin/export/users - Export users data
router.get('/export/users', adminController.exportUsers);

// GET /api/admin/export/organizations - Export organizations data  
router.get('/export/organizations', adminController.exportOrganizations);

// GET /api/admin/export/alerts - Export alerts data
router.get('/export/alerts', adminController.exportAlerts);

// GET /api/admin/export/moods - Export mood entries
router.get('/export/moods', adminController.exportMoods);

// GET /api/admin/export/activities - Export activities
router.get('/export/activities', adminController.exportActivities);

// GET /api/admin/export/system-report - Full system report
router.get('/export/system-report', adminController.exportSystemReport);

module.exports = router;
