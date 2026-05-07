/**
 * Analyzer Service — Phase 2 (Hybrid ML + Rule-based)
 *
 * Combines ML classifiers (Naive Bayes) with rule-based keyword/regex
 * analysis for robust patient chat message analysis.
 *
 * Strategy:
 *   1. Rule-based HIGH risk patterns ALWAYS run (safety-critical)
 *   2. ML classifiers run in parallel for risk + emotion
 *   3. Results are merged — the HIGHER risk prevails (safety first)
 *   4. Emotion uses ML when confident, rule-based as fallback
 *   5. Method field tracks which engine(s) contributed
 *
 * Outputs: { emotion, intensity, risk, summary, reasons, method }
 */

// Import ML service (graceful if not loaded yet)
let mlService;
try { mlService = require('../ml/mlService'); } catch (_) { mlService = null; }

// ── HIGH risk patterns (self-harm / suicide / overdose / immediate danger) ──
const HIGH_RISK_PATTERNS = [
  /\b(kill\s*(my)?self|sui[cs]ide|suicidal)\b/i,
  /\b(want\s+to\s+die|wanna\s+die|rather\s+be\s+dead)\b/i,
  /\b(end\s+(my\s+)?life|end\s+it\s+all)\b/i,
  /\b(self[- ]?harm|cut(ting)?\s*(my)?self|hurt(ing)?\s*(my)?self)\b/i,
  /\b(overdos(e|ed|ing)|took?\s+too\s+many\s+(pills|tablets|meds))\b/i,
  /\b(going\s+to\s+jump|jump\s+off)\b/i,
  /\b(no\s+reason\s+to\s+live|nothing\s+to\s+live\s+for)\b/i,
  /\b(plan\s+to\s+(die|end))\b/i,
  /\b(goodbye\s*(forever|world|everyone))\b/i,
  /\b(can'?t\s+go\s+on|can'?t\s+take\s+(it|this)\s+any\s*more)\b/i,
  /\b(i'?m\s+going\s+to\s+do\s+it)\b/i,
  /\b(slit\s+(my\s+)?wrist|hang(ing)?\s*(my)?self)\b/i,
];

// ── MED risk keywords (relapse / craving / distress without imminent danger) ──
const MED_RISK_KEYWORDS = [
  'relapse', 'relapsed', 'relapsing',
  'craving', 'cravings',
  'can\'t cope', 'cannot cope',
  'panic attack', 'panicking',
  'using again', 'used again', 'want to use',
  'falling apart', 'breaking down',
  'desperate', 'unbearable',
  'spiraling', 'out of control',
  'give up', 'giving up',
  'drinking again', 'smoking again',
  'tempted', 'temptation',
];

// ── Emotion keyword maps ──
const EMOTION_KEYWORDS = {
  anxiety: [
    'panic', 'panicking', 'anxious', 'anxiety', 'scared', 'shaky',
    'can\'t breathe', 'nervous', 'worried', 'terrified', 'fear',
    'restless', 'on edge', 'heart racing', 'trembling',
  ],
  sadness: [
    'hopeless', 'depressed', 'depression', 'empty', 'crying',
    'tears', 'lonely', 'alone', 'miserable', 'worthless',
    'numb', 'broken', 'grief', 'loss', 'sad', 'devastated',
  ],
  anger: [
    'angry', 'furious', 'rage', 'hate', 'pissed', 'frustrated',
    'irritated', 'enraged', 'livid', 'resentment', 'bitter',
  ],
  hope: [
    'proud', 'improving', 'better', 'progress', 'grateful',
    'clean', 'sober', 'streak', 'milestone', 'accomplished',
    'optimistic', 'hopeful', 'stronger', 'recovered', 'healing',
    'positive', 'motivated', 'moving forward',
  ],
};

// ── Intensity boosters ──
const URGENCY_WORDS = [
  'now', 'right now', 'immediately', 'tonight', 'today',
  'can\'t', 'cannot', 'unbearable', 'desperate', 'please help',
  'emergency', 'urgent',
];

/**
 * Analyze a single patient message using hybrid ML + rule-based approach.
 * @param {string} text — raw message text
 * @returns {{ emotion, intensity, risk, summary, reasons, method }}
 */
async function analyze(text) {
  const lower = text.toLowerCase().trim();
  const reasons = [];
  let method = 'rule-based';

  // ── 1. Rule-based risk assessment (ALWAYS runs — safety gate) ──
  let ruleRisk = 'LOW';

  // HIGH — regex patterns (critical safety net — never skipped)
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(lower)) {
      ruleRisk = 'HIGH';
      reasons.push(`High-risk pattern detected: "${lower.match(pattern)?.[0]}"`);
      break;
    }
  }

  // MED — keyword scan (only if not already HIGH)
  if (ruleRisk !== 'HIGH') {
    for (const kw of MED_RISK_KEYWORDS) {
      if (lower.includes(kw)) {
        ruleRisk = 'MED';
        reasons.push(`Medium-risk keyword: "${kw}"`);
        break;
      }
    }
  }

  // ── 2. ML classification (if models are loaded) ──
  let mlResult = null;
  if (mlService && mlService.isReady()) {
    try {
      mlResult = await mlService.classifyText(text);
      reasons.push(`ML Naive Bayes: risk=${mlResult.risk} (conf ${(mlResult.riskConfidence * 100).toFixed(0)}%), emotion=${mlResult.emotion} (conf ${(mlResult.emotionConfidence * 100).toFixed(0)}%)`);
    } catch (err) {
      reasons.push('ML classification failed — using rule-based only');
    }
  }

  // ── 3. Merge risk: take the HIGHER of rule-based vs ML (safety first) ──
  const RISK_ORDER = { HIGH: 3, MED: 2, LOW: 1 };
  let risk = ruleRisk;

  if (mlResult) {
    const mlRiskLevel = RISK_ORDER[mlResult.risk] || 1;
    const ruleRiskLevel = RISK_ORDER[ruleRisk] || 1;

    if (mlRiskLevel > ruleRiskLevel) {
      risk = mlResult.risk;
      reasons.push(`ML elevated risk from ${ruleRisk} to ${mlResult.risk}`);
    } else if (mlRiskLevel === ruleRiskLevel) {
      // Both agree
      method = 'hybrid-agree';
    }

    if (risk === ruleRisk && mlResult.risk === ruleRisk) {
      method = 'hybrid-agree';
    } else {
      method = 'hybrid-escalated';
    }
  }

  // ── 4. Emotion detection: ML first, rule-based fallback ──
  const emotionScores = { anxiety: 0, sadness: 0, anger: 0, hope: 0, neutral: 0 };

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        emotionScores[emotion] += 1;
      }
    }
  }

  // Rule-based top emotion
  let ruleEmotion = 'neutral';
  let maxScore = 0;
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      ruleEmotion = emotion;
    }
  }

  // Use ML emotion when confident, rule-based otherwise
  let topEmotion;
  if (mlResult && mlResult.emotionConfidence > 0.15) {
    topEmotion = mlResult.emotion;
    if (ruleEmotion !== 'neutral' && ruleEmotion !== mlResult.emotion) {
      reasons.push(`Emotion: ML says "${mlResult.emotion}", rules say "${ruleEmotion}" — using ML (higher confidence)`);
    }
  } else {
    topEmotion = ruleEmotion;
  }

  if (topEmotion !== 'neutral' && !mlResult) {
    reasons.push(`Emotion "${topEmotion}" detected (${maxScore} keyword hits)`);
  }

  // ── 3. Intensity score (0–1) ──
  let intensity = 0;

  // Base from keyword density
  const totalKeywordHits = Object.values(emotionScores).reduce((a, b) => a + b, 0);
  intensity += Math.min(totalKeywordHits * 0.1, 0.3);

  // Urgency words
  let urgencyHits = 0;
  for (const uw of URGENCY_WORDS) {
    if (lower.includes(uw)) urgencyHits++;
  }
  intensity += Math.min(urgencyHits * 0.12, 0.25);

  // Exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  intensity += Math.min(exclamationCount * 0.05, 0.15);

  // CAPS emphasis — ratio of uppercase letters to total
  const alphaChars = text.replace(/[^a-zA-Z]/g, '');
  if (alphaChars.length > 3) {
    const capsRatio = (alphaChars.replace(/[^A-Z]/g, '').length) / alphaChars.length;
    if (capsRatio > 0.5) {
      intensity += 0.15;
      reasons.push('Heavy use of CAPS detected');
    }
  }

  // Risk-based floor
  if (risk === 'HIGH') intensity = Math.max(intensity, 0.8);
  if (risk === 'MED') intensity = Math.max(intensity, 0.4);

  // Clamp
  intensity = Math.round(Math.min(Math.max(intensity, 0.05), 1.0) * 100) / 100;

  // ── 4. Summary ──
  let summary;
  if (risk === 'HIGH') {
    summary = 'Patient expressed high-risk distress requiring immediate attention.';
  } else if (risk === 'MED') {
    summary = `Patient showing signs of ${topEmotion !== 'neutral' ? topEmotion : 'distress'} with moderate risk indicators.`;
  } else if (topEmotion !== 'neutral') {
    summary = `Patient expressed ${topEmotion} with low overall risk.`;
  } else {
    summary = 'Patient sent a general message with no significant risk indicators.';
  }

  if (reasons.length === 0) {
    reasons.push('No significant keywords or patterns detected');
  }

  return {
    emotion: topEmotion,
    intensity,
    risk,
    summary,
    reasons,
    method,
    mlConfidence: mlResult ? mlResult.confidence : null,
  };
}

module.exports = { analyze };
