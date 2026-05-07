const mongoose = require('mongoose');

const geoFenceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Zone Type
  zoneType: {
    type: String,
    enum: ['circle', 'polygon'],
    required: true
  },
  
  // For Circle Zones
  center: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  radius: {
    type: Number // in meters
  },
  
  // For Polygon Zones
  coordinates: [{
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }],
  
  // Risk Level
  riskCategory: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  totalAlerts: {
    type: Number,
    default: 0
  },
  
  uniquePatients: {
    type: Number,
    default: 0
  }
  
}, { timestamps: true });

// Index for faster geo queries
geoFenceSchema.index({ status: 1 });
geoFenceSchema.index({ riskCategory: 1 });

module.exports = mongoose.model('GeoFence', geoFenceSchema);
