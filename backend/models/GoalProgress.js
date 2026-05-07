const mongoose = require("mongoose");

const goalProgressSchema = new mongoose.Schema(
  {
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },

    note: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoalProgress", goalProgressSchema);
