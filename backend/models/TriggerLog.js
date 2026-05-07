const mongoose = require('mongoose');

const TriggerLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  triggers: [{ type: String }], // Array of trigger names: ['stress', 'anxiety', 'loneliness']
  customTrigger: {
    name: String, // Custom trigger name
    icon: String  // Custom trigger icon
  },
  dateString: String // Date string for grouping (e.g., 'Thu Dec 19 2025')
}, { timestamps: true });

// Index for efficient queries and aggregation
TriggerLogSchema.index({ patient: 1, createdAt: -1 });
TriggerLogSchema.index({ patient: 1, dateString: 1 });

module.exports = mongoose.model('TriggerLog', TriggerLogSchema);