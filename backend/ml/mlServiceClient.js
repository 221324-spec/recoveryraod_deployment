/**
 * ML Service — Python ML Microservice Client
 * =============================================
 *
 * Thin HTTP client that calls the Python scikit-learn ML service (port 5001).
 *
 * The Python service runs:
 *   1. Text Risk Classifier   (TF-IDF + Random Forest)      → HIGH/MED/LOW
 *   2. Emotion Classifier     (TF-IDF + SVM, RBF kernel)    → anxiety/sadness/anger/hope/neutral
 *   3. Risk Feature Predictor (Gradient Boosting Classifier) → HIGH/MED/LOW
 *
 * If the Python service is unavailable, falls back to the JS-based `natural`
 * classifiers (Naive Bayes / Logistic Regression) as a safety net.
 *
 * Architecture:
 *   [Node.js Backend :5000]  →  HTTP  →  [Python ML Service :5001]
 */

const http = require('http');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';
let _pythonServiceReady = false;
let _modelMeta = {};

// JS fallback models (loaded from natural.js if Python is down)
let _jsFallback = null;

// ══════════════════════════════════════════════════════════════════════════════
//  HTTP CLIENT HELPER
// ══════════════════════════════════════════════════════════════════════════════

function callPythonService(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ML_SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON from ML service: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('ML service timeout')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}


// ══════════════════════════════════════════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check if Python ML service is running and load model metadata.
 * Falls back to JS models if Python service is unavailable.
 */
async function loadModels() {
  try {
    const health = await callPythonService('/api/ml/health');
    if (health.status === 'ok' && health.modelsLoaded) {
      _pythonServiceReady = true;

      const modelsResp = await callPythonService('/api/ml/models');
      if (modelsResp.success) {
        _modelMeta = modelsResp.models;
      }

      console.log('  ✓ Python ML service connected (scikit-learn)');
      return;
    }
  } catch (err) {
    console.log(`  ⚠ Python ML service not available (${err.message})`);
  }

  // Fallback: try loading JS natural models
  try {
    _jsFallback = require('./mlService_js_fallback');
    await _jsFallback.loadModels();
    if (_jsFallback.isReady()) {
      _modelMeta = _jsFallback.getModelMeta();
      console.log('  ✓ JS fallback models loaded (natural.js)');
    }
  } catch (err) {
    console.log(`  ⚠ JS fallback models also unavailable: ${err.message}`);
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  PREDICTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Classify text for risk level and emotion.
 *
 * @param {string} text — patient message / journal entry
 * @returns {{ risk, emotion, riskConfidence, emotionConfidence, confidence, method }}
 */
async function classifyText(text) {
  // Try Python service first
  if (_pythonServiceReady) {
    try {
      const result = await callPythonService('/api/ml/classify-text', 'POST', { text });
      if (result.success) {
        return result;
      }
    } catch (err) {
      console.warn('Python ML classify-text failed:', err.message);
    }
  }

  // Fallback to JS models
  if (_jsFallback && _jsFallback.isReady()) {
    return _jsFallback.classifyText(text);
  }

  // No ML available
  return { risk: 'LOW', emotion: 'neutral', confidence: 0, method: 'fallback' };
}


/**
 * Predict risk level from numeric patient features.
 *
 * @param {object} features — { avgCraving, maxCraving, avgMood, moodDecline, triggers, activity, missed, relapses }
 * @returns {{ riskLevel, confidence, method, probabilities }}
 */
async function predictRisk(features) {
  // Try Python service first
  if (_pythonServiceReady) {
    try {
      const result = await callPythonService('/api/ml/predict-risk', 'POST', { features });
      if (result.success) {
        return result;
      }
    } catch (err) {
      console.warn('Python ML predict-risk failed:', err.message);
    }
  }

  // Fallback to JS models
  if (_jsFallback && _jsFallback.isReady()) {
    return _jsFallback.predictRisk(features);
  }

  return { riskLevel: 'LOW', confidence: 0, method: 'fallback', probabilities: {} };
}


/**
 * Get model metadata.
 */
function getModelMeta() {
  return { ..._modelMeta, modelsLoaded: isReady() };
}

/**
 * Check if ML models are ready (Python or JS fallback).
 */
function isReady() {
  return _pythonServiceReady || (_jsFallback && _jsFallback.isReady());
}

/**
 * Check if specifically the Python service is active.
 */
function isPythonActive() {
  return _pythonServiceReady;
}


module.exports = {
  loadModels,
  classifyText,
  predictRisk,
  getModelMeta,
  isReady,
  isPythonActive,
};
