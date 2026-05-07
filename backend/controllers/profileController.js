const User = require('../models/User');
const realtime = require('../utils/realtime');

exports.getProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    
    // Filter out sensitive fields
    delete updates.passwordHash;
    delete updates.role;
    
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    // Emit realtime user update
    try {
      realtime.emitToUser(id, 'user:updated', { user, generatedAt: new Date() });
      // If user has an assigned supervisor, also notify them
      if (user && user.assignedSupervisor) {
        realtime.emitToUser(user.assignedSupervisor.toString(), 'patient:updated', { userId: id, changes: updates, generatedAt: new Date() });
      }
    } catch (e) { console.error('Realtime emit error (profile update):', e); }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};