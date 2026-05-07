// backend/middleware/roleMiddleware.js
const { roleKey } = require('../utils/roles');

const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (roleKey(req.user.role) !== roleKey(requiredRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredRole} role required.`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;