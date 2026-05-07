const router = require('express').Router();
const geoFenceController = require('../controllers/geoFenceController');
const { authenticate } = require('../middleware/authMiddleware');

// Patient location tracking endpoint
// POST /api/patient/location
router.post('/location', authenticate, geoFenceController.checkPatientLocation);

module.exports = router;
