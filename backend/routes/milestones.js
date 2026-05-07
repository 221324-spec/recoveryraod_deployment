// backend/routes/milestones.js
const express = require("express");
const router = express.Router();
const Goal = require("../models/Goal");
const { authenticate } = require("../middleware/authMiddleware");

// PUT - Update milestone status
router.put("/update-status", authenticate, async (req, res) => {
  try {
    const { goalId, milestoneId, status } = req.body;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const milestone = goal.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    if (status === "Done") {
      milestone.completed = true;
      milestone.completedAt = new Date();
    } else {
      milestone.completed = false;
      milestone.completedAt = null;
    }

    await goal.save();
    res.json({ message: "Milestone status updated", milestone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
