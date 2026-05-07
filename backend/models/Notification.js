const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'message', 'appointment', 'alert', 'reminder', 'achievement',
      'system', 'crisis', 'mood-check', 'activity-reminder', 'report'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },

  // Related entities
  relatedId: mongoose.Schema.Types.ObjectId, // Could be message, appointment, etc.
  relatedModel: {
    type: String,
    enum: ['Message', 'Appointment', 'Alert', 'MoodEntry', 'Activity', 'User']
  },

  // Delivery status
  delivered: { type: Boolean, default: false },
  deliveredAt: Date,
  read: { type: Boolean, default: false },
  readAt: Date,

  // Channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },

  // Email/SMS specific
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
  smsSent: { type: Boolean, default: false },
  smsSentAt: Date,

  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: Date,

  // Actions (for interactive notifications)
  actions: [{
    label: String,
    action: String, // e.g., 'view_appointment', 'respond_message'
    url: String
  }],

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: {
    type: String,
    enum: ['system', 'user', 'ai', 'scheduled'],
    default: 'system'
  }
}, { timestamps: true });

// Indexes
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, delivered: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ createdAt: -1 });

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
  }
};

NotificationSchema.methods.markAsDelivered = function(channel = 'inApp') {
  if (!this.delivered) {
    this.delivered = true;
    this.deliveredAt = new Date();
  }

  if (channel === 'email' && !this.emailSent) {
    this.emailSent = true;
    this.emailSentAt = new Date();
  }

  if (channel === 'sms' && !this.smsSent) {
    this.smsSent = true;
    this.smsSentAt = new Date();
  }
};

NotificationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Static methods
NotificationSchema.statics.createForUser = async function(userId, notificationData) {
  const notification = new this({
    recipient: userId,
    ...notificationData
  });
  await notification.save();
  return notification;
};

NotificationSchema.statics.createBulk = async function(notifications) {
  return await this.insertMany(notifications);
};

NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, read: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);