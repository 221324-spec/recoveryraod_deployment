const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  // Patient who sent location
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // GPS Coordinates
  latitude: {
    type: Number,
    required: true
  },
  
  longitude: {
    type: Number,
    required: true
  },
  
  // GPS accuracy in meters
  accuracy: {
    type: Number
  },
  
  // When location was recorded
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Source of location data
  source: {
    type: String,
    enum: ['foreground', 'background'],
    default: 'foreground'
  },
  
  // Optional: Battery optimization
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Optional: Movement detection
  isMoving: {
    type: Boolean
  }
  
}, { timestamps: true });

// Index for fast patient location history queries
locationLogSchema.index({ patient: 1, timestamp: -1 });
locationLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('LocationLog', locationLogSchema);
