const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { roleKey, rolesMatch } = require('../utils/roles');

// SECURITY: Add user status validation for authentication
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Handle malformed tokens gracefully
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'recoveryroad-secret-key');
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    
    // Support both 'id' and 'userId' in token payload
    const tokenUserId = decoded.userId || decoded.id;
    const user = await User.findById(tokenUserId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (decoded.role && !rolesMatch(user.role, decoded.role)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token role.'
      });
    }

    // NGO and Admin accounts bypass the isActive check — they manage the system.
    // Also auto-heal the isActive flag if it's unset for these privileged roles.
    const roleUpper = user.role.toUpperCase();
    const isPrivilegedRole = roleUpper === 'NGO' || roleUpper === 'ADMIN' || roleUpper === 'SUPERVISOR';

    if (!user.isActive) {
      if (isPrivilegedRole) {
        // Auto-heal: set isActive true for privileged accounts that are missing the flag
        await User.findByIdAndUpdate(user._id, { isActive: true });
        user.isActive = true;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }
    }

    // SECURITY: Check user status for proper workflow
    // Only 'approved', 'assigned', or 'active' users can access the system
    // NGO and Admin roles can always access (case-insensitive check)
    const userRoleUpper = user.role.toUpperCase();
    const allowedStatuses = ['approved', 'assigned', 'active'];
    
    if (userRoleUpper !== 'NGO' && userRoleUpper !== 'ADMIN' && user.status && !allowedStatuses.includes(user.status)) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an administrator to approve your account.'
      });
    }

    req.user = {
      _id: user._id,
      userId: user._id,
      role: user.role,
      email: user.email,
      status: user.status
    };
    req.currentUser = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Optional authentication - allows requests without token in development
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // No token - continue without user context (allowed in dev mode)
      req.user = null;
      return next();
    }

    // Try to decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'recoveryroad-secret-key');
    } catch (jwtError) {
      // Invalid token - continue without user context in dev
      req.user = null;
      return next();
    }
    
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        role: user.role,
        email: user.email
      };
      req.currentUser = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Don't fail, just continue without user
    req.user = null;
    next();
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    const normalizedAllowed = roles.map((role) => roleKey(role)).filter(Boolean);
    const normalizedUserRole = roleKey(req.user.role);

    if (!normalizedAllowed.includes('all') && normalizedAllowed.length && !normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check if user owns resource or has admin access
const ownsResource = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.userId;
      const resource = await getResourceById(req.params.resourceType, resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      if (roleKey(req.user.role) === 'admin') {
        req.resource = resource;
        return next();
      }

      // NGO can access patient data
      if (roleKey(req.user.role) === 'ngo' && roleKey(resource.role) === 'patient') {
        req.resource = resource;
        return next();
      }

      // Supervisor can access their assigned patients
      if (roleKey(req.user.role) === 'supervisor' && resourceUserId?.toString() === req.user.userId.toString()) {
        req.resource = resource;
        return next();
      }

      // User owns the resource
      if (resourceUserId?.toString() === req.user.userId.toString()) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resource.'
      });

    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed.'
      });
    }
  };
};

// Helper function to get resource by ID
async function getResourceById(resourceType, id) {
  const models = {
    user: require('../models/User'),
    message: require('../models/Message'),
    appointment: require('../models/Appointment'),
    moodentry: require('../models/MoodEntry'),
    activity: require('../models/Activity'),
    triggerlog: require('../models/TriggerLog'),
    alert: require('../models/Alert'),
    notification: require('../models/Notification')
  };

  const Model = models[resourceType.toLowerCase()];
  if (!Model) return null;

  return await Model.findById(id);
}

// Check if user can access patient data
const canAccessPatient = (patientId) => {
  return async (req, res, next) => {
    try {
      const patient = await User.findById(patientId);
      if (!patient || roleKey(patient.role) !== 'patient') {
        return res.status(404).json({
          success: false,
          message: 'Patient not found.'
        });
      }

      // Admin can access all patients
      if (roleKey(req.user.role) === 'admin') {
        req.patient = patient;
        return next();
      }

      // NGO can access all patients
      if (roleKey(req.user.role) === 'ngo') {
        req.patient = patient;
        return next();
      }

      // Supervisor can access assigned patients
      if (roleKey(req.user.role) === 'supervisor') {
        const supervisor = await User.findById(req.user.userId);
        if (supervisor && patient.assignedSupervisor?.toString() === supervisor._id.toString()) {
          req.patient = patient;
          return next();
        }
      }

      // Patient can access their own data
      if (patient._id.toString() === req.user.userId.toString()) {
        req.patient = patient;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot access this patient\'s data.'
      });

    } catch (error) {
      console.error('Patient access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Access check failed.'
      });
    }
  };
};

// Rate limiting for sensitive operations
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user?.userId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  ownsResource,
  canAccessPatient,
  rateLimit
};
