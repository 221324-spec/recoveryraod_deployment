const mongoose = require('mongoose');

const AISupportActionLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIMoodScan', required: true },
  dateTime: { type: Date, default: Date.now },
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'anxious', 'neutral'],
    required: true
  },
  actionType: {
    type: String,
    enum: ['BREATHING', 'JOURNAL_PROMPT', 'QUOTE', 'CHECKIN_REMINDER', 'COPING_TIP'],
    required: true
  },
  actionId: String
}, { timestamps: true });

AISupportActionLogSchema.index({ patientId: 1, createdAt: -1 });
AISupportActionLogSchema.index({ scanId: 1 });

module.exports = mongoose.model('AISupportActionLog', AISupportActionLogSchema);
