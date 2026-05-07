const router = require('express').Router();
const organizationController = require('../controllers/organizationController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');

const isDev = process.env.NODE_ENV !== 'production';

// Middleware to check admin role - with dev mode support
const requireAdmin = async (req, res, next) => {
  try {
    // In dev mode, if no user, create a mock admin context
    if (!req.user && isDev) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        req.user = { userId: adminUser._id, email: adminUser.email, role: 'admin' };
      } else {
        const ngoUser = await User.findOne({ role: 'ngo' });
        if (ngoUser) {
          req.user = { userId: ngoUser._id, email: ngoUser.email, role: 'ngo' };
        }
      }
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Allow both admin and ngo roles
    const roleNormalized = req.user.role.toLowerCase();
    if (roleNormalized !== 'admin' && roleNormalized !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Admin or NGO access required'
      });
    }
    next();
  } catch (error) {
    console.error('Organizations auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify access',
      error: isDev ? error.message : undefined
    });
  }
};

// Apply authentication - optional in dev, required in production
if (isDev) {
  router.use(optionalAuth);
} else {
  router.use(authenticate);
}

router.use(requireAdmin);

// ============================================
// ORGANIZATION CRUD
// ============================================

// POST /api/organizations - Create new organization
router.post('/', organizationController.addOrganization);

// GET /api/organizations - Get all organizations
router.get('/', organizationController.getOrganizations);

// GET /api/organizations/compare - Compare multiple organizations
router.get('/compare', organizationController.compareOrganizations);

// GET /api/organizations/:id - Get single organization details
router.get('/:id', organizationController.getOrganizationById);

// PUT /api/organizations/:id - Update organization
router.put('/:id', organizationController.updateOrganization);

// DELETE /api/organizations/:id - Delete organization
router.delete('/:id', organizationController.deleteOrganization);

// ============================================
// ORGANIZATION ANALYTICS
// ============================================

// GET /api/organizations/:id/stats - Get organization performance stats
router.get('/:id/stats', organizationController.getOrganizationStats);

// GET /api/organizations/:id/reports - Get detailed reports for organization
router.get('/:id/reports', organizationController.getOrganizationReports);

// ============================================
// ORGANIZATION USERS
// ============================================

// POST /api/organizations/:id/supervisors - Assign supervisor to organization
router.post('/:id/supervisors', organizationController.assignSupervisor);

// DELETE /api/organizations/:id/supervisors/:supervisorId - Remove supervisor
router.delete('/:id/supervisors/:supervisorId', organizationController.removeSupervisor);

// GET /api/organizations/:id/patients - Get all patients under organization
router.get('/:id/patients', organizationController.getOrganizationPatients);

module.exports = router;
