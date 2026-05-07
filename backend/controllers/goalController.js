// backend/controllers/goalController.js
const Goal = require('../models/Goal');
const User = require('../models/User');
const PDFDocument = require('pdfkit'); // add to package.json: pdfkit
const stream = require('stream');

const calculateProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  const done = milestones.filter(m => m.completed).length;
  return Math.round((done / milestones.length) * 100);
};

exports.createGoal = async (req, res) => {
  try {
    // Supervisor only (route will use role middleware)
    const { title, description, category, goalType, user: userId, milestones = [] } = req.body;

    if (!title || !userId) return res.status(400).json({ message: 'title and user are required' });

    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'Assigned user not found' });

    const goal = new Goal({
      title,
      description,
      category,
      goalType,
      supervisor: req.user._id,
      user: userId,
      milestones: milestones.map(m => ({ title: m.title }))
    });

    goal.progress = calculateProgress(goal.milestones);

    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error('createGoal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGoalsForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get goals assigned to current user (patient)
    const goals = await Goal.find({ user: userId }).populate('supervisor', 'name email');
    res.json(goals);
  } catch (err) {
    console.error('getGoalsForUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGoalsForSupervisor = async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const goals = await Goal.find({ supervisor: supervisorId }).populate('user', 'name email');
    res.json(goals);
  } catch (err) {
    console.error('getGoalsForSupervisor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    const updates = req.body;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Only supervisor who created it or assigned user (for some fields) should be allowed.
    if (req.user.role === 'supervisor' && goal.supervisor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed to edit this goal' });
    }
    // apply safe updates:
    const allowed = ['title', 'description', 'category', 'goalType', 'milestones'];
    allowed.forEach(field => {
      if (updates[field] !== undefined) goal[field] = updates[field];
    });

    // recalc progress
    goal.progress = calculateProgress(goal.milestones);
    if (goal.progress === 100 && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    }

    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error('updateGoal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleMilestone = async (req, res) => {
  try {
    const goalId = req.params.id;
    const milestoneIndex = parseInt(req.body.index, 10);
    if (isNaN(milestoneIndex)) return res.status(400).json({ message: 'milestone index is required' });

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Only the assigned user or supervisor can toggle
    const isSupervisorOwner = req.user.role === 'supervisor' && goal.supervisor.toString() === req.user._id.toString();
    const isAssignedUser = goal.user.toString() === req.user._id.toString();
    if (!isSupervisorOwner && !isAssignedUser && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify milestones' });
    }

    const milestone = goal.milestones[milestoneIndex];
    if (!milestone) return res.status(400).json({ message: 'Milestone not found' });

    milestone.completed = !milestone.completed;
    milestone.completedAt = milestone.completed ? new Date() : undefined;

    // recalc progress
    goal.progress = calculateProgress(goal.milestones);
    if (goal.progress === 100 && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    } else if (goal.progress < 100 && goal.completed) {
      goal.completed = false;
      goal.completedAt = null;
    }

    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error('toggleMilestone error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Only supervisor who created it or admin can delete
    if (req.user.role === 'supervisor' && goal.supervisor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed to delete this goal' });
    }

    await goal.remove();
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    console.error('deleteGoal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    // Generates simple PDF certificate for a completed goal
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId).populate('user', 'name').populate('supervisor', 'name');
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (!goal.completed) return res.status(400).json({ message: 'Goal not yet completed' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `certificate-${goal._id}.pdf`;

    // stream PDF back
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.fontSize(24).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(16).text(`This certificate is awarded to:`, { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(20).text(`${goal.user.name}`, { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(14).text(`For successfully completing the goal:`, { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(16).text(`"${goal.title}"`, { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(12).text(`Category: ${goal.category}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Assigned by: ${goal.supervisor.name}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Completion Date: ${goal.completedAt ? goal.completedAt.toDateString() : new Date().toDateString()}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(10).text('Milestones achieved:', { underline: true });
    goal.milestones.forEach((m, i) => {
      doc.text(`${i+1}. ${m.title} - ${m.completed ? 'Completed' : 'Not completed'}`);
    });

    doc.end();
    doc.pipe(res);

  } catch (err) {
    console.error('generateCertificate error:', err);
    res.status(500).json({ message: 'Server error generating certificate' });
  }
};
