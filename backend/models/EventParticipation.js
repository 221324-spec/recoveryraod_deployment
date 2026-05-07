const mongoose = require('mongoose');

const EventParticipationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled'],
    default: 'registered'
  },
  pointsEarned: { type: Number, default: 0 },
  badgeEarned: { type: String, default: '' },
  registeredAt: { type: Date, default: Date.now },
  attendedAt: { type: Date }
}, { timestamps: true });

// One registration per patient per event
EventParticipationSchema.index({ eventId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('EventParticipation', EventParticipationSchema);
