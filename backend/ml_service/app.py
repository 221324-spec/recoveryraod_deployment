"""
Recovery Road — Python ML Microservice
========================================
Flask REST API serving scikit-learn ML predictions.

Endpoints:
  POST /api/ml/classify-text     — classify text → risk + emotion
  POST /api/ml/predict-risk      — numeric features → risk level
  GET  /api/ml/health            — health check + model status
  GET  /api/ml/models            — model metadata
  POST /api/ml/retrain           — retrain all models

Runs on port 5001, called by Node.js backend via HTTP.
"""

import os
import sys

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ModuleNotFoundError as e:
    print(f"Missing Python dependency: {e.name}")
    print("Install dependencies with: python -m pip install -r requirements.txt")
    sys.exit(1)

# Windows 32-bit Python often cannot install scikit-learn / scipy wheels cleanly.
if sys.maxsize <= 2**32:
    print("WARNING: 32-bit Python detected. Use 64-bit Python for the ML service if installation fails.")

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from ml_models import (
    load_models, train_all, classify_text,
    predict_risk, get_model_meta, is_ready
)

app = Flask(__name__)
CORS(app)


# ══════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════════

@app.route('/api/ml/health', methods=['GET'])
def health():
    """Health check — is the ML service running and models loaded?"""
    return jsonify({
        'status': 'ok',
        'service': 'recovery-road-ml',
        'modelsLoaded': is_ready(),
        'framework': 'scikit-learn',
        'language': 'python',
    })


@app.route('/api/ml/models', methods=['GET'])
def models_info():
    """Return model metadata — accuracy, algorithms, training info."""
    return jsonify({
        'success': True,
        'models': get_model_meta(),
    })


@app.route('/api/ml/classify-text', methods=['POST'])
def classify_text_endpoint():
    """
    Classify patient text for risk level and emotion.

    Body: { "text": "I'm feeling really bad today..." }
    Returns: { risk, emotion, riskConfidence, emotionConfidence, method, ... }
    """
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'success': False, 'error': 'Missing "text" field'}), 400

    text = data['text'].strip()
    if not text:
        return jsonify({'success': False, 'error': 'Empty text'}), 400

    result = classify_text(text)
    return jsonify({'success': True, **result})


@app.route('/api/ml/predict-risk', methods=['POST'])
def predict_risk_endpoint():
    """
    Predict relapse risk from numeric patient features.

    Body: { "features": { "avgCraving": 0.8, "maxCraving": 0.9, ... } }
    Returns: { riskLevel, confidence, method, probabilities }
    """
    data = request.get_json()
    if not data or 'features' not in data:
        return jsonify({'success': False, 'error': 'Missing "features" field'}), 400

    features = data['features']
    required = ['avgCraving', 'maxCraving', 'avgMood', 'moodDecline',
                'triggers', 'activity', 'missed', 'relapses']

    for key in required:
        if key not in features:
            return jsonify({'success': False, 'error': f'Missing feature: {key}'}), 400

    result = predict_risk(features)
    return jsonify({'success': True, **result})


@app.route('/api/ml/retrain', methods=['POST'])
def retrain_endpoint():
    """Retrain all models with current training data."""
    try:
        meta = train_all()
        return jsonify({'success': True, 'message': 'Models retrained successfully', 'models': meta})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════
#  STARTUP
# ══════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("=" * 60)
    print("  Recovery Road — Python ML Service")
    print("=" * 60)

    # Load (or train) models at startup
    load_models()

    if is_ready():
        meta = get_model_meta()
        print(f"\n🤖 Models ready:")
        if 'textRiskClassifier' in meta:
            print(f"   Text Risk   : {meta['textRiskClassifier']['algorithm']} — {meta['textRiskClassifier']['accuracy']}% acc")
        if 'emotionClassifier' in meta:
            print(f"   Emotion     : {meta['emotionClassifier']['algorithm']} — {meta['emotionClassifier']['accuracy']}% acc")
        if 'riskFeatureClassifier' in meta:
            print(f"   Risk Feature: {meta['riskFeatureClassifier']['algorithm']} — {meta['riskFeatureClassifier']['accuracy']}% acc")
    else:
        print("⚠ Warning: Models could not be loaded!")

    port = int(os.environ.get('ML_PORT', 5001))
    print(f"\n🚀 ML Service running on http://localhost:{port}")
    print(f"📡 Endpoints: /api/ml/health, /api/ml/classify-text, /api/ml/predict-risk")

    app.run(host='0.0.0.0', port=port, debug=False)
