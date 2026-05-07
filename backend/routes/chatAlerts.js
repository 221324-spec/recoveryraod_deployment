/**
 * Chat Alert Routes — Phase 1
 *
 * GET  /api/chat-alerts           — list alerts
 * GET  /api/chat-alerts/:id       — alert detail
 * POST /api/chat-alerts/:id/close — close alert
 *
 * Restricted to Supervisor and Admin roles.
 */

const express = require('express');
const router = express.Router();
const { getAlerts, getAlertById, closeAlert } = require('../controllers/chatAlertController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('Supervisor', 'Admin'));

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.post('/:id/close', closeAlert);

module.exports = router;
