const mongoose = require('mongoose');

const chatAlertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatAnalysis'
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  risk: {
    type: String,
    enum: ['LOW', 'MED', 'HIGH'],
    required: true
  },
  topEmotion: {
    type: String,
    enum: ['sadness', 'anxiety', 'anger', 'neutral', 'hope'],
    required: true
  },
  intensity: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  triggerText: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  closedAt: {
    type: Date,
    default: null
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

chatAlertSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ChatAlert', chatAlertSchema);
