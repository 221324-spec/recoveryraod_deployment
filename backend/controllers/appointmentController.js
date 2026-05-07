const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.createAppointment = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { title, description, date, duration, supervisorId, meetingLink, notes } = req.body;
    
    const appointment = new Appointment({ 
      patientId, 
      supervisorId,
      title, 
      description,
      date, 
      duration: duration || 60,
      meetingLink,
      notes 
    });
    
    await appointment.save();
    
    // Emit via socket to patient and supervisor
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${patientId}`).emit('appointment:created', { appointment, generatedAt: new Date() });
      if (supervisorId) {
        io.to(`user:${supervisorId}`).emit('appointment:created', { appointment, generatedAt: new Date() });
      }
    }
    
    res.json({ success: true, appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const patientId = req.params.id;
    const appointments = await Appointment.find({ patientId })
      .populate('supervisorId', 'name')
      .sort({ date: 1 });
    res.json({ appointments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updates = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId, 
      updates, 
      { new: true }
    ).populate('supervisorId', 'name');
    // Emit update via socket
    const io = req.app.get('io');
    if (io && appointment) {
      io.to(`appointments:${appointment.patientId}`).emit('appointment:updated', { appointment, generatedAt: new Date() });
      if (appointment.supervisorId) io.to(`user:${appointment.supervisorId}`).emit('appointment:updated', { appointment, generatedAt: new Date() });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

exports.getProviders = async (req, res) => {
  try {
    // Get all supervisors who can provide appointments
    const providers = await User.find({ role: 'supervisor' }).select('name email');
    res.json({ providers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
};