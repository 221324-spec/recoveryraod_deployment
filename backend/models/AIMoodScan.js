const mongoose = require('mongoose');

const AIMoodScanSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateTime: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['PROCESSING', 'DONE', 'FAILED'],
    required: true,
    default: 'PROCESSING'
  },
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'anxious', 'neutral']
  },
  confidence: { type: Number, min: 0, max: 1 },
  intensity: {
    level: {
      type: String,
      enum: ['mild', 'moderate', 'strong']
    },
    score: { type: Number, min: 0, max: 1 }
  },
  qualityMetrics: {
    overallScore: { type: Number, min: 0, max: 1 },
    sharpness: { type: Number, min: 0, max: 1 },
    lighting: { type: Number, min: 0, max: 1 },
    faceSize: { type: Number, min: 0, max: 1 }
  },
  rawEmotionScores: {
    happy: Number,
    sad: Number,
    angry: Number,
    fear: Number,
    disgust: Number,
    neutral: Number,
    sadness: Number,
    surprise: Number
  },
  modelVersion: String,
  analysisSource: {
    type: String,
    enum: ['ml_service', 'fallback_contextual'],
    default: 'ml_service'
  },
  failureReason: String,
  screenshot: {
    storage: { type: String, default: 'gridfs' },
    fileId: { type: mongoose.Schema.Types.ObjectId },
    mimeType: String,
    capturedAt: Date
  },
  retentionUntil: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, { timestamps: true });

AIMoodScanSchema.index({ patientId: 1, createdAt: -1 });
AIMoodScanSchema.index({ retentionUntil: 1 });
AIMoodScanSchema.index({ status: 1 });

module.exports = mongoose.model('AIMoodScan', AIMoodScanSchema);
