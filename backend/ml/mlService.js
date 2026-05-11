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
const https = require('https');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';
let _pythonServiceReady = false;
let _modelMeta = {};

// JS fallback models (loaded from natural.js if Python is down)
let _jsFallback = null;

// ══════════════════════════════════════════════════════════════════════════════
//  HTTP CLIENT HELPER
// ══════════════════════════════════════════════════════════════════════════════

function callPythonService(path, method = 'GET', body = null, redirectsLeft = 2) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ML_SERVICE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = url.port ? Number(url.port) : (isHttps ? 443 : 80);
    const reqBody = body ? JSON.stringify(body) : null;
    const requestPath = `${url.pathname}${url.search || ''}`;

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (reqBody) headers['Content-Length'] = Buffer.byteLength(reqBody);

    const options = {
      hostname: url.hostname,
      port,
      path: requestPath,
      method,
      headers,
      timeout: 5000,
    };

    const req = lib.request(options, (res) => {
      const sc = res.statusCode || 0;
      const loc = res.headers?.location;
      if ([301, 302, 307, 308].includes(sc) && loc && redirectsLeft > 0) {
        res.resume();
        return resolve(callPythonService(new URL(loc, url).toString(), method, body, redirectsLeft - 1));
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (!data) return resolve({});

        try {
          resolve(JSON.parse(data));
        } catch {
          const snippet = String(data).slice(0, 200);
          reject(new Error(`Invalid JSON from ML service (HTTP ${sc}): ${snippet}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML service timeout'));
    });

    if (reqBody) req.write(reqBody);
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
  // Detect if we're connecting to a remote service (Render) or local.
  // Local: Python is auto-started, should be ready in <30s → fewer, shorter retries.
  // Remote (Render): cold-start takes 60-120s → more, longer retries.
  const isRemote = (() => {
    try {
      const u = new URL(ML_SERVICE_URL);
      return u.hostname !== '127.0.0.1' && u.hostname !== 'localhost';
    } catch { return false; }
  })();

  const maxAttempts = isRemote ? 12 : 6;
  const retryDelayMs = isRemote ? 10000 : 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt) {
        console.log(`  ⚠ Python ML service not available after ${maxAttempts} attempts (${err.message})`);
      } else {
        console.log(`  ⏳ ML service not ready (attempt ${attempt}/${maxAttempts}): ${err.message} — retrying in ${retryDelayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
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
