const Relapse = require('../models/Relapse');
const User = require('../models/User');
const realtime = require('../utils/realtime');

/**
 * Relapse Controller — CRUD for manual relapse logging.
 *
 * Routes:
 *   POST /api/patients/:id/relapses       — patient logs a relapse
 *   GET  /api/patients/:id/relapses       — patient or supervisor reads relapses
 *   GET  /api/supervisors/:id/relapses    — supervisor: all relapses across assigned patients
 */

// POST /api/patients/:id/relapses
exports.createRelapse = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Validate ObjectId format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }

    // Authorization: patient can only log for themselves
    const requesterId = req.user._id.toString();
    if (requesterId !== patientId) {
      return res.status(403).json({ error: 'You can only log relapses for your own account' });
    }

    const {
      dateTime, substanceType, severity, triggers,
      cravingLevelAtRelapse, moodAtRelapse, notes, location
    } = req.body;

    // Validations
    if (!severity || !['slip', 'relapse'].includes(severity)) {
      return res.status(400).json({ error: 'severity must be "slip" or "relapse"' });
    }
    if (cravingLevelAtRelapse === undefined || cravingLevelAtRelapse < 0 || cravingLevelAtRelapse > 10) {
      return res.status(400).json({ error: 'cravingLevelAtRelapse must be 0-10' });
    }
    if (!moodAtRelapse) {
      return res.status(400).json({ error: 'moodAtRelapse is required' });
    }

    const relapse = new Relapse({
      patientId,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      substanceType: substanceType ? String(substanceType).substring(0, 100) : undefined,
      severity,
      triggers: Array.isArray(triggers) ? triggers.map(t => String(t).substring(0, 100)) : [],
      cravingLevelAtRelapse: Math.max(0, Math.min(10, Number(cravingLevelAtRelapse))),
      moodAtRelapse: String(moodAtRelapse).substring(0, 50),
      notes: notes ? String(notes).substring(0, 5000) : undefined,
      location: location && (location.label || location.lat) ? {
        lat: location.lat || null,
        lng: location.lng || null,
        label: location.label ? String(location.label).substring(0, 200) : undefined
      } : undefined
    });

    await relapse.save();

    // Real-time: notify supervisor
    try {
      const patient = await User.findById(patientId).select('name assignedSupervisor');
      if (patient && patient.assignedSupervisor) {
        realtime.emitToUser(patient.assignedSupervisor.toString(), 'relapse:logged', {
          patientId,
          patientName: patient.name,
          relapse,
          generatedAt: new Date()
        });
      }
      // Also emit to the patient's own socket for UI update
      realtime.emitToUser(patientId, 'relapse:created', { relapse, generatedAt: new Date() });
    } catch (e) {
      console.error('Realtime emit error (relapse):', e);
    }

    res.status(201).json({ success: true, relapse });
  } catch (err) {
    console.error('Create relapse error:', err);
    res.status(500).json({ error: 'Failed to log relapse' });
  }
};

// GET /api/patients/:id/relapses
exports.getPatientRelapses = async (req, res) => {
  try {
    const patientId = req.params.id;

    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }

    // Authorization: patient reads own, supervisor reads assigned patient
    const requesterId = req.user._id.toString();
    const requesterRole = (req.user.role || '').toLowerCase();

    if (requesterId !== patientId) {
      if (requesterRole === 'supervisor') {
        // Check that patient is assigned to this supervisor
        const patient = await User.findById(patientId).select('assignedSupervisor');
        if (!patient || !patient.assignedSupervisor || patient.assignedSupervisor.toString() !== requesterId) {
          return res.status(403).json({ error: 'Patient is not assigned to you' });
        }
      } else if (requesterRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 50));
    const relapses = await Relapse.find({ patientId }).sort({ dateTime: -1 }).limit(limit);

    res.json({ success: true, relapses });
  } catch (err) {
    console.error('Get patient relapses error:', err);
    res.status(500).json({ error: 'Failed to fetch relapses' });
  }
};

// GET /api/supervisors/:supervisorId/relapses
exports.getSupervisorRelapses = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;

    if (!supervisorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid supervisor ID format' });
    }

    // Authorization: supervisor only reads their own patients
    const requesterId = req.user._id.toString();
    if (requesterId !== supervisorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find patients assigned to this supervisor
    const patients = await User.find({ 
      assignedSupervisor: supervisorId, 
      role: { $regex: /^patient$/i } 
    }).select('_id name email');

    const patientIds = patients.map(p => p._id);
    const patientMap = {};
    patients.forEach(p => { patientMap[p._id.toString()] = p; });

    // Query filters
    const query = { patientId: { $in: patientIds } };

    // Date range filter
    if (req.query.from || req.query.to) {
      query.dateTime = {};
      if (req.query.from) query.dateTime.$gte = new Date(req.query.from);
      if (req.query.to) query.dateTime.$lte = new Date(req.query.to);
    }

    // Severity filter
    if (req.query.severity && ['slip', 'relapse'].includes(req.query.severity)) {
      query.severity = req.query.severity;
    }

    // Patient filter
    if (req.query.patientId && req.query.patientId.match(/^[0-9a-fA-F]{24}$/)) {
      if (patientIds.map(id => id.toString()).includes(req.query.patientId)) {
        query.patientId = req.query.patientId;
      }
    }

    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit) || 100));
    const relapses = await Relapse.find(query).sort({ dateTime: -1 }).limit(limit);

    // Attach patient names
    const enriched = relapses.map(r => {
      const rObj = r.toObject();
      const patient = patientMap[r.patientId.toString()];
      rObj.patientName = patient ? patient.name : 'Unknown';
      rObj.patientEmail = patient ? patient.email : '';
      return rObj;
    });

    res.json({ success: true, relapses: enriched, patients });
  } catch (err) {
    console.error('Get supervisor relapses error:', err);
    res.status(500).json({ error: 'Failed to fetch relapses' });
  }
};
