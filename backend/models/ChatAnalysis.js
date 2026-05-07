const mongoose = require('mongoose');

const chatAnalysisSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    required: true,
    index: true
  },
  emotion: {
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
  risk: {
    type: String,
    enum: ['LOW', 'MED', 'HIGH'],
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  reasons: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

chatAnalysisSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('ChatAnalysis', chatAnalysisSchema);
