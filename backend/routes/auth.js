const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { normalizeRole, rolesMatch } = require('../utils/roles');
const {
  sendVerificationOTPEmail,
  sendPasswordResetLinkEmail,
  sendWelcomeEmail
} = require('../services/emailService');

// REGISTER (send OTP)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const normalizedEmail = String(email).trim().toLowerCase();

    // Normalize role
    const validRoles = ['Admin', 'Supervisor', 'Patient', 'NGO'];
    const normalizedRole = role ? validRoles.find(r => r.toLowerCase() === role.toLowerCase()) || 'Patient' : 'Patient';

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = new User({
      name,
      email: normalizedEmail,
      role: normalizedRole,
      status: 'pending', // New users start as pending
      isActive: false // Not active until approved
    });

    await user.setPassword(password);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Try to send email, but don't fail registration if email fails
    try {
      await sendVerificationOTPEmail(user, otp);
    } catch (emailError) {
      console.log('📧 Email sending failed, but registration successful:', emailError.message);
      // In development, include OTP in response so user can verify
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 DEV MODE: OTP for', user.email, 'is:', otp);
        
        // Emit socket event for new registration (even unverified)
        if (global.io) {
          const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: normalizedRole,
            isVerified: false,
            timestamp: new Date()
          };
          
          if (normalizedRole === 'Patient') {
            global.io.emit('patient:registered', userData);
            global.io.to('ngo:global').emit('patient:registered', userData);
          } else if (normalizedRole === 'Supervisor') {
            global.io.emit('supervisor:registered', userData);
            global.io.to('ngo:global').emit('supervisor:registered', userData);
          }
          console.log('📢 New', normalizedRole, 'registration notification sent:', user.name);
        }
        
        return res.status(201).json({
          message: 'Registration successful! Check console for OTP.',
          email: user.email,
          requiresVerification: true,
          devOtp: otp // Only in development
        });
      }
      // Continue with registration even if email fails
    }

    // Emit socket event for new registration
    if (global.io) {
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        isVerified: false,
        timestamp: new Date()
      };
      
      if (normalizedRole === 'Patient') {
        global.io.emit('patient:registered', userData);
        global.io.to('ngo:global').emit('patient:registered', userData);
      } else if (normalizedRole === 'Supervisor') {
        global.io.emit('supervisor:registered', userData);
        global.io.to('ngo:global').emit('supervisor:registered', userData);
      }
      console.log('📢 New', normalizedRole, 'registration notification sent:', user.name);
    }

    return res.status(201).json({
      message: 'Registration successful! Please verify your email.',
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isEmailVerified) {
      return res.json({ ok: true, message: 'Email already verified! You can now log in.' });
    }

    if (!user.emailVerificationOTPExpires || user.emailVerificationOTPExpires < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user);

    // Emit socket event for new verified user - NGO dashboard can see them now
    if (global.io) {
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timestamp: new Date()
      };

      if (user.role === 'Patient') {
        console.log('📢 Emitting patient:registered event for:', user.name);
        global.io.emit('patient:registered', userData);
        global.io.to('ngo:global').emit('patient:registered', userData);
      } else if (user.role === 'Supervisor') {
        console.log('📢 Emitting supervisor:registered event for:', user.name);
        global.io.emit('supervisor:registered', userData);
        global.io.to('ngo:global').emit('supervisor:registered', userData);
      }

      // Also emit general user registered event
      global.io.emit('user:verified', userData);
      console.log('✅ Registration notification sent for:', user.role, user.name);
    }

    return res.json({ ok: true, message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('verify-otp error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN (JWT)
router.post('/login', async (req, res) => {
  try {
    const { email, password, portalRole } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const requestedRole = normalizeRole(portalRole || req.body.role);

    console.log(`🔐 LOGIN ATTEMPT:`, {
      rawEmail: email,
      normalizedEmail,
      password: password ? '[PROVIDED]' : '[MISSING]',
      portalRole,
      requestedRole,
      isAdminAttempt: normalizedEmail === 'admin@admin.com' && password === 'admin'
    });

    // Special handling for admin
    if (normalizedEmail === 'admin@admin.com' && password === 'admin') {
      console.log(`✅ Admin credentials matched, proceeding with admin login...`);
      let admin = await User.findOne({ email: 'admin@admin.com' });
      
      if (!admin) {
        console.log(`📝 Admin not found in DB, creating new admin account...`);
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
        console.log(`✅ Admin account created: ${admin._id}`);
      } else {
        console.log(`✅ Admin found in DB: ${admin._id}, role: ${admin.role}`);
      }

      if (requestedRole && !rolesMatch(admin.role, requestedRole)) {
        console.log(`❌ Role mismatch: admin role=${admin.role}, requested=${requestedRole}`);
        return res.status(403).json({
          error: 'Access denied: invalid role for this portal'
        });
      }

      const token = jwt.sign(
        { id: admin._id, role: admin.role, name: admin.name },
        process.env.JWT_SECRET || 'recoveryroad-secret-key',
        { expiresIn: '7d' }
      );

      admin.lastLogin = new Date();
      await admin.save();

      return res.json({ 
        success: true,
        message: 'Admin login successful',
        token, 
        user: admin.toPublic ? admin.toPublic() : {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    }

    // Regular user login
    if (!requestedRole) {
      console.log(`❌ No portal role provided for regular user login`);
      return res.status(400).json({ error: 'Portal role is required' });
    }

    console.log(`🔐 Regular user login attempt for email: ${normalizedEmail}, role: ${requestedRole}`);
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`❌ User not found: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ User found: ${user._id}, checking password...`);
    const ok = await user.comparePassword(password);
    if (!ok) {
      console.log(`❌ Password mismatch for user: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ Password verified for: ${normalizedEmail}`);

    if (user.isBlocked) {
      console.log(`❌ User is blocked: ${normalizedEmail}`);
      return res.status(403).json({ error: 'User is blocked' });
    }

    if (!user.isEmailVerified) {
      console.log(`⚠️ Email not verified for: ${normalizedEmail}`);
      return res.status(403).json({
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email
      });
    }
    
    // Check approval status for Patient and Supervisor roles
    const roleNormalized = user.role.toLowerCase();
    if ((roleNormalized === 'patient' || roleNormalized === 'supervisor') && 
        user.status !== 'approved' && user.status !== 'assigned' && user.status !== 'active') {
      return res.status(403).json({
        error: 'Account pending approval',
        code: 'PENDING_APPROVAL',
        message: 'Your account is verified but pending approval from an NGO administrator. You will receive a notification once your account is approved.',
        pendingApproval: true,
        status: user.status,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    if (!rolesMatch(user.role, requestedRole)) {
      return res.status(403).json({ error: 'Access denied: invalid role for this portal' });
    }

    // Populate supervisor data for patients
    if (user.role === 'Patient' && user.assignedSupervisor) {
      user = await User.findById(user._id).populate('assignedSupervisor', 'name email specialization');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'recoveryroad-secret-key',
      { expiresIn: '7d' }
    );

    user.lastLogin = new Date();
    await user.save();

    return res.json({ 
      success: true,
      token, 
      user: user.toPublic ? user.toPublic() : {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ME (protected)
router.get('/me', authMiddleware, async (req, res) => {
  let user = req.user;
  // Populate assignedSupervisor for patients so frontend gets fresh data
  if (user.role === 'Patient' && user.assignedSupervisor) {
    user = await User.findById(user._id).populate('assignedSupervisor', 'name email specialization').select('-passwordHash');
  }
  return res.json({ user: user.toPublic() });
});

// RESEND OTP
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ ok: true }); // avoid leaking which emails exist

    if (user.isEmailVerified) return res.status(400).json({ error: 'Email already verified' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendVerificationOTPEmail(user, otp);

    return res.json({ ok: true, message: 'Verification code resent! Please check your inbox.' });
  } catch (err) {
    console.error('resend-verification error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// REQUEST RESET (send reset LINK)
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: 'This email is not registered. Please check your email address or sign up for a new account.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendPasswordResetLinkEmail(user, resetLink);

    return res.json({ ok: true, message: 'Password reset link sent. Please check your email.' });
  } catch (err) {
    console.error('request-reset error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// RESET PASSWORD (token + newPassword)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await user.setPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
