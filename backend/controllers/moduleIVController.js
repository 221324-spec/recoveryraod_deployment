/**
 * Module IV Controller — risk scoring, crisis SOS, check-in status,
 * journal keyword insights, and supervisor export.
 */
const MoodEntry = require('../models/MoodEntry');
const TriggerLog = require('../models/TriggerLog');
const Activity = require('../models/Activity');
const Alert = require('../models/Alert');
const Relapse = require('../models/Relapse');
const User = require('../models/User');
const realtime = require('../utils/realtime');
const { evaluateRisk, evaluateAndAlert } = require('../services/riskScoringService');

// ── STOPWORDS for journal keyword extraction (non-ML) ──────────────
const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'he', 'him',
  'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
  'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
  'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
  'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
  'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'really', 'today', 'also', 'just', 'like', 'even', 'get',
  'got', 'much', 'still', 'thing', 'things', 'going', 'went', 'would', 'could',
  'feel', 'feeling', 'felt', 'lot', 'bit', 'day', 'think', 'know', 'want',
  'make', 'made', 'been', 'well', 'back', 'one', 'two'
]);

/**
 * Extract top N keywords from text. Computed on demand (not stored).
 * Approach: tokenize, lowercase, strip punctuation, remove stopwords, count frequency.
 */
function extractKeywords(text, topN = 5) {
  if (!text || typeof text !== 'string') return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));

  const freq = {};
  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

