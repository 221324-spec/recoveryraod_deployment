const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// SECURITY: All message routes require proper authentication - no bypasses
router.use(authenticate);

// Send a message
router.post('/', messageController.sendMessage);

// Get all conversations for current user
router.get('/', messageController.getConversations);

// Get conversation with specific user
router.get('/conversation/:userId', messageController.getConversation);

// Mark message as read
router.patch('/:messageId/read', messageController.markAsRead);

// Delete message
router.delete('/:messageId', messageController.deleteMessage);

// Get unread message count
router.get('/unread/count', messageController.getUnreadCount);

module.exports = router;
