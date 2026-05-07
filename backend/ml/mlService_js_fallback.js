/**
 * ML Service — Machine Learning Models for Recovery Road
 *
 * Two trained ML models:
 *
 *   1. textClassifier (Naive Bayes)
 *      - Input:  raw text (journal / chat message)
 *      - Output: { risk: HIGH|MED|LOW, emotion: anxiety|sadness|anger|hope|neutral,
 *                  confidence: 0–1 }
 *
 *   2. riskClassifier (Logistic Regression)
 *      - Input:  numeric feature vector (cravings, mood, triggers, etc.)
 *      - Output: { riskLevel: HIGH|MED|LOW, confidence: 0–1 }
 *
 * Models are trained once (via trainAll()) and persisted as JSON in backend/ml/models/.
 * On server start, loadModels() loads them from disk for instant predictions.
 *
 * Uses the `natural` npm package (pure JS, no native dependencies).
 */

const natural = require('natural');
const path = require('path');
const fs = require('fs');
const { textTrainingData, riskTrainingData } = require('./trainingData');

const MODELS_DIR = path.join(__dirname, 'models');

// ── Model instances (loaded at startup) ──
let riskTextClassifier = null;   // Naive Bayes — classifies text → risk level
let emotionTextClassifier = null; // Naive Bayes — classifies text → emotion
let riskFeatureClassifier = null; // Logistic Regression — numeric features → risk level

// Track training metadata
let modelMeta = {
  textClassifier: { trained: false, trainedAt: null, samplesUsed: 0, accuracy: null },
  emotionClassifier: { trained: false, trainedAt: null, samplesUsed: 0, accuracy: null },
  riskClassifier: { trained: false, trainedAt: null, samplesUsed: 0, accuracy: null },
};

// ══════════════════════════════════════════════════════════════════════════════
//  TRAINING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Train all models and save to disk.
 * Call this once (e.g. via `node ml/trainModels.js`) or on first startup.
 */
async function trainAll() {
  console.log('🤖 ML Training started...');

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  // ── 1. Text → Risk classifier (Naive Bayes) ──
  console.log('  ▸ Training text risk classifier (Naive Bayes)...');
  riskTextClassifier = new natural.BayesClassifier();
  for (const sample of textTrainingData) {
    riskTextClassifier.addDocument(sample.text, sample.risk);
  }
  riskTextClassifier.train();

  // Cross-validation accuracy
  let riskCorrect = 0;
  for (const sample of textTrainingData) {
    if (riskTextClassifier.classify(sample.text) === sample.risk) riskCorrect++;
  }
  const riskAccuracy = +(riskCorrect / textTrainingData.length * 100).toFixed(1);
  console.log(`    ✓ Text risk classifier trained — accuracy: ${riskAccuracy}% (${textTrainingData.length} samples)`);

  // Save
  const riskTextPath = path.join(MODELS_DIR, 'textRiskClassifier.json');
  await saveClassifier(riskTextClassifier, riskTextPath);

  modelMeta.textClassifier = {
    trained: true,
    trainedAt: new Date().toISOString(),
    samplesUsed: textTrainingData.length,
    accuracy: riskAccuracy,
  };

  // ── 2. Text → Emotion classifier (Naive Bayes) ──
  console.log('  ▸ Training text emotion classifier (Naive Bayes)...');
  emotionTextClassifier = new natural.BayesClassifier();
  for (const sample of textTrainingData) {
    emotionTextClassifier.addDocument(sample.text, sample.emotion);
  }
  emotionTextClassifier.train();

  let emCorrect = 0;
  for (const sample of textTrainingData) {
    if (emotionTextClassifier.classify(sample.text) === sample.emotion) emCorrect++;
  }
  const emAccuracy = +(emCorrect / textTrainingData.length * 100).toFixed(1);
  console.log(`    ✓ Emotion classifier trained — accuracy: ${emAccuracy}% (${textTrainingData.length} samples)`);

  const emPath = path.join(MODELS_DIR, 'emotionClassifier.json');
  await saveClassifier(emotionTextClassifier, emPath);

  modelMeta.emotionClassifier = {
    trained: true,
    trainedAt: new Date().toISOString(),
    samplesUsed: textTrainingData.length,
    accuracy: emAccuracy,
  };

  // ── 3. Risk feature classifier (Logistic Regression) ──
  console.log('  ▸ Training risk feature classifier (Logistic Regression)...');
  riskFeatureClassifier = new natural.LogisticRegressionClassifier();

  for (const sample of riskTrainingData) {
    // Convert feature object to a consistent text representation for natural's classifier
    // natural's LR works on text internally; we encode numerics as repeated tokens
    const featureString = featuresToTokens(sample.features);
    riskFeatureClassifier.addDocument(featureString, sample.label);
  }
  riskFeatureClassifier.train();

  let riskFeatCorrect = 0;
  for (const sample of riskTrainingData) {
    const featureString = featuresToTokens(sample.features);
    if (riskFeatureClassifier.classify(featureString) === sample.label) riskFeatCorrect++;
  }
  const riskFeatAccuracy = +(riskFeatCorrect / riskTrainingData.length * 100).toFixed(1);
  console.log(`    ✓ Risk feature classifier trained — accuracy: ${riskFeatAccuracy}% (${riskTrainingData.length} samples)`);

  const riskFeatPath = path.join(MODELS_DIR, 'riskFeatureClassifier.json');
  await saveClassifier(riskFeatureClassifier, riskFeatPath);

  modelMeta.riskClassifier = {
    trained: true,
    trainedAt: new Date().toISOString(),
    samplesUsed: riskTrainingData.length,
    accuracy: riskFeatAccuracy,
  };

  // Save meta
  fs.writeFileSync(path.join(MODELS_DIR, 'modelMeta.json'), JSON.stringify(modelMeta, null, 2));
  console.log('🤖 ML Training complete! Models saved to backend/ml/models/');

  return modelMeta;
}

