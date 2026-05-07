const mongoose = require('mongoose');

const geoFenceAlertSchema = new mongoose.Schema({
  // Who triggered the alert
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Which zone was triggered
  geoFence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeoFence',
    required: true
  },
  
  // Event type
  eventType: {
    type: String,
    enum: ['entered', 'exited', 'dwelling'],
    required: true
  },
  
  // Location details
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number }
  },
  
  // Timing
  entryTime: {
    type: Date,
    default: Date.now
  },
  
  exitTime: {
    type: Date
  },
  
  // Alert severity
  alertSeverity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  
  // Alert status
  alertStatus: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved'],
    default: 'new'
  },
  
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  acknowledgedAt: {
    type: Date
  },
  
  // Who was notified
  notifiedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor']
    },
    notifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notes from supervisor/admin
  notes: {
    type: String
  }
  
}, { timestamps: true });

// Virtual field for dwell duration (in minutes)
geoFenceAlertSchema.virtual('dwellDuration').get(function() {
  if (!this.exitTime) return null; // Still in zone
  return Math.floor((this.exitTime - this.entryTime) / 60000);
});

// Indexes for fast queries
geoFenceAlertSchema.index({ patient: 1, createdAt: -1 });
geoFenceAlertSchema.index({ geoFence: 1, createdAt: -1 });
geoFenceAlertSchema.index({ alertStatus: 1, alertSeverity: 1 });
geoFenceAlertSchema.index({ createdAt: -1 });

// Ensure virtuals are included in JSON
geoFenceAlertSchema.set('toJSON', { virtuals: true });
geoFenceAlertSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('GeoFenceAlert', geoFenceAlertSchema);
