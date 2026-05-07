const express = require("express");
const router = express.Router();

// ❌ previous incorrect destructuring
// const { authenticateUser } = require("../middleware/authMiddleware");

// ✅ correct: authMiddleware is exported directly
const authenticateUser = require("../middleware/authMiddleware");

const { getProgressHistory } = require("../controllers/progressHistoryController");

router.get("/history", authenticateUser, getProgressHistory);

module.exports = router;
