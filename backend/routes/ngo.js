const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Organization = require('../models/Organization');
const MoodEntry = require('../models/MoodEntry');
const Activity = require('../models/Activity');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const realtime = require('../utils/realtime');

const isDev = process.env.NODE_ENV !== 'production';

// PRODUCTION MODE - All security checks enforced

// Middleware to check NGO role and get organization
const requireNgo = async (req, res, next) => {
  try {
    // SECURITY: Require authentication - no development bypasses
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Case-insensitive role check
    if (req.user.role.toUpperCase() !== 'NGO') {
      console.error(`NGO role check failed. User role: "${req.user.role}", userId: ${req.user.userId}, email: ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: `NGO access required. Your role is "${req.user.role}".`
      });
    }
    
    // Find organization where this NGO user is an admin
    let organization = await Organization.findOne({
      $or: [
        { admins: req.user.userId },
        { 'contact.email': req.user.email }
      ]
    });
    
    if (!organization) {
      // Create a default organization for this NGO user
      const ngoUser = await User.findById(req.user.userId);
      organization = await Organization.create({
        name: ngoUser?.organizationName || 'Recovery Organization',
        type: 'recovery-center',
        description: 'Auto-created organization for NGO portal',
        contact: {
          email: ngoUser?.email || req.user.email,
          phone: ngoUser?.phone || ''
        },
        admins: [req.user.userId],
        status: 'Active',
        supervisors: [],
        patients: [],
        capacity: { total: 100, current: 0, available: 100 }
      });
    }
    
    req.organization = organization;
    next();
  } catch (error) {
    console.error('NGO auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify NGO access'
    });
  }
};

// SECURITY: Always require proper authentication
router.use(authenticate);

router.use(requireNgo);

// ============================================
// GET NGO DASHBOARD DATA
// ============================================
router.get('/dashboard', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organization._id)
      .populate('supervisors', 'name email phone isActive specialization maxPatients status')
      .populate('patients', 'name email phone isActive assignedSupervisor sobrietyDate status');

    // Get registered users waiting for approval (only show pending users)
    let pendingSupervisors = [];
    let pendingPatients = [];

    // Show pending users for approval in both dev and production
    pendingSupervisors = await User.find({
      role: 'supervisor',
      status: 'pending',
      isEmailVerified: true
    }).select('name email phone specialization createdAt');

    pendingPatients = await User.find({
      role: 'patient',
      status: 'pending',
      isEmailVerified: true
    }).select('name email phone createdAt');

    // Use only explicitly assigned and approved users
    const assignedPatients = organization.patients || [];
    const assignedSupervisors = organization.supervisors || [];

    const totalPatients = assignedPatients.length;
    const activePatients = assignedPatients.filter(p => p.isActive).length;
    const totalSupervisors = assignedSupervisors.length;

    // Get recent moods for average mood score - only from assigned patients
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMoods = await MoodEntry.find({
      patient: { $in: assignedPatients.map(p => p._id) },
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    const averageMoodScore = recentMoods.length > 0
      ? recentMoods.reduce((sum, mood) => sum + (mood.moodValue || 5), 0) / recentMoods.length
      : 5;

    // Count alerts this month - only for assigned patients
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let alertsThisMonth = 0;
    try {
      const Alert = require('../models/Alert');
      alertsThisMonth = await Alert.countDocuments({
        patient: { $in: assignedPatients.map(p => p._id) },
        createdAt: { $gte: monthAgo }
      });
    } catch (e) {
      try {
        const GeoFenceAlert = require('../models/GeoFenceAlert');
        alertsThisMonth = await GeoFenceAlert.countDocuments({
          patient: { $in: assignedPatients.map(p => p._id) },
          createdAt: { $gte: monthAgo }
        });
      } catch (e2) {
        alertsThisMonth = 0;
      }
    }

    // Get recent activities - only from assigned patients
    const recentActivities = await Activity.find({
      patient: { $in: assignedPatients.map(p => p._id) }
    }).sort({ createdAt: -1 }).limit(10).populate('patient', 'name');

    // Calculate success rate
    const successRate = organization.stats?.successRate ||
      (totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 85);

    // Occupancy rate
    const occupancyRate = organization.capacity?.total > 0
      ? Math.round((totalPatients / organization.capacity.total) * 100)
      : Math.round((totalPatients / 100) * 100);

    // Get mood trend data for charts - only from assigned patients
    const moodTrends = await MoodEntry.aggregate([
      {
        $match: {
          patient: { $in: assignedPatients.map(p => p._id) },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgMood: { $avg: "$moodValue" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // Get appointments data - only for assigned patients and supervisors
    const upcomingAppointments = await Appointment.find({
      $or: [
        { patient: { $in: assignedPatients.map(p => p._id) } },
        { provider: { $in: assignedSupervisors.map(s => s._id) } }
      ],
      dateTime: { $gte: new Date() }
    }).sort({ dateTime: 1 }).limit(5).populate('patient', 'name').populate('provider', 'name');

    // Get messages count (activity metric) - only between assigned patients and supervisors
    const messagesThisWeek = await Message.countDocuments({
      $or: [
        { sender: { $in: assignedPatients.map(p => p._id) }, receiver: { $in: assignedSupervisors.map(s => s._id) } },
        { sender: { $in: assignedSupervisors.map(s => s._id) }, receiver: { $in: assignedPatients.map(p => p._id) } }
      ],
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        organization: {
          id: organization._id,
          name: organization.name,
          type: organization.type,
          status: organization.status
        },
        stats: {
          totalPatients,
          activePatients,
          totalSupervisors,
          alertsThisMonth,
          averageMoodScore: Number(averageMoodScore.toFixed(1)),
          successRate,
          occupancyRate,
          messagesThisWeek,
          moodEntriesCount: recentMoods.length
        },
        pendingSupervisors,
        pendingPatients,
        moodTrends: moodTrends.map(t => ({
          date: t._id,
          avgMood: Number(t.avgMood?.toFixed(1) || 5),
          count: t.count
        })),
        recentActivities: recentActivities.map(a => ({
          id: a._id,
          type: a.activity || a.category || 'activity',
          description: a.notes || a.activity || 'Activity logged',
          patient: a.patient?.name || 'Patient',
          timestamp: a.createdAt,
          points: a.points || 0
        })),
        upcomingAppointments: upcomingAppointments.map(a => ({
          id: a._id,
          patient: a.patient?.name || 'Patient',
          provider: a.provider?.name || 'Provider',
          dateTime: a.dateTime,
          type: a.appointmentType || 'General'
        })),
        recentMoods: recentMoods.slice(0, 10).map(m => ({
          id: m._id,
          mood: m.mood,
          moodValue: m.moodValue,
          craving: m.craving,
          journal: m.journal,
          createdAt: m.createdAt
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching NGO dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: isDev ? error.message : undefined
    });
  }
});

// ============================================
// APPROVE SUPERVISOR
// ============================================
router.post('/supervisors/:id/approve', async (req, res) => {
  try {
    const supervisorId = req.params.id;
    const organizationId = req.organization._id;

    // Find the supervisor
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role.toLowerCase() !== 'supervisor') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    // Check if already approved
    if (supervisor.status === 'approved' || supervisor.status === 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Supervisor is already approved'
      });
    }

    // Update supervisor status
    supervisor.status = 'approved';
    supervisor.assignedOrganization = organizationId;
    supervisor.isActive = true;
    await supervisor.save();

    // Add to organization supervisors list
    const organization = await Organization.findById(organizationId);
    if (!organization.supervisors.includes(supervisorId)) {
      organization.supervisors.push(supervisorId);
      organization.stats.totalSupervisors = organization.supervisors.length;
      await organization.save();
    }

    realtime.notifyAdminDataRefresh('ngo_supervisor_approved', {
      organizationId: organizationId.toString(),
      supervisorId: supervisorId.toString()
    });

    res.json({
      success: true,
      message: 'Supervisor approved successfully',
      data: {
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        status: supervisor.status
      }
    });

  } catch (error) {
    console.error('Error approving supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve supervisor'
    });
  }
});

// ============================================
// APPROVE PATIENT
// ============================================
router.post('/patients/:id/approve', async (req, res) => {
  try {
    const patientId = req.params.id;
    const organizationId = req.organization._id;

    // Find the patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role.toLowerCase() !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if already approved
    if (patient.status === 'approved' || patient.status === 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Patient is already approved'
      });
    }

    // Update patient status
    patient.status = 'approved';
    patient.assignedOrganization = organizationId;
    patient.isActive = true;
    await patient.save();

    // Add to organization patients list
    const organization = await Organization.findById(organizationId);
    if (!organization.patients.includes(patientId)) {
      organization.patients.push(patientId);
      organization.capacity.current = organization.patients.length;
      organization.stats.totalPatients = organization.patients.length;
      await organization.save();
    }

    realtime.notifyAdminDataRefresh('ngo_patient_approved', {
      organizationId: organizationId.toString(),
      patientId: patientId.toString()
    });

    res.json({
      success: true,
      message: 'Patient approved successfully',
      data: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        status: patient.status
      }
    });

  } catch (error) {
    console.error('Error approving patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve patient'
    });
  }
});

// ============================================
// ASSIGN SUPERVISOR TO PATIENT
// ============================================
router.post('/patients/:patientId/assign-supervisor/:supervisorId', async (req, res) => {
  try {
    const { patientId, supervisorId } = req.params;
    const organizationId = req.organization._id;

    // Verify both users belong to this organization
    const organization = await Organization.findById(organizationId);
    if (!organization.patients.includes(patientId) || !organization.supervisors.includes(supervisorId)) {
      return res.status(403).json({
        success: false,
        message: 'Patient or supervisor not assigned to this organization'
      });
    }

    // Find and update patient
    const patient = await User.findById(patientId);
    const supervisor = await User.findById(supervisorId);

    if (!patient || !supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Patient or supervisor not found'
      });
    }

    // Check supervisor capacity
    const currentPatients = await User.countDocuments({
      assignedSupervisor: supervisorId,
      role: 'patient'
    });

    if (currentPatients >= (supervisor.maxPatients || 20)) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor has reached maximum patient capacity'
      });
    }

    // Assign supervisor to patient
    patient.assignedSupervisor = supervisorId;
    patient.status = 'assigned';
    await patient.save();

    // Update supervisor's assigned patients
    if (!supervisor.assignedPatients) {
      supervisor.assignedPatients = [];
    }
    if (!supervisor.assignedPatients.includes(patientId)) {
      supervisor.assignedPatients.push(patientId);
      await supervisor.save();
    }

    realtime.notifyAdminDataRefresh('ngo_patient_supervisor_linked', {
      organizationId: organizationId.toString(),
      patientId: patientId.toString(),
      supervisorId: supervisorId.toString()
    });

    res.json({
      success: true,
      message: 'Patient assigned to supervisor successfully',
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          assignedSupervisor: supervisorId
        },
        supervisor: {
          id: supervisor._id,
          name: supervisor.name
        }
      }
    });

  } catch (error) {
    console.error('Error assigning supervisor to patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign supervisor to patient'
    });
  }
});

// ============================================
// GET SUPERVISORS
// ============================================
router.get('/supervisors', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organization._id)
      .populate({
        path: 'supervisors',
        select: 'name email phone isActive specialization maxPatients yearsOfExperience licenseNumber createdAt'
      });
    
    // Get patient count for each supervisor
    const supervisorsWithPatients = await Promise.all(
      organization.supervisors.map(async (supervisor) => {
        const patientCount = await User.countDocuments({
          assignedSupervisor: supervisor._id,
          role: 'patient'
        });
        
        const patients = await User.find({
          assignedSupervisor: supervisor._id,
          role: 'patient'
        }).select('name email isActive');
        
        return {
          id: supervisor._id,
          name: supervisor.name,
          email: supervisor.email,
          phone: supervisor.phone,
          isActive: supervisor.isActive,
          specialization: supervisor.specialization || [],
          maxPatients: supervisor.maxPatients || 20,
          yearsOfExperience: supervisor.yearsOfExperience || 0,
          licenseNumber: supervisor.licenseNumber,
          patientCount,
          patients: patients.map(p => ({
            id: p._id,
            name: p.name,
            email: p.email,
            isActive: p.isActive
          })),
          joinedAt: supervisor.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      data: supervisorsWithPatients
    });
    
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supervisors'
    });
  }
});

// ============================================
// GET AVAILABLE SUPERVISORS (not in org)
// ============================================
router.get('/supervisors/available', async (req, res) => {
  try {
    // Get all supervisors not in this organization
    // Support both 'Supervisor' and 'supervisor' role values
    const query = {
      role: { $regex: /^supervisor$/i },
      _id: { $nin: req.organization.supervisors }
    };
    
    // SECURITY: Only show verified supervisors with pending status awaiting approval
    query.isEmailVerified = true;
    query.status = 'pending';
    
    const availableSupervisors = await User.find(query)
      .select('name email phone specialization maxPatients yearsOfExperience isEmailVerified isActive createdAt');
    
    console.log(`📋 Found ${availableSupervisors.length} available supervisors for NGO`);
    
    res.json({
      success: true,
      data: availableSupervisors.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        specialization: s.specialization || [],
        maxPatients: s.maxPatients || 20,
        yearsOfExperience: s.yearsOfExperience || 0,
        isVerified: s.isEmailVerified,
        isActive: s.isActive,
        registeredAt: s.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching available supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available supervisors'
    });
  }
});

// ============================================
// ASSIGN SUPERVISOR TO ORGANIZATION
// ============================================
router.post('/supervisors/assign', async (req, res) => {
  try {
    const { supervisorId } = req.body;
    
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role.toLowerCase() !== 'supervisor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid supervisor ID'
      });
    }
    
    const organization = await Organization.findById(req.organization._id);
    
    if (!organization.supervisors.includes(supervisorId)) {
      organization.supervisors.push(supervisorId);
      organization.stats.totalSupervisors = organization.supervisors.length;
      await organization.save();
    }
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('ngo:supervisor:assigned', {
        organizationId: organization._id,
        supervisor: {
          id: supervisor._id,
          name: supervisor.name,
          email: supervisor.email
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Supervisor assigned successfully',
      data: {
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email
      }
    });
    
  } catch (error) {
    console.error('Error assigning supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign supervisor'
    });
  }
});

// ============================================
// REMOVE SUPERVISOR FROM ORGANIZATION
// ============================================
router.delete('/supervisors/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    
    const organization = await Organization.findById(req.organization._id);
    organization.supervisors = organization.supervisors.filter(
      id => id.toString() !== supervisorId
    );
    organization.stats.totalSupervisors = organization.supervisors.length;
    await organization.save();
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('ngo:supervisor:removed', {
        organizationId: organization._id,
        supervisorId
      });
    }

    realtime.notifyAdminDataRefresh('ngo_supervisor_removed', {
      organizationId: organization._id.toString(),
      supervisorId: supervisorId.toString()
    });
    
    res.json({
      success: true,
      message: 'Supervisor removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove supervisor'
    });
  }
});

// ============================================
// GET PATIENTS
// ============================================
router.get('/patients', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organization._id)
      .populate({
        path: 'patients',
        select: 'name email phone isActive assignedSupervisor sobrietyDate recoveryPoints createdAt',
        populate: {
          path: 'assignedSupervisor',
          select: 'name email'
        }
      });
    
    // Get mood data and risk level for each patient
    const patientsWithData = await Promise.all(
      organization.patients.map(async (patient) => {
        // Get recent moods
        const recentMoods = await MoodEntry.find({
          patient: patient._id
        }).sort({ createdAt: -1 }).limit(7);
        
        // Calculate average mood
        const avgMood = recentMoods.length > 0
          ? recentMoods.reduce((sum, m) => sum + (m.moodValue || 5), 0) / recentMoods.length
          : 5;
        
        // Determine risk level
        let riskLevel = 'low';
        if (avgMood < 3) riskLevel = 'high';
        else if (avgMood < 5) riskLevel = 'medium';
        
        // Get alert count - try Alert model first, then GeoFenceAlert
        let alertCount = 0;
        try {
          const Alert = require('../models/Alert');
          alertCount = await Alert.countDocuments({
            targetUsers: patient._id,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          });
        } catch (e) {
          try {
            const GeoFenceAlert = require('../models/GeoFenceAlert');
            alertCount = await GeoFenceAlert.countDocuments({
              patient: patient._id,
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            });
          } catch (e2) {
            alertCount = 0;
          }
        }
        
        // Calculate progress (days since sobriety date)
        const sobrietyDays = patient.sobrietyDate
          ? Math.floor((Date.now() - new Date(patient.sobrietyDate)) / (1000 * 60 * 60 * 24))
          : 0;
        
        return {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          isActive: patient.isActive,
          supervisor: patient.assignedSupervisor ? {
            id: patient.assignedSupervisor._id,
            name: patient.assignedSupervisor.name
          } : null,
          sobrietyDays,
          recoveryPoints: patient.recoveryPoints || 0,
          averageMood: Number(avgMood.toFixed(2)),
          riskLevel,
          alertCount,
          moodTrend: recentMoods.map(m => ({
            value: m.moodValue || 5,
            date: m.createdAt
          })),
          joinedAt: patient.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      data: patientsWithData
    });
    
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
});

// ============================================
// GET AVAILABLE PATIENTS (not in org)
// ============================================
router.get('/patients/available', async (req, res) => {
  try {
    // Get all patients not in this organization
    // Support both 'Patient' and 'patient' role values
    const query = {
      role: { $regex: /^patient$/i },
      _id: { $nin: req.organization.patients }
    };
    
    // SECURITY: Only show verified patients with pending status awaiting approval
    query.isEmailVerified = true;
    query.status = 'pending';
    
    const availablePatients = await User.find(query)
      .select('name email phone isActive isEmailVerified createdAt');
    
    console.log(`📋 Found ${availablePatients.length} available patients for NGO`);
    
    res.json({
      success: true,
      data: availablePatients.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        isActive: p.isActive,
        isVerified: p.isEmailVerified,
        registeredAt: p.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching available patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available patients'
    });
  }
});

// ============================================
// ASSIGN PATIENT TO ORGANIZATION
// ============================================
router.post('/patients/assign', async (req, res) => {
  try {
    const { patientId, supervisorId } = req.body;
    
    const patient = await User.findById(patientId);
    if (!patient || patient.role.toLowerCase() !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }
    
    const organization = await Organization.findById(req.organization._id);
    
    if (!organization.patients.includes(patientId)) {
      organization.patients.push(patientId);
      organization.stats.totalPatients = organization.patients.length;
      organization.capacity.current = organization.patients.length;
      await organization.save();
    }
    
    // Assign supervisor if provided
    if (supervisorId) {
      patient.assignedSupervisor = supervisorId;
      await patient.save();
    }
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('ngo:patient:assigned', {
        organizationId: organization._id,
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email
        }
      });
    }

    realtime.notifyAdminDataRefresh('ngo_patient_added_to_org', {
      organizationId: organization._id.toString(),
      patientId: patient._id.toString()
    });
    
    res.json({
      success: true,
      message: 'Patient assigned successfully',
      data: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      }
    });
    
  } catch (error) {
    console.error('Error assigning patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign patient'
    });
  }
});

// ============================================
// ASSIGN PATIENT TO SUPERVISOR
// ============================================
router.post('/patients/:patientId/assign-supervisor', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { supervisorId } = req.body;
    
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Verify supervisor is in organization
    if (!req.organization.supervisors.includes(supervisorId)) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor not in this organization'
      });
    }
    
    patient.assignedSupervisor = supervisorId;
    patient.status = 'assigned'; // IMPORTANT: Set status so supervisor API can find them
    await patient.save();
    
    const supervisor = await User.findById(supervisorId).select('name email');
    
    // Emit real-time event
    if (global.io) {
      global.io.emit('ngo:patient:supervisor:changed', {
        organizationId: req.organization._id,
        patientId,
        supervisor: {
          id: supervisor._id,
          name: supervisor.name
        }
      });
    }

    realtime.notifyAdminDataRefresh('ngo_assignment_updated', {
      organizationId: req.organization._id.toString(),
      patientId: patientId.toString(),
      supervisorId: supervisor._id.toString()
    });
    
    res.json({
      success: true,
      message: 'Supervisor assigned to patient successfully'
    });
    
  } catch (error) {
    console.error('Error assigning supervisor to patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign supervisor'
    });
  }
});

// ============================================
// GET REPORTS
// ============================================
router.get('/reports', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const organization = await Organization.findById(req.organization._id)
      .populate('patients')
      .populate('supervisors');
    
    const patientIds = organization.patients.map(p => p._id);
    
    // Date range based on period
    const now = new Date();
    let startDate;
    if (period === 'quarterly') {
      startDate = new Date(now.setMonth(now.getMonth() - 3));
    } else {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }
    
    // Get mood trends
    const moodTrends = await MoodEntry.aggregate([
      {
        $match: {
          patient: { $in: patientIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          avgMood: { $avg: "$moodValue" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get activity summary
    const activitySummary = await Activity.aggregate([
      {
        $match: {
          patient: { $in: patientIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get alert summary - try Alert model first
    let alertSummary = [];
    try {
      const Alert = require('../models/Alert');
      alertSummary = await Alert.aggregate([
        {
          $match: {
            targetUsers: { $in: patientIds },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 }
          }
        }
      ]);
    } catch (e) {
      // Fallback to GeoFenceAlert
      alertSummary = await GeoFenceAlert.aggregate([
        {
          $match: {
            patient: { $in: patientIds },
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
    }
    
    // Calculate key metrics
    const totalMoods = moodTrends.reduce((sum, t) => sum + t.count, 0);
    const avgMoodOverall = moodTrends.length > 0
      ? moodTrends.reduce((sum, t) => sum + (t.avgMood * t.count), 0) / totalMoods
      : 0;
    
    const totalAlerts = alertSummary.reduce((sum, a) => sum + a.count, 0);
    const criticalAlerts = alertSummary.find(a => a._id === 'critical')?.count || 0;
    
    res.json({
      success: true,
      data: {
        period,
        organization: {
          name: organization.name,
          type: organization.type
        },
        summary: {
          totalPatients: organization.patients.length,
          totalSupervisors: organization.supervisors.length,
          averageMood: Number(avgMoodOverall.toFixed(2)),
          totalAlerts,
          criticalAlerts,
          successRate: organization.stats.successRate || 0
        },
        moodTrends: moodTrends.map(t => ({
          date: t._id,
          avgMood: Number(t.avgMood.toFixed(2)),
          count: t.count
        })),
        activitySummary: activitySummary.map(a => ({
          type: a._id || 'Unknown',
          count: a.count
        })),
        alertSummary: alertSummary.map(a => ({
          severity: a._id || 'Unknown',
          count: a.count
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// ============================================
// GET ALERTS
// ============================================
router.get('/alerts', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const organization = await Organization.findById(req.organization._id);
    const patientIds = organization.patients || [];
    
    // Try Alert model first
    let alerts = [];
    try {
      const Alert = require('../models/Alert');
      alerts = await Alert.find({
        targetUsers: { $in: patientIds }
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('targetUsers', 'name email')
        .populate('createdBy', 'name');
      
      return res.json({
        success: true,
        data: alerts.map(a => ({
          id: a._id,
          patient: a.targetUsers && a.targetUsers[0] ? {
            id: a.targetUsers[0]._id,
            name: a.targetUsers[0].name
          } : null,
          severity: a.priority || 'medium',
          title: a.title,
          message: a.message,
          type: a.type,
          createdAt: a.createdAt,
          resolved: a.resolved || false,
          createdBy: a.createdBy ? a.createdBy.name : 'System'
        }))
      });
    } catch (alertError) {
      // Fallback to GeoFenceAlert model
      try {
        const GeoFenceAlert = require('../models/GeoFenceAlert');
        alerts = await GeoFenceAlert.find({
          patient: { $in: patientIds }
        })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .populate('patient', 'name email');
        
        return res.json({
          success: true,
          data: alerts.map(a => ({
            id: a._id,
            patient: a.patient ? {
              id: a.patient._id,
              name: a.patient.name
            } : null,
            severity: a.alertSeverity || 'medium',
            title: 'Geofence Alert',
            message: a.message || 'Geofence violation detected',
            location: a.location,
            createdAt: a.createdAt,
            resolved: a.resolved || false
          }))
        });
      } catch (geoError) {
        // No alerts to return
        return res.json({
          success: true,
          data: []
        });
      }
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

module.exports = router;
