const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // Role-based schema supporting all user types
  role: {
    type: String,
    enum: ['Admin', 'Supervisor', 'Patient', 'NGO'],
    default: 'Patient'
  },

  passwordHash: { type: String, required: true },

  // Account status
  isBlocked: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Assignment and approval status
  status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'active', 'inactive'],
    default: 'pending'
  },
  assignedOrganization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  // Contact information
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },

  // Personal information
  dob: Date,
  gender: String,

  // Patient-specific fields
  assignedSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recoveryPoints: { type: Number, default: 0 },
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String
  }],
  medicalHistory: String,
  currentMedications: [String],
  sobrietyDate: Date,

  // Supervisor-specific fields
  specialization: [String], // e.g., ['addiction', 'mental-health', 'dual-diagnosis']
  licenseNumber: String,
  yearsOfExperience: Number,
  maxPatients: { type: Number, default: 20 },
  availability: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },

  // NGO-specific fields
  organizationName: String,
  organizationType: String, // e.g., 'recovery-center', 'support-group', 'treatment-facility'
  website: String,
  services: [String], // e.g., ['detox', 'counseling', 'housing']
  capacity: Number,
  accreditation: [String],

  // Common fields
  profilePicture: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showActivity: { type: Boolean, default: false }
    }
  },

  // Real-time status
  onlineStatus: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: Date,

  // Security & Verification
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationOTP: { type: String },
  emailVerificationOTPExpires: { type: Date }
}, { timestamps: true });

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ assignedSupervisor: 1 });
UserSchema.index({ onlineStatus: 1 });
UserSchema.index({ 'preferences.notifications.push': 1 });

// Virtual for full profile
UserSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    address: this.address,
    profilePicture: this.profilePicture,
    onlineStatus: this.onlineStatus,
    lastSeen: this.lastSeen,
    preferences: this.preferences
  };
});

// Instance methods
UserSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

UserSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.toPublic = function () {
  const publicData = {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isBlocked: this.isBlocked,
    isEmailVerified: this.isEmailVerified,
    status: this.status,
    createdAt: this.createdAt
  };
  
  // Include patient-specific fields
  if (this.role === 'Patient') {
    publicData.assignedSupervisor = this.assignedSupervisor;
    publicData.assignedOrganization = this.assignedOrganization;
    publicData.recoveryPoints = this.recoveryPoints;
    publicData.sobrietyDate = this.sobrietyDate;
  }
  
  // Include supervisor-specific fields
  if (this.role === 'Supervisor') {
    publicData.assignedOrganization = this.assignedOrganization;
    publicData.specialization = this.specialization;
  }
  
  return publicData;
};

// Instance method to check if user can access patient data
UserSchema.methods.canAccessPatient = function(patientId) {
  if (this.role === 'Admin') return true;
  if (this.role === 'NGO') return true;
  if (this.role === 'Supervisor' && patientId.toString() === this.assignedSupervisor?.toString()) return true;
  return false;
};

// Instance method to get dashboard data based on role
UserSchema.methods.getDashboardData = function() {
  const baseData = {
    user: this.fullProfile,
    stats: {}
  };

  switch (this.role) {
    case 'Patient':
      baseData.stats = {
        recoveryPoints: this.recoveryPoints,
        assignedSupervisor: this.assignedSupervisor,
        sobrietyDays: this.sobrietyDate ? Math.floor((Date.now() - this.sobrietyDate) / (1000 * 60 * 60 * 24)) : 0
      };
      break;
    case 'Supervisor':
      baseData.stats = {
        patientsCount: 0, // Will be populated by controller
        specialization: this.specialization,
        yearsOfExperience: this.yearsOfExperience
      };
      break;
    case 'NGO':
      baseData.stats = {
        organizationName: this.organizationName,
        services: this.services,
        capacity: this.capacity
      };
      break;
    case 'Admin':
      baseData.stats = {
        totalUsers: 0, // Will be populated by controller
        systemHealth: 'good'
      };
      break;
  }

  return baseData;
};

module.exports = mongoose.model('User', UserSchema);
