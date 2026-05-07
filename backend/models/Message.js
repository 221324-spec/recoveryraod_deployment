const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file', 'call'], default: 'text' },
  read: { type: Boolean, default: false },
  readAt: Date,
  // E2E encryption fields
  encryptedContent: String,
  keyVersion: String,
  // Emergency/Crisis flags
  isCrisis: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);