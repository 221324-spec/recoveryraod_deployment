const Organization = require('../models/Organization');
const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const Activity = require('../models/Activity');
const GeoFenceAlert = require('../models/GeoFenceAlert');
const realtime = require('../utils/realtime');

// ============================================
// GET ALL ORGANIZATIONS
// ============================================
exports.getOrganizations = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const organizations = await Organization.find(filter)
      .populate('supervisors', 'name email')
      .populate('admins', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: organizations
    });
    
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
};

// ============================================
// CREATE ORGANIZATION
// ============================================
exports.addOrganization = async (req, res) => {
  try {
    const organizationData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const organization = await Organization.create(organizationData);
    
    // Emit real-time event for admin dashboard
    realtime.emitOrganizationCreated({
      id: organization._id,
      name: organization.name,
      type: organization.type
    });
    
    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    });
    
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organization'
    });
  }
};

// ============================================
// GET ORGANIZATION BY ID
// ============================================
exports.getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('supervisors', 'name email phone')
      .populate('patients', 'name email phone')
      .populate('createdBy', 'name email');
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
    
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
};

// ============================================
// UPDATE ORGANIZATION
// ============================================
exports.updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization,
      message: 'Organization updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization'
    });
  }
};

// ============================================
// DELETE ORGANIZATION
// ============================================
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Check if organization has patients or supervisors
    if (organization.patients.length > 0 || organization.supervisors.length > 0) {
      // Soft delete - set to inactive
      organization.status = 'Inactive';
      await organization.save();
      
      return res.json({
        success: true,
        message: 'Organization deactivated (has active users)'
      });
    }
    
    // Hard delete if no users
    await Organization.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization'
    });
  }
};

// ============================================
// GET ORGANIZATION STATISTICS
// ============================================
exports.getOrganizationStats = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('patients')
      .populate('supervisors');
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Count patients
    const totalPatients = organization.patients.length;
    const activePatients = organization.patients.filter(p => p.isActive).length;
    
    // Count supervisors
    const totalSupervisors = organization.supervisors.length;
    
    // Calculate occupancy rate
    const occupancyRate = organization.capacity.total > 0 
      ? (organization.capacity.current / organization.capacity.total) * 100 
      : 0;
    
    // Get recent moods for average mood score
    const patientIds = organization.patients.map(p => p._id);
    const recentMoods = await MoodEntry.find({
      userId: { $in: patientIds },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    const averageMoodScore = recentMoods.length > 0
      ? recentMoods.reduce((sum, mood) => sum + (mood.moodValue || 0), 0) / recentMoods.length
      : 0;
    
    // Count alerts this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const alertsThisMonth = await GeoFenceAlert.countDocuments({
      patient: { $in: patientIds },
      createdAt: { $gte: monthAgo }
    });
    
    // Get recent activities
    const recentActivities = await Activity.find({
      userId: { $in: patientIds }
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      data: {
        totalPatients,
        activePatients,
        totalSupervisors,
        occupancyRate: occupancyRate.toFixed(1),
        averageMoodScore: averageMoodScore.toFixed(2),
        successRate: organization.stats.successRate || 0,
        alertsThisMonth,
        recentActivities
      }
    });
    
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization statistics'
    });
  }
};

// ============================================
// GET ORGANIZATION REPORTS
// ============================================
exports.getOrganizationReports = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('patients')
      .populate('supervisors');
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    const patientIds = organization.patients.map(p => p._id);
    
    // Get mood trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const moodTrends = await MoodEntry.aggregate([
      {
        $match: {
          userId: { $in: patientIds },
          createdAt: { $gte: thirtyDaysAgo }
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
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          avgMood: 1,
          count: 1
        }
      }
    ]);
    
    // Get activity summary
    const activitySummary = await Activity.aggregate([
      {
        $match: {
          userId: { $in: patientIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get alert summary
    const alertSummary = await GeoFenceAlert.aggregate([
      {
        $match: {
          patient: { $in: patientIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$alertSeverity",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        organization: {
          name: organization.name,
          type: organization.type,
          totalPatients: organization.patients.length,
          totalSupervisors: organization.supervisors.length
        },
        moodTrends,
        activitySummary,
        alertSummary
      }
    });
    
  } catch (error) {
    console.error('Error fetching organization reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization reports'
    });
  }
};

// ============================================
// COMPARE ORGANIZATIONS
// ============================================
exports.compareOrganizations = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({
        success: false,
        message: 'Organization IDs required'
      });
    }
    
    const orgIds = ids.split(',');
    
    const organizations = await Organization.find({
      _id: { $in: orgIds }
    }).populate('patients').populate('supervisors');
    
    const comparison = await Promise.all(organizations.map(async (org) => {
      const patientIds = org.patients.map(p => p._id);
      
      // Get mood average
      const moods = await MoodEntry.find({
        userId: { $in: patientIds },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      const avgMood = moods.length > 0
        ? moods.reduce((sum, m) => sum + (m.moodValue || 0), 0) / moods.length
        : 0;
      
      // Occupancy rate
      const occupancyRate = org.capacity.total > 0
        ? (org.capacity.current / org.capacity.total) * 100
        : 0;
      
      return {
        organizationId: org._id,
        name: org.name,
        totalPatients: org.patients.length,
        activePatients: org.patients.filter(p => p.isActive).length,
        totalSupervisors: org.supervisors.length,
        successRate: org.stats.successRate || 0,
        occupancyRate: occupancyRate.toFixed(1),
        averageMood: avgMood.toFixed(2)
      };
    }));
    
    res.json({
      success: true,
      data: {
        comparison
      }
    });
    
  } catch (error) {
    console.error('Error comparing organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare organizations'
    });
  }
};

// ============================================
// ASSIGN SUPERVISOR TO ORGANIZATION
// ============================================
exports.assignSupervisor = async (req, res) => {
  try {
    const { supervisorId } = req.body;
    
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    const supervisor = await User.findById(supervisorId);
    
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid supervisor ID'
      });
    }
    
    // Add supervisor if not already assigned
    if (!organization.supervisors.includes(supervisorId)) {
      organization.supervisors.push(supervisorId);
      organization.stats.totalSupervisors = organization.supervisors.length;
      await organization.save();
    }
    
    res.json({
      success: true,
      data: organization,
      message: 'Supervisor assigned successfully'
    });
    
  } catch (error) {
    console.error('Error assigning supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign supervisor'
    });
  }
};

// ============================================
// REMOVE SUPERVISOR FROM ORGANIZATION
// ============================================
exports.removeSupervisor = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    organization.supervisors = organization.supervisors.filter(
      id => id.toString() !== req.params.supervisorId
    );
    organization.stats.totalSupervisors = organization.supervisors.length;
    
    await organization.save();
    
    res.json({
      success: true,
      data: organization,
      message: 'Supervisor removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove supervisor'
    });
  }
};

// ============================================
// GET ORGANIZATION PATIENTS
// ============================================
exports.getOrganizationPatients = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate({
        path: 'patients',
        select: 'name email phone isActive createdAt',
        populate: {
          path: 'assignedSupervisor',
          select: 'name email'
        }
      });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization.patients
    });
    
  } catch (error) {
    console.error('Error fetching organization patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization patients'
    });
  }
};
