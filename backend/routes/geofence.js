const router = require('express').Router();
const geoFenceController = require('../controllers/geoFenceController');
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
    
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    console.error('GeoFence auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify access'
    });
  }
};

// SECURITY: Always require proper authentication
router.use(authenticate);

router.use(requireAdmin);

// ============================================
// GEO-FENCE ALERTS (before :id routes to prevent matching)
// ============================================

// GET /api/geofence/alerts - Get all geo-fence alerts (primary endpoint)
router.get('/alerts', geoFenceController.getAllAlerts);

// GET /api/geofence/alerts/all - Get all geo-fence alerts (legacy endpoint)
router.get('/alerts/all', geoFenceController.getAllAlerts);

// PUT /api/geofence/alerts/:alertId/acknowledge - Acknowledge an alert
router.put('/alerts/:alertId/acknowledge', geoFenceController.acknowledgeAlert);

// ============================================
// GEO-FENCE CRUD
// ============================================

// POST /api/geofence - Create new geo-fence zone
router.post('/', geoFenceController.createGeoFence);

// GET /api/geofence - Get all geo-fence zones
router.get('/', geoFenceController.getAllGeoFences);

// GET /api/geofence/:id - Get single geo-fence details
router.get('/:id', geoFenceController.getGeoFenceById);

// PUT /api/geofence/:id - Update geo-fence zone
router.put('/:id', geoFenceController.updateGeoFence);

// DELETE /api/geofence/:id - Delete geo-fence zone
router.delete('/:id', geoFenceController.deleteGeoFence);

// GET /api/geofence/:id/alerts - Get all alerts for specific zone
router.get('/:id/alerts', geoFenceController.getZoneAlerts);

module.exports = router;
