const User = require('../models/User');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const MoodEntry = require('../models/MoodEntry');
const Activity = require('../models/Activity');
const TriggerLog = require('../models/TriggerLog');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const Goal = require('../models/Goal');

const dashboardController = {
  // Get dashboard data (authenticated - uses logged-in user)
  getDashboard: async (req, res) => {
    try {
      console.log('GET /api/dashboard - start');
      
      // Use the authenticated user from the token
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      // Fetch the authenticated user from database (populate patient → supervisor card)
      let currentUser = await User.findById(userId)
        .populate({
          path: 'assignedSupervisor',
          select:
            'name email phone specialization address profilePicture organizationName licenseNumber role yearsOfExperience dob gender createdAt',
        })
        .lean();
      
      if (!currentUser) {
        console.warn('⚠️ User not found in database:', userId);
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      console.log('✅ Dashboard for authenticated user:', currentUser.name, currentUser._id, 'Role:', currentUser.role);

      let dashboardData = {
        user: currentUser,
        stats: {},
        recentActivity: [],
        notifications: [],
        alerts: []
      };

      // Get role-specific data based on user role
      const role = (currentUser.role || '').toLowerCase();
      console.log('GET /api/dashboard - calling role-specific dashboard for:', role);
      
      try {
        if (role === 'patient') {
          dashboardData = await getPatientDashboard(currentUser, dashboardData);
        } else if (role === 'supervisor') {
          dashboardData = await getSupervisorDashboard(currentUser, dashboardData);
        } else if (role === 'ngo') {
          dashboardData = await getNGODashboard(currentUser, dashboardData);
        } else if (role === 'admin') {
          dashboardData = await getAdminDashboard(currentUser, dashboardData);
        } else {
          // Default to patient dashboard for unknown roles
          dashboardData = await getPatientDashboard(currentUser, dashboardData);
        }
      } catch (innerErr) {
        console.error('Warning: Role-specific dashboard failed, returning minimal payload', innerErr);
        dashboardData = {
          user: currentUser,
          stats: {},
          recentActivity: [],
          notifications: [],
          alerts: []
        };
      }

      console.log('GET /api/dashboard - completed, returning payload');

      // Ensure notifications & alerts exist
      dashboardData.notifications = dashboardData.notifications || [];
      dashboardData.alerts = dashboardData.alerts || [];

      return res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message,
        stack: error.stack
      });
    }
  },

  // Get real-time stats for dashboard
  getRealtimeStats: async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      const stats = {};

      const roleNormalized = (user.role || '').toLowerCase();
      if (roleNormalized === 'patient') {
          stats.unreadMessages = await Message.countDocuments({
            receiverId: userId,
            read: false
          });
          stats.upcomingAppointments = await Appointment.countDocuments({
            patientId: userId,
            date: { $gte: new Date() },
            status: 'scheduled'
          });
          stats.moodTrend = await getMoodTrend(userId);
      } else if (roleNormalized === 'supervisor') {
          stats.assignedPatients = await User.countDocuments({
            assignedSupervisor: userId,
            role: { $regex: /^patient$/i }
          });
          stats.unreadMessages = await Message.countDocuments({
            receiverId: userId,
            read: false
          });
          stats.upcomingAppointments = await Appointment.countDocuments({
            supervisorId: userId,
            date: { $gte: new Date() },
            status: 'scheduled'
          });
          stats.crisisAlerts = await Alert.countDocuments({
            targetUsers: userId,
            type: 'crisis',
            isActive: true
          });
      } else if (roleNormalized === 'admin') {
          stats.totalUsers = await User.countDocuments();
          stats.activeUsers = await User.countDocuments({ onlineStatus: 'online' });
          stats.totalMessages = await Message.countDocuments();
          stats.activeAlerts = await Alert.countDocuments({ isActive: true });
      } else if (roleNormalized === 'ngo') {
          const organization = await Organization.findOne({ admins: userId });
          if (organization) {
            stats.organizationCapacity = organization.capacity;
            stats.currentOccupancy = organization.capacity.current;
            stats.pendingReferrals = 0; // Would need a referral system
          }
      }

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${userId}`).emit('dashboard:stats', stats);
      }

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get realtime stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get realtime stats',
        error: error.message
      });
    }
  }
};

// Helper functions for role-specific dashboard data
async function getPatientDashboard(user, dashboardData) {
  const userId = user._id;

  console.log('📊 Fetching real patient stats for:', user.name, userId);
  
  try {
    // Fetch REAL stats from database
    const [moodEntries, triggerLogs, activities, upcomingAppts, unreadMsgs, totalGoals, completedGoals] = await Promise.all([
      MoodEntry.find({ patient: userId }).sort({ createdAt: -1 }).limit(30).lean(),
      TriggerLog.find({ patient: userId }).sort({ createdAt: -1 }).limit(30).lean(),
      Activity.find({ patient: userId }).sort({ createdAt: -1 }).limit(30).lean(),
      Appointment.countDocuments({ 
        patientId: userId, 
        date: { $gte: new Date() },
        status: { $ne: 'cancelled' }
      }),
      Message.countDocuments({ receiverId: userId, read: false }),
      Goal.countDocuments({ user: userId }),
      Goal.countDocuments({ user: userId, completed: true })
    ]);
    
    // Calculate real stats
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, m) => sum + (m.moodValue || 0), 0) / moodEntries.length
      : 0;
    
    const sobrietyDays = user.sobrietyDate 
      ? Math.floor((Date.now() - user.sobrietyDate) / (1000 * 60 * 60 * 24)) 
      : 0;
    
    // Calculate streak (consecutive days with mood entries)
    let streakDays = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    for (let i = 0; i < moodEntries.length; i++) {
      const entryDate = new Date(moodEntries[i].createdAt).toDateString();
      if (i === 0 && (entryDate === today || entryDate === yesterday)) {
        streakDays++;
      } else if (i > 0) {
        const prevEntry = new Date(moodEntries[i-1].createdAt);
        const currEntry = new Date(moodEntries[i].createdAt);
        const dayDiff = Math.floor((prevEntry - currEntry) / 86400000);
        if (dayDiff === 1) streakDays++;
        else break;
      }
    }
    
    // Get today's mood (most recent entry from today)
    const todayMoodEntry = moodEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
    
    dashboardData.stats = {
      recoveryPoints: user.recoveryPoints || 0,
      sobrietyDays,
      unreadMessages: unreadMsgs,
      upcomingAppointments: upcomingAppts,
      streakDays,
      totalCheckIns: moodEntries.length,
      avgMood: Math.round(avgMood * 10) / 10,
      triggersIdentified: triggerLogs.length,
      todayMood: todayMoodEntry ? todayMoodEntry.moodValue : null,
      totalGoals,
      completedGoals
    };
    
    console.log('✅ Real stats calculated:', dashboardData.stats);
  } catch (error) {
    console.error('❌ Error fetching patient stats:', error);
    // Fallback to basic stats
    dashboardData.stats = {
      recoveryPoints: user.recoveryPoints || 0,
      sobrietyDays: user.sobrietyDate ? Math.floor((Date.now() - user.sobrietyDate) / (1000 * 60 * 60 * 24)) : 0,
      unreadMessages: 0,
      upcomingAppointments: 0,
      streakDays: 0,
      totalCheckIns: 0,
      avgMood: 0,
      triggersIdentified: 0
    };
  }

  // Get REAL recent activity from database
  try {
    const recentMoods = await MoodEntry.find({ patient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
      
    const recentTriggers = await TriggerLog.find({ patient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
      
    const recentActivities = await Activity.find({ patient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    dashboardData.recentActivity = [
      ...recentMoods.map(m => ({
        type: 'mood',
        title: 'Mood Check-in',
        description: `Mood: ${m.mood} (${m.moodValue}/4)`,
        timestamp: m.createdAt,
        data: m
      })),
      ...recentTriggers.map(t => ({
        type: 'trigger',
        title: 'Trigger Logged',
        description: `Triggers: ${t.triggers?.join(', ') || 'None'}`,
        timestamp: t.createdAt,
        data: t
      })),
      ...recentActivities.map(a => ({
        type: 'activity',
        title: 'Activity Logged',
        description: `${a.activity} - ${a.points} points`,
        timestamp: a.createdAt,
        data: a
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    console.log('✅ Real recent activity loaded:', dashboardData.recentActivity.length, 'items');
  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    dashboardData.recentActivity = [];
  }

  // Goals assigned to this patient by their care provider (assigned supervisor only)
  try {
    dashboardData.supervisorAssignedGoals = {
      items: [],
      activeCount: 0,
      completedCount: 0
    };
    const supervisorRef = user.assignedSupervisor;
    const supervisorId = supervisorRef ? supervisorRef._id || supervisorRef : null;
    if (supervisorId) {
      const [items, activeCount, completedCount] = await Promise.all([
        Goal.find({ user: userId, supervisor: supervisorId })
          .sort({ completed: 1, updatedAt: -1 })
          .limit(8)
          .select('title progress completed category goalType updatedAt')
          .lean(),
        Goal.countDocuments({ user: userId, supervisor: supervisorId, completed: false }),
        Goal.countDocuments({ user: userId, supervisor: supervisorId, completed: true })
      ]);
      dashboardData.supervisorAssignedGoals = { items, activeCount, completedCount };
    }
  } catch (err) {
    console.error('❌ Error loading supervisor-assigned goals:', err);
    dashboardData.supervisorAssignedGoals = {
      items: [],
      activeCount: 0,
      completedCount: 0
    };
  }

  return dashboardData;
}

async function getSupervisorDashboard(user, dashboardData) {
  const userId = user._id;

  // Get assigned patients
  const assignedPatients = await User.find({
    assignedSupervisor: userId,
    role: { $regex: /^patient$/i }
  }).select('name email onlineStatus lastSeen recoveryPoints').lean();

  const patientIds = assignedPatients.map(p => p._id);

  // Bulk fetch latest mood per patient (instead of N+1 loop)
  const [latestMoods, latestTriggers] = await Promise.all([
    MoodEntry.aggregate([
      { $match: { patient: { $in: patientIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$patient', moodValue: { $first: '$moodValue' }, createdAt: { $first: '$createdAt' } } }
    ]),
    TriggerLog.aggregate([
      { $match: { patient: { $in: patientIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$patient', triggerType: { $first: '$triggers' }, createdAt: { $first: '$createdAt' } } }
    ])
  ]);

  const moodMap = Object.fromEntries(latestMoods.map(m => [String(m._id), m]));
  const triggerMap = Object.fromEntries(latestTriggers.map(t => [String(t._id), t]));

  dashboardData.stats = {
    assignedPatients: assignedPatients.length,
    unreadMessages: await Message.countDocuments({ receiverId: userId, read: false }),
    upcomingAppointments: await Appointment.countDocuments({
      supervisorId: userId,
      date: { $gte: new Date() },
      status: 'scheduled'
    }),
    activeAlerts: await Alert.countDocuments({
      $or: [
        { targetUsers: userId },
        { targetRoles: 'supervisor' }
      ],
      isActive: true
    })
  };

  // Build recent activity from pre-fetched data (no more per-patient loops)
  const recentPatientActivity = [];
  for (const patient of assignedPatients.slice(0, 5)) {
    const pid = String(patient._id);
    if (moodMap[pid]) {
      recentPatientActivity.push({
        type: 'patient_mood',
        title: `${patient.name} - Mood Update`,
        description: `Mood: ${moodMap[pid].moodValue}/10`,
        timestamp: moodMap[pid].createdAt,
        patient
      });
    }
    if (triggerMap[pid]) {
      recentPatientActivity.push({
        type: 'patient_trigger',
        title: `${patient.name} - Trigger Logged`,
        description: `Trigger logged`,
        timestamp: triggerMap[pid].createdAt,
        patient
      });
    }
  }

  dashboardData.recentActivity = recentPatientActivity
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  dashboardData.assignedPatients = assignedPatients;

  return dashboardData;
}

async function getAdminDashboard(user, dashboardData) {
  dashboardData.stats = {
    totalUsers: await User.countDocuments(),
    activeUsers: await User.countDocuments({ onlineStatus: 'online' }),
    totalMessages: await Message.countDocuments(),
    totalAppointments: await Appointment.countDocuments(),
    activeAlerts: await Alert.countDocuments({ isActive: true }),
    systemHealth: 'good' // Could be enhanced with actual health checks
  };

  // Recent system activity
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role createdAt');

  const recentAlerts = await Alert.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('createdBy', 'name');

  dashboardData.recentActivity = [
    ...recentUsers.map(u => ({
      type: 'new_user',
      title: 'New User Registered',
      description: `${u.name} (${u.role})`,
      timestamp: u.createdAt,
      data: u
    })),
    ...recentAlerts.map(a => ({
      type: 'alert_created',
      title: 'Alert Created',
      description: a.title,
      timestamp: a.createdAt,
      data: a
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

  return dashboardData;
}

async function getNGODashboard(user, dashboardData) {
  const userId = user._id;

  // Get organization data
  const organization = await Organization.findOne({ admins: userId });

  dashboardData.stats = {
    organizationName: user.organizationName,
    services: user.services || [],
    unreadMessages: await Message.countDocuments({ receiverId: userId, read: false }),
    activeReferrals: 0, // Would need referral system
    capacity: organization ? organization.capacity : null
  };

  // Recent organization activity
  const recentMessages = await Message.find({ receiverId: userId })
    .populate('senderId', 'name role')
    .sort({ createdAt: -1 })
    .limit(5);

  dashboardData.recentActivity = recentMessages.map(m => ({
    type: 'message',
    title: `Message from ${m.senderId.name}`,
    description: m.content.substring(0, 100),
    timestamp: m.createdAt,
    data: m
  }));

  if (organization) {
    dashboardData.organization = organization;
  }

  return dashboardData;
}

// Helper function to get mood trend
async function getMoodTrend(userId) {
  const last7Days = await MoodEntry.find({
    patient: userId,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).sort({ createdAt: 1 });

  if (last7Days.length === 0) return null;

  const avgMood = last7Days.reduce((sum, entry) => sum + entry.moodValue, 0) / last7Days.length;
  const trend = last7Days.length >= 2 ?
    (last7Days[last7Days.length - 1].moodValue > last7Days[0].moodValue ? 'up' :
     last7Days[last7Days.length - 1].moodValue < last7Days[0].moodValue ? 'down' : 'stable') : 'stable';

  return { average: Math.round(avgMood * 10) / 10, trend, days: last7Days.length };
}

module.exports = dashboardController;