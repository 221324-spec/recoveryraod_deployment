// backend/routes/goalProgressRoutes.js
const express = require("express");
const router = express.Router();
const GoalProgress = require("../models/GoalProgress");
const Goal = require("../models/Goal");
const { authenticate } = require("../middleware/authMiddleware");

const canAccessGoal = (goal, reqUser) => {
  const userId = reqUser?.userId?.toString();
  if (!userId) return false;
  const isSupervisor = goal.supervisor?.toString() === userId;
  const isPatient = goal.user?.toString() === userId;
  const isAdmin = (reqUser?.role || "").toLowerCase() === "admin";
  return isSupervisor || isPatient || isAdmin;
};

const recalcGoalProgress = (goal) => {
  const total = goal.milestones?.length || 0;
  const doneCount = total ? goal.milestones.filter((m) => !!m.completed).length : 0;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;
  return { total, doneCount, progress };
};

const normalizeMilestoneCompleted = (status) => {
  const s = String(status || "").trim().toLowerCase();
  if (s === "done" || s === "completed" || s === "complete" || s === "true") return true;
  if (s === "to do" || s === "todo" || s === "not started" || s === "false") return false;
  if (s === "doing" || s === "in progress" || s === "progress") return false;
  return null;
};

// POST - Add a new progress update (User)
router.post("/", authenticate, async (req, res) => {
  try {
    const { goalId, progress, note } = req.body;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (!canAccessGoal(goal, req.user)) {
      return res.status(403).json({ message: "Not authorized to update this goal" });
    }

    // Prefer authoritative progress from milestones when available.
    const computed = recalcGoalProgress(goal);
    const finalProgress = computed.total
      ? computed.progress
      : Number.isFinite(Number(progress))
        ? Math.max(0, Math.min(100, Number(progress)))
        : 0;

    const newProgress = await GoalProgress.create({
      goal: goalId,
      user: req.user.userId,
      progress: finalProgress,
      note
    });

    // Keep Goal.progress in sync so supervisor dashboards update.
    goal.progress = finalProgress;
    if (goal.progress === 100 && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    } else if (goal.progress < 100 && goal.completed) {
      goal.completed = false;
      goal.completedAt = null;
    }
    await goal.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${goal.user}`).emit("goal:progress:updated", {
        goalId: goal._id,
        progress: goal.progress,
        message: "Progress note submitted",
        timestamp: new Date()
      });

      io.to(`user:${goal.supervisor}`).emit("goal:progress:updated", {
        goalId: goal._id,
        patientId: goal.user,
        progress: goal.progress,
        message: "Patient submitted a progress update",
        timestamp: new Date()
      });

      io.to("supervisor:dashboard").emit("goal:progress:updated", {
        type: "progress_update",
        goalId: goal._id,
        patientId: goal.user,
        progress: goal.progress
      });
    }

    res.status(201).json(newProgress);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET - Get progress history for a goal (User)
router.get("/:goalId", authenticate, async (req, res) => {
  try {
    const history = await GoalProgress.find({
      goal: req.params.goalId,
      user: req.user.userId
    }).sort({ createdAt: 1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// PUT - Update milestone status
router.put("/milestones/update-status", authenticate, async (req, res) => {
  try {
    const { goalId, milestoneId, status } = req.body;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    if (!canAccessGoal(goal, req.user)) {
      return res.status(403).json({ message: "Not authorized to update this goal" });
    }

    const milestone = goal.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const milestoneIndex = goal.milestones.findIndex(
      (m) => m?._id?.toString() === String(milestoneId)
    );

    // The Goal schema stores `completed` (boolean), not a `status` string.
    // Translate status text from the patient UI into `completed`.
    const completed = normalizeMilestoneCompleted(status);
    if (completed === null) {
      return res.status(400).json({ message: "Invalid status" });
    }

    milestone.completed = completed;
    milestone.completedAt = completed ? new Date() : undefined;

    const computed = recalcGoalProgress(goal);
    goal.progress = computed.progress;
    if (goal.progress === 100 && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    } else if (goal.progress < 100 && goal.completed) {
      goal.completed = false;
      goal.completedAt = null;
    }
    await goal.save();

    const io = req.app.get("io");
    if (io) {
      // Emit to patient
      io.to(`user:${goal.user}`).emit("goal:progress:updated", {
        goalId: goal._id,
        progress: goal.progress,
        milestoneIndex,
        completed: milestone.completed,
        message: `Milestone "${milestone.title}" ${milestone.completed ? "completed" : "marked incomplete"}`,
        timestamp: new Date()
      });

      // Emit to supervisor
      io.to(`user:${goal.supervisor}`).emit("goal:progress:updated", {
        goalId: goal._id,
        patientId: goal.user,
        progress: goal.progress,
        milestoneIndex,
        completed: milestone.completed,
        message: `Patient updated milestone: "${milestone.title}"`,
        timestamp: new Date()
      });

      // Broadcast to supervisor dashboard
      io.to("supervisor:dashboard").emit("goal:progress:updated", {
        type: "progress_update",
        goalId: goal._id,
        patientId: goal.user,
        progress: goal.progress
      });
    }

    res.json({ message: "Milestone updated", goal, milestone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router; // ✅ Must export the router

