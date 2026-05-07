const GeoFence = require('../models/GeoFence');
const GeoFenceAlert = require('../models/GeoFenceAlert');
const LocationLog = require('../models/LocationLog');
const User = require('../models/User');
const realtime = require('../utils/realtime');

// ============================================
// CREATE GEO-FENCE
// ============================================
exports.createGeoFence = async (req, res) => {
  try {
    const { name, description, zoneType, coordinates, center, radius, riskCategory } = req.body;
    
    // Validation
    if (!name || !zoneType || !riskCategory) {
      return res.status(400).json({
        success: false,
        message: 'Name, zone type, and risk category are required'
      });
    }
    
    if (zoneType === 'polygon' && (!coordinates || coordinates.length < 3)) {
      return res.status(400).json({
        success: false,
        message: 'Polygon requires at least 3 coordinates'
      });
    }
    
    if (zoneType === 'circle' && (!center || !radius)) {
      return res.status(400).json({
        success: false,
        message: 'Circle requires center and radius'
      });
    }
    
    // Create geo-fence
    const geoFence = await GeoFence.create({
      name,
      description,
      zoneType,
      coordinates: zoneType === 'polygon' ? coordinates : undefined,
      center: zoneType === 'circle' ? center : undefined,
      radius: zoneType === 'circle' ? radius : undefined,
      riskCategory,
      createdBy: req.user.userId
    });
    
    // Emit real-time event for geofence creation
    realtime.emit('geofence:created', {
      id: geoFence._id,
      name: geoFence.name,
      zoneType: geoFence.zoneType,
      riskCategory: geoFence.riskCategory
    });
    
    res.status(201).json({
      success: true,
      data: geoFence,
      message: 'Geo-fence created successfully'
    });
    
  } catch (error) {
    console.error('Error creating geo-fence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create geo-fence'
    });
  }
};

// ============================================
// GET ALL GEO-FENCES
// ============================================
exports.getAllGeoFences = async (req, res) => {
  try {
    const { status, riskCategory } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (riskCategory) filter.riskCategory = riskCategory;
    
    const geoFences = await GeoFence.find(filter)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: geoFences
    });
    
  } catch (error) {
    console.error('Error fetching geo-fences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geo-fences'
    });
  }
};

// ============================================
// GET GEO-FENCE BY ID
// ============================================
exports.getGeoFenceById = async (req, res) => {
  try {
    const geoFence = await GeoFence.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!geoFence) {
      return res.status(404).json({
        success: false,
        message: 'Geo-fence not found'
      });
    }
    
    res.json({
      success: true,
      data: geoFence
    });
    
  } catch (error) {
    console.error('Error fetching geo-fence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geo-fence'
    });
  }
};

// ============================================
// UPDATE GEO-FENCE
// ============================================
exports.updateGeoFence = async (req, res) => {
  try {
    const { name, description, zoneType, coordinates, center, radius, riskCategory, status } = req.body;
    
    const geoFence = await GeoFence.findById(req.params.id);
    
    if (!geoFence) {
      return res.status(404).json({
        success: false,
        message: 'Geo-fence not found'
      });
    }
    
    // Update fields
    if (name) geoFence.name = name;
    if (description !== undefined) geoFence.description = description;
    if (zoneType) geoFence.zoneType = zoneType;
    if (coordinates) geoFence.coordinates = coordinates;
    if (center) geoFence.center = center;
    if (radius) geoFence.radius = radius;
    if (riskCategory) geoFence.riskCategory = riskCategory;
    if (status) geoFence.status = status;
    
    geoFence.lastModifiedBy = req.user.userId;
    
    await geoFence.save();
    
    // Emit real-time event for geofence update
    realtime.emit('geofence:updated', {
      id: geoFence._id,
      name: geoFence.name,
      zoneType: geoFence.zoneType,
      riskCategory: geoFence.riskCategory,
      status: geoFence.status
    });
    
    res.json({
      success: true,
      data: geoFence,
      message: 'Geo-fence updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating geo-fence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update geo-fence'
    });
  }
};

