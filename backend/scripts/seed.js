require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dbConnect = require('../config/db');
const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const TriggerLog = require('../models/TriggerLog');
const Activity = require('../models/Activity');

const run = async () => {
  await dbConnect();
  await User.deleteMany({});
  await MoodEntry.deleteMany({});
  await TriggerLog.deleteMany({});
  await Activity.deleteMany({});

  // Create password hash for admin
  const salt = await bcrypt.genSalt(12);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  
  const admin = await User.create({ 
    name: 'Admin User', 
    email: 'admin@admin.com', 
    role: 'Admin',
    passwordHash: adminPasswordHash,
    isActive: true, 
    status: 'active', 
    isEmailVerified: true 
  });
  
  const supervisorPasswordHash = await bcrypt.hash('supervisor123', salt);
  const supervisor = await User.create({ 
    name: 'Demo Supervisor', 
    email: 'supervisor@example.com', 
    role: 'Supervisor',
    passwordHash: supervisorPasswordHash,
    status: 'approved',
    isEmailVerified: true,
    isActive: true
  });
  
  const patientPasswordHash = await bcrypt.hash('patient123', salt);
  const patient = await User.create({ 
    name: 'Demo Patient', 
    email: 'patient@example.com', 
    role: 'Patient',
    passwordHash: patientPasswordHash,
    assignedSupervisor: supervisor._id,
    status: 'approved',
    isEmailVerified: true,
    isActive: true
  });

  const moods = [ '😊', '😐', '😔', '😊', '😐', '😔', '😊' ];
  for (let i=0;i<moods.length;i++) {
    await MoodEntry.create({ patient: patient._id, mood: moods[i], moodValue: {'😊':4,'😐':3,'😔':2,'😠':1}[moods[i]], craving: Math.floor(Math.random()*8), journal: 'Sample entry ' + (i+1), dateString: new Date().toDateString() });
  }

  await TriggerLog.create({ patient: patient._id, triggers: ['stress'], customTrigger: null, dateString: new Date().toDateString() });
  await Activity.create({ patient: patient._id, activity: 'Morning Meditation', icon: '🧘', points: 15, category: 'Wellness', date: new Date().toDateString(), time: '07:00', status: 'completed' });

  console.log('Seed complete!');
  console.log('✅ Admin (No approval needed):');
  console.log('   Email: admin@admin.com');
  console.log('   Password: admin123');
  console.log('   Status: ACTIVE (Full system access, no approval required)');
  console.log('');
  console.log('✅ Supervisor (Pre-approved):');
  console.log('   Email: supervisor@example.com');
  console.log('   Password: supervisor123');
  console.log('   Status: APPROVED');
  console.log('');
  console.log('✅ Patient (Pre-approved):');
  console.log('   Email: patient@example.com');
  console.log('   Password: patient123');
  console.log('   Status: APPROVED');
  process.exit(0);
};

run().catch(err=>{console.error(err); process.exit(1)});
