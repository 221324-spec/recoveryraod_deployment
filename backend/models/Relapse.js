const mongoose = require('mongoose');

/**
 * Relapse Model — Manual relapse logging by patients.
 * Tracks slip/relapse events with severity, substance, craving level,
 * mood at the time, triggers, and optional notes/location.
 */
const RelapseSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  substanceType: {
    type: String,
    trim: true,
    maxlength: 100
  },
  severity: {
    type: String,
    enum: ['slip', 'relapse'],
    required: true
  },
  triggers: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  cravingLevelAtRelapse: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  moodAtRelapse: {
    type: String,
    required: true
    // Accepts emoji ('😔') or text ('down') — same as MoodEntry.mood
  },
  notes: {
    type: String,
    maxlength: 5000
  },
  location: {
    lat: Number,
    lng: Number,
    label: { type: String, maxlength: 200 }
  }
}, {
  timestamps: true // adds createdAt, updatedAt
});

// Indexes for efficient queries
RelapseSchema.index({ patientId: 1, createdAt: -1 });
RelapseSchema.index({ patientId: 1, dateTime: -1 });
RelapseSchema.index({ severity: 1 });

module.exports = mongoose.model('Relapse', RelapseSchema);
