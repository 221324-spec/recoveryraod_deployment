/**
 * Risk Scoring Service — Hybrid ML + Rule-based relapse risk evaluation.
 *
 * Computes a numeric riskScore (0–100) from real DB data using TWO methods:
 *
 *   A) Rule-based (7 weighted factors → deterministic score)
 *   B) ML Logistic Regression (feature vector → probabilistic classification)
 *
 * The final score blends both: 60% rule-based + 40% ML (when ML is available).
 * If ML models aren't loaded, falls back to 100% rule-based.
 *
 * Thresholds:
 *   riskScore >= 75  →  HIGH alert
 *   riskScore >= 55  →  MED  alert
 *
 * Deduplication: same type+level not created more than once per 24h per patient.
 */

const MoodEntry = require('../models/MoodEntry');
const TriggerLog = require('../models/TriggerLog');
const Activity = require('../models/Activity');
const Relapse = require('../models/Relapse');
const Alert = require('../models/Alert');
const User = require('../models/User');
const realtime = require('../utils/realtime');

// ML service (graceful if not loaded)
let mlService;
try { mlService = require('../ml/mlService'); } catch (_) { mlService = null; }

// Try loading ChatAnalysis for keyword flags — skip gracefully if absent
let ChatAnalysis;
try { ChatAnalysis = require('../models/ChatAnalysis'); } catch (_) { ChatAnalysis = null; }

/**
 * Evaluate risk for a single patient. Returns { riskScore, reasons[] }.
 * @param {string} patientId - Mongo ObjectId string
 * @returns {{ riskScore: number, reasons: Array<{factor: string, points: number, detail: string}> }}
 */
