const mongoose = require('mongoose');

const MoodEntrySchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, required: true }, // Emoji or text: '😊', '😐', '😔', '😠', 'great', 'okay', 'down', 'angry'
  moodValue: { type: Number, required: true, min: 1, max: 10, default: 3 }, // Numeric value for calculations
  craving: { type: Number, min: 0, max: 10, default: 5 }, // Craving level 0-10
  journal: String, // Patient's journal entry
  timestamp: { type: Date, default: Date.now }, // Custom timestamp if provided
  dateString: String // Date string for grouping (e.g., 'Thu Dec 19 2025')
}, { timestamps: true });

// Index for efficient queries
MoodEntrySchema.index({ patient: 1, createdAt: -1 });
MoodEntrySchema.index({ patient: 1, dateString: 1 });

module.exports = mongoose.model('MoodEntry', MoodEntrySchema);