// ============================================
// DELETE GEO-FENCE
// ============================================
exports.deleteGeoFence = async (req, res) => {
  try {
    const geoFence = await GeoFence.findById(req.params.id);
    
    if (!geoFence) {
      return res.status(404).json({
        success: false,
        message: 'Geo-fence not found'
      });
    }
    
    // Check if there are active alerts for this zone
    const activeAlerts = await GeoFenceAlert.countDocuments({
      geoFence: geoFence._id,
      alertStatus: { $in: ['new', 'acknowledged'] }
    });
    
    if (activeAlerts > 0) {
      // Soft delete - set to inactive
      geoFence.status = 'inactive';
      await geoFence.save();
      
      // Emit real-time event for geofence deactivation
      realtime.emit('geofence:updated', {
        id: geoFence._id,
        name: geoFence.name,
        status: 'inactive',
        message: 'deactivated'
      });
      
      return res.json({
        success: true,
        message: `Geo-fence deactivated (${activeAlerts} active alerts exist)`
      });
    }
    
    // Save zone info before deletion for event
    const deletedZoneInfo = {
      id: geoFence._id,
      name: geoFence.name,
      zoneType: geoFence.zoneType
    };
    
    // Hard delete if no active alerts
    await GeoFence.findByIdAndDelete(req.params.id);
    
    // Emit real-time event for geofence deletion
    realtime.emit('geofence:deleted', deletedZoneInfo);
    
    res.json({
      success: true,
      message: 'Geo-fence deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting geo-fence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete geo-fence'
    });
  }
};

// ============================================
// GET ZONE ALERTS
// ============================================
exports.getZoneAlerts = async (req, res) => {
  try {
    const alerts = await GeoFenceAlert.find({ geoFence: req.params.id })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: alerts
    });
    
  } catch (error) {
    console.error('Error fetching zone alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zone alerts'
    });
  }
};

// ============================================
// GET ALL ALERTS
// ============================================
exports.getAllAlerts = async (req, res) => {
  try {
    const { status, severity, limit = 100 } = req.query;
    
    const filter = {};
    if (status) filter.alertStatus = status;
    if (severity) filter.alertSeverity = severity;
    
    const alerts = await GeoFenceAlert.find(filter)
      .populate('patient', 'name email phone')
      .populate('geoFence', 'name riskCategory')
      .populate('acknowledgedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const total = await GeoFenceAlert.countDocuments(filter);
    
    res.json({
      success: true,
      data: alerts,
      total: total
    });
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
};

// ============================================
// ACKNOWLEDGE ALERT
// ============================================
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const alert = await GeoFenceAlert.findById(req.params.alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    alert.alertStatus = 'acknowledged';
    alert.acknowledgedBy = req.user.userId;
    alert.acknowledgedAt = new Date();
    if (notes) alert.notes = notes;
    
    await alert.save();
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
    });
    
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert'
    });
  }
};