/**
 * Convert a numeric feature object into token strings for the text-based classifier.
 * We discretize each feature into 5 bins (very_low/low/medium/high/very_high)
 * and repeat high-signal tokens to increase their weight in the bag-of-words model.
 */
function featuresToTokens(features) {
  const tokens = [];

  const addBinned = (name, value) => {
    // 5-level binning for better discrimination
    let level;
    if (value <= 0.15) level = 'verylow';
    else if (value <= 0.35) level = 'low';
    else if (value <= 0.55) level = 'medium';
    else if (value <= 0.75) level = 'high';
    else level = 'veryhigh';

    const token = `${name}_${level}`;
    // Repeat proportional to importance
    const repeats = level === 'veryhigh' ? 4 : level === 'high' ? 3 : level === 'medium' ? 2 : 1;
    for (let i = 0; i < repeats; i++) tokens.push(token);
  };

  addBinned('cravingavg', features.avgCraving);
  addBinned('cravingmax', features.maxCraving);
  addBinned('mood', 1 - features.avgMood); // invert: low mood = high risk signal
  addBinned('mooddecline', features.moodDecline);
  addBinned('triggers', features.triggers);
  addBinned('activity', 1 - features.activity); // invert: low activity = high risk signal
  addBinned('missedcheckins', features.missed);
  addBinned('relapses', features.relapses);

  // Add compound signals for clearer separation
  const dangerScore = (features.avgCraving + features.moodDecline + features.missed + features.relapses) / 4;
  const protectScore = (features.avgMood + features.activity) / 2;

  if (dangerScore > 0.65) {
    tokens.push('danger_composite_high', 'danger_composite_high', 'danger_composite_high');
  } else if (dangerScore > 0.4) {
    tokens.push('danger_composite_medium', 'danger_composite_medium');
  } else {
    tokens.push('danger_composite_low');
  }

  if (protectScore > 0.6) {
    tokens.push('protection_composite_high', 'protection_composite_high', 'protection_composite_high');
  } else if (protectScore > 0.35) {
    tokens.push('protection_composite_medium', 'protection_composite_medium');
  } else {
    tokens.push('protection_composite_low');
  }

  return tokens.join(' ');
}


// ══════════════════════════════════════════════════════════════════════════════
//  LOADING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Load pre-trained models from disk. Called at server startup.
 * If models don't exist yet, trains them automatically.
 */
