// controllers/progressHistoryController.js

const Goal = require("../models/Goal");

const getProgressHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const goals = await Goal.find({ user: userId }).select("title milestones");

    let history = [];

    goals.forEach(goal => {
      goal.milestones.forEach(ms => {
        history.push({
          _id: ms._id,
          goalTitle: goal.title,
          milestoneTitle: ms.title,
          status: ms.status,
          updatedAt: ms.updatedAt
        });
      });
    });

    history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ history });
  } catch (err) {
    console.error("Progress history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProgressHistory
};
