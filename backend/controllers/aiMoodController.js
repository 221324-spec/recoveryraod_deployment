const mongoose = require('mongoose');
const AIMoodPromptLog = require('../models/AIMoodPromptLog');
const AIMoodScan = require('../models/AIMoodScan');
const AISupportActionLog = require('../models/AISupportActionLog');
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');
const axios = require('axios');

const AI_MOOD_ML_URL = process.env.AI_MOOD_ML_URL || 'http://localhost:8001/predict';
const RETENTION_DAYS = parseInt(process.env.AI_MOOD_RETENTION_DAYS || '30', 10);

// Enhanced fallback analysis from recent structured mood signals with intensity classification
// This keeps the feature useful if the face-emotion microservice is down.
async function inferEmotionFromRecentSignals(patientId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const entries = await MoodEntry.find({
    patient: patientId,
    createdAt: { $gte: sevenDaysAgo }
  })
    .sort({ createdAt: -1 })
    .limit(7)
    .select('moodValue craving');

  if (!entries.length) {
    return {
      emotion: 'neutral',
      confidence: 0.52,
      intensity: {
        level: 'mild',
        score: 0.25
      },
      modelVersion: 'contextual-fallback-v1',
      analysisSource: 'fallback_contextual',
      note: 'No recent mood logs; defaulted to neutral baseline.'
    };
  }

  const avgMood = entries.reduce((s, e) => s + Number(e.moodValue || 0), 0) / entries.length;
  const avgCraving = entries.reduce((s, e) => s + Number(e.craving || 0), 0) / entries.length;
  
  // Calculate variance to measure intensity
  const moodVariance = entries.reduce((s, e) => s + Math.pow((Number(e.moodValue || 0) - avgMood), 2), 0) / entries.length;
  const stdDev = Math.sqrt(moodVariance);

  let emotion = 'neutral';
  let intensityScore = 0.3;

  if (avgCraving >= 7 || avgMood <= 1.6) {
    emotion = 'anxious';
    intensityScore = Math.min(0.85, 0.5 + (avgCraving / 10));
  } else if (avgMood <= 2.3) {
    emotion = 'sad';
    intensityScore = Math.min(0.85, 0.4 + ((3 - avgMood) / 5));
  } else if (avgMood >= 3.4 && avgCraving <= 4.5) {
    emotion = 'happy';
    intensityScore = Math.min(0.85, 0.4 + (avgMood / 10));
  } else {
    intensityScore = 0.3 + (stdDev * 0.1); // More variance = more intensity
  }

  const intensityLevel = intensityScore >= 0.65 ? 'strong' : intensityScore >= 0.40 ? 'moderate' : 'mild';
  const sampleBoost = Math.min(entries.length / 7, 1) * 0.16;
  const baseConfidence = 0.56;
  const confidence = Math.min(0.82, Math.max(0.5, baseConfidence + sampleBoost));

  return {
    emotion,
    confidence: Number(confidence.toFixed(3)),
    intensity: {
      level: intensityLevel,
      score: Number(intensityScore.toFixed(3))
    },
    modelVersion: 'contextual-fallback-v1',
    analysisSource: 'fallback_contextual',
    note: 'Derived from recent mood and craving logs while face-emotion service was unavailable.'
  };
}

// ─── Helper: get GridFS bucket ───────────────────────────────────
function getBucket() {
  const db = mongoose.connection.db;
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'ai_mood_screenshots' });
}