// ============================================
// CHECK PATIENT LOCATION (FOR MOBILE APP)
// ============================================
exports.checkPatientLocation = async (req, res) => {
  try {
    const { patientId, latitude, longitude, accuracy, source } = req.body;
    
    // 1. Save to LocationLog
    await LocationLog.create({
      patient: patientId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date(),
      source: source || 'foreground'
    });
    
    // 2. Get all active geo-fences
    const geoFences = await GeoFence.find({ status: 'active' });
    
    const triggeredZones = [];
    
    // 3. Check each zone
    for (const zone of geoFences) {
      let isInside = false;
      
      if (zone.zoneType === 'circle') {
        // Calculate distance using Haversine formula
        isInside = isPointInCircle(
          latitude,
          longitude,
          zone.center.latitude,
          zone.center.longitude,
          zone.radius
        );
      } else if (zone.zoneType === 'polygon') {
        // Ray casting algorithm for polygon
        isInside = isPointInPolygon(
          latitude,
          longitude,
          zone.coordinates
        );
      }
      
      if (isInside) {
        triggeredZones.push(zone);
        
        // Check if alert already exists (patient still in zone)
        const existingAlert = await GeoFenceAlert.findOne({
          patient: patientId,
          geoFence: zone._id,
          alertStatus: { $in: ['new', 'acknowledged'] },
          exitTime: null
        });
        
        if (!existingAlert) {
          // Create new alert
          const alert = await GeoFenceAlert.create({
            patient: patientId,
            geoFence: zone._id,
            eventType: 'entered',
            location: { latitude, longitude, accuracy },
            alertSeverity: zone.riskCategory,
            alertStatus: 'new',
            entryTime: new Date()
          });
          
          // Get patient info
          const patient = await User.findById(patientId).populate('assignedSupervisor');
          
          // Emit real-time alert to supervisor
          if (patient && patient.assignedSupervisor) {
            realtime.emitToUser(
              patient.assignedSupervisor._id,
              'geofence:alert',
              {
                alert: alert.toObject(),
                patient: {
                  _id: patient._id,
                  name: patient.name,
                  email: patient.email
                },
                zone: {
                  _id: zone._id,
                  name: zone.name,
                  riskCategory: zone.riskCategory
                }
              }
            );
            
            // Add to notified users
            alert.notifiedUsers.push({
              userId: patient.assignedSupervisor._id,
              role: 'supervisor',
              notifiedAt: new Date()
            });
            await alert.save();
          }
          
          // Emit to all admins
          const admins = await User.find({ role: 'admin', isActive: true });
          for (const admin of admins) {
            realtime.emitToUser(admin._id, 'geofence:alert', {
              alert: alert.toObject(),
              patient: { _id: patient._id, name: patient.name },
              zone: { _id: zone._id, name: zone.name, riskCategory: zone.riskCategory }
            });
            
            alert.notifiedUsers.push({
              userId: admin._id,
              role: 'admin',
              notifiedAt: new Date()
            });
          }
          await alert.save();
          
          // Update zone statistics
          zone.totalAlerts += 1;
          const uniquePatients = await GeoFenceAlert.distinct('patient', { geoFence: zone._id });
          zone.uniquePatients = uniquePatients.length;
          await zone.save();
        }
      } else {
        // Patient exited zone
        const activeAlert = await GeoFenceAlert.findOne({
          patient: patientId,
          geoFence: zone._id,
          alertStatus: { $ne: 'resolved' },
          exitTime: null
        });
        
        if (activeAlert) {
          activeAlert.exitTime = new Date();
          activeAlert.alertStatus = 'resolved';
          activeAlert.eventType = 'exited';
          await activeAlert.save();
          
          // Notify that patient exited
          const patient = await User.findById(patientId).populate('assignedSupervisor');
          if (patient && patient.assignedSupervisor) {
            realtime.emitToUser(
              patient.assignedSupervisor._id,
              'geofence:exit',
              {
                alert: activeAlert.toObject(),
                patient: { _id: patient._id, name: patient.name },
                zone: { _id: zone._id, name: zone.name }
              }
            );
          }
        }
      }
    }
    
    res.json({
      success: true,
      inGeoFence: triggeredZones.length > 0,
      zones: triggeredZones,
      alertCreated: triggeredZones.length > 0
    });
    
  } catch (error) {
    console.error('Error checking location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check location'
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Haversine formula - Check if point is in circle
function isPointInCircle(lat, lng, centerLat, centerLng, radius) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRadians(centerLat - lat);
  const dLng = toRadians(centerLng - lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat)) * Math.cos(toRadians(centerLat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radius;
}

// Ray casting algorithm - Check if point is in polygon
function isPointInPolygon(lat, lng, coordinates) {
  let inside = false;
  
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].latitude;
    const yi = coordinates[i].longitude;
    const xj = coordinates[j].latitude;
    const yj = coordinates[j].longitude;
    
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}
