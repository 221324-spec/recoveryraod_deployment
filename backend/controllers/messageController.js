const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { roleKey } = require('../utils/roles');

const messageController = {
  // Send a new message
  sendMessage: async (req, res) => {
    try {
      const { receiverId, content, messageType = 'text', isCrisis = false, isUrgent = false, priority = 'normal' } = req.body;
      const senderId = req.user.userId;

      // Validate receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      // Get sender information
      const sender = await User.findById(senderId);
      if (!sender) {
        return res.status(404).json({
          success: false,
          message: 'Sender not found'
        });
      }

      // Validate communication permissions based on roles
      let isAuthorized = false;

      if (roleKey(sender.role) === 'patient' && roleKey(receiver.role) === 'supervisor') {
        // Patient can message their assigned supervisor
        isAuthorized = sender.assignedSupervisor && sender.assignedSupervisor.toString() === receiverId.toString();
      } else if (roleKey(sender.role) === 'supervisor' && roleKey(receiver.role) === 'patient') {
        // Supervisor can message their assigned patients
        isAuthorized = receiver.assignedSupervisor && receiver.assignedSupervisor.toString() === senderId;
      } else if (roleKey(sender.role) === 'admin' || roleKey(receiver.role) === 'admin') {
        // Admins can communicate with anyone
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to send messages to this user'
        });
      }

      // Create message
      const message = new Message({
        senderId,
        receiverId,
        content,
        messageType,
        isCrisis,
        isUrgent,
        priority
      });

      await message.save();

      // Populate sender info for response
      await message.populate('senderId', 'name role profilePicture');
      await message.populate('receiverId', 'name role profilePicture');

      // Real-time emission
      const io = req.app.get('io');
      if (io) {
        const messageData = {
          _id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          messageType: message.messageType,
          isCrisis: message.isCrisis,
          isUrgent: message.isUrgent,
          priority: message.priority,
          createdAt: message.createdAt,
          sender: {
            _id: message.senderId._id,
            name: message.senderId.name,
            role: message.senderId.role,
            profilePicture: message.senderId.profilePicture
          }
        };

        // Emit to receiver
        io.to(`user:${receiverId}`).emit('message:new', messageData);

        // Emit to sender (for multi-device support)
        io.to(`user:${senderId}`).emit('message:sent', messageData);

        // Update online status
        if (receiver.onlineStatus === 'online') {
          io.to(`user:${receiverId}`).emit('notification:new', {
            type: 'message',
            title: 'New Message',
            message: `New message from ${message.senderId.name}`,
            data: messageData
          });
        }
      }

      // Create notification for offline users
      if (receiver.onlineStatus !== 'online') {
        await Notification.createForUser(receiverId, {
          type: 'message',
          title: 'New Message',
          message: `You have a new message from ${message.senderId.name}`,
          relatedId: message._id,
          relatedModel: 'Message',
          priority: isUrgent ? 'high' : 'normal',
          actions: [{
            label: 'View Message',
            action: 'view_message',
            url: `/messages/${message._id}`
          }]
        });
      }

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  },

  // Get conversation between two users
  getConversation: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;
      const { page = 1, limit = 50 } = req.query;

      // Verify access permission
      const otherUser = await User.findById(userId);
      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if current user can access this conversation
      if (roleKey(req.user.role) !== 'admin' && roleKey(req.user.role) !== 'ngo') {
        const currentUser = await User.findById(currentUserId);
        const isAssignedPatient = roleKey(currentUser.role) === 'supervisor' &&
          otherUser.assignedSupervisor?.toString() === currentUserId.toString();
        const isAssignedSupervisor = roleKey(currentUser.role) === 'patient' &&
          currentUser.assignedSupervisor?.toString() === userId.toString();
        const isOwnConversation = userId === currentUserId.toString();

        if (!isAssignedPatient && !isAssignedSupervisor && !isOwnConversation) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Cannot view this conversation.'
          });
        }
      }

      // Get messages
      const filter = {
        $or: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      };

      const messages = await Message.find(filter)
        .populate('senderId', 'name role profilePicture onlineStatus')
        .populate('receiverId', 'name role profilePicture onlineStatus')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Message.countDocuments(filter);

      // Mark messages as read if current user is receiver
      await Message.updateMany(
        { senderId: userId, receiverId: currentUserId, read: false },
        { read: true, readAt: new Date() }
      );

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Return in chronological order
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          participant: {
            _id: otherUser._id,
            name: otherUser.name,
            role: otherUser.role,
            profilePicture: otherUser.profilePicture,
            onlineStatus: otherUser.onlineStatus,
            lastSeen: otherUser.lastSeen
          }
        }
      });

    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get conversation',
        error: error.message
      });
    }
  },

  // Get all conversations for current user
  getConversations: async (req, res) => {
    try {
      const currentUserId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      let userIds = [];

      if (roleKey(req.user.role) === 'admin' || roleKey(req.user.role) === 'ngo') {
        // Admin/NGO can see all users
        const users = await User.find({ _id: { $ne: currentUserId } }, '_id');
        userIds = users.map(u => u._id);
      } else if (roleKey(req.user.role) === 'supervisor') {
        // Supervisor can see assigned patients and other supervisors
        const patients = await User.find({ assignedSupervisor: currentUserId }, '_id');
        const supervisors = await User.find({ role: 'Supervisor', _id: { $ne: currentUserId } }, '_id');
        userIds = [...patients.map(p => p._id), ...supervisors.map(s => s._id)];
      } else {
        // Patient can see their supervisor and other patients (for peer support)
        const currentUser = await User.findById(currentUserId);
        const supervisorId = currentUser.assignedSupervisor;
        const patients = await User.find({
          role: 'Patient',
          _id: { $ne: currentUserId }
        }, '_id');
        userIds = supervisorId ? [supervisorId, ...patients.map(p => p._id)] : patients.map(p => p._id);
      }

      // Get latest message for each conversation
      const conversations = [];

      for (const userId of userIds) {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ]
        })
        .populate('senderId', 'name role profilePicture')
        .populate('receiverId', 'name role profilePicture')
        .sort({ createdAt: -1 })
        .lean();

        if (latestMessage) {
          const otherUser = latestMessage.senderId._id.toString() === currentUserId.toString()
            ? latestMessage.receiverId
            : latestMessage.senderId;

          const unreadCount = await Message.countDocuments({
            senderId: userId,
            receiverId: currentUserId,
            read: false
          });

          conversations.push({
            user: {
              _id: otherUser._id,
              name: otherUser.name,
              role: otherUser.role,
              profilePicture: otherUser.profilePicture,
              onlineStatus: await getUserOnlineStatus(otherUser._id)
            },
            lastMessage: {
              _id: latestMessage._id,
              content: latestMessage.content,
              createdAt: latestMessage.createdAt,
              isCrisis: latestMessage.isCrisis,
              isUrgent: latestMessage.isUrgent
            },
            unreadCount
          });
        }
      }

      // Sort by latest message
      conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedConversations = conversations.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          conversations: paginatedConversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: conversations.length,
            pages: Math.ceil(conversations.length / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get conversations',
        error: error.message
      });
    }
  },

  // Mark messages as read
  markAsRead: async (req, res) => {
    try {
      const { messageId } = req.params;
      const currentUserId = req.user.userId;

      const message = await Message.findOneAndUpdate(
        { _id: messageId, receiverId: currentUserId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'Message marked as read'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark message as read',
        error: error.message
      });
    }
  },

  // Get unread message count
  getUnreadCount: async (req, res) => {
    try {
      const currentUserId = req.user.userId;

      const unreadCount = await Message.countDocuments({
        receiverId: currentUserId,
        read: false
      });

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
  },

  // Delete message (soft delete by marking as deleted)
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const currentUserId = req.user.userId;

      const message = await Message.findOne({
        _id: messageId,
        $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Instead of hard delete, we could add a deletedBy field
      // For now, we'll do hard delete since the schema doesn't have soft delete
      await Message.findByIdAndDelete(messageId);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });

    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: error.message
      });
    }
  }
};

// Helper function to get user online status
async function getUserOnlineStatus(userId) {
  const user = await User.findById(userId).select('onlineStatus lastSeen');
  return {
    status: user.onlineStatus,
    lastSeen: user.lastSeen
  };
}

module.exports = messageController;