// ═══════════════════════════════════════════════════════════════════
// 1) POST /api/patients/:id/risk/evaluate — compute risk + maybe alert
// ═══════════════════════════════════════════════════════════════════
exports.evaluateRisk = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    const result = await evaluateAndAlert(patientId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Risk evaluate error:', err);
    res.status(500).json({ error: 'Failed to evaluate risk' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 2) GET /api/patients/:id/risk — return current risk score + reasons
// ═══════════════════════════════════════════════════════════════════
exports.getRisk = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    const result = await evaluateRisk(patientId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Risk get error:', err);
    res.status(500).json({ error: 'Failed to get risk score' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 3) POST /api/patients/:id/sos — Crisis SOS button (real alert)
// ═══════════════════════════════════════════════════════════════════
exports.createSOS = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    // Authorization: patient only
    if (req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'You can only trigger SOS for yourself' });
    }

    const patient = await User.findById(patientId).select('name assignedSupervisor');
    const message = req.body.message || 'Patient triggered SOS — immediate support needed.';

    const alert = new Alert({
      title: `🆘 SOS Alert — ${patient?.name || 'Patient'}`,
      message: String(message).substring(0, 1000),
      type: 'crisis',
      priority: 'urgent',
      targetRoles: ['supervisor', 'admin'],
      targetUsers: patient?.assignedSupervisor ? [patient.assignedSupervisor] : [],
      triggerType: 'manual',
      conditions: { customCondition: 'SOS' },
      createdBy: patientId,
      source: 'crisis-detection',
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await alert.save();

    // Real-time: notify supervisor + admin
    if (patient?.assignedSupervisor) {
      realtime.emitToUser(patient.assignedSupervisor.toString(), 'sos:alert', {
        patientId,
        patientName: patient.name,
        alert,
        generatedAt: new Date()
      });
    }
    realtime.emitToRoom('admin:alerts', 'sos:alert', {
      patientId,
      patientName: patient?.name,
      alert,
      generatedAt: new Date()
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    console.error('SOS create error:', err);
    res.status(500).json({ error: 'Failed to create SOS alert' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 4) GET /api/patients/:id/checkin-status — today's completion status
//    Complete = mood + craving + triggers all submitted today
// ═══════════════════════════════════════════════════════════════════
exports.getCheckinStatus = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const todayStr = new Date().toDateString();

    const [moodToday, triggerToday] = await Promise.all([
      MoodEntry.findOne({ patient: patientId, dateString: todayStr }),
      TriggerLog.findOne({ patient: patientId, dateString: todayStr })
    ]);

    const hasMood = !!moodToday;
    const hasCraving = hasMood && moodToday.craving !== undefined && moodToday.craving !== null;
    const hasTriggers = !!triggerToday;

    const complete = hasMood && hasCraving && hasTriggers;

    res.json({
      success: true,
      status: complete ? 'Complete' : 'Incomplete',
      details: { hasMood, hasCraving, hasTriggers }
    });
  } catch (err) {
    console.error('Check-in status error:', err);
    res.status(500).json({ error: 'Failed to get check-in status' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 5) GET /api/patients/:id/journal-keywords — top 5 keywords from today's journal
//    Keywords are computed on demand from the journal text, NOT stored.
// ═══════════════════════════════════════════════════════════════════
exports.getJournalKeywords = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const todayStr = new Date().toDateString();
    const moods = await MoodEntry.find({ patient: patientId, dateString: todayStr }).sort({ createdAt: -1 });

    // Combine all journal entries from today
    const combinedJournal = moods
      .map(m => m.journal || '')
      .filter(j => j.length > 0)
      .join(' ');

    const keywords = extractKeywords(combinedJournal, 5);

    res.json({ success: true, keywords, journalLength: combinedJournal.length });
  } catch (err) {
    console.error('Journal keywords error:', err);
    res.status(500).json({ error: 'Failed to extract keywords' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 6) GET /api/supervisors/:id/patients/:patientId/export
//    Aggregated summary for a patient over a date range.
//    Query params: from, to (ISO dates). Defaults to last 7 days.
//    Returns JSON; frontend converts to CSV.
// ═══════════════════════════════════════════════════════════════════
exports.exportPatientSummary = async (req, res) => {
  try {
    const supervisorId = req.params.id;
    const patientId = req.params.patientId;

    if (!supervisorId.match(/^[0-9a-fA-F]{24}$/) || !patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Authorization
    if (req.user._id.toString() !== supervisorId && (req.user.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify patient is assigned
    const patient = await User.findById(patientId).select('name email assignedSupervisor');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.assignedSupervisor?.toString() !== supervisorId && (req.user.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Patient not assigned to you' });
    }

    // Date range
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);

    const dateFilter = { $gte: from, $lte: to };

    const [moods, triggers, activities, relapses] = await Promise.all([
      MoodEntry.find({ patient: patientId, createdAt: dateFilter }).sort({ createdAt: 1 }),
      TriggerLog.find({ patient: patientId, createdAt: dateFilter }),
      Activity.find({ patient: patientId, status: 'completed', createdAt: dateFilter }),
      Relapse.find({ patientId, dateTime: dateFilter })
    ]);

    // Calculate aggregates
    const moodAvg = moods.length > 0
      ? moods.reduce((s, m) => s + (m.moodValue || 3), 0) / moods.length
      : 0;
    const cravingAvg = moods.length > 0
      ? moods.reduce((s, m) => s + (m.craving ?? 5), 0) / moods.length
      : 0;

    // Trigger frequency
    const triggerCounts = {};
    triggers.forEach(t => {
      (t.triggers || []).forEach(tr => { triggerCounts[tr] = (triggerCounts[tr] || 0) + 1; });
      if (t.customTrigger?.name) triggerCounts[t.customTrigger.name] = (triggerCounts[t.customTrigger.name] || 0) + 1;
    });

    const activityPointsSum = activities.reduce((s, a) => s + (a.points || 0), 0);

    // Check-in streak (from end of range backwards)
    const moodDates = new Set(moods.map(m => new Date(m.createdAt).toDateString()));
    let streakDays = 0;
    const checkDate = new Date(to);
    while (checkDate >= from) {
      if (moodDates.has(checkDate.toDateString())) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    // Risk score snapshot
    const risk = await evaluateRisk(patientId);

    // Daily breakdown for CSV
    const dailyRows = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const dayStr = cursor.toDateString();
      const dayISO = cursor.toISOString().split('T')[0];
      const dayMoods = moods.filter(m => new Date(m.createdAt).toDateString() === dayStr);
      const dayTriggers = triggers.filter(t => new Date(t.createdAt).toDateString() === dayStr);
      const dayActivities = activities.filter(a => new Date(a.createdAt).toDateString() === dayStr);
      const dayRelapses = relapses.filter(r => new Date(r.dateTime).toDateString() === dayStr);

      dailyRows.push({
        date: dayISO,
        moodAvg: dayMoods.length > 0
          ? (dayMoods.reduce((s, m) => s + (m.moodValue || 3), 0) / dayMoods.length).toFixed(1)
          : '',
        cravingAvg: dayMoods.length > 0
          ? (dayMoods.reduce((s, m) => s + (m.craving ?? 5), 0) / dayMoods.length).toFixed(1)
          : '',
        triggers: dayTriggers.flatMap(t => t.triggers || []).join('; '),
        activityPoints: dayActivities.reduce((s, a) => s + (a.points || 0), 0),
        relapseCount: dayRelapses.length,
        checkedIn: dayMoods.length > 0 ? 'Yes' : 'No'
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      success: true,
      summary: {
        patientName: patient.name,
        patientEmail: patient.email,
        dateRange: { from: from.toISOString(), to: to.toISOString() },
        moodAvg: Math.round(moodAvg * 10) / 10,
        cravingAvg: Math.round(cravingAvg * 10) / 10,
        totalCheckIns: moods.length,
        triggerFrequency: triggerCounts,
        activityPointsSum,
        streakDays,
        totalRelapses: relapses.length,
        riskScore: risk.riskScore,
        riskReasons: risk.reasons
      },
      dailyRows
    });
  } catch (err) {
    console.error('Export summary error:', err);
    res.status(500).json({ error: 'Failed to export summary' });
  }
};