// ═══════════════════════════════════════════════════════════════════
//  PATIENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/patients/:id/ai-mood/should-prompt
exports.shouldPrompt = async (req, res) => {
  try {
    const patientId = req.params.id;
    const now = new Date();

    // Anti-spam: check if prompted in last 24h
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const recentPrompt = await AIMoodPromptLog.findOne({
      patientId,
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });

    if (recentPrompt) {
      return res.json({
        success: true,
        data: { shouldPrompt: false, reasons: [], lastPromptAt: recentPrompt.dateTime }
      });
    }

    const reasons = [];

    // Condition 1: Skipped check-in (no mood entry today AND past 20:00)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayMood = await MoodEntry.findOne({
      patient: patientId,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    if (!todayMood && now.getHours() >= 20) {
      reasons.push({ code: 'SKIPPED_CHECKIN', message: 'You haven\'t completed today\'s mood check-in yet.' });
    }

    // Condition 2: High/frequent cravings last 3 days
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const recentMoods = await MoodEntry.find({
      patient: patientId,
      createdAt: { $gte: threeDaysAgo }
    }).select('craving createdAt');

    if (recentMoods.length > 0) {
      const avgCraving = recentMoods.reduce((sum, m) => sum + (m.craving || 0), 0) / recentMoods.length;
      // Count days with craving >= 8
      const dayMap = {};
      recentMoods.forEach(m => {
        const day = new Date(m.createdAt).toDateString();
        if ((m.craving || 0) >= 8) dayMap[day] = true;
      });
      const highCravingDays = Object.keys(dayMap).length;

      if (avgCraving >= 7 || highCravingDays >= 2) {
        reasons.push({ code: 'HIGH_CRAVINGS', message: 'Your craving levels have been elevated recently.' });
      }
    }

    const shouldPrompt = reasons.length > 0;
    const lastLog = await AIMoodPromptLog.findOne({ patientId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        shouldPrompt,
        reasons,
        lastPromptAt: lastLog?.dateTime || null
      }
    });
  } catch (err) {
    console.error('shouldPrompt error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/patients/:id/ai-mood/prompt-log
exports.logPrompt = async (req, res) => {
  try {
    const { action, reasonCodes } = req.body;
    if (!action || !reasonCodes || !reasonCodes.length) {
      return res.status(400).json({ success: false, error: 'action and reasonCodes required' });
    }
    const log = await AIMoodPromptLog.create({
      patientId: req.params.id,
      action,
      reasonCodes
    });
    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error('logPrompt error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/patients/:id/ai-mood/scan  (multipart — file field: "screenshot")
exports.createScan = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No screenshot file uploaded' });
    }

    const bucket = getBucket();

    // Store screenshot in GridFS
    const uploadStream = bucket.openUploadStream(`scan_${patientId}_${Date.now()}.jpg`, {
      contentType: req.file.mimetype,
      metadata: { patientId, capturedAt: new Date() }
    });

    uploadStream.end(req.file.buffer);

    const fileId = uploadStream.id;

    // Create scan record
    const scan = await AIMoodScan.create({
      patientId,
      status: 'PROCESSING',
      screenshot: {
        storage: 'gridfs',
        fileId,
        mimeType: req.file.mimetype,
        capturedAt: new Date()
      },
      retentionUntil: new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
    });

    // Call Python ML service
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: 'screenshot.jpg',
        contentType: req.file.mimetype
      });

      const mlResponse = await axios.post(AI_MOOD_ML_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 120000
      });

      const result = mlResponse.data;

      if (result.ok) {
        scan.status = 'DONE';
        scan.emotion = result.emotion;
        scan.confidence = result.confidence;
        scan.modelVersion = result.modelVersion || 'deepface';
        scan.analysisSource = 'ml_service';
        
        // Store intensity and quality metrics
        if (result.intensity) {
          scan.intensity = {
            level: result.intensity.level,
            score: result.intensity.score
          };
        }
        
        if (result.quality) {
          scan.qualityMetrics = {
            overallScore: result.quality.overallScore,
            sharpness: result.quality.sharpness,
            lighting: result.quality.lighting,
            faceSize: result.quality.faceSize
          };
        }
        
        // Store raw emotion scores for later analysis
        if (result.raw && result.raw.scores) {
          scan.rawEmotionScores = result.raw.scores;
        }
        
        await scan.save();

        // Emit Socket.IO event with enhanced data
        if (global.io) {
          global.io.emit('ai_mood_scan_created', {
            scanId: scan._id,
            patientId,
            emotion: scan.emotion,
            confidence: scan.confidence,
            intensity: scan.intensity,
            qualityScore: scan.qualityMetrics?.overallScore,
            status: 'DONE',
            timestamp: scan.dateTime
          });
        }

        return res.json({
          success: true,
          data: {
            _id: scan._id,
            patientId,
            dateTime: scan.dateTime,
            status: 'DONE',
            emotion: scan.emotion,
            confidence: scan.confidence,
            intensity: scan.intensity,
            qualityMetrics: scan.qualityMetrics,
            analysisSource: 'ml_service',
            screenshotUrl: `/api/patients/${patientId}/ai-mood/scans/${scan._id}/screenshot`
          }
        });
      } else {
        // ML returned ok:false
        scan.status = 'FAILED';
        scan.failureReason = result.error || 'INFERENCE_FAILED';
        await scan.save();

        return res.json({
          success: true,
          data: {
            _id: scan._id,
            patientId,
            dateTime: scan.dateTime,
            status: 'FAILED',
            failureReason: scan.failureReason
          }
        });
      }
    } catch (mlErr) {
      console.error('ML service error:', mlErr.message);

      // Fallback: derive an evidence-based mood label from recent patient logs
      // so the user still gets an actionable result instead of a hard failure.
      const fallback = await inferEmotionFromRecentSignals(patientId);
      scan.status = 'DONE';
      scan.emotion = fallback.emotion;
      scan.confidence = fallback.confidence;
      scan.intensity = fallback.intensity;
      scan.modelVersion = fallback.modelVersion;
      scan.analysisSource = fallback.analysisSource;
      scan.failureReason = 'ML_SERVICE_UNAVAILABLE';
      await scan.save();

      console.log(`⚠️ Using fallback analysis for patient ${patientId}: ${fallback.emotion} (${fallback.intensity.level})`);

      return res.json({
        success: true,
        data: {
          _id: scan._id,
          patientId,
          dateTime: scan.dateTime,
          status: 'DONE',
          emotion: scan.emotion,
          confidence: scan.confidence,
          intensity: scan.intensity,
          modelVersion: scan.modelVersion,
          analysisSource: fallback.analysisSource,
          analysisNote: fallback.note,
          fallbackUsed: true,
          screenshotUrl: `/api/patients/${patientId}/ai-mood/scans/${scan._id}/screenshot`
        }
      });
    }
  } catch (err) {
    console.error('createScan error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/patients/:id/ai-mood/scans/:scanId/screenshot
exports.getPatientScreenshot = async (req, res) => {
  try {
    const scan = await AIMoodScan.findOne({
      _id: req.params.scanId,
      patientId: req.params.id
    });
    if (!scan || !scan.screenshot?.fileId) {
      return res.status(404).json({ success: false, error: 'Screenshot not found' });
    }

    const bucket = getBucket();
    res.set('Content-Type', scan.screenshot.mimeType || 'image/jpeg');
    res.set('Cache-Control', 'private, max-age=3600');

    const downloadStream = bucket.openDownloadStream(scan.screenshot.fileId);
    downloadStream.on('error', () => res.status(404).json({ success: false, error: 'File not found in storage' }));
    downloadStream.pipe(res);
  } catch (err) {
    console.error('getPatientScreenshot error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/patients/:id/ai-mood/scans  — patient's own scan history
exports.getPatientScans = async (req, res) => {
  try {
    const scans = await AIMoodScan.find({
      patientId: req.params.id,
      status: 'DONE'
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('dateTime status emotion confidence createdAt');

    return res.json({ success: true, data: scans });
  } catch (err) {
    console.error('getPatientScans error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/patients/:id/ai-mood/support-action
exports.logSupportAction = async (req, res) => {
  try {
    const { scanId, emotion, actionType, actionId } = req.body;
    if (!scanId || !emotion || !actionType) {
      return res.status(400).json({ success: false, error: 'scanId, emotion, actionType required' });
    }
    const log = await AISupportActionLog.create({
      patientId: req.params.id,
      scanId,
      emotion,
      actionType,
      actionId
    });
    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error('logSupportAction error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  SUPERVISOR ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/supervisors/:supervisorId/ai-mood/scans
exports.supervisorGetScans = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;

    // Get assigned patient IDs
    const patients = await User.find({
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i }
    }).select('_id name');

    const patientIds = patients.map(p => p._id);
    const patientMap = {};
    patients.forEach(p => { patientMap[p._id.toString()] = p.name; });

    // Build query
    const query = { patientId: { $in: patientIds } };
    if (req.query.patientId) {
      // Ensure requested patient is assigned
      if (!patientIds.some(pid => pid.toString() === req.query.patientId)) {
        return res.status(403).json({ success: false, error: 'Patient not assigned to you' });
      }
      query.patientId = req.query.patientId;
    }
    if (req.query.from || req.query.to) {
      query.dateTime = {};
      if (req.query.from) query.dateTime.$gte = new Date(req.query.from);
      if (req.query.to) query.dateTime.$lte = new Date(req.query.to);
    }
    if (req.query.emotion) query.emotion = req.query.emotion;

    const scans = await AIMoodScan.find(query)
      .sort({ dateTime: -1 })
      .limit(200)
      .select('patientId dateTime status emotion confidence screenshot.fileId createdAt');

    const result = scans.map(s => ({
      _id: s._id,
      patientId: s.patientId,
      patientName: patientMap[s.patientId.toString()] || 'Unknown',
      dateTime: s.dateTime,
      emotion: s.emotion,
      confidence: s.confidence,
      status: s.status,
      hasScreenshot: !!s.screenshot?.fileId
    }));

    // Mismatch detection: check manual vs AI mood
    const mismatchFlags = [];
    if (!req.query.patientId) {
      // Check each patient for masking
      for (const patient of patients) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const manualMoods = await MoodEntry.find({
          patient: patient._id,
          createdAt: { $gte: sevenDaysAgo }
        }).select('moodValue');

        const aiScans = await AIMoodScan.find({
          patientId: patient._id,
          status: 'DONE',
          dateTime: { $gte: sevenDaysAgo }
        }).select('emotion');

        if (manualMoods.length >= 3 && aiScans.length >= 2) {
          const avgManualMood = manualMoods.reduce((s, m) => s + m.moodValue, 0) / manualMoods.length;
          const negativeAiCount = aiScans.filter(s => s.emotion === 'sad' || s.emotion === 'anxious').length;

          if (avgManualMood >= 6 && negativeAiCount >= 3) {
            mismatchFlags.push({
              patientId: patient._id,
              patientName: patient.name,
              flag: 'POSSIBLE_MASKING',
              avgManualMood: Math.round(avgManualMood * 10) / 10,
              negativeAiScans: negativeAiCount,
              totalAiScans: aiScans.length
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      data: { scans: result, mismatchFlags }
    });
  } catch (err) {
    console.error('supervisorGetScans error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/supervisors/:supervisorId/ai-mood/scans/:scanId/screenshot
exports.supervisorGetScreenshot = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    const scan = await AIMoodScan.findById(req.params.scanId);
    if (!scan || !scan.screenshot?.fileId) {
      return res.status(404).json({ success: false, error: 'Screenshot not found' });
    }

    // Authorization: check patient is assigned to supervisor
    const patient = await User.findOne({
      _id: scan.patientId,
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i }
    });
    if (!patient) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this screenshot' });
    }

    const bucket = getBucket();
    res.set('Content-Type', scan.screenshot.mimeType || 'image/jpeg');
    res.set('Cache-Control', 'private, max-age=3600');

    const downloadStream = bucket.openDownloadStream(scan.screenshot.fileId);
    downloadStream.on('error', () => res.status(404).json({ success: false, error: 'File not found in storage' }));
    downloadStream.pipe(res);
  } catch (err) {
    console.error('supervisorGetScreenshot error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/supervisors/:supervisorId/ai-mood/weekly-distribution
exports.supervisorWeeklyDistribution = async (req, res) => {
  try {
    const supervisorId = req.params.supervisorId;
    const patientId = req.query.patientId;

    // Check assignment
    const patientQuery = { assignedSupervisor: supervisorId, role: { $regex: /^patient$/i } };
    if (patientId) patientQuery._id = patientId;
    const patients = await User.find(patientQuery).select('_id');
    const patientIds = patients.map(p => p._id);

    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const scans = await AIMoodScan.find({
      patientId: { $in: patientIds },
      status: 'DONE',
      dateTime: { $gte: fourWeeksAgo }
    }).select('emotion dateTime').sort({ dateTime: 1 });

    // Group by week
    const weeks = {};
    scans.forEach(s => {
      const weekStart = new Date(s.dateTime);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { happy: 0, sad: 0, anxious: 0, neutral: 0 };
      if (s.emotion && weeks[key][s.emotion] !== undefined) {
        weeks[key][s.emotion]++;
      }
    });

    const distribution = Object.entries(weeks).map(([week, counts]) => ({
      week, ...counts
    }));

    return res.json({ success: true, data: distribution });
  } catch (err) {
    console.error('supervisorWeeklyDistribution error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  RETENTION CLEANUP (called by cron job)
// ═══════════════════════════════════════════════════════════════════
exports.cleanupExpiredScans = async () => {
  try {
    const now = new Date();
    const expiredScans = await AIMoodScan.find({
      retentionUntil: { $lt: now },
      'screenshot.fileId': { $exists: true, $ne: null }
    });

    if (expiredScans.length === 0) return;

    const bucket = getBucket();
    let cleaned = 0;

    for (const scan of expiredScans) {
      try {
        if (scan.screenshot?.fileId) {
          await bucket.delete(scan.screenshot.fileId);
        }
        scan.screenshot = { storage: 'gridfs', fileId: null, mimeType: null, capturedAt: scan.screenshot?.capturedAt };
        await scan.save();
        cleaned++;
      } catch (delErr) {
        console.error(`Failed to cleanup scan ${scan._id}:`, delErr.message);
      }
    }

    console.log(`🗑️ AI Mood Scan retention: cleaned ${cleaned}/${expiredScans.length} expired screenshots`);
  } catch (err) {
    console.error('cleanupExpiredScans error:', err);
  }
};
