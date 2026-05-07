const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const TriggerLog = require('../models/TriggerLog');
const Activity = require('../models/Activity');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');

// Get all patients assigned to a supervisor
exports.getPatients = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    
    // SECURITY: Verify the requesting user is this supervisor (or admin/NGO)
    const userRole = req.user?.role?.toLowerCase();
    // authMiddleware sets req.user.userId
    const userId = req.user?.userId?.toString() || req.user?._id?.toString() || req.user?.id?.toString();
    
    if (req.user && userId !== supervisorId && userRole !== 'admin' && userRole !== 'ngo') {
      console.log('Access denied: userId', userId, 'trying to access supervisorId', supervisorId);
      return res.status(403).json({ 
        error: 'You can only view your own assigned patients' 
      });
    }
    
    // Only return patients with proper assignment status (case-insensitive role check)
    const patients = await User.find({ 
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i },
      status: { $in: ['assigned', 'active'] }
    }).select('name email recoveryPoints createdAt status');
    
    console.log(`Supervisor ${supervisorId} has ${patients.length} assigned patients`);
    res.json({ patients });
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

// Get detailed overview of a specific patient
exports.getPatientOverview = async (req, res) => {
  try {
    const { supervisorId, patientId } = req.params;
    
    // Verify this patient belongs to this supervisor
    const patient = await User.findOne({
      _id: patientId,
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i }
    }).select('name email recoveryPoints createdAt');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or not assigned to this supervisor' });
    }

    // Get recent mood entries (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMoods = await MoodEntry.find({
      patient: patientId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(30);

    // Calculate mood statistics
    const avgMood = recentMoods.length > 0 
      ? recentMoods.reduce((sum, mood) => sum + mood.moodValue, 0) / recentMoods.length 
      : 0;
    
    const avgCraving = recentMoods.length > 0
      ? recentMoods.reduce((sum, mood) => sum + (mood.craving || 0), 0) / recentMoods.length
      : 0;

    // Get recent triggers
    const recentTriggers = await TriggerLog.find({
      patient: patientId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    // Get recent activities
    const recentActivities = await Activity.find({
      patient: patientId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    // Calculate streak days (consecutive days with mood entries)
    let streakDays = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    while (streakDays < 100) { // Max 100 days to prevent infinite loop
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayEntry = await MoodEntry.findOne({
        patient: patientId,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      if (dayEntry) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get unread messages from patient
    const unreadMessages = await Message.countDocuments({
      senderId: patientId,
      receiverId: supervisorId,
      read: false
    });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patientId: patientId,
      supervisorId: supervisorId,
      date: { $gte: new Date() },
      status: 'scheduled'
    }).sort({ date: 1 }).limit(5);

    const overview = {
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        recoveryPoints: patient.recoveryPoints,
        joinedDate: patient.createdAt
      },
      stats: {
        streakDays,
        avgMood: Math.round(avgMood * 10) / 10,
        avgCraving: Math.round(avgCraving * 10) / 10,
        totalMoodEntries: recentMoods.length,
        totalTriggers: recentTriggers.length,
        totalActivities: recentActivities.length
      },
      recentMoods: recentMoods.slice(0, 7), // Last 7 entries
      recentTriggers: recentTriggers.slice(0, 5),
      recentActivities: recentActivities.slice(0, 5),
      unreadMessages,
      upcomingAppointments
    };

    res.json({ overview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patient overview' });
  }
};

// Get aggregated statistics for all patients under a supervisor
exports.getPatientStatistics = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    
    // Get all patients under this supervisor
    const patients = await User.find({ 
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i }
    }).select('_id name');

    const patientIds = patients.map(p => p._id);

    // Get mood statistics
    const moodStats = await MoodEntry.aggregate([
      { $match: { patient: { $in: patientIds } } },
      {
        $group: {
          _id: null,
          avgMood: { $avg: '$moodValue' },
          avgCraving: { $avg: '$craving' },
          totalEntries: { $sum: 1 }
        }
      }
    ]);

    // Get trigger statistics
    const triggerStats = await TriggerLog.aggregate([
      { $match: { patient: { $in: patientIds } } },
      { $unwind: '$triggers' },
      {
        $group: {
          _id: '$triggers',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get activity statistics
    const activityStats = await Activity.aggregate([
      { $match: { patient: { $in: patientIds } } },
      {
        $group: {
          _id: '$activity',
          count: { $sum: 1 },
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Risk assessment based on recent data
    const riskPatients = [];
    for (const patient of patients) {
      const recentMoods = await MoodEntry.find({
        patient: patient._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      const recentTriggers = await TriggerLog.find({
        patient: patient._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      let riskScore = 0;
      const avgMood = recentMoods.length > 0 
        ? recentMoods.reduce((sum, mood) => sum + mood.moodValue, 0) / recentMoods.length 
        : 5;
      
      // Risk factors
      if (avgMood < 3) riskScore += 30;
      if (recentMoods.length === 0) riskScore += 25; // No recent check-ins
      if (recentTriggers.length > 3) riskScore += 20; // Many triggers
      
      const avgCraving = recentMoods.length > 0
        ? recentMoods.reduce((sum, mood) => sum + (mood.craving || 0), 0) / recentMoods.length
        : 0;
      if (avgCraving > 6) riskScore += 25;

      if (riskScore > 40) { // High risk threshold
        riskPatients.push({
          id: patient._id,
          name: patient.name,
          riskScore,
          riskLevel: riskScore > 70 ? 'high' : 'medium',
          avgMood,
          avgCraving,
          recentCheckIns: recentMoods.length,
          recentTriggers: recentTriggers.length
        });
      }
    }

    const statistics = {
      totalPatients: patients.length,
      moodStatistics: moodStats[0] || { avgMood: 0, avgCraving: 0, totalEntries: 0 },
      topTriggers: triggerStats,
      topActivities: activityStats,
      riskPatients: riskPatients.sort((a, b) => b.riskScore - a.riskScore)
    };

    res.json({ statistics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patient statistics' });
  }
};

// Get recent alerts/notifications for supervisor
exports.getAlerts = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    
    // Get all patients under this supervisor
    const patients = await User.find({ 
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i }
    }).select('_id name');

    const alerts = [];
    
    for (const patient of patients) {
      // Check for concerning mood patterns
      const recentMoods = await MoodEntry.find({
        patient: patient._id,
        createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // Last 3 days
      }).sort({ createdAt: -1 });

      if (recentMoods.length > 0) {
        const avgMood = recentMoods.reduce((sum, mood) => sum + mood.moodValue, 0) / recentMoods.length;
        const avgCraving = recentMoods.reduce((sum, mood) => sum + (mood.craving || 0), 0) / recentMoods.length;
        
        if (avgMood < 3) {
          alerts.push({
            id: `mood-${patient._id}-${Date.now()}`,
            type: 'warning',
            priority: 'high',
            patientId: patient._id,
            patientName: patient.name,
            title: 'Low mood pattern detected',
            message: `${patient.name} has had consistently low mood (avg: ${avgMood.toFixed(1)}) over the last 3 days`,
            timestamp: new Date(),
            category: 'mood'
          });
        }

        if (avgCraving > 7) {
          alerts.push({
            id: `craving-${patient._id}-${Date.now()}`,
            type: 'critical',
            priority: 'urgent',
            patientId: patient._id,
            patientName: patient.name,
            title: 'High craving levels',
            message: `${patient.name} has reported high craving levels (avg: ${avgCraving.toFixed(1)}) recently`,
            timestamp: new Date(),
            category: 'craving'
          });
        }
      }

      // Check for no recent check-ins
      const lastMood = await MoodEntry.findOne({
        patient: patient._id
      }).sort({ createdAt: -1 });

      if (!lastMood || lastMood.createdAt < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
        alerts.push({
          id: `checkin-${patient._id}-${Date.now()}`,
          type: 'info',
          priority: 'medium',
          patientId: patient._id,
          patientName: patient.name,
          title: 'Missing check-ins',
          message: `${patient.name} hasn't logged their mood in over 2 days`,
          timestamp: new Date(),
          category: 'engagement'
        });
      }

      // Check for unread messages
      const unreadCount = await Message.countDocuments({
        senderId: patient._id,
        receiverId: supervisorId,
        read: false
      });

      if (unreadCount > 0) {
        alerts.push({
          id: `message-${patient._id}-${Date.now()}`,
          type: 'info',
          priority: 'low',
          patientId: patient._id,
          patientName: patient.name,
          title: 'Unread messages',
          message: `${unreadCount} unread message(s) from ${patient.name}`,
          timestamp: new Date(),
          category: 'communication'
        });
      }
    }

    // Sort alerts by priority and timestamp
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    alerts.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({ alerts: alerts.slice(0, 20) }); // Return top 20 alerts
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};