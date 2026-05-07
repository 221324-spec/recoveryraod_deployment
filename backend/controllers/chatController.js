/**
 * Chat Controller — Phase 2
 *
 * Handles patient chatbot interactions:
 *   POST /api/chat/send   — send message, get analysis + bot reply (now async LLM-powered)
 *   GET  /api/chat/history — retrieve conversation history for logged-in patient
 */

const ChatMessage = require('../models/ChatMessage');
const ChatAnalysis = require('../models/ChatAnalysis');
const ChatAlert = require('../models/ChatAlert');
const analyzer = require('../services/analyzerService');
const responder = require('../services/responderService');

/**
 * POST /api/chat/send
 * Body: { text: string }
 * Auth: Patient only
 */
const sendMessage = async (req, res) => {
  try {
    // Derive patientId from auth (supports both middleware patterns)
    const patientId = req.user?.userId || req.user?._id;
    if (!patientId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // ── 1. Validate input ──
    const rawText = req.body?.text;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const text = rawText.trim();
    if (text.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }
    if (text.length > 1000) {
      return res.status(400).json({ error: 'Message is too long (max 1000 characters).' });
    }

    // ── 2. Save patient message ──
    const patientMessage = await ChatMessage.create({
      patientId,
      sender: 'patient',
      text,
    });

    // ── 3. Run analyzer ──
    const analysisResult = await analyzer.analyze(text);

    // ── 4. Save analysis ──
    const analysis = await ChatAnalysis.create({
      patientId,
      messageId: patientMessage._id,
      emotion: analysisResult.emotion,
      intensity: analysisResult.intensity,
      risk: analysisResult.risk,
      summary: analysisResult.summary,
      reasons: analysisResult.reasons,
    });

    // ── 5. HIGH risk → create alert + push to supervisors ──
    let alert = null;
    if (analysisResult.risk === 'HIGH') {
      alert = await ChatAlert.create({
        patientId,
        analysisId: analysis._id,
        messageId: patientMessage._id,
        risk: analysisResult.risk,
        topEmotion: analysisResult.emotion,
        intensity: analysisResult.intensity,
        summary: analysisResult.summary,
        triggerText: text.substring(0, 300),
      });

      // Emit real-time alert to supervisors via Socket.io
      const io = req.app.get('io') || global.io;
      if (io) {
        // Populate patient name for supervisor display
        const User = require('../models/User');
        const patient = await User.findById(patientId).select('firstName lastName email').lean();

        const alertPayload = {
          _id: alert._id,
          patientId,
          patientName: patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown',
          patientEmail: patient?.email || '',
          risk: alert.risk,
          topEmotion: alert.topEmotion,
          intensity: alert.intensity,
          summary: alert.summary,
          triggerText: alert.triggerText,
          status: alert.status,
          createdAt: alert.createdAt,
        };

        // Broadcast to all connected supervisors
        io.emit('new_alert', alertPayload);

        // Also try sending to the specific supervisor assigned to this patient
        if (patient) {
          const fullPatient = await User.findById(patientId).select('assignedSupervisor').lean();
          if (fullPatient?.assignedSupervisor) {
            io.to(`user:${fullPatient.assignedSupervisor}`).emit('new_alert', alertPayload);
          }
        }
      }
    }

    // ── 6. Fetch recent conversation history for LLM context (last 10 messages) ──
    const recentHistory = await ChatMessage.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(4)
      .lean();
    // Reverse to oldest-first for chronological context
    recentHistory.reverse();

    // ── 7. Generate bot reply (async — may call LM Studio) ──
    const replyText = await responder.generateReply(analysisResult, text, recentHistory);

    // ── 8. Save bot message ──
    const botMessage = await ChatMessage.create({
      patientId,
      sender: 'bot',
      text: replyText,
    });

    // ── 9. Return response ──
    return res.status(200).json({
      patientMessage,
      analysis,
      botMessage,
      alert: alert || undefined,
    });
  } catch (err) {
    console.error('[ChatController] sendMessage error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

/**
 * GET /api/chat/history
 * Returns all chat messages for the logged-in patient, sorted by timestamp asc.
 */
const getHistory = async (req, res) => {
  try {
    const patientId = req.user?.userId || req.user?._id;
    if (!patientId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const messages = await ChatMessage.find({ patientId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (err) {
    console.error('[ChatController] getHistory error:', err);
    return res.status(500).json({ error: 'Could not load chat history.' });
  }
};

module.exports = { sendMessage, getHistory };
