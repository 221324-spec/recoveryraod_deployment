const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'crisis', 'system'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Target audience
  targetRoles: [{
    type: String,
    enum: ['patient', 'supervisor', 'admin', 'ngo', 'all']
  }],
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  targetOrganizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],

  // Trigger conditions
  triggerType: {
    type: String,
    enum: ['manual', 'automatic', 'scheduled', 'threshold']
  },
  conditions: {
    moodThreshold: Number,
    triggerFrequency: Number,
    timeWindow: Number, // hours
    customCondition: String
  },

  // Timing
  scheduledFor: Date,
  expiresAt: Date,
  isActive: { type: Boolean, default: true },

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: {
    type: String,
    enum: ['system', 'supervisor', 'admin', 'ai', 'crisis-detection'],
    default: 'system'
  },

  // Response tracking
  responses: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    response: {
      type: String,
      enum: ['acknowledged', 'dismissed', 'escalated', 'action-taken']
    },
    notes: String,
    respondedAt: { type: Date, default: Date.now }
  }],

  // Real-time delivery
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Analytics
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    responded: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Indexes
AlertSchema.index({ type: 1, priority: 1 });
AlertSchema.index({ targetRoles: 1 });
AlertSchema.index({ isActive: 1, expiresAt: 1 });
AlertSchema.index({ createdBy: 1 });
AlertSchema.index({ 'stats.read': 1 });

// Instance methods
AlertSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

AlertSchema.methods.canAccess = function(user) {
  if ((user.role || '').toLowerCase() === 'admin') return true;
  if (this.targetRoles.includes('all') || this.targetRoles.includes(user.role)) return true;
  if (this.targetUsers.some(id => id.toString() === user._id.toString())) return true;
  return false;
};

AlertSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    this.stats.read += 1;
  }
};

AlertSchema.methods.recordResponse = function(userId, response, notes = '') {
  this.responses.push({
    userId,
    response,
    notes,
    respondedAt: new Date()
  });
  this.stats.responded += 1;
};

module.exports = mongoose.model('Alert', AlertSchema);