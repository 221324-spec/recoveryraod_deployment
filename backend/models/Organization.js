const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['recovery-center', 'treatment-facility', 'support-group', 'counseling-center', 'shelter', 'other'],
    required: true
  },
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  services: [{
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['detox', 'counseling', 'therapy', 'housing', 'medical', 'support', 'education', 'other']
    }
  }],
  capacity: {
    total: Number,
    current: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  accreditation: [String],
  
  // Enhanced fields for admin dashboard
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  
  location: {
    latitude: Number,
    longitude: Number
  },
  
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Active'
  },
  
  licenseNumber: String,
  licenseExpiryDate: Date,
  
  // Relationships
  supervisors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  patients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Statistics (auto-calculated)
  stats: {
    totalPatients: { type: Number, default: 0 },
    activePatients: { type: Number, default: 0 },
    totalSupervisors: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    averageStayDays: { type: Number, default: 0 }
  },
  operatingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Indexes
OrganizationSchema.index({ type: 1 });
OrganizationSchema.index({ 'address.city': 1, 'address.state': 1 });
OrganizationSchema.index({ 'services.category': 1 });
OrganizationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Organization', OrganizationSchema);