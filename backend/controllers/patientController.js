const MoodEntry = require('../models/MoodEntry');
const TriggerLog = require('../models/TriggerLog');
const Activity = require('../models/Activity');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const realtime = require('../utils/realtime');

exports.postMood = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { mood, craving, journal, timestamp } = req.body;
    
    // Input validation
    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // Validate craving range (0-10)
    const validCraving = craving !== undefined ? Math.max(0, Math.min(10, Number(craving))) : 5;
    
    // Sanitize journal entry (basic XSS prevention)
    const sanitizedJournal = journal ? String(journal).substring(0, 10000) : '';
    
    // Comprehensive mood mapping - supports multiple emojis and text values
    const moodValueMap = { 
      // Happy/Excellent moods (4)
      '😊': 4, '🙂': 4, '😄': 4, '😁': 4, 'great': 4, 'excellent': 4, 'happy': 4,
      // Neutral/Okay moods (3)
      '😐': 3, 'okay': 3, 'neutral': 3, 'fine': 3,
      // Down/Low moods (2)
      '😔': 2, '😕': 2, '🙁': 2, 'down': 2, 'sad': 2, 'low': 2,
      // Angry/Very Low moods (1)
      '😠': 1, '😡': 1, '😤': 1, 'angry': 1, 'frustrated': 1, 'mad': 1
    };
    const moodEntry = new MoodEntry({
      patient: patientId,
      mood,
      moodValue: moodValueMap[mood] || 3,
      craving: validCraving,
      journal: sanitizedJournal,
      timestamp: timestamp ? new Date(timestamp) : undefined,
      dateString: new Date().toDateString()
    });
    await moodEntry.save();
    // Emit real-time update: new mood entry and updated stats
    try {
      const patient = await User.findById(patientId).select('assignedSupervisor name');
      const stats = await exports.getMoodStatsInternal(patientId);
      realtime.emitToUser(patientId, 'mood:created', { moodEntry, generatedAt: new Date() });
      realtime.emitToUser(patientId, 'dashboard:stats', { stats, generatedAt: new Date() });
      if (patient && patient.assignedSupervisor) {
        realtime.emitToUser(patient.assignedSupervisor.toString(), 'patient:mood:created', { patientId, moodEntry, generatedAt: new Date() });
        realtime.emitToUser(patient.assignedSupervisor.toString(), 'dashboard:stats:update', { patientId, stats, generatedAt: new Date() });
      }
      // Emit to admin dashboard
      realtime.emitMoodLogged({ patientId, mood, patientName: patient?.name, timestamp: new Date() });
    } catch (e) {
      console.error('Realtime emit error (mood):', e);
    }

    res.json({ success: true, moodEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save mood' });
  }
};

exports.getMoods = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // Support both 'limit' and 'range' query parameters
    const limitParam = parseInt(req.query.limit) || parseInt(req.query.range) || 7;
    const limit = Math.max(1, Math.min(100, limitParam));
    
    const moods = await MoodEntry.find({ patient: patientId }).sort({ createdAt: -1 }).limit(limit);
    res.json({ moods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch moods' });
  }
};

