const Alert = require('../models/Alert');
const User = require('../models/User');
const Notification = require('../models/Notification');
const GeoFenceAlert = require('../models/GeoFenceAlert');

const alertController = {
  // Create a new alert
  createAlert: async (req, res) => {
    try {
      const {
        title,
        message,
        type = 'info',
        priority = 'medium',
        targetRoles = [],
        targetUsers = [],
        scheduledFor,
        expiresAt,
        conditions = {}
      } = req.body;

      const createdBy = req.user.userId;

      const alert = new Alert({
        title,
        message,
        type,
        priority,
        targetRoles,
        targetUsers,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        conditions,
        createdBy
      });

      await alert.save();

      // If not scheduled, send immediately
      if (!scheduledFor) {
        await sendAlertToTargets(alert);
      }

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: { alert }
      });

    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create alert',
        error: error.message
      });
    }
  },

  // Get alerts for current user
  getAlerts: async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      const { page = 1, limit = 20, status = 'active' } = req.query;

      let query = {};

      // Build $and array to combine multiple $or conditions without overwriting
      const andConditions = [];

      if (status === 'active') {
        query.isActive = true;
        andConditions.push({
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        });
      }

      // Filter by target audience
      andConditions.push({
        $or: [
          { targetRoles: user.role },
          { targetRoles: 'all' },
          { targetUsers: userId }
        ]
      });

      if (andConditions.length > 0) {
        query.$and = andConditions;
      }

      const alerts = await Alert.find(query)
        .populate('createdBy', 'name role')
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Alert.countDocuments(query);

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alerts',
        error: error.message
      });
    }
  },

  // Mark alert as read
  markAsRead: async (req, res) => {
    try {
      const { alertId } = req.params;
      const userId = req.user.userId;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      // Check if user can access this alert
      if (!alert.canAccess(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      alert.markAsRead(userId);
      await alert.save();

      res.json({
        success: true,
        message: 'Alert marked as read'
      });

    } catch (error) {
      console.error('Mark alert as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alert as read',
        error: error.message
      });
    }
  },

  // Record alert response
  recordResponse: async (req, res) => {
    try {
      const { alertId } = req.params;
      const { response, notes = '' } = req.body;
      const userId = req.user.userId;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      alert.recordResponse(userId, response, notes);
      await alert.save();

      res.json({
        success: true,
        message: 'Response recorded successfully'
      });

    } catch (error) {
      console.error('Record response error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record response',
        error: error.message
      });
    }
  },

  // Update alert (admin/supervisor only)
  updateAlert: async (req, res) => {
    try {
      const { alertId } = req.params;
      const updates = req.body;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      // Only creator or admin can update
      if (alert.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update fields
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          alert[key] = updates[key];
        }
      });

      await alert.save();

      // If reactivated, resend to targets
      if (updates.isActive === true && !alert.scheduledFor) {
        await sendAlertToTargets(alert);
      }

      res.json({
        success: true,
        message: 'Alert updated successfully',
        data: { alert }
      });

    } catch (error) {
      console.error('Update alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update alert',
        error: error.message
      });
    }
  },

  // Delete alert (admin only)
  deleteAlert: async (req, res) => {
    try {
      const { alertId } = req.params;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      // Only creator or admin can delete
      if (alert.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Alert.findByIdAndDelete(alertId);

      res.json({
        success: true,
        message: 'Alert deleted successfully'
      });

    } catch (error) {
      console.error('Delete alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete alert',
        error: error.message
      });
    }
  },

  // Get alert statistics (admin only)
  getAlertStats: async (req, res) => {
    try {
      const totalAlerts = await Alert.countDocuments();
      const activeAlerts = await Alert.countDocuments({ isActive: true });
      const crisisAlerts = await Alert.countDocuments({ type: 'crisis', isActive: true });

      const alertsByType = await Alert.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      const alertsByPriority = await Alert.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          total: totalAlerts,
          active: activeAlerts,
          crisis: crisisAlerts,
          byType: alertsByType,
          byPriority: alertsByPriority
        }
      });

    } catch (error) {
      console.error('Get alert stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alert statistics',
        error: error.message
      });
    }
  },

  // Get geo-fence alerts for supervisor
  getGeoFenceAlerts: async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      const { status, limit = 50 } = req.query;

      // Build filter based on role
      let filter = {};
      
      if ((user.role || '').toLowerCase() === 'supervisor') {
        // Get patients assigned to this supervisor
        const assignedPatients = await User.find({ 
          assignedSupervisor: userId,
          role: { $regex: /^patient$/i }
        }).select('_id');
        
        const patientIds = assignedPatients.map(p => p._id);
        filter.patient = { $in: patientIds };
      }
      
      if (status) {
        filter.alertStatus = status;
      }

      const alerts = await GeoFenceAlert.find(filter)
        .populate('patient', 'name email phone')
        .populate('geoFence', 'name riskCategory zoneType')
        .populate('acknowledgedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });

    } catch (error) {
      console.error('Get geo-fence alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get geo-fence alerts',
        error: error.message
      });
    }
  },

  // Acknowledge geo-fence alert
  acknowledgeGeoFenceAlert: async (req, res) => {
    try {
      const { alertId } = req.params;
      const { notes } = req.body;
      const userId = req.user.userId;

      const alert = await GeoFenceAlert.findById(alertId);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      alert.alertStatus = 'acknowledged';
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      if (notes) alert.notes = notes;

      await alert.save();

      // Emit real-time update
      const io = global.io;
      if (io) {
        io.emit('geofence:alert:acknowledged', {
          alertId: alert._id,
          acknowledgedBy: userId,
          acknowledgedAt: alert.acknowledgedAt
        });
      }

      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        data: alert
      });

    } catch (error) {
      console.error('Acknowledge geo-fence alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge alert',
        error: error.message
      });
    }
  }
};

// Helper function to send alert to targets
async function sendAlertToTargets(alert) {
  try {
    const io = global.io; // Access io from global scope

    // Get all target users
    let targetUserIds = [];

    if (alert.targetRoles.includes('all')) {
      const allUsers = await User.find({ isActive: true }, '_id onlineStatus');
      targetUserIds = allUsers.map(u => u._id.toString());
    } else {
      for (const role of alert.targetRoles) {
        const users = await User.find({ role, isActive: true }, '_id onlineStatus');
        targetUserIds.push(...users.map(u => u._id.toString()));
      }
    }

    // Add specific target users
    if (alert.targetUsers && alert.targetUsers.length > 0) {
      targetUserIds.push(...alert.targetUsers.map(id => id.toString()));
    }

    // Remove duplicates
    targetUserIds = [...new Set(targetUserIds)];

    // Send to each user
    for (const userId of targetUserIds) {
      alert.deliveredTo.push(userId);

      // Create notification
      await Notification.createForUser(userId, {
        type: 'alert',
        title: alert.title,
        message: alert.message,
        relatedId: alert._id,
        relatedModel: 'Alert',
        priority: alert.priority,
        expiresAt: alert.expiresAt
      });

      // Real-time emission if user is online
      const user = await User.findById(userId);
      if (user && user.onlineStatus === 'online' && io) {
        io.to(`user:${userId}`).emit('alert:new', {
          _id: alert._id,
          title: alert.title,
          message: alert.message,
          type: alert.type,
          priority: alert.priority,
          createdAt: alert.createdAt
        });
      }
    }

    alert.stats.sent = targetUserIds.length;
    alert.stats.delivered = targetUserIds.length;
    await alert.save();

  } catch (error) {
    console.error('Send alert to targets error:', error);
  }
}

module.exports = alertController;