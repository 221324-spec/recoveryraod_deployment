const User = require('../models/User');
const Organization = require('../models/Organization');
const GeoFenceAlert = require('../models/GeoFenceAlert');
const MoodEntry = require('../models/MoodEntry');
const Activity = require('../models/Activity');
const TriggerLog = require('../models/TriggerLog');
const Alert = require('../models/Alert');

// ============================================
// GET SYSTEM STATISTICS
// ============================================
exports.getSystemStats = async (req, res) => {
  try {
    // Count organizations
    const totalNGOs = await Organization.countDocuments();
    const activeNGOs = await Organization.countDocuments({ status: 'Active' });
    const suspendedNGOs = await Organization.countDocuments({ status: 'Suspended' });
    
    // Count users
    const totalSupervisors = await User.countDocuments({ role: /^supervisor$/i });
    const activeSupervisors = await User.countDocuments({ 
      role: /^supervisor$/i,
      isActive: true 
    });
    
    const totalPatients = await User.countDocuments({ role: /^patient$/i });
    const activePatients = await User.countDocuments({ 
      role: /^patient$/i,
      isActive: true 
    });
    
    // Count alerts (geo-fence + regular alerts)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const geoAlertsToday = await GeoFenceAlert.countDocuments({
      createdAt: { $gte: today }
    });
    
    const regularAlertsToday = await Alert.countDocuments({
      createdAt: { $gte: today }
    });
    
    const riskAlertsToday = geoAlertsToday + regularAlertsToday;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const riskAlertsWeek = await GeoFenceAlert.countDocuments({
      createdAt: { $gte: weekAgo }
    }) + await Alert.countDocuments({
      createdAt: { $gte: weekAgo }
    });
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const riskAlertsMonth = await GeoFenceAlert.countDocuments({
      createdAt: { $gte: monthAgo }
    }) + await Alert.countDocuments({
      createdAt: { $gte: monthAgo }
    });
    
    res.json({
      success: true,
      data: {
        totalNGOs,
        activeNGOs,
        suspendedNGOs,
        totalSupervisors,
        activeSupervisors,
        totalPatients,
        activePatients,
        riskAlertsToday,
        riskAlertsWeek,
        riskAlertsMonth
      }
    });
    
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system statistics' 
    });
  }
};

// ============================================
// GET GLOBAL ALERTS
// ============================================
exports.getGlobalAlerts = async (req, res) => {
  try {
    const { limit = 50, status, severity } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.alertStatus = status;
    if (severity) filter.alertSeverity = severity;
    
    // Get geo-fence alerts
    const geoAlerts = await GeoFenceAlert.find(filter)
      .populate('patient', 'name email phone')
      .populate('geoFence', 'name riskCategory')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Get regular alerts
    const regularAlerts = await Alert.find()
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Combine and sort
    const allAlerts = [...geoAlerts.map(alert => ({
      ...alert.toObject(),
      type: 'geofence',
      patientName: alert.patient?.name,
      zoneName: alert.geoFence?.name
    })), ...regularAlerts.map(alert => ({
      ...alert.toObject(),
      type: 'regular',
      patientName: alert.createdBy?.name
    }))].sort((a, b) => b.createdAt - a.createdAt).slice(0, parseInt(limit));
    
    const total = await GeoFenceAlert.countDocuments(filter) + await Alert.countDocuments();
    
    res.json({
      success: true,
      data: {
        alerts: allAlerts,
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching global alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts' 
    });
  }
};

// ============================================
// GET ALERT ANALYTICS
// ============================================
exports.getAlertAnalytics = async (req, res) => {
  try {
    const { range = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));
    
    // Alerts per day
    const alertsPerDay = await GeoFenceAlert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      }
    ]);
    
    // Alerts by severity
    const alertsBySeverity = await GeoFenceAlert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$alertSeverity",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object
    const severityObj = {};
    alertsBySeverity.forEach(item => {
      severityObj[item._id || 'Unknown'] = item.count;
    });
    
    // Top zones (if any geo-fences exist)
    const topZones = await GeoFenceAlert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$geoFence",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'geofences',
          localField: '_id',
          foreignField: '_id',
          as: 'zone'
        }
      },
      {
        $unwind: { path: '$zone', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 0,
          zoneName: { $ifNull: ['$zone.name', 'Unknown Zone'] },
          alertCount: '$count'
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        alertsPerDay,
        alertsBySeverity: severityObj,
        topZones
      }
    });
    
  } catch (error) {
    console.error('Error fetching alert analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
};

// ============================================
// GET MOOD ANALYTICS
// ============================================
exports.getMoodAnalytics = async (req, res) => {
  try {
    const { range = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));
    
    // Moods per day
    const moodsPerDay = await MoodEntry.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      }
    ]);
    
    // Average mood value
    const avgMood = await MoodEntry.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$moodValue" }
        }
      }
    ]);
    
    // Mood distribution
    const moodDistribution = await MoodEntry.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$mood",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const distributionObj = {};
    moodDistribution.forEach(item => {
      distributionObj[item._id || 'Unknown'] = item.count;
    });
    
    res.json({
      success: true,
      data: {
        moodsPerDay,
        averageMood: avgMood[0]?.average || 0,
        moodDistribution: distributionObj
      }
    });
    
  } catch (error) {
    console.error('Error fetching mood analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch mood analytics' 
    });
  }
};

