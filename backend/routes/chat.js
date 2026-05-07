/**
 * Chat Routes — Phase 1
 *
 * POST /api/chat/send    — patient sends message
 * GET  /api/chat/history — patient loads conversation
 */

const express = require('express');
const router = express.Router();
const { sendMessage, getHistory } = require('../controllers/chatController');

// Use the project's primary auth middleware
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(authenticate);

// Allow any authenticated user to use the chatbot
router.post('/send', sendMessage);
router.get('/history', getHistory);

module.exports = router;
