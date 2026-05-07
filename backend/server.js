require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { getAllowedOrigins } = require('./config/corsOrigins');

const app = express();
const server = http.createServer(app);

const allowedOrigins = getAllowedOrigins();
const corsOriginOption =
  allowedOrigins.length > 0 ? allowedOrigins : true;

// Socket.IO - Enhanced real-time functionality
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: corsOriginOption,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io globally available
global.io = io;

// WebRTC 1-to-1 video call signaling (Socket.IO)
const videoCallHandler = require('./socket/videoCallHandler');

const dbConnect = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const messageRoutes = require('./routes/messages');
const appointmentRoutes = require('./routes/appointments');
const profileRoutes = require('./routes/profile');
const supervisorRoutes = require('./routes/supervisor');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const notificationRoutes = require('./routes/notifications');

// Auth middleware
const { authMiddleware } = require('./middleware/auth');

// Admin Dashboard Routes
const adminRoutes = require('./routes/admin');
const geoFenceRoutes = require('./routes/geofence');
const organizationRoutes = require('./routes/organizations');
const patientLocationRoutes = require('./routes/patientLocation');

// NGO Dashboard Routes
const ngoRoutes = require('./routes/ngo');

// Goal Management Routes
const goalRoutes = require('./routes/goals');
const goalProgressRoutes = require('./routes/goalProgressRoutes');
const milestoneRoutes = require('./routes/milestones');

// Progress Routes
const progressRoutes = require('./routes/progress');

// Chatbot Routes (Phase 1)
const chatRoutes = require('./routes/chat');
const chatAlertRoutes = require('./routes/chatAlerts');

// Module V: AI Mood Detection
const aiMoodRoutes = require('./routes/aiMood');