// ============================================
// GET ACTIVITY ANALYTICS
// ============================================
exports.getActivityAnalytics = async (req, res) => {
  try {
    const { range = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));
    
    // Activities per day
    const activitiesPerDay = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      }
    ]);
    
    // Activity types distribution
    const activityTypes = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const typesObj = {};
    activityTypes.forEach(item => {
      typesObj[item._id || 'Unknown'] = item.count;
    });
    
    res.json({
      success: true,
      data: {
        activitiesPerDay,
        activityTypes: typesObj,
        totalActivities: activitiesPerDay.reduce((sum, day) => sum + day.count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error fetching activity analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity analytics' 
    });
  }
};

// ============================================
// GET ALL USERS
// ============================================
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, limit = 100 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        users,
        total
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
};

// ============================================
// GET USER DETAILS
// ============================================
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('assignedSupervisor', 'name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's activities, moods, triggers (using 'patient' field as defined in models)
    const activities = await Activity.find({ patient: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const moods = await MoodEntry.find({ patient: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const triggers = await TriggerLog.find({ patient: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        user,
        recentActivities: activities,
        recentMoods: moods,
        recentTriggers: triggers
      }
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user details' 
    });
  }
};

// ============================================
// UPDATE USER STATUS
// ============================================
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = status === 'active';
    await user.save();
    
    // Emit real-time update
    if (global.io) {
      global.io.emit('admin:user:updated', { userId: user._id, isActive: user.isActive });
    }
    
    res.json({
      success: true,
      data: user,
      message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user status' 
    });
  }
};

// ============================================
// DELETE USER
// ============================================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow deleting admin users
    if ((user.role || '').toLowerCase() === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    
    // Emit real-time update
    if (global.io) {
      global.io.emit('admin:user:deleted', { userId: req.params.userId });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
};

// ============================================
// ASSIGN PATIENT TO SUPERVISOR
// ============================================
exports.assignPatientToSupervisor = async (req, res) => {
  try {
    const { patientId, supervisorId } = req.body;
    
    if (!patientId || !supervisorId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and Supervisor ID are required'
      });
    }
    
    // Verify patient exists and is a patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Verify supervisor exists and is a supervisor
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }
    
    // Assign patient to supervisor and mark as assigned (supervisor queries filter on 'assigned'/'active')
    patient.assignedSupervisor = supervisorId;
    patient.status = 'assigned';
    patient.isActive = true;
    await patient.save();
    
    // Emit real-time update
    if (global.io) {
      global.io.to(`user:${supervisorId}`).emit('patient:assigned', {
        patientId,
        patientName: patient.name,
        message: `Patient ${patient.name} has been assigned to you`
      });
    }
    
    res.json({
      success: true,
      message: `Patient ${patient.name} assigned to supervisor ${supervisor.name}`,
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email
        },
        supervisor: {
          id: supervisor._id,
          name: supervisor.name,
          email: supervisor.email
        }
      }
    });
    
  } catch (error) {
    console.error('Error assigning patient to supervisor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign patient to supervisor' 
    });
  }
};