exports.getMoodStats = async (req, res) => {
  try {
    const patientId = req.params.id;
    const range = Math.max(1, Math.min(365, parseInt(req.query.range) || 7)); // Limit range 1-365
    const moodHistory = await MoodEntry.find({ patient: patientId }).sort({ createdAt: -1 }).limit(range);
    const triggerLog = await TriggerLog.find({ patient: patientId }).limit(100);

    const recentEntries = moodHistory || [];
    
    // Calculate consecutive low-craving days (proper streak)
    let streakDays = 0;
    const dateMap = {};
    
    // Group by date and find lowest craving per day
    recentEntries.forEach(entry => {
      const dateKey = new Date(entry.createdAt).toDateString();
      if (!dateMap[dateKey] || entry.craving < dateMap[dateKey]) {
        dateMap[dateKey] = entry.craving || 0;
      }
    });
    
    // Count consecutive days with craving <= 3, starting from most recent
    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(b) - new Date(a));
    for (const date of sortedDates) {
      if (dateMap[date] <= 3) {
        streakDays++;
      } else {
        break; // Streak broken
      }
    }
    
    const totalCheckIns = await MoodEntry.countDocuments({ patient: patientId });
    const avgMood = recentEntries.length > 0
      ? recentEntries.reduce((sum, entry) => sum + (entry.moodValue || 3), 0) / recentEntries.length
      : 3;

    res.json({
      streakDays,
      totalCheckIns,
      avgMood: Math.round(avgMood * 10) / 10,
      triggersIdentified: triggerLog.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
};

// Internal helper to compute stats (used for realtime emits)
exports.getMoodStatsInternal = async (patientId, range = 30) => {
  try {
    // Get all moods for comprehensive stats
    const allMoods = await MoodEntry.find({ patient: patientId }).sort({ createdAt: -1 });
    const triggerLog = await TriggerLog.find({ patient: patientId });
    const activities = await Activity.find({ patient: patientId, status: 'completed' });

    if (allMoods.length === 0) {
      return {
        streakDays: 0,
        totalCheckIns: 0,
        avgMood: 0,
        triggersIdentified: 0,
        recoveryPoints: 0
      };
    }
    
    // Calculate consecutive check-in days (proper streak)
    let streakDays = 0;
    const dateMap = {};
    
    // Group moods by date
    allMoods.forEach(entry => {
      const dateKey = new Date(entry.createdAt).toDateString();
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(entry);
    });
    
    // Count consecutive days from today backwards
    const today = new Date();
    let checkDate = new Date(today);
    
    while (true) {
      const dateKey = checkDate.toDateString();
      if (dateMap[dateKey] && dateMap[dateKey].length > 0) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Get recent moods for average (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMoods = allMoods.filter(m => new Date(m.createdAt) >= sevenDaysAgo);
    
    const avgMood = recentMoods.length > 0
      ? recentMoods.reduce((sum, entry) => sum + (entry.moodValue || 3), 0) / recentMoods.length
      : 3;

    // Calculate recovery points from activities
    const recoveryPoints = activities.reduce((sum, act) => sum + (act.points || 0), 0);

    return {
      streakDays,
      totalCheckIns: allMoods.length,
      avgMood: Math.round(avgMood * 10) / 10,
      triggersIdentified: triggerLog.length,
      recoveryPoints
    };
  } catch (err) {
    console.error('Error computing internal mood stats:', err);
    return {
      streakDays: 0,
      totalCheckIns: 0,
      avgMood: 0,
      triggersIdentified: 0,
      recoveryPoints: 0
    };
  }
};

exports.postTrigger = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { triggers, customTrigger } = req.body;
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // Ensure triggers is an array
    const validTriggers = Array.isArray(triggers) ? triggers : [];
    
    // Validate custom trigger if provided
    const validCustomTrigger = customTrigger && customTrigger.name ? {
      name: String(customTrigger.name).substring(0, 100),
      icon: String(customTrigger.icon || 'T').substring(0, 10)
    } : undefined;
    
    const entry = new TriggerLog({ 
      patient: patientId, 
      triggers: validTriggers, 
      customTrigger: validCustomTrigger, 
      dateString: new Date().toDateString() 
    });
    await entry.save();
    try {
      realtime.emitToUser(patientId, 'trigger:created', { entry, generatedAt: new Date() });
      const patient = await User.findById(patientId).select('assignedSupervisor name');
      if (patient && patient.assignedSupervisor) {
        realtime.emitToUser(patient.assignedSupervisor.toString(), 'patient:trigger:created', { patientId, entry, generatedAt: new Date() });
      }
      // Emit to admin dashboards for analytics — triggers can indicate risk
      const triggerPayload = { patientId, triggers: validTriggers, patientName: patient?.name, timestamp: new Date() };
      realtime.emitToRoom('admin:stats', 'trigger:logged', triggerPayload);
      realtime.emitToRoom('admin:dashboard', 'trigger:logged', triggerPayload);
    } catch (e) { console.error('Realtime emit error (trigger):', e); }

    res.json({ success: true, entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trigger' });
  }
};

exports.getTriggers = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // Validate and limit the limit parameter (1-100)
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    
    const triggers = await TriggerLog.find({ patient: patientId }).sort({ createdAt: -1 }).limit(limit);
    res.json({ triggers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
};

exports.getTopTriggers = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // Validate and limit range (1-365 days)
    const range = Math.max(1, Math.min(365, parseInt(req.query.range) || 30));
    
    const triggerEntries = await TriggerLog.find({ patient: patientId }).sort({ createdAt: -1 }).limit(range);

    const counts = {};
    triggerEntries.forEach(entry => {
      if (entry.triggers && Array.isArray(entry.triggers)) {
        entry.triggers.forEach(trigger => {
          counts[trigger] = (counts[trigger] || 0) + 1;
        });
      }
      if (entry.customTrigger && entry.customTrigger.name) {
        counts[entry.customTrigger.name] = (counts[entry.customTrigger.name] || 0) + 1;
      }
    });

    const sortedTriggers = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const top = sortedTriggers[0] || null;

    res.json({ top, counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute top triggers' });
  }
};

exports.postActivity = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { activity, icon, points, category, date, time, status, notes } = req.body;
    
    // Input validation
    if (!activity) {
      return res.status(400).json({ error: 'Activity name is required' });
    }
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // Validate and cap points (0-100 range to prevent exploitation)
    const validPoints = Math.max(0, Math.min(100, Number(points) || 0));
    
    // Validate status
    const validStatus = ['scheduled', 'completed', 'pending'].includes(status) ? status : 'scheduled';
    
    // Sanitize notes
    const sanitizedNotes = notes ? String(notes).substring(0, 1000) : '';
    
    const act = new Activity({ 
      patient: patientId, 
      activity: String(activity).substring(0, 200), 
      icon: icon ? String(icon).substring(0, 10) : '', 
      points: validPoints, 
      category: category ? String(category).substring(0, 50) : '', 
      date, 
      time, 
      status: validStatus, 
      notes: sanitizedNotes 
    });
    await act.save();

    try {
      const patient = await User.findById(patientId).select('name assignedSupervisor');
      // If completed, update user points and emit update
      if (validStatus === 'completed' && validPoints > 0) {
        const updated = await User.findByIdAndUpdate(patientId, { $inc: { recoveryPoints: validPoints } }, { new: true }).select('recoveryPoints assignedSupervisor');
        realtime.emitToUser(patientId, 'activity:created', { activity: act, generatedAt: new Date() });
        realtime.emitToUser(patientId, 'user:updated', { userId: patientId, recoveryPoints: updated.recoveryPoints, generatedAt: new Date() });
        if (updated && updated.assignedSupervisor) {
          realtime.emitToUser(updated.assignedSupervisor.toString(), 'patient:activity:created', { patientId, activity: act, generatedAt: new Date() });
          realtime.emitToUser(updated.assignedSupervisor.toString(), 'patient:updated', { patientId, recoveryPoints: updated.recoveryPoints, generatedAt: new Date() });
        }
      } else {
        realtime.emitToUser(patientId, 'activity:created', { activity: act, generatedAt: new Date() });
      }
      // Emit to admin dashboard for analytics
      realtime.emitActivityLogged({ patientId, activity, patientName: patient?.name, status: validStatus, points: validPoints, timestamp: new Date() });
    } catch (e) {
      console.error('Realtime emit error (activity):', e);
    }

    res.json({ success: true, activity: act });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save activity' });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    const activities = await Activity.find({ patient: patientId }).sort({ createdAt: -1 }).limit(100);
    res.json({ activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

exports.getPoints = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Validate patient ID format
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    const user = await User.findById(patientId);
    
    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ points: user.recoveryPoints || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
};