// Middleware
app.use(cors({
  origin: corsOriginOption,
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to database
dbConnect();

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/supervisors', authMiddleware, supervisorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);

// Admin Dashboard Routes
app.use('/api/admin', adminRoutes);
app.use('/api/geofence', geoFenceRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/patient', patientLocationRoutes);

// NGO Dashboard Routes
app.use('/api/ngo', ngoRoutes);

// Chatbot Routes (Phase 2 — LM Studio powered)
app.use('/api/chat', chatRoutes);
app.use('/api/chat-alerts', chatAlertRoutes);

// Goal Management Routes
app.use('/api/goals', goalRoutes);
app.use('/api/goal-progress', goalProgressRoutes);
app.use('/api/milestones', milestoneRoutes);

// Progress Routes
app.use('/api/progress', progressRoutes);

// Module V: AI Mood Detection — patient routes
app.use('/api/patients', aiMoodRoutes);

// Module XI: Events, Campaigns & Recovery Calendar
const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

// Legacy route for backward compatibility
const appointmentController = require('./controllers/appointmentController');
app.get('/api/providers', appointmentController.getProviders);

// Health check
app.get('/api/health', (req, res) => res.json({
  ok: true,
  time: new Date(),
  version: '2.0.0',
  realtime: 'enabled'
}));

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Register video call signaling events
  videoCallHandler(io, socket);

  // User joins their personal room
  socket.on('join', async (data) => {
    try {
      if (data && data.userId) {
        // Attach user identity to the socket for other real-time features
        socket.userId = data.userId;
        socket.data = socket.data || {};
        socket.data.userId = data.userId;

        socket.join(`user:${data.userId}`);
        console.log(`👤 User ${data.userId} joined room: user:${data.userId}`);
        console.log(`📍 Socket ${socket.id} joined room for user ${data.userId}`);

        // Update user online status
        const User = require('./models/User');
        await User.findByIdAndUpdate(data.userId, {
          onlineStatus: 'online',
          lastSeen: new Date()
        });

        // Notify others about online status
        io.emit('user:status', {
          userId: data.userId,
          status: 'online',
          lastSeen: new Date()
        });
      }
    } catch (error) {
      console.error('Join room error:', error);
    }
  });

  // Presence: allow clients to request the current status of a userId
  socket.on('user:status:request', async (data) => {
    try {
      const userId = data?.userId;
      if (!userId) return;

      const User = require('./models/User');
      const user = await User.findById(userId).select('onlineStatus lastSeen');

      socket.emit('user:status', {
        userId,
        status: (user?.onlineStatus || 'offline').toString().toLowerCase(),
        lastSeen: user?.lastSeen || null
      });
    } catch (error) {
      console.error('user:status:request error:', error);
    }
  });

  // Presence: mark offline when the last socket for a user disconnects
  socket.on('disconnect', async () => {
    try {
      const userId = socket.userId || socket.data?.userId;
      if (!userId) return;

      const roomName = `user:${userId}`;
      let remaining = 0;
      try {
        const sockets = await io.in(roomName).fetchSockets();
        remaining = sockets.length;
      } catch (e) {
        const room = io.sockets.adapter.rooms.get(roomName);
        remaining = room ? room.size : 0;
      }

      if (remaining > 0) return;

      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, {
        onlineStatus: 'offline',
        lastSeen: new Date()
      });

      io.emit('user:status', {
        userId,
        status: 'offline',
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Disconnect presence error:', error);
    }
  });

  // Real-time messaging
  socket.on('message:send', async (msg) => {
    try {
      console.log('📨 Socket.IO received message:send event:', JSON.stringify(msg, null, 2));
      
      if (!msg || !msg.receiverId || !msg.content) {
        console.error('❌ Invalid message format:', msg);
        return;
      }

      if (!msg.senderId) {
        console.error('❌ Missing senderId in message:', msg);
        return;
      }

      console.log('✅ Valid message received from:', msg.senderId, 'to:', msg.receiverId);
      
      // Save message directly to database (bypass authentication)
      const Message = require('./models/Message');
      const User = require('./models/User');

      // Verify users exist
      const [sender, receiver] = await Promise.all([
        User.findById(msg.senderId),
        User.findById(msg.receiverId)
      ]);

      if (!sender) {
        console.error('❌ Sender not found:', msg.senderId);
        return;
      }

      if (!receiver) {
        console.error('❌ Receiver not found:', msg.receiverId);
        return;
      }

      console.log('✅ Both users verified:', sender.name, '→', receiver.name);

      // Create and save message
      const message = new Message({
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        messageType: msg.messageType || 'text',
        isCrisis: msg.isCrisis || false,
        isUrgent: msg.isUrgent || false,
        priority: msg.priority || 'normal'
      });

      await message.save();
      console.log('✅ Message saved to database, ID:', message._id);

      // Populate sender info for real-time emission
      await message.populate('senderId', 'name role profilePicture');
      await message.populate('receiverId', 'name role profilePicture');

      const messageData = {
        _id: message._id,
        senderId: {
          _id: message.senderId._id,
          name: message.senderId.name,
          role: message.senderId.role
        },
        receiverId: {
          _id: message.receiverId._id,
          name: message.receiverId.name,
          role: message.receiverId.role
        },
        content: message.content,
        messageType: message.messageType,
        timestamp: message.createdAt,
        createdAt: message.createdAt,
        isRead: false
      };

      // Emit to receiver
      console.log('📤 Emitting message:new to receiver room: user:' + msg.receiverId);
      io.to(`user:${msg.receiverId}`).emit('message:new', { message: messageData });

      // Emit to sender (for multi-device support)
      console.log('📤 Emitting message:sent to sender room: user:' + msg.senderId);
      io.to(`user:${msg.senderId}`).emit('message:sent', { message: messageData });
      
      console.log('✅ Real-time message delivery complete');
    } catch (error) {
      console.error('❌ Real-time message send error:', error);
      console.error('Stack trace:', error.stack);
    }
  });

    // Allow clients to create mood entries via socket (will persist and emit)
    socket.on('patient:mood:create', async (msg) => {
      try {
        if (msg && msg.patientId && msg.payload) {
          const patientController = require('./controllers/patientController');
          const mockReq = {
            params: { id: msg.patientId },
            body: msg.payload,
            user: { userId: msg.senderId },
            app: { get: () => io }
          };
          const mockRes = {
            status: (code) => ({ json: (data) => {} }),
            json: (data) => {}
          };
          await patientController.postMood(mockReq, mockRes);
        }
      } catch (error) {
        console.error('Socket patient:mood:create error:', error);
      }
    });

    // Create trigger via socket
    socket.on('patient:trigger:create', async (msg) => {
      try {
        if (msg && msg.patientId && msg.payload) {
          const patientController = require('./controllers/patientController');
          const mockReq = { params: { id: msg.patientId }, body: msg.payload, user: { userId: msg.senderId }, app: { get: () => io } };
          const mockRes = { status: (code) => ({ json: (data) => {} }), json: (data) => {} };
          await patientController.postTrigger(mockReq, mockRes);
        }
      } catch (error) {
        console.error('Socket patient:trigger:create error:', error);
      }
    });

    // Create activity via socket
    socket.on('patient:activity:create', async (msg) => {
      try {
        if (msg && msg.patientId && msg.payload) {
          const patientController = require('./controllers/patientController');
          const mockReq = { params: { id: msg.patientId }, body: msg.payload, user: { userId: msg.senderId }, app: { get: () => io } };
          const mockRes = { status: (code) => ({ json: (data) => {} }), json: (data) => {} };
          await patientController.postActivity(mockReq, mockRes);
        }
      } catch (error) {
        console.error('Socket patient:activity:create error:', error);
      }
    });

    // Profile update via socket
    socket.on('profile:update', async (msg) => {
      try {
        if (msg && msg.userId && msg.updates) {
          const profileController = require('./controllers/profileController');
          const mockReq = { params: { id: msg.userId }, body: msg.updates, user: { userId: msg.senderId }, app: { get: () => io } };
          const mockRes = { status: (code) => ({ json: (data) => {} }), json: (data) => {} };
          await profileController.updateProfile(mockReq, mockRes);
        }
      } catch (error) {
        console.error('Socket profile:update error:', error);
      }
    });

  // Typing indicators
  socket.on('typing:start', (data) => {
    if (data && data.receiverId && data.senderId) {
      socket.to(`user:${data.receiverId}`).emit('typing:start', {
        senderId: data.senderId
      });

      // Also emit to sender for testing
      socket.emit('typing:start', {
        senderId: data.senderId
      });
    }
  });

  socket.on('typing:stop', (data) => {
    if (data && data.receiverId && data.senderId) {
      socket.to(`user:${data.receiverId}`).emit('typing:stop', {
        senderId: data.senderId
      });

      // Also emit to sender for testing
      socket.emit('typing:stop', {
        senderId: data.senderId
      });
    }
  });

  // Real-time dashboard updates
  socket.on('dashboard:subscribe', (data) => {
    if (data && data.userId) {
      socket.join(`dashboard:${data.userId}`);
      console.log(`📊 User ${data.userId} subscribed to dashboard updates`);
    }
  });

  // Appointment updates
  socket.on('appointment:subscribe', (data) => {
    if (data && data.userId) {
      socket.join(`appointments:${data.userId}`);
      console.log(`📅 User ${data.userId} subscribed to appointment updates`);
    }
  });

  // Admin subscribes to all geo-fence alerts
  socket.on('admin:subscribe:alerts', async (data) => {
    try {
      if (data && data.userId) {
        const User = require('./models/User');
        const user = await User.findById(data.userId);
        
        if (user && (user.role || '').toLowerCase() === 'admin') {
          socket.join('admin:alerts');
          console.log(`🔔 Admin ${data.userId} subscribed to global alerts`);
        }
      }
    } catch (error) {
      console.error('Admin alert subscription error:', error);
    }
  });

  // Admin subscribes to all system events
  socket.on('admin:subscribe', async (data) => {
    try {
      if (data && data.userId) {
        const User = require('./models/User');
        const user = await User.findById(data.userId);
        
        if (user && (user.role || '').toLowerCase() === 'admin') {
          socket.join('admin:alerts');
          socket.join('admin:stats');
          socket.join('admin:dashboard');
          console.log(`🔔 Admin ${data.userId} subscribed to all system events`);
          
          // Send initial stats on subscription
          const Organization = require('./models/Organization');
          const GeoFenceAlert = require('./models/GeoFenceAlert');
          const Alert = require('./models/Alert');
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const stats = {
            totalNGOs: await Organization.countDocuments(),
            totalSupervisors: await User.countDocuments({ role: /^supervisor$/i }),
            totalPatients: await User.countDocuments({ role: /^patient$/i }),
            riskAlertsToday: await GeoFenceAlert.countDocuments({ createdAt: { $gte: today } }) + 
                             await Alert.countDocuments({ createdAt: { $gte: today } })
          };
          
          socket.emit('stats:updated', stats);
          console.log(`📊 Sent initial stats to admin:`, stats);
        }
      }
    } catch (error) {
      console.error('Admin subscription error:', error);
    }
  });

  // Alert subscriptions
  socket.on('alerts:subscribe', (data) => {
    if (data && data.userId) {
      socket.join(`alerts:${data.userId}`);
      console.log(`🚨 User ${data.userId} subscribed to alerts`);
    }
  });

  // NGO subscribes to organization events
  socket.on('ngo:subscribe', async (data) => {
    try {
      if (data && data.userId) {
        const User = require('./models/User');
        const Organization = require('./models/Organization');
        const user = await User.findById(data.userId);
        
        if (user && user.role === 'ngo') {
          // Join NGO-specific rooms
          socket.join(`ngo:${data.userId}`);
          socket.join('ngo:global');
          
          // Find organization and join its room
          const org = await Organization.findOne({
            $or: [
              { admins: data.userId },
              { 'contact.email': user.email }
            ]
          });
          
          if (org) {
            socket.join(`organization:${org._id}`);
            console.log(`🏢 NGO ${data.userId} subscribed to organization: ${org.name}`);
          }
          
          console.log(`🏢 NGO ${data.userId} subscribed to NGO events`);
          
          // Send initial dashboard stats
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const stats = {
            totalSupervisors: org ? org.supervisors?.length || 0 : await User.countDocuments({ role: /^supervisor$/i }),
            totalPatients: org ? org.patients?.length || 0 : await User.countDocuments({ role: /^patient$/i }),
            timestamp: new Date()
          };
          
          socket.emit('ngo:stats:initial', stats);
        }
      }
    } catch (error) {
      console.error('NGO subscription error:', error);
    }
  });

  // NGO supervisor assignment
  socket.on('ngo:supervisor:assign', async (data) => {
    try {
      if (data && data.supervisorId && data.organizationId) {
        // Emit to all NGO dashboard users
        io.to(`organization:${data.organizationId}`).emit('ngo:supervisor:assigned', {
          supervisorId: data.supervisorId,
          organizationId: data.organizationId,
          timestamp: new Date()
        });
        
        // Notify the supervisor
        io.to(`user:${data.supervisorId}`).emit('supervisor:organization:assigned', {
          organizationId: data.organizationId,
          message: 'You have been assigned to an organization',
          timestamp: new Date()
        });
        
        // Broadcast to admin dashboard
        io.to('admin:dashboard').emit('system:update', {
          type: 'supervisor_assignment',
          data: data
        });
        
        console.log(`✅ Supervisor ${data.supervisorId} assignment broadcast complete`);
      }
    } catch (error) {
      console.error('NGO supervisor assignment broadcast error:', error);
    }
  });

  // NGO patient assignment
  socket.on('ngo:patient:assign', async (data) => {
    try {
      if (data && data.patientId && data.organizationId) {
        // Emit to all NGO dashboard users
        io.to(`organization:${data.organizationId}`).emit('ngo:patient:assigned', {
          patientId: data.patientId,
          organizationId: data.organizationId,
          timestamp: new Date()
        });
        
        // Notify the patient
        io.to(`user:${data.patientId}`).emit('patient:organization:assigned', {
          organizationId: data.organizationId,
          message: 'You have been assigned to an organization',
          timestamp: new Date()
        });
        
        // Broadcast to admin dashboard
        io.to('admin:dashboard').emit('system:update', {
          type: 'patient_assignment',
          data: data
        });
        
        console.log(`✅ Patient ${data.patientId} assignment broadcast complete`);
      }
    } catch (error) {
      console.error('NGO patient assignment broadcast error:', error);
    }
  });

  // NGO dashboard data sync request
  socket.on('ngo:sync:request', async (data) => {
    try {
      if (data && data.organizationId) {
        const Organization = require('./models/Organization');
        const User = require('./models/User');
        const MoodEntry = require('./models/MoodEntry');
        
        const org = await Organization.findById(data.organizationId)
          .populate('supervisors', 'name email role isActive')
          .populate('patients', 'name email role isActive riskLevel');
        
        if (org) {
          // Get recent mood data for trend analysis
          const patientIds = org.patients?.map(p => p._id) || [];
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const moodData = await MoodEntry.find({
            patient: { $in: patientIds },
            createdAt: { $gte: thirtyDaysAgo }
          }).sort({ createdAt: -1 }).limit(100);
          
          // Calculate averages
          const avgMood = moodData.length > 0
            ? moodData.reduce((sum, m) => sum + (m.moodValue || 5), 0) / moodData.length
            : 5;
          
          socket.emit('ngo:sync:response', {
            organization: org,
            supervisors: org.supervisors || [],
            patients: org.patients || [],
            moodTrend: avgMood.toFixed(1),
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('NGO sync request error:', error);
    }
  });

  // Crisis alerts (high priority)
  socket.on('crisis:alert', async (data) => {
    try {
      if (data && data.userId && data.message) {
        const User = require('./models/User');
        const user = await User.findById(data.userId);

        if (user) {
          // Find supervisors and emit crisis alert
          const crisisPayload = {
            patientId: data.userId,
            patientName: user.name,
            message: data.message,
            timestamp: new Date()
          };

          io.to('admin:dashboard').emit('crisis:alert', crisisPayload);
          io.to('admin:stats').emit('crisis:alert', crisisPayload);

          const supervisors = await User.find({
            role: /^supervisor$/i,
            isActive: true
          });

          for (const supervisor of supervisors) {
            io.to(`user:${supervisor._id}`).emit('crisis:alert', crisisPayload);
          }

          const ngos = await User.find({
            role: /^ngo$/i,
            isActive: true
          });

          for (const ngo of ngos) {
            io.to(`user:${ngo._id}`).emit('crisis:alert', crisisPayload);
          }
        }
      }
    } catch (error) {
      console.error('Crisis alert error:', error);
    }
  });

  // User status updates
  socket.on('status:update', async (data) => {
    try {
      console.log('Status update received:', data);
      if (data && data.userId && data.status) {
        // Skip database update for test users
        if (data.userId.startsWith('test_')) {
          console.log('Handling test user status update');
          // Broadcast status change to all connected users
          socket.broadcast.emit('user:status', {
            userId: data.userId,
            status: data.status,
            lastSeen: new Date()
          });

          // Also emit to sender for testing
          socket.emit('user:status', {
            userId: data.userId,
            status: data.status,
            lastSeen: new Date()
          });

          console.log(`👤 Status updated for user ${data.userId}`);
          return;
        }

        console.log('Handling real user status update');
        const User = require('./models/User');
        await User.findByIdAndUpdate(data.userId, {
          onlineStatus: data.status,
          lastSeen: new Date()
        });

        // Broadcast status change to all connected users
        socket.broadcast.emit('user:status', {
          userId: data.userId,
          status: data.status,
          lastSeen: new Date()
        });

        console.log(`👤 Status updated for user ${data.userId}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  });

  // Goal Management Socket Events

  // Goal creation/update
  socket.on('goal:create', async (data) => {
    try {
      if (data && data.patientId && data.supervisorId) {
        // Emit to patient and supervisor
        io.to(`user:${data.patientId}`).emit('goal:created', {
          goal: data.goal,
          message: 'A new goal has been assigned to you',
          timestamp: new Date()
        });

        io.to(`user:${data.supervisorId}`).emit('goal:assigned', {
          goal: data.goal,
          patientId: data.patientId,
          timestamp: new Date()
        });

        // Also emit to sender for testing
        socket.emit('goal:created', {
          goal: data.goal,
          message: 'A new goal has been assigned to you',
          timestamp: new Date()
        });

        // Broadcast to supervisor dashboard
        io.to('supervisor:dashboard').emit('goal:updated', {
          type: 'goal_created',
          goal: data.goal,
          patientId: data.patientId
        });

        console.log(`🎯 Goal created for patient ${data.patientId}`);
      }
    } catch (error) {
      console.error('Goal creation socket error:', error);
    }
  });

  // Goal progress update
  socket.on('goal:progress:update', async (data) => {
    try {
      if (data && data.goalId && data.patientId && data.supervisorId) {
        // Emit to patient and supervisor
        io.to(`user:${data.patientId}`).emit('goal:progress:updated', {
          goalId: data.goalId,
          progress: data.progress,
          message: 'Your goal progress has been updated',
          timestamp: new Date()
        });

        io.to(`user:${data.supervisorId}`).emit('goal:progress:updated', {
          goalId: data.goalId,
          patientId: data.patientId,
          progress: data.progress,
          timestamp: new Date()
        });

        // Also emit to sender for testing
        socket.emit('goal:progress:updated', {
          goalId: data.goalId,
          progress: data.progress,
          message: 'Your goal progress has been updated',
          timestamp: new Date()
        });

        // Broadcast to supervisor dashboard
        io.to('supervisor:dashboard').emit('goal:updated', {
          type: 'progress_updated',
          goalId: data.goalId,
          patientId: data.patientId,
          progress: data.progress
        });

        console.log(`📈 Goal progress updated for goal ${data.goalId}`);
      }
    } catch (error) {
      console.error('Goal progress update socket error:', error);
    }
  });

  // Milestone completion
  socket.on('milestone:complete', async (data) => {
    try {
      if (data && data.goalId && data.milestoneId && data.patientId && data.supervisorId) {
        // Emit to patient and supervisor
        io.to(`user:${data.patientId}`).emit('milestone:completed', {
          goalId: data.goalId,
          milestoneId: data.milestoneId,
          milestone: data.milestone,
          message: 'A milestone has been completed!',
          timestamp: new Date()
        });

        io.to(`user:${data.supervisorId}`).emit('milestone:completed', {
          goalId: data.goalId,
          milestoneId: data.milestoneId,
          patientId: data.patientId,
          milestone: data.milestone,
          timestamp: new Date()
        });

        // Also emit to sender for testing
        socket.emit('milestone:completed', {
          goalId: data.goalId,
          milestoneId: data.milestoneId,
          milestone: data.milestone,
          message: 'A milestone has been completed!',
          timestamp: new Date()
        });

        // Broadcast to supervisor dashboard
        io.to('supervisor:dashboard').emit('goal:updated', {
          type: 'milestone_completed',
          goalId: data.goalId,
          milestoneId: data.milestoneId,
          patientId: data.patientId,
          milestone: data.milestone
        });

        console.log(`✅ Milestone ${data.milestoneId} completed for goal ${data.goalId}`);
      }
    } catch (error) {
      console.error('Milestone completion socket error:', error);
    }
  });

  // Goal subscription for real-time updates
  socket.on('goals:subscribe', (data) => {
    if (data && data.userId) {
      socket.join(`user:${data.userId}`);
      console.log(`🎯 User ${data.userId} subscribed to goal updates`);
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    try {
      console.log('🔌 Socket disconnected:', socket.id);

      // Find user by socket and update status
      // Note: In production, you'd want to track socket-to-user mapping
      // For now, we'll handle this in the logout endpoint
    } catch (error) {
      console.error('Disconnect handling error:', error);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const FRONTEND_DIST = process.env.FRONTEND_DIST_PATH
  ? path.resolve(process.env.FRONTEND_DIST_PATH)
  : path.join(__dirname, '..', 'frontend', 'dist');

const shouldServeFrontend =
  process.env.SERVE_FRONTEND === '1' ||
  process.env.SERVE_FRONTEND === 'true';

if (shouldServeFrontend && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 / SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  if (shouldServeFrontend && fs.existsSync(FRONTEND_DIST)) {
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  }
  return res.status(404).json({
    success: false,
    message: 'Not found'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`🚀 Recovery Road Backend Server running on port ${PORT}`);
  console.log(`📡 Real-time functionality enabled`);
  console.log(`🌐 CORS origins: ${Array.isArray(allowedOrigins) && allowedOrigins.length ? allowedOrigins.join(', ') : 'reflect-request (dev / unset)'}`);
  if (shouldServeFrontend) {
    console.log(`📦 SPA: ${fs.existsSync(FRONTEND_DIST) ? FRONTEND_DIST : '(dist missing — run frontend build)'}`);
  }

  // Ensure Python ML microservice is up (localhost) before connecting
  try {
    const { ensurePythonMlService } = require('./ml/ensurePythonMlService');
    await ensurePythonMlService();
  } catch (e) {
    console.warn('[ml-service] Auto-start skipped:', e.message);
  }

  // Load ML models at startup
  try {
    const mlService = require('./ml/mlService');
    await mlService.loadModels();
    const meta = mlService.getModelMeta();
    if (mlService.isPythonActive()) {
      console.log(`🐍 Python ML Service connected (scikit-learn)`);
      if (meta.textRiskClassifier) console.log(`   Text Risk   : ${meta.textRiskClassifier.algorithm} — ${meta.textRiskClassifier.accuracy}% acc`);
      if (meta.emotionClassifier) console.log(`   Emotion     : ${meta.emotionClassifier.algorithm} — ${meta.emotionClassifier.accuracy}% acc`);
      if (meta.riskFeatureClassifier) console.log(`   Risk Feature: ${meta.riskFeatureClassifier.algorithm} — ${meta.riskFeatureClassifier.accuracy}% acc`);
    } else if (mlService.isReady()) {
      console.log(`🤖 JS fallback ML Models loaded (natural.js)`);
    } else {
      console.log(`⚠️  No ML models available`);
    }
  } catch (err) {
    console.warn('⚠️  ML models not loaded:', err.message);
  }

  // Module V: AI Mood Scan retention cleanup — run daily at 3 AM
  try {
    const cron = require('node-cron');
    const { cleanupExpiredScans } = require('./controllers/aiMoodController');
    cron.schedule('0 3 * * *', async () => {
      console.log('🗑️  Running AI Mood Scan retention cleanup...');
      await cleanupExpiredScans();
    });
    console.log('🕐 AI Mood Scan retention cron scheduled (daily 3 AM)');
  } catch (cronErr) {
    console.warn('⚠️  node-cron not available, retention cleanup disabled:', cronErr.message);
  }
});