async function evaluateRisk(patientId) {
  const reasons = [];
  let score = 0;

  const now = new Date();
  const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  // ── 1. Cravings (last 7 days): avg & max ──────────────────────────────
  const recentMoods = await MoodEntry.find({
    patient: patientId,
    createdAt: { $gte: daysAgo(7) }
  }).sort({ createdAt: -1 });

  if (recentMoods.length > 0) {
    const cravings = recentMoods.map(m => m.craving ?? 5);
    const avgCraving = cravings.reduce((s, c) => s + c, 0) / cravings.length;
    const maxCraving = Math.max(...cravings);

    // Average craving contribution (0-20 pts)
    const avgPts = Math.round(Math.min(20, (avgCraving / 10) * 20));
    if (avgPts > 5) {
      score += avgPts;
      reasons.push({ factor: 'High average cravings', points: avgPts, detail: `Avg craving: ${avgCraving.toFixed(1)}/10 (7d)` });
    }

    // Max craving spike (0-10 pts)
    if (maxCraving >= 8) {
      const spikePts = maxCraving >= 9 ? 10 : 7;
      score += spikePts;
      reasons.push({ factor: 'Craving spike', points: spikePts, detail: `Max craving: ${maxCraving}/10 in past 7d` });
    }
  }

  // ── 2. Mood trend (last 7 days): worsening detection ────────────────
  if (recentMoods.length >= 3) {
    const moodVals = recentMoods.map(m => m.moodValue || 3).reverse(); // oldest first
    let worseningCount = 0;
    for (let i = 1; i < moodVals.length; i++) {
      if (moodVals[i] < moodVals[i - 1]) worseningCount++;
    }
    const worseningRatio = worseningCount / (moodVals.length - 1);
    if (worseningRatio > 0.5) {
      const pts = Math.round(Math.min(15, worseningRatio * 20));
      score += pts;
      reasons.push({ factor: 'Declining mood trend', points: pts, detail: `${worseningCount}/${moodVals.length - 1} mood drops in 7d` });
    }

    // Low average mood
    const avgMood = moodVals.reduce((s, v) => s + v, 0) / moodVals.length;
    if (avgMood <= 2) {
      score += 10;
      reasons.push({ factor: 'Very low mood', points: 10, detail: `Avg mood: ${avgMood.toFixed(1)}/4 (7d)` });
    }
  }

  // ── 3. Trigger count (7 days) ──────────────────────────────────────
  const recentTriggers = await TriggerLog.find({
    patient: patientId,
    createdAt: { $gte: daysAgo(7) }
  });
  const totalTriggers = recentTriggers.reduce((sum, t) => sum + (t.triggers?.length || 0), 0);
  if (totalTriggers >= 10) {
    const pts = Math.min(10, Math.round(totalTriggers / 2));
    score += pts;
    reasons.push({ factor: 'Many triggers reported', points: pts, detail: `${totalTriggers} triggers in 7d` });
  }

  // ── 4. Recovery activity points (7 days) ───────────────────────────
  const recentActivities = await Activity.find({
    patient: patientId,
    status: 'completed',
    createdAt: { $gte: daysAgo(7) }
  });
  const activityPoints = recentActivities.reduce((s, a) => s + (a.points || 0), 0);
  if (activityPoints < 20) {
    const pts = activityPoints === 0 ? 10 : 5;
    score += pts;
    reasons.push({ factor: 'Low recovery activity', points: pts, detail: `Only ${activityPoints} activity pts in 7d` });
  }

  // ── 5. Streak break / missed check-ins (last 3 days) ──────────────
  let missedDays = 0;
  for (let i = 0; i < 3; i++) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = await MoodEntry.countDocuments({
      patient: patientId,
      createdAt: { $gte: dayStart, $lte: dayEnd }
    });
    if (count === 0) missedDays++;
  }
  if (missedDays >= 2) {
    const pts = missedDays === 3 ? 10 : 7;
    score += pts;
    reasons.push({ factor: 'Missed check-ins', points: pts, detail: `${missedDays} of last 3 days missed` });
  }

  // ── 6. Relapse history (30 & 90 days) ─────────────────────────────
  const relapses30 = await Relapse.countDocuments({
    patientId,
    dateTime: { $gte: daysAgo(30) }
  });
  const relapses90 = await Relapse.countDocuments({
    patientId,
    dateTime: { $gte: daysAgo(90) }
  });

  if (relapses30 > 0) {
    const pts = Math.min(15, relapses30 * 8);
    score += pts;
    reasons.push({ factor: 'Recent relapse events', points: pts, detail: `${relapses30} relapses in 30d` });
  } else if (relapses90 > 0) {
    score += 5;
    reasons.push({ factor: 'Past relapse history', points: 5, detail: `${relapses90} relapses in 90d` });
  }

  // ── 7. Chat keyword flags (optional) ──────────────────────────────
  if (ChatAnalysis) {
    try {
      const highRiskChats = await ChatAnalysis.countDocuments({
        patientId,
        risk: { $in: ['HIGH', 'MED'] },
        createdAt: { $gte: daysAgo(7) }
      });
      if (highRiskChats >= 2) {
        const pts = Math.min(10, highRiskChats * 3);
        score += pts;
        reasons.push({ factor: 'Concerning chat messages', points: pts, detail: `${highRiskChats} flagged messages in 7d` });
      }
    } catch (_) { /* skip gracefully */ }
  }

  // Cap at 100
  const ruleBasedScore = Math.min(100, score);

  // ── 8. ML Risk Prediction (Logistic Regression) ───────────────────
  let mlPrediction = null;
  let method = 'rule-based';

  if (mlService && mlService.isReady()) {
    try {
      // Build normalized feature vector from the data we already queried
      const cravings = recentMoods.length > 0 ? recentMoods.map(m => m.craving ?? 5) : [0];
      const avgCravingRaw = cravings.reduce((s, c) => s + c, 0) / cravings.length;
      const maxCravingRaw = Math.max(...cravings);
      const moodVals = recentMoods.length > 0 ? recentMoods.map(m => m.moodValue || 3) : [3];
      const avgMoodRaw = moodVals.reduce((s, v) => s + v, 0) / moodVals.length;

      // Mood decline ratio
      let moodDeclineRaw = 0;
      if (moodVals.length >= 3) {
        const sorted = [...moodVals].reverse(); // oldest first
        let drops = 0;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] < sorted[i - 1]) drops++;
        }
        moodDeclineRaw = drops / (sorted.length - 1);
      }

      // Normalize features to 0-1 scale
      const mlFeatures = {
        avgCraving: Math.min(1, avgCravingRaw / 10),
        maxCraving: Math.min(1, maxCravingRaw / 10),
        avgMood: Math.min(1, avgMoodRaw / 5),    // mood is 1-5 scale
        moodDecline: moodDeclineRaw,
        triggers: Math.min(1, totalTriggers / 20),
        activity: Math.min(1, activityPoints / 100),
        missed: Math.min(1, missedDays / 3),
        relapses: Math.min(1, relapses30 / 5),
      };

      mlPrediction = await mlService.predictRisk(mlFeatures);

      if (mlPrediction.method !== 'fallback') {
        method = 'hybrid';
        reasons.push({
          factor: 'ML Risk Prediction',
          points: 0,
          detail: `Logistic Regression: ${mlPrediction.riskLevel} (confidence: ${(mlPrediction.confidence * 100).toFixed(0)}%)`
        });
      }
    } catch (err) {
      // ML failed — continue with rule-based only
      reasons.push({ factor: 'ML unavailable', points: 0, detail: 'Using rule-based scoring only' });
    }
  }

  // ── 9. Blend rule-based + ML scores ───────────────────────────────
  let riskScore;
  if (mlPrediction && mlPrediction.method !== 'fallback') {
    // Convert ML risk level to numeric score
    const ML_SCORE_MAP = { HIGH: 85, MED: 65, LOW: 25 };
    const mlScore = ML_SCORE_MAP[mlPrediction.riskLevel] || 25;

    // Weighted blend: 60% rule-based + 40% ML
    riskScore = Math.round(ruleBasedScore * 0.6 + mlScore * 0.4);
    riskScore = Math.min(100, riskScore);
  } else {
    riskScore = ruleBasedScore;
  }

  return { riskScore, reasons, method, mlPrediction };
}

