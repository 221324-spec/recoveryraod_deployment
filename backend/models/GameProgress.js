// models/GameProgress.js
const mongoose = require("mongoose");

const GameProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  game: { type: String, required: true },
  points: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GameProgress", GameProgressSchema);
