// backend/routes/goals.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Goal = require('../models/Goal');
const User = require('../models/User');

// POST /api/goals  (supervisor creates)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, goalType, user: userId, milestones = [] } = req.body;
    if (!title || !userId) {
      return res.status(400).json({ message: 'title and user are required' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    const goal = new Goal({
      title,
      description,
      category,
      goalType,
      supervisor: req.user.userId,
      user: userExists._id,
      milestones: milestones.map(m => ({ title: m.title || m }))
    });

    const done = goal.milestones.filter(m => m.completed).length;
    goal.progress = goal.milestones.length ? Math.round((done / goal.milestones.length) * 100) : 0;

    await goal.save();

    // Emit real-time goal creation event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userExists._id}`).emit('goal:created', {
        goal: goal,
        message: 'A new goal has been assigned to you',
        timestamp: new Date()
      });

      io.to(`user:${req.user.userId}`).emit('goal:assigned', {
        goal: goal,
        patientId: userExists._id,
        timestamp: new Date()
      });

      // Broadcast to supervisor dashboard
      io.to('supervisor:dashboard').emit('goal:updated', {
        type: 'goal_created',
        goal: goal,
        patientId: userExists._id
      });
    }

    const supervisor = await User.findById(req.user.userId);
    res.status(201).json({
      message: 'Goal assigned successfully',
      supervisorName: supervisor ? supervisor.name || supervisor.username : "Supervisor",
      patientName: userExists.name,
      goalTitle: title,
    });

  } catch (err) {
    console.error('POST /api/goals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/goals/my  — goals for logged-in patient
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const goals = await Goal.find({ user: userId }).populate('supervisor', 'name email');
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals/my error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/goals/supervisor  — goals created by logged-in supervisor
router.get('/supervisor', authenticate, async (req, res) => {
  try {
    const supId = req.user.userId;
    const goals = await Goal.find({ supervisor: supId }).populate('user', 'name email');
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals/supervisor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/goals/:id/milestone  — toggle milestone
router.post('/:id/milestone', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const index = parseInt(req.body.index, 10);
    if (isNaN(index)) return res.status(400).json({ message: 'index required' });

    const goal = await Goal.findById(id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Authorization: check if user is supervisor or patient for this goal
    const userId = req.user.userId.toString();
    const isSupervisor = goal.supervisor.toString() === userId;
    const isPatient = goal.user.toString() === userId;
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    
    if (!isSupervisor && !isPatient && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this goal' });
    }

    const ms = goal.milestones[index];
    if (!ms) return res.status(400).json({ message: 'milestone not found' });

    ms.completed = !ms.completed;
    ms.completedAt = ms.completed ? new Date() : undefined;

    const doneCount = goal.milestones.filter(m => m.completed).length;
    goal.progress = goal.milestones.length ? Math.round((doneCount / goal.milestones.length)*100) : 0;

    if (goal.progress === 100 && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    } else if (goal.progress < 100 && goal.completed) {
      goal.completed = false;
      goal.completedAt = null;
    }

    await goal.save();

    // Emit real-time progress update
    const io = req.app.get('io');
    if (io) {
      // Emit to patient
      io.to(`user:${goal.user}`).emit('goal:progress:updated', {
        goalId: goal._id,
        progress: goal.progress,
        milestoneIndex: index,
        completed: ms.completed,
        message: `Milestone "${ms.title}" ${ms.completed ? 'completed' : 'marked incomplete'}`,
        timestamp: new Date()
      });

      // Emit to supervisor
      io.to(`user:${goal.supervisor}`).emit('goal:progress:updated', {
        goalId: goal._id,
        patientId: goal.user,
        progress: goal.progress,
        milestoneIndex: index,
        completed: ms.completed,
        message: `Patient updated milestone: "${ms.title}"`,
        timestamp: new Date()
      });

      // Broadcast to supervisor dashboard
      io.to('supervisor:dashboard').emit('goal:progress:updated', {
        type: 'progress_update',
        goalId: goal._id,
        patientId: goal.user,
        progress: goal.progress
      });
    }

    res.json(goal);
  } catch (err) {
    console.error('POST /api/goals/:id/milestone error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/goals/:id  — delete (supervisor or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    
    // Authorization: only supervisor who created it or admin can delete
    const userId = req.user.userId.toString();
    const isSupervisor = goal.supervisor.toString() === userId;
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    
    if (!isSupervisor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this goal' });
    }
    
    await Goal.findByIdAndDelete(req.params.id);
    
    // Emit deletion event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${goal.user}`).emit('goal:deleted', {
        goalId: goal._id,
        message: 'A goal has been removed'
      });
    }
    
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    console.error('DELETE /api/goals/:id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