/**
 * Evaluate risk AND create an Alert if threshold met, with 24h dedup.
 * @param {string} patientId
 * @returns {{ riskScore, reasons, alertCreated: boolean, alert?: object }}
 */
async function evaluateAndAlert(patientId) {
  const { riskScore, reasons } = await evaluateRisk(patientId);

  let alertCreated = false;
  let alert = null;

  if (riskScore >= 55) {
    const riskLevel = riskScore >= 75 ? 'HIGH' : 'MED';
    const priority = riskLevel === 'HIGH' ? 'urgent' : 'high';

    // 24h dedup: check if same type+priority exists for this patient in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Alert.findOne({
      createdBy: patientId,
      triggerType: 'automatic',
      priority,
      'conditions.customCondition': 'RISK_SCORE',
      createdAt: { $gte: oneDayAgo }
    });

    if (!existing) {
      const patient = await User.findById(patientId).select('name assignedSupervisor');
      const topFactors = reasons.slice(0, 3).map(r => r.factor).join(', ');

      alert = new Alert({
        title: `${riskLevel} Relapse Risk — ${patient?.name || 'Patient'}`,
        message: `Risk score: ${riskScore}/100. Top factors: ${topFactors}`,
        type: riskLevel === 'HIGH' ? 'crisis' : 'warning',
        priority,
        targetRoles: ['supervisor'],
        targetUsers: patient?.assignedSupervisor ? [patient.assignedSupervisor] : [],
        triggerType: 'automatic',
        conditions: { customCondition: 'RISK_SCORE', moodThreshold: riskScore },
        createdBy: patientId,
        source: 'system',
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // expires in 7 days
      });
      await alert.save();
      alertCreated = true;

      // Real-time notify supervisor
      if (patient?.assignedSupervisor) {
        realtime.emitToUser(patient.assignedSupervisor.toString(), 'risk:alert', {
          patientId,
          patientName: patient.name,
          riskScore,
          riskLevel,
          reasons,
          alert,
          generatedAt: new Date()
        });
      }
    }
  }

  return { riskScore, reasons, alertCreated, alert };
}

module.exports = { evaluateRisk, evaluateAndAlert };