// ============================================
// EXPORT USERS
// ============================================
exports.exportUsers = async (req, res) => {
  try {
    const { role, format = 'json' } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    
    const users = await User.find(filter)
      .select('name email role phone isActive createdAt lastLogin')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      const csv = [
        'Name,Email,Role,Phone,Status,Created,Last Login',
        ...users.map(u => `"${u.name}","${u.email}","${u.role}","${u.phone || ''}","${u.isActive ? 'Active' : 'Inactive'}","${u.createdAt?.toISOString() || ''}","${u.lastLogin?.toISOString() || ''}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: users,
      exportedAt: new Date(),
      total: users.length
    });
    
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ success: false, message: 'Failed to export users' });
  }
};

// ============================================
// EXPORT ORGANIZATIONS
// ============================================
exports.exportOrganizations = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const organizations = await Organization.find()
      .populate('supervisors', 'name email')
      .populate('patients', 'name email')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      const csv = [
        'Name,Type,Status,Email,Phone,Supervisors,Patients,Created',
        ...organizations.map(o => `"${o.name}","${o.type}","${o.status}","${o.contact?.email || ''}","${o.contact?.phone || ''}","${o.supervisors?.length || 0}","${o.patients?.length || 0}","${o.createdAt?.toISOString() || ''}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=organizations-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: organizations,
      exportedAt: new Date(),
      total: organizations.length
    });
    
  } catch (error) {
    console.error('Error exporting organizations:', error);
    res.status(500).json({ success: false, message: 'Failed to export organizations' });
  }
};

