const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, required: true }, // Activity name: 'Meditation', 'Exercise', 'Therapy Session'
  icon: { type: String }, // Emoji icon: '🧘', '🏃', '💬'
  points: { type: Number, default: 0, min: 0 }, // Points earned for this activity
  category: { type: String }, // Category: 'Wellness', 'Physical', 'Mental', 'Social', 'Support'
  date: { type: String }, // Date in ISO format (YYYY-MM-DD)
  time: { type: String }, // Time in HH:MM format
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'pending'], 
    default: 'scheduled' 
  }, // Activity status
  notes: String // Additional notes about the activity
}, { timestamps: true });

// Index for efficient queries
ActivitySchema.index({ patient: 1, createdAt: -1 });
ActivitySchema.index({ patient: 1, status: 1 });
ActivitySchema.index({ patient: 1, date: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);