const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['patient', 'bot'],
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

chatMessageSchema.index({ patientId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
