const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  meetingLink: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);