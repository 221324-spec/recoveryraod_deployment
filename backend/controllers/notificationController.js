const Notification = require('../models/Notification');

const notificationController = {
  // Get notifications for current user
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, read, type } = req.query;

      let query = { recipient: userId };

      if (read !== undefined) {
        query.read = read === 'true';
      }

      if (type) {
        query.type = type;
      }

      const notifications = await Notification.find(query)
        .populate('createdBy', 'name role profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        read: false
      });

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
        error: error.message
      });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      notification.markAsRead();
      await notification.save();

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.userId;

      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true, readAt: new Date() }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  },

  // Get notification preferences
  getPreferences: async (req, res) => {
    try {
      const user = req.currentUser;

      res.json({
        success: true,
        data: {
          preferences: user.preferences.notifications
        }
      });

    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification preferences',
        error: error.message
      });
    }
  },

  // Update notification preferences
  updatePreferences: async (req, res) => {
    try {
      const { email, sms, push } = req.body;
      const userId = req.user.userId;

      const user = await require('../models/User').findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (email !== undefined) user.preferences.notifications.email = email;
      if (sms !== undefined) user.preferences.notifications.sms = sms;
      if (push !== undefined) user.preferences.notifications.push = push;

      await user.save();

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: {
          preferences: user.preferences.notifications
        }
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error.message
      });
    }
  },

  // Get unread count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.userId;
      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount }
      });

    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }
};

module.exports = notificationController;