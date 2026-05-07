const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const realtime = require('../utils/realtime');
const { normalizeRole, rolesMatch } = require('../utils/roles');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'recoveryroad-secret-key', {
    expiresIn: '7d'
  });
};

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = 'Patient',
        phone,
        address,
        dob,
        gender,
        organizationName,
        organizationType,
        services
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Normalize role to proper capitalization
      let normalizedRole = role;
      if (typeof role === 'string') {
        const roleMap = {
          'admin': 'Admin',
          'supervisor': 'Supervisor',
          'patient': 'Patient',
          'ngo': 'NGO'
        };
        normalizedRole = roleMap[role.toLowerCase()] || role;
      }

      // Create user object
      // Admin and NGO roles bypass approval requirement
      const isPrivilegedRole = normalizedRole === 'Admin' || normalizedRole === 'NGO';
      const userData = {
        name,
        email,
        passwordHash,
        role: normalizedRole,
        phone,
        address,
        dob,
        gender,
        isActive: true,
        isEmailVerified: true,
        status: isPrivilegedRole ? 'active' : 'pending'
      };

      // Add role-specific fields
      if (normalizedRole.toLowerCase() === 'ngo') {
        userData.organizationName = organizationName;
        userData.organizationType = organizationType;
        userData.services = services || [];
      }

      const user = new User(userData);
      await user.save();

      // Create welcome notification
      await Notification.createForUser(user._id, {
        type: 'system',
        title: 'Welcome to Recovery Road!',
        message: `Welcome ${name}! Your account has been created successfully.`,
        priority: 'normal'
      });

      // Emit real-time event for admin dashboard
      if (role === 'patient') {
        realtime.emitPatientRegistered({ id: user._id, name: user.name, email: user.email });
      } else if (role === 'supervisor') {
        realtime.emitSupervisorRegistered({ id: user._id, name: user.name, email: user.email });
      }

      // Generate token
      const token = generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.fullProfile,
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password, portalRole } = req.body;
      const requestedRole = normalizeRole(portalRole || req.body.role);

      // Special handling for admin
      if (email === 'admin@admin.com' && password === 'admin') {
        let admin = await User.findOne({ email: 'admin@admin.com' });
        if (!admin) {
          const salt = await bcrypt.genSalt(12);
          const passwordHash = await bcrypt.hash('admin', salt);

          admin = new User({
            name: 'System Administrator',
            email: 'admin@admin.com',
            passwordHash,
            role: 'Admin',
            isActive: true,
            status: 'active',
            isEmailVerified: true
          });
          await admin.save();
        }

        if (requestedRole && !rolesMatch(admin.role, requestedRole)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: invalid role for this portal'
          });
        }

        const token = generateToken(admin._id);
        admin.lastLogin = new Date();
        admin.onlineStatus = 'online';
        await admin.save();

        return res.json({
          success: true,
          message: 'Admin login successful',
          data: {
            user: admin.fullProfile,
            token
          }
        });
      }

      // Regular user login
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (requestedRole && !rolesMatch(user.role, requestedRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: invalid role for this portal'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      const token = generateToken(user._id);

      // Update user status
      user.lastLogin = new Date();
      user.onlineStatus = 'online';
      await user.save();

      // Emit online status to connected clients
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user._id}`).emit('user:status', {
          userId: user._id,
          status: 'online',
          lastSeen: new Date()
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.fullProfile,
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.fullProfile,
          dashboard: user.getDashboardData()
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const updates = req.body;

      // Remove sensitive fields
      delete updates.passwordHash;
      delete updates.role;
      delete updates.email;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.fullProfile
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      user.passwordHash = newPasswordHash;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (user) {
        user.onlineStatus = 'offline';
        user.lastSeen = new Date();
        await user.save();

        // Emit offline status
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${user._id}`).emit('user:status', {
            userId: user._id,
            status: 'offline',
            lastSeen: new Date()
          });
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  },

  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      const { role, page = 1, limit = 20, search } = req.query;

      let query = {};
      if (role && role !== 'all') {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      });
    }
  },

  // Update user status (admin only)
  updateUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user: user.fullProfile }
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  }
};

module.exports = authController;
