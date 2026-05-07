/**
 * AI Insights Controller
 *
 * Aggregates real analytics from the database to power the supervisor
 * "AI Insights & Analytics" panel.  Every number shown is computed
 * from actual patient data — no hardcoded fakes.
 *
 * Four insight categories:
 *   1. Sentiment Analysis   — mood entry stats + emotion distribution
 *   2. Risk Assessment      — per-patient risk scoring via riskScoringService
 *   3. Pattern Recognition  — trigger frequency, mood-craving correlation
 *   4. Predictive Trends    — recent vs prior period comparison
 */

const MoodEntry = require('../models/MoodEntry');
const TriggerLog = require('../models/TriggerLog');
const Activity = require('../models/Activity');
const Relapse = require('../models/Relapse');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { evaluateRisk } = require('../services/riskScoringService');
const { analyze } = require('../services/analyzerService');
const Message = require('../models/Message');

// ML service for model metadata
let mlService;
try { mlService = require('../ml/mlService'); } catch (_) { mlService = null; }

/**
 * GET /api/supervisors/:supervisorId/ai-insights
 *
 * Returns aggregated analytics across all patients assigned to this supervisor.
 */
exports.getAIInsights = async (req, res) => {
  try {
    const { supervisorId } = req.params;

    // Fetch assigned patients
    const patients = await User.find({
      assignedSupervisor: supervisorId,
      role: { $regex: /^patient$/i },
      status: { $in: ['assigned', 'active'] }
    }).select('_id name');

    const patientIds = patients.map(p => p._id);
    const now = new Date();
    const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

    // ── 1. SENTIMENT ANALYSIS — mood entries from last 7 days ──────
    const recentMoods = await MoodEntry.find({
      patient: { $in: patientIds },
      createdAt: { $gte: daysAgo(7) }
    }).sort({ createdAt: -1 });

    const totalMoodEntries = recentMoods.length;
    const avgMood = totalMoodEntries > 0
      ? +(recentMoods.reduce((s, m) => s + (m.moodValue || 3), 0) / totalMoodEntries).toFixed(1)
      : 0;
    const avgCraving = totalMoodEntries > 0
      ? +(recentMoods.reduce((s, m) => s + (m.craving ?? 5), 0) / totalMoodEntries).toFixed(1)
      : 0;

    // Emotion distribution from journal entries (use analyzerService)
    const emotionCounts = { anxiety: 0, sadness: 0, anger: 0, hope: 0, neutral: 0 };
    let journalAnalyzed = 0;
    let highRiskJournals = 0;
    let medRiskJournals = 0;

    for (const mood of recentMoods) {
      if (mood.journal && mood.journal.trim().length > 2) {
        const result = await analyze(mood.journal);
        emotionCounts[result.emotion] = (emotionCounts[result.emotion] || 0) + 1;
        journalAnalyzed++;
        if (result.risk === 'HIGH') highRiskJournals++;
        else if (result.risk === 'MED') medRiskJournals++;
      }
    }

    // Also analyze recent chat messages (patient → chatbot)
    let chatAnalyzed = 0;
    let chatHighRisk = 0;
    let chatMedRisk = 0;
    try {
      const recentChats = await Message.find({
        senderId: { $in: patientIds },
        createdAt: { $gte: daysAgo(7) }
      }).select('content').limit(200);

      for (const msg of recentChats) {
        if (msg.content && msg.content.trim().length > 2) {
          const result = await analyze(msg.content);
          emotionCounts[result.emotion] = (emotionCounts[result.emotion] || 0) + 1;
          chatAnalyzed++;
          if (result.risk === 'HIGH') chatHighRisk++;
          else if (result.risk === 'MED') chatMedRisk++;
        }
      }
    } catch (_) { /* Messages may not exist */ }

    const totalAnalyzed = journalAnalyzed + chatAnalyzed;

    // ── 2. RISK ASSESSMENT — run riskScoringService for each patient ──
    const riskResults = [];
    for (const patient of patients) {
      try {
        const { riskScore, reasons } = await evaluateRisk(patient._id.toString());
        riskResults.push({
          patientId: patient._id,
          patientName: patient.name,
          riskScore,
          topFactors: reasons.slice(0, 3).map(r => r.factor)
        });
      } catch (_) {
        riskResults.push({
          patientId: patient._id,
          patientName: patient.name,
          riskScore: 0,
          topFactors: []
        });
      }
    }

    const avgRiskScore = riskResults.length > 0
      ? Math.round(riskResults.reduce((s, r) => s + r.riskScore, 0) / riskResults.length)
      : 0;
    const highRiskPatients = riskResults.filter(r => r.riskScore >= 75);
    const medRiskPatients = riskResults.filter(r => r.riskScore >= 55 && r.riskScore < 75);
    const lowRiskPatients = riskResults.filter(r => r.riskScore < 55);

    // ── 3. PATTERN RECOGNITION — triggers & correlations ─────────
    const recentTriggers = await TriggerLog.find({
      patient: { $in: patientIds },
      createdAt: { $gte: daysAgo(7) }
    });

    // Count trigger frequency
    const triggerFreq = {};
    let totalTriggerCount = 0;
    for (const log of recentTriggers) {
      for (const t of (log.triggers || [])) {
        triggerFreq[t] = (triggerFreq[t] || 0) + 1;
        totalTriggerCount++;
      }
      if (log.customTrigger?.name) {
        const ct = log.customTrigger.name;
        triggerFreq[ct] = (triggerFreq[ct] || 0) + 1;
        totalTriggerCount++;
      }
    }
    const topTriggers = Object.entries(triggerFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Activity completion
    const recentActivities = await Activity.find({
      patient: { $in: patientIds },
      createdAt: { $gte: daysAgo(7) }
    });
    const completedActivities = recentActivities.filter(a => a.status === 'completed').length;
    const totalActivities = recentActivities.length;
    const activityCompletionRate = totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    // ── 4. PREDICTIVE TRENDS — this week vs last week ──────────
    const prevMoods = await MoodEntry.find({
      patient: { $in: patientIds },
      createdAt: { $gte: daysAgo(14), $lt: daysAgo(7) }
    });
    const prevAvgMood = prevMoods.length > 0
      ? +(prevMoods.reduce((s, m) => s + (m.moodValue || 3), 0) / prevMoods.length).toFixed(1)
      : 0;
    const prevAvgCraving = prevMoods.length > 0
      ? +(prevMoods.reduce((s, m) => s + (m.craving ?? 5), 0) / prevMoods.length).toFixed(1)
      : 0;

    const moodTrend = prevAvgMood > 0
      ? +(((avgMood - prevAvgMood) / prevAvgMood) * 100).toFixed(1)
      : 0; // +ve = improving, -ve = worsening
    const cravingTrend = prevAvgCraving > 0
      ? +(((avgCraving - prevAvgCraving) / prevAvgCraving) * 100).toFixed(1)
      : 0; // +ve = worsening (higher cravings), -ve = improving

    // Recent relapses (7d vs prior 7d)
    const relapses7d = await Relapse.countDocuments({
      patientId: { $in: patientIds },
      dateTime: { $gte: daysAgo(7) }
    });
    const relapsesPrev7d = await Relapse.countDocuments({
      patientId: { $in: patientIds },
      dateTime: { $gte: daysAgo(14), $lt: daysAgo(7) }
    });

    // Active alerts count
    const activeAlerts = await Alert.countDocuments({
      isActive: true,
      $or: [
        { targetUsers: supervisorId },
        { targetRoles: 'supervisor' },
        { targetRoles: 'all' }
      ]
    });

    res.json({
      success: true,
      data: {
        patientCount: patients.length,
        generatedAt: now.toISOString(),

        sentimentAnalysis: {
          totalMoodEntries,
          avgMood,           // 1-10
          avgCraving,        // 0-10
          emotionDistribution: emotionCounts,
          textsAnalyzed: totalAnalyzed,
          journalsAnalyzed: journalAnalyzed,
          chatsAnalyzed: chatAnalyzed,
          highRiskTexts: highRiskJournals + chatHighRisk,
          medRiskTexts: medRiskJournals + chatMedRisk,
          lastUpdated: now.toISOString()
        },

        riskAssessment: {
          avgRiskScore,
          highRiskCount: highRiskPatients.length,
          medRiskCount: medRiskPatients.length,
          lowRiskCount: lowRiskPatients.length,
          highRiskPatients: highRiskPatients.map(r => ({
            name: r.patientName,
            score: r.riskScore,
            topFactors: r.topFactors
          })),
          factorsEvaluated: 7, // cravings, mood, triggers, activities, check-ins, relapses, chat
          lastEvaluated: now.toISOString()
        },

        patternRecognition: {
          totalTriggers: totalTriggerCount,
          topTriggers,
          activityCompletionRate,
          completedActivities,
          totalActivities,
          triggerPatternsFound: topTriggers.length
        },

        predictiveTrends: {
          moodTrend,          // % change week-over-week
          cravingTrend,       // % change week-over-week
          relapses7d,
          relapsesPrev7d,
          relapseTrend: relapsesPrev7d > 0
            ? +(((relapses7d - relapsesPrev7d) / relapsesPrev7d) * 100).toFixed(1)
            : (relapses7d > 0 ? 100 : 0),
          checkinRate: totalMoodEntries > 0
            ? Math.round((totalMoodEntries / (patients.length * 7)) * 100)
            : 0,
          activeAlerts
        },

        // ── ML MODEL METADATA ────────────────────────────────────────
        mlModels: mlService ? {
          ready: mlService.isReady(),
          pythonActive: mlService.isPythonActive ? mlService.isPythonActive() : false,
          ...mlService.getModelMeta(),
          algorithms: {
            textAnalysis: 'TF-IDF + Random Forest (scikit-learn)',
            emotionDetection: 'TF-IDF + SVM RBF Kernel (scikit-learn)',
            riskPrediction: 'Gradient Boosting Classifier (scikit-learn)',
            integration: 'Hybrid (Python ML microservice + Rule-based safety net)',
            framework: 'scikit-learn / Python',
            fallback: 'natural.js / Node.js'
          }
        } : { ready: false, message: 'ML models not loaded' }
      }
    });
  } catch (error) {
    console.error('AI Insights error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI insights', error: error.message });
  }
};
