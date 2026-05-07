const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { roleKey, rolesMatch } = require('../utils/roles');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const secret = process.env.JWT_SECRET || 'recoveryroad-secret-key';
    const payload = jwt.verify(token, secret);

    const user = await User.findById(payload.userId || payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (payload.role && !rolesMatch(user.role, payload.role)) {
      return res.status(401).json({ error: 'Invalid token role' });
    }
    if (user.isBlocked) return res.status(403).json({ error: 'User is blocked' });
    
    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before accessing this resource.'
      });
    }

    // NGO and Admin accounts bypass the isActive check — they manage the system.
    // Also auto-heal the isActive flag if it's unset for these privileged roles.
    const roleNormalized = user.role.toUpperCase();
    const isPrivilegedRole = roleNormalized === 'NGO' || roleNormalized === 'ADMIN' || roleNormalized === 'SUPERVISOR';

    if (!user.isActive) {
      if (isPrivilegedRole) {
        // Auto-heal: set isActive true for privileged accounts that are missing the flag
        await User.findByIdAndUpdate(user._id, { isActive: true });
        user.isActive = true;
      } else {
        return res.status(403).json({
          error: 'Account deactivated',
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated. Please contact support.'
        });
      }
    }
    
    // Check approval status for Patient and Supervisor roles
    // Admin and NGO roles don't need approval
    if ((roleNormalized === 'PATIENT' || roleNormalized === 'SUPERVISOR') && 
        user.status !== 'approved' && user.status !== 'assigned' && user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        code: 'PENDING_APPROVAL',
        message: 'Your account is pending approval from an NGO administrator. You will be notified once approved.',
        status: user.status
      });
    }

    req.user = user;
    req.user.userId = user._id; // Alias for backward compatibility
    req.user.roleKey = roleKey(user.role);
    next();
  } catch (err) {
    console.error('auth error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (allowed.length && !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient role' });
  }
  next();
};

module.exports = { authMiddleware, requireRole };
