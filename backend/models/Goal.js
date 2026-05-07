// backend/models/Goal.js
const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const GoalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, enum: ['Social', 'Emotional', 'Physical', 'Other'], default: 'Other' },
  goalType: { type: String, enum: ['short-term', 'long-term'], default: 'short-term' },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who assigns
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // patient
  milestones: { type: [MilestoneSchema], default: [] },
  progress: { type: Number, default: 0 }, // percent 0-100
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  streakDays: { type: Number, default: 0 }, // recovery streak tracking
}, {
  timestamps: true
});

module.exports = mongoose.model('Goal', GoalSchema);