async function loadModels() {
  const metaPath = path.join(MODELS_DIR, 'modelMeta.json');

  if (!fs.existsSync(metaPath)) {
    console.log('🤖 No trained models found — training now...');
    await trainAll();
    return;
  }

  try {
    modelMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

    // Load text risk classifier
    const riskTextPath = path.join(MODELS_DIR, 'textRiskClassifier.json');
    if (fs.existsSync(riskTextPath)) {
      riskTextClassifier = await loadClassifier(riskTextPath);
      console.log('  ✓ Text risk classifier loaded');
    }

    // Load emotion classifier
    const emPath = path.join(MODELS_DIR, 'emotionClassifier.json');
    if (fs.existsSync(emPath)) {
      emotionTextClassifier = await loadClassifier(emPath);
      console.log('  ✓ Emotion classifier loaded');
    }

    // Load risk feature classifier
    const riskFeatPath = path.join(MODELS_DIR, 'riskFeatureClassifier.json');
    if (fs.existsSync(riskFeatPath)) {
      riskFeatureClassifier = await loadClassifier(riskFeatPath);
      console.log('  ✓ Risk feature classifier loaded');
    }

    console.log('🤖 ML models loaded from disk');
  } catch (err) {
    console.error('Error loading ML models, retraining:', err.message);
    await trainAll();
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  PREDICTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Classify text for risk level and emotion.
 * Falls back to rule-based analyzerService if models aren't loaded.
 *
 * @param {string} text
 * @returns {{ risk: string, emotion: string, confidence: number, method: string }}
 */
function classifyText(text) {
  if (!riskTextClassifier || !emotionTextClassifier) {
    return { risk: 'LOW', emotion: 'neutral', confidence: 0, method: 'fallback' };
  }

  const risk = riskTextClassifier.classify(text);
  const emotion = emotionTextClassifier.classify(text);

  // Get confidence from classifications
  const riskClassifications = riskTextClassifier.getClassifications(text);
  const topRisk = riskClassifications[0];
  const totalRiskScore = riskClassifications.reduce((sum, c) => sum + Math.exp(c.value), 0);
  const riskConfidence = totalRiskScore > 0 ? +(Math.exp(topRisk.value) / totalRiskScore).toFixed(3) : 0;

  const emotionClassifications = emotionTextClassifier.getClassifications(text);
  const topEmotion = emotionClassifications[0];
  const totalEmScore = emotionClassifications.reduce((sum, c) => sum + Math.exp(c.value), 0);
  const emotionConfidence = totalEmScore > 0 ? +(Math.exp(topEmotion.value) / totalEmScore).toFixed(3) : 0;

  return {
    risk,
    emotion,
    riskConfidence,
    emotionConfidence,
    confidence: +((riskConfidence + emotionConfidence) / 2).toFixed(3),
    method: 'ml-naive-bayes',
  };
}

/**
 * Predict relapse risk level from numeric patient features.
 *
 * @param {object} rawFeatures — { avgCraving, maxCraving, avgMood, moodDecline, triggers, activity, missed, relapses }
 *                                Values should be normalized 0–1.
 * @returns {{ riskLevel: string, confidence: number, method: string, classifications: object[] }}
 */
function predictRisk(rawFeatures) {
  if (!riskFeatureClassifier) {
    return { riskLevel: 'LOW', confidence: 0, method: 'fallback', classifications: [] };
  }

  const featureString = featuresToTokens(rawFeatures);
  const riskLevel = riskFeatureClassifier.classify(featureString);

  const classifications = riskFeatureClassifier.getClassifications(featureString);
  const top = classifications[0];
  const totalScore = classifications.reduce((sum, c) => sum + Math.exp(c.value), 0);
  const confidence = totalScore > 0 ? +(Math.exp(top.value) / totalScore).toFixed(3) : 0;

  return {
    riskLevel,
    confidence,
    method: 'ml-logistic-regression',
    classifications: classifications.map(c => ({
      label: c.label,
      probability: +(Math.exp(c.value) / totalScore).toFixed(3),
    })),
  };
}

/**
 * Get model metadata (training accuracy, sample count, timestamps).
 */
function getModelMeta() {
  return { ...modelMeta, modelsLoaded: isReady() };
}

/**
 * Check if models are loaded and ready for predictions.
 */
function isReady() {
  return !!(riskTextClassifier && emotionTextClassifier && riskFeatureClassifier);
}


// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function saveClassifier(classifier, filePath) {
  return new Promise((resolve, reject) => {
    classifier.save(filePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function loadClassifier(filePath) {
  return new Promise((resolve, reject) => {
    natural.BayesClassifier.load(filePath, null, (err, classifier) => {
      if (err) {
        // Try as LogisticRegressionClassifier
        natural.LogisticRegressionClassifier.load(filePath, null, (err2, classifier2) => {
          if (err2) reject(err2);
          else resolve(classifier2);
        });
      } else {
        resolve(classifier);
      }
    });
  });
}

module.exports = {
  trainAll,
  loadModels,
  classifyText,
  predictRisk,
  getModelMeta,
  isReady,
  featuresToTokens,
};
