const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  // Keep optional because supervisor form allows quick drafts without body text.
  description: { type: String, trim: true, default: '' },
  type: {
    type: String,
    enum: ['anti-narcotics-day', 'rehab-drive', 'webinar', 'seminar', 'awareness-campaign', 'workshop', 'community-event', 'other'],
    required: true
  },
  date: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String, default: 'Online' },
  isNational: { type: Boolean, default: false },
  pointsReward: { type: Number, default: 10 },
  badge: { type: String, default: '' }, // badge name earned for attending
  maxParticipants: { type: Number, default: 0 }, // 0 = unlimited
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, { timestamps: true });

// Auto-update status based on date
EventSchema.pre('find', function() {
  // This is handled in controller for simplicity
});

module.exports = mongoose.model('Event', EventSchema);
