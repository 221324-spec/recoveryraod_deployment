const mongoose = require('mongoose');

const AIMoodPromptLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateTime: { type: Date, default: Date.now },
  reasonCodes: {
    type: [{ type: String, enum: ['SKIPPED_CHECKIN', 'HIGH_CRAVINGS'] }],
    required: true
  },
  action: {
    type: String,
    enum: ['SHOWN', 'ACCEPTED', 'DECLINED', 'DISMISSED'],
    required: true
  }
}, { timestamps: true });

AIMoodPromptLogSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('AIMoodPromptLog', AIMoodPromptLogSchema);
