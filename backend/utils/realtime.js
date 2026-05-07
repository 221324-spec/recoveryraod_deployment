// Matches User.role regardless of casing (DB enum uses Admin, Supervisor, Patient, NGO)
function roleRegex(role) {
  return new RegExp(`^${role}$`, 'i');
}

// Lightweight realtime helper using global.io (set in server.js)
function getIo() {
  if (global && global.io) return global.io;
  // fallback: try to require server app io if available
  try {
    const app = require('../server');
    return app && app.get && app.get('io');
  } catch (e) {
    return null;
  }
}

function emitToUser(userId, event, payload) {
  const io = getIo();
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToUsers(userIds, event, payload) {
  const io = getIo();
  if (!io) return;
  userIds.forEach(id => io.to(`user:${id}`).emit(event, payload));
}

function emitToRoom(room, event, payload) {
  const io = getIo();
  if (!io) return;
  io.to(room).emit(event, payload);
}

function broadcast(event, payload) {
  const io = getIo();
  if (!io) return;
  io.emit(event, payload);
}

// Admin dashboard specific updates — scoped to admin rooms only
async function broadcastStatsUpdate() {
  const io = getIo();
  if (!io) return;
  
  try {
    const User = require('../models/User');
    const Organization = require('../models/Organization');
    const GeoFenceAlert = require('../models/GeoFenceAlert');
    const Alert = require('../models/Alert');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      totalNGOs: await Organization.countDocuments(),
      totalSupervisors: await User.countDocuments({ role: roleRegex('supervisor') }),
      totalPatients: await User.countDocuments({ role: roleRegex('patient') }),
      riskAlertsToday: await GeoFenceAlert.countDocuments({ createdAt: { $gte: today } }) + 
                       await Alert.countDocuments({ createdAt: { $gte: today } })
    };
    
    // Emit ONLY to admin rooms — do NOT broadcast to all clients
    io.to('admin:stats').emit('stats:updated', stats);
    io.to('admin:dashboard').emit('stats:updated', stats);
    console.log('📊 Broadcast stats update to admin rooms:', stats);
  } catch (error) {
    console.error('Error broadcasting stats update:', error);
  }
}

function emitPatientRegistered(patientData) {
  const io = getIo();
  if (!io) return;
  io.to('admin:stats').emit('patient:registered', patientData);
  io.to('admin:dashboard').emit('patient:registered', patientData);
  broadcastStatsUpdate().catch((e) => console.error(e));
}

function emitSupervisorRegistered(supervisorData) {
  const io = getIo();
  if (!io) return;
  io.to('admin:stats').emit('supervisor:registered', supervisorData);
  io.to('admin:dashboard').emit('supervisor:registered', supervisorData);
  broadcastStatsUpdate().catch((e) => console.error(e));
}

function emitOrganizationCreated(orgData) {
  const io = getIo();
  if (!io) return;
  io.to('admin:stats').emit('organization:created', orgData);
  io.to('admin:dashboard').emit('organization:created', orgData);
  broadcastStatsUpdate().catch((e) => console.error(e));
}

function emitMoodLogged(moodData) {
  const io = getIo();
  if (!io) return;
  // Scoped to admin rooms only — do NOT broadcast to all clients
  io.to('admin:stats').emit('mood:logged', moodData);
  io.to('admin:dashboard').emit('mood:logged', moodData);
  // Also notify NGO global room so NGO dashboards can refresh mood trends
  io.to('ngo:global').emit('patient:mood:created', moodData);
  console.log('📊 Emitted mood:logged to admin/NGO rooms:', moodData);
  broadcastStatsUpdate();
}

function emitActivityLogged(activityData) {
  const io = getIo();
  if (!io) return;
  // Scoped to admin rooms only — do NOT broadcast to all clients
  io.to('admin:stats').emit('activity:logged', activityData);
  io.to('admin:dashboard').emit('activity:logged', activityData);
  console.log('📊 Emitted activity:logged to admin rooms:', activityData);
  broadcastStatsUpdate();
}

function emitGeoFenceAlert(alertData) {
  const io = getIo();
  if (!io) return;
  // Emit to admin rooms only
  io.to('admin:alerts').emit('geofence:alert', alertData);
  io.to('admin:dashboard').emit('geofence:alert', alertData);
  broadcastStatsUpdate();
}

// Generic emit function for custom events
function emit(event, payload) {
  const io = getIo();
  if (!io) return;
  io.emit(event, payload);
  console.log(`📡 Emitted ${event}:`, payload);
}

// Geofence-specific event emitters
function emitGeoFenceCreated(zoneData) {
  const io = getIo();
  if (!io) return;
  io.emit('geofence:created', zoneData);
  console.log('📍 Emitted geofence:created:', zoneData);
  broadcastStatsUpdate();
}

function emitGeoFenceUpdated(zoneData) {
  const io = getIo();
  if (!io) return;
  io.emit('geofence:updated', zoneData);
  console.log('📍 Emitted geofence:updated:', zoneData);
}

function emitGeoFenceDeleted(zoneData) {
  const io = getIo();
  if (!io) return;
  io.emit('geofence:deleted', zoneData);
  console.log('📍 Emitted geofence:deleted:', zoneData);
  broadcastStatsUpdate();
}

/** NGO/API mutations → prompt admin UIs to refetch; also pushes fresh aggregate stats */
function notifyAdminDataRefresh(reason = 'system_update', payload = {}) {
  const io = getIo();
  if (!io) return;
  const envelope = { reason, timestamp: new Date().toISOString(), ...payload };
  io.to('admin:dashboard').emit('admin:data:refresh', envelope);
  io.to('admin:stats').emit('admin:data:refresh', envelope);
  broadcastStatsUpdate().catch((err) => console.error('broadcastStatsUpdate:', err));
}

module.exports = {
  emitToUser,
  emitToUsers,
  emitToRoom,
  broadcast,
  emit,
  broadcastStatsUpdate,
  emitPatientRegistered,
  emitSupervisorRegistered,
  emitOrganizationCreated,
  emitMoodLogged,
  emitActivityLogged,
  emitGeoFenceAlert,
  emitGeoFenceCreated,
  emitGeoFenceUpdated,
  emitGeoFenceDeleted,
  notifyAdminDataRefresh,
  roleRegex
};