// ============================================
// EXPORT ALERTS
// ============================================
exports.exportAlerts = async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const geoAlerts = await GeoFenceAlert.find({ createdAt: { $gte: startDate } })
      .populate('patient', 'name email')
      .populate('geoFence', 'name')
      .sort({ createdAt: -1 });
    
    const alerts = await Alert.find({ createdAt: { $gte: startDate } })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    const allAlerts = [
      ...geoAlerts.map(a => ({
        type: 'geofence',
        patient: a.patient?.name || 'Unknown',
        zone: a.geoFence?.name || 'Unknown',
        severity: a.alertSeverity,
        status: a.alertStatus,
        createdAt: a.createdAt
      })),
      ...alerts.map(a => ({
        type: 'alert',
        title: a.title,
        message: a.message,
        priority: a.priority,
        createdBy: a.createdBy?.name || 'System',
        createdAt: a.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (format === 'csv') {
      const csv = [
        'Type,Patient/Title,Zone/Message,Severity/Priority,Status,Created',
        ...allAlerts.map(a => `"${a.type}","${a.patient || a.title}","${a.zone || a.message || ''}","${a.severity || a.priority || ''}","${a.status || ''}","${a.createdAt?.toISOString() || ''}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=alerts-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: allAlerts,
      exportedAt: new Date(),
      total: allAlerts.length
    });
    
  } catch (error) {
    console.error('Error exporting alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to export alerts' });
  }
};

// ============================================
// EXPORT MOODS
// ============================================
exports.exportMoods = async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const moods = await MoodEntry.find({ createdAt: { $gte: startDate } })
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      const csv = [
        'Patient,Mood,Mood Value,Craving,Journal,Created',
        ...moods.map(m => `"${m.patient?.name || 'Unknown'}","${m.mood || ''}","${m.moodValue || ''}","${m.craving || ''}","${(m.journal || '').replace(/"/g, '""')}","${m.createdAt?.toISOString() || ''}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=moods-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: moods,
      exportedAt: new Date(),
      total: moods.length
    });
    
  } catch (error) {
    console.error('Error exporting moods:', error);
    res.status(500).json({ success: false, message: 'Failed to export moods' });
  }
};

// ============================================
// EXPORT ACTIVITIES
// ============================================
exports.exportActivities = async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const activities = await Activity.find({ createdAt: { $gte: startDate } })
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      const csv = [
        'Patient,Activity,Category,Points,Notes,Created',
        ...activities.map(a => `"${a.patient?.name || 'Unknown'}","${a.activity || ''}","${a.category || ''}","${a.points || 0}","${(a.notes || '').replace(/"/g, '""')}","${a.createdAt?.toISOString() || ''}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activities-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: activities,
      exportedAt: new Date(),
      total: activities.length
    });
    
  } catch (error) {
    console.error('Error exporting activities:', error);
    res.status(500).json({ success: false, message: 'Failed to export activities' });
  }
};

// ============================================
// EXPORT SYSTEM REPORT
// ============================================
exports.exportSystemReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Gather all system data
    const [
      totalNGOs,
      totalSupervisors,
      totalPatients,
      activePatients,
      organizations,
      recentMoods,
      recentActivities,
      recentAlerts
    ] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments({ role: /^supervisor$/i }),
      User.countDocuments({ role: /^patient$/i }),
      User.countDocuments({ role: 'patient', isActive: true }),
      Organization.find().select('name type status').limit(50),
      MoodEntry.find().sort({ createdAt: -1 }).limit(100).populate('patient', 'name'),
      Activity.find().sort({ createdAt: -1 }).limit(100).populate('patient', 'name'),
      GeoFenceAlert.find().sort({ createdAt: -1 }).limit(50).populate('patient', 'name')
    ]);
    
    // Calculate mood averages
    const avgMood = recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + (m.moodValue || 5), 0) / recentMoods.length
      : 5;
    
    const report = {
      generatedAt: new Date(),
      summary: {
        totalOrganizations: totalNGOs,
        totalSupervisors,
        totalPatients,
        activePatients,
        averageMood: Number(avgMood.toFixed(2)),
        totalMoodEntries: recentMoods.length,
        totalActivities: recentActivities.length,
        totalAlerts: recentAlerts.length
      },
      organizations: organizations.map(o => ({
        name: o.name,
        type: o.type,
        status: o.status
      })),
      moodTrends: recentMoods.slice(0, 20).map(m => ({
        patient: m.patient?.name || 'Unknown',
        mood: m.mood,
        value: m.moodValue,
        date: m.createdAt
      })),
      recentActivities: recentActivities.slice(0, 20).map(a => ({
        patient: a.patient?.name || 'Unknown',
        activity: a.activity,
        category: a.category,
        date: a.createdAt
      })),
      recentAlerts: recentAlerts.map(a => ({
        patient: a.patient?.name || 'Unknown',
        severity: a.alertSeverity,
        date: a.createdAt
      }))
    };
    
    if (format === 'csv') {
      const csv = [
        '=== SYSTEM REPORT ===',
        `Generated: ${report.generatedAt.toISOString()}`,
        '',
        '=== SUMMARY ===',
        `Total Organizations,${report.summary.totalOrganizations}`,
        `Total Supervisors,${report.summary.totalSupervisors}`,
        `Total Patients,${report.summary.totalPatients}`,
        `Active Patients,${report.summary.activePatients}`,
        `Average Mood,${report.summary.averageMood}`,
        `Total Mood Entries,${report.summary.totalMoodEntries}`,
        `Total Activities,${report.summary.totalActivities}`,
        `Total Alerts,${report.summary.totalAlerts}`,
        '',
        '=== ORGANIZATIONS ===',
        'Name,Type,Status',
        ...report.organizations.map(o => `"${o.name}","${o.type}","${o.status}"`),
        '',
        '=== RECENT MOODS ===',
        'Patient,Mood,Value,Date',
        ...report.moodTrends.map(m => `"${m.patient}","${m.mood}","${m.value}","${m.date?.toISOString() || ''}"`)
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=system-report-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Error generating system report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate system report' });
  }
};
