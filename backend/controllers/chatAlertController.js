/**
 * Chat Alert Controller — Phase 1
 *
 * Handles supervisor-facing alert operations for chatbot-generated alerts:
 *   GET  /api/chat-alerts           — list alerts (filter by status)
 *   GET  /api/chat-alerts/:id       — single alert detail
 *   POST /api/chat-alerts/:id/close — close an alert
 */

const ChatAlert = require('../models/ChatAlert');
const ChatMessage = require('../models/ChatMessage');

/**
 * GET /api/chat-alerts?status=open|closed
 * Supervisors & Admins only.
 */
const getAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status === 'open' || req.query.status === 'closed') {
      filter.status = req.query.status;
    }

    const alerts = await ChatAlert.find(filter)
      .sort({ createdAt: -1 })
      .populate('patientId', 'firstName lastName email profilePicture')
      .populate('closedBy', 'firstName lastName')
      .lean();

    return res.status(200).json({ alerts });
  } catch (err) {
    console.error('[ChatAlertController] getAlerts error:', err);
    return res.status(500).json({ error: 'Could not load alerts.' });
  }
};

/**
 * GET /api/chat-alerts/:id
 */
const getAlertById = async (req, res) => {
  try {
    const alert = await ChatAlert.findById(req.params.id)
      .populate('patientId', 'firstName lastName email profilePicture phone')
      .populate('closedBy', 'firstName lastName')
      .lean();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    // Also fetch the patient's recent chat messages for context
    const chatHistory = await ChatMessage.find({ patientId: alert.patientId._id || alert.patientId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      alert,
      chatHistory: chatHistory.reverse(), // oldest first
    });
  } catch (err) {
    console.error('[ChatAlertController] getAlertById error:', err);
    return res.status(500).json({ error: 'Could not load alert details.' });
  }
};

/**
 * POST /api/chat-alerts/:id/close
 * Body: { closedBy } — optional, defaults to req.user
 */
const closeAlert = async (req, res) => {
  try {
    const closedBy = req.user?.userId || req.user?._id;

    const alert = await ChatAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    if (alert.status === 'closed') {
      return res.status(400).json({ error: 'Alert is already closed.' });
    }

    alert.status = 'closed';
    alert.closedAt = new Date();
    alert.closedBy = closedBy;
    await alert.save();

    // Notify connected clients that the alert was closed
    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('alert_closed', {
        _id: alert._id,
        status: 'closed',
        closedAt: alert.closedAt,
        closedBy,
      });
    }

    return res.status(200).json({ alert });
  } catch (err) {
    console.error('[ChatAlertController] closeAlert error:', err);
    return res.status(500).json({ error: 'Could not close alert.' });
  }
};

module.exports = { getAlerts, getAlertById, closeAlert };
