const express = require("express");
const router = express.Router();
const GameProgress = require("../models/GameProgress");

router.post("/save", async (req, res) => {
  const { userId, game, points } = req.body;

  // ✅ Step 1: Validate required fields
  if (!userId || !game || typeof points !== "number") {
    console.warn("⚠️ Missing or invalid data:", req.body);
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    // ✅ Step 2: Log the data being saved
    console.log("📥 Saving progress:", { userId, game, points });

    const newProgress = new GameProgress({ userId, game, points });
    await newProgress.save();

    console.log("✅ Progress saved successfully to MongoDB");
    res.status(200).json({ message: "Progress saved" });

  } catch (err) {
    console.error("❌ Error saving progress:", err.message);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

// Get leaderboard - total points across all games
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await GameProgress.aggregate([
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$points" },
          gamesPlayed: { $addToSet: "$game" }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 } // top 10 users
    ]);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error("❌ Error fetching leaderboard:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
