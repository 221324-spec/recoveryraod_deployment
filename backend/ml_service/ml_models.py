"""
ML Models for Recovery Road
============================
Trains and manages scikit-learn models:

1. Text Risk Classifier   — TF-IDF + Random Forest → HIGH/MED/LOW
2. Emotion Classifier     — TF-IDF + SVM → anxiety/sadness/anger/hope/neutral
3. Risk Feature Predictor — Random Forest on numeric features → HIGH/MED/LOW

Models are persisted via joblib for fast loading at server startup.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from training_data import get_text_dataframe, get_risk_dataframe

# ── Paths ──
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

TEXT_RISK_MODEL_PATH = os.path.join(MODELS_DIR, 'text_risk_classifier.joblib')
EMOTION_MODEL_PATH = os.path.join(MODELS_DIR, 'emotion_classifier.joblib')
RISK_FEATURE_MODEL_PATH = os.path.join(MODELS_DIR, 'risk_feature_classifier.joblib')
META_PATH = os.path.join(MODELS_DIR, 'model_meta.json')

# ── Loaded models (in memory) ──
_text_risk_model = None
_emotion_model = None
_risk_feature_model = None
_model_meta = {}


# ══════════════════════════════════════════════════════════════════════
#  TRAINING
# ══════════════════════════════════════════════════════════════════════

def train_all():
    """Train all 3 models, evaluate with cross-validation, and save to disk."""
    global _text_risk_model, _emotion_model, _risk_feature_model, _model_meta

    print("=" * 60)
    print("  Recovery Road — Python ML Model Training (scikit-learn)")
    print("=" * 60)

    text_df = get_text_dataframe()
    risk_df = get_risk_dataframe()

    # ── 1. Text Risk Classifier (TF-IDF + Random Forest) ──
    print("\n▸ Training Text Risk Classifier (TF-IDF + Random Forest)...")
    _text_risk_model = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=1
        )),
        ('clf', RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=2,
            min_samples_leaf=1,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])

    X_text = text_df['text'].values
    y_risk = text_df['risk'].values

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    risk_cv_scores = cross_val_score(_text_risk_model, X_text, y_risk, cv=cv, scoring='accuracy')
    print(f"  Cross-validation accuracy: {risk_cv_scores.mean():.1%} (+/-{risk_cv_scores.std():.1%})")

    # Train on full data
    _text_risk_model.fit(X_text, y_risk)
    risk_train_acc = accuracy_score(y_risk, _text_risk_model.predict(X_text))
    print(f"  Training accuracy: {risk_train_acc:.1%} ({len(X_text)} samples)")

    joblib.dump(_text_risk_model, TEXT_RISK_MODEL_PATH)
    print(f"  [OK] Saved to {TEXT_RISK_MODEL_PATH}")

    # ── 2. Emotion Classifier (TF-IDF + SVM) ──
    print("\n[INFO] Training Emotion Classifier (TF-IDF + SVM)...")
    _emotion_model = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=1
        )),
        ('clf', SVC(
            kernel='rbf',
            C=10,
            gamma='scale',
            class_weight='balanced',
            probability=True,
            random_state=42
        ))
    ])

    y_emotion = text_df['emotion'].values

    emotion_cv_scores = cross_val_score(_emotion_model, X_text, y_emotion, cv=cv, scoring='accuracy')
    print(f"  Cross-validation accuracy: {emotion_cv_scores.mean():.1%} (+/-{emotion_cv_scores.std():.1%})")

    _emotion_model.fit(X_text, y_emotion)
    emotion_train_acc = accuracy_score(y_emotion, _emotion_model.predict(X_text))
    print(f"  Training accuracy: {emotion_train_acc:.1%} ({len(X_text)} samples)")

    joblib.dump(_emotion_model, EMOTION_MODEL_PATH)
    print(f"  [OK] Saved to {EMOTION_MODEL_PATH}")

    # ── 3. Risk Feature Classifier (Random Forest on numeric features) ──
    print("\n[INFO] Training Risk Feature Classifier (Gradient Boosting)...")
    feature_cols = ['avgCraving', 'maxCraving', 'avgMood', 'moodDecline',
                    'triggers', 'activity', 'missed', 'relapses']

    X_features = risk_df[feature_cols].values
    y_risk_feat = risk_df['label'].values

    _risk_feature_model = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            min_samples_split=3,
            min_samples_leaf=2,
            random_state=42
        ))
    ])

    risk_feat_cv_scores = cross_val_score(_risk_feature_model, X_features, y_risk_feat, cv=cv, scoring='accuracy')
    print(f"  Cross-validation accuracy: {risk_feat_cv_scores.mean():.1%} (+/-{risk_feat_cv_scores.std():.1%})")

    _risk_feature_model.fit(X_features, y_risk_feat)
    risk_feat_train_acc = accuracy_score(y_risk_feat, _risk_feature_model.predict(X_features))
    print(f"  Training accuracy: {risk_feat_train_acc:.1%} ({len(X_features)} samples)")

    joblib.dump(_risk_feature_model, RISK_FEATURE_MODEL_PATH)
    print(f"  [OK] Saved to {RISK_FEATURE_MODEL_PATH}")

    # ── Save metadata ──
    _model_meta = {
        'textRiskClassifier': {
            'algorithm': 'TF-IDF + Random Forest',
            'trained': True,
            'trainedAt': datetime.utcnow().isoformat(),
            'samplesUsed': int(len(X_text)),
            'accuracy': round(risk_train_acc * 100, 1),
            'cvAccuracy': round(risk_cv_scores.mean() * 100, 1),
            'cvStd': round(risk_cv_scores.std() * 100, 1),
        },
        'emotionClassifier': {
            'algorithm': 'TF-IDF + SVM (RBF kernel)',
            'trained': True,
            'trainedAt': datetime.utcnow().isoformat(),
            'samplesUsed': int(len(X_text)),
            'accuracy': round(emotion_train_acc * 100, 1),
            'cvAccuracy': round(emotion_cv_scores.mean() * 100, 1),
            'cvStd': round(emotion_cv_scores.std() * 100, 1),
        },
        'riskFeatureClassifier': {
            'algorithm': 'Gradient Boosting Classifier',
            'trained': True,
            'trainedAt': datetime.utcnow().isoformat(),
            'samplesUsed': int(len(X_features)),
            'accuracy': round(risk_feat_train_acc * 100, 1),
            'cvAccuracy': round(risk_feat_cv_scores.mean() * 100, 1),
            'cvStd': round(risk_feat_cv_scores.std() * 100, 1),
        },
        'framework': 'scikit-learn',
        'pythonVersion': f'{__import__("sys").version}',
    }

    with open(META_PATH, 'w') as f:
        json.dump(_model_meta, f, indent=2)

    print(f"\n{'=' * 60}")
    print("  Training Summary")
    print(f"{'=' * 60}")
    print(f"  Text Risk Classifier    : {_model_meta['textRiskClassifier']['accuracy']}% train / {_model_meta['textRiskClassifier']['cvAccuracy']}% CV ({len(X_text)} samples)")
    print(f"  Emotion Classifier      : {_model_meta['emotionClassifier']['accuracy']}% train / {_model_meta['emotionClassifier']['cvAccuracy']}% CV ({len(X_text)} samples)")
    print(f"  Risk Feature Classifier : {_model_meta['riskFeatureClassifier']['accuracy']}% train / {_model_meta['riskFeatureClassifier']['cvAccuracy']}% CV ({len(X_features)} samples)")
    print(f"  Framework               : scikit-learn")
    print(f"{'=' * 60}")

    return _model_meta


# ══════════════════════════════════════════════════════════════════════
#  MODEL LOADING
# ══════════════════════════════════════════════════════════════════════

def load_models():
    """Load pre-trained models from disk. Train if not found."""
    global _text_risk_model, _emotion_model, _risk_feature_model, _model_meta

    if not all(os.path.exists(p) for p in [TEXT_RISK_MODEL_PATH, EMOTION_MODEL_PATH, RISK_FEATURE_MODEL_PATH]):
        print("[WARN] Models not found on disk — training now...")
        train_all()
        return

    _text_risk_model = joblib.load(TEXT_RISK_MODEL_PATH)
    _emotion_model = joblib.load(EMOTION_MODEL_PATH)
    _risk_feature_model = joblib.load(RISK_FEATURE_MODEL_PATH)

    if os.path.exists(META_PATH):
        with open(META_PATH, 'r') as f:
            _model_meta = json.load(f)

    print("  [OK] All ML models loaded from disk")


def is_ready():
    """Check if models are loaded and ready."""
    return all([_text_risk_model, _emotion_model, _risk_feature_model])


def get_model_meta():
    """Return model metadata."""
    return {**_model_meta, 'modelsLoaded': is_ready()}


# ══════════════════════════════════════════════════════════════════════
#  PREDICTION
# ══════════════════════════════════════════════════════════════════════

def classify_text(text):
    """
    Classify text for risk level and emotion.

    Returns: {risk, emotion, riskConfidence, emotionConfidence, method}
    """
    if not _text_risk_model or not _emotion_model:
        return {'risk': 'LOW', 'emotion': 'neutral', 'riskConfidence': 0, 'emotionConfidence': 0, 'method': 'fallback'}

    # Risk prediction
    risk = _text_risk_model.predict([text])[0]
    risk_proba = _text_risk_model.predict_proba([text])[0]
    risk_classes = _text_risk_model.classes_
    risk_confidence = float(max(risk_proba))

    # Emotion prediction
    emotion = _emotion_model.predict([text])[0]
    emotion_proba = _emotion_model.predict_proba([text])[0]
    emotion_classes = _emotion_model.classes_
    emotion_confidence = float(max(emotion_proba))

    return {
        'risk': risk,
        'emotion': emotion,
        'riskConfidence': round(risk_confidence, 3),
        'emotionConfidence': round(emotion_confidence, 3),
        'confidence': round((risk_confidence + emotion_confidence) / 2, 3),
        'method': 'python-scikit-learn',
        'riskProbabilities': {cls: round(float(p), 3) for cls, p in zip(risk_classes, risk_proba)},
        'emotionProbabilities': {cls: round(float(p), 3) for cls, p in zip(emotion_classes, emotion_proba)},
    }


def predict_risk(features):
    """
    Predict risk level from numeric patient features.

    Args:
        features: dict with keys avgCraving, maxCraving, avgMood, moodDecline,
                  triggers, activity, missed, relapses (all 0-1)

    Returns: {riskLevel, confidence, method, probabilities}
    """
    if not _risk_feature_model:
        return {'riskLevel': 'LOW', 'confidence': 0, 'method': 'fallback', 'probabilities': {}}

    feature_order = ['avgCraving', 'maxCraving', 'avgMood', 'moodDecline',
                     'triggers', 'activity', 'missed', 'relapses']

    X = np.array([[features.get(f, 0) for f in feature_order]])

    risk_level = _risk_feature_model.predict(X)[0]
    proba = _risk_feature_model.predict_proba(X)[0]
    classes = _risk_feature_model.classes_
    confidence = float(max(proba))

    return {
        'riskLevel': risk_level,
        'confidence': round(confidence, 3),
        'method': 'python-gradient-boosting',
        'probabilities': {cls: round(float(p), 3) for cls, p in zip(classes, proba)},
    }


# ══════════════════════════════════════════════════════════════════════
#  STANDALONE TRAINING
# ══════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    meta = train_all()

    print("\n🧪 Quick Test Predictions:")
    print("-" * 40)

    tests = [
        "I want to kill myself I can't take this anymore",
        "cravings are really strong today I want to use",
        "had a great day 90 days sober feeling proud",
        "I'm so anxious and scared I can't breathe",
    ]

    for t in tests:
        result = classify_text(t)
        print(f"\n  Text: \"{t}\"")
        print(f"  → risk={result['risk']} ({result['riskConfidence']:.0%}), emotion={result['emotion']} ({result['emotionConfidence']:.0%})")

    print("\n  Risk features (high risk profile):")
    high_risk = predict_risk({
        'avgCraving': 0.9, 'maxCraving': 1.0, 'avgMood': 0.1,
        'moodDecline': 0.8, 'triggers': 0.9, 'activity': 0.0,
        'missed': 1.0, 'relapses': 0.8
    })
    print(f"  → {high_risk['riskLevel']} ({high_risk['confidence']:.0%}) — {high_risk['probabilities']}")

    print("\n  Risk features (low risk profile):")
    low_risk = predict_risk({
        'avgCraving': 0.1, 'maxCraving': 0.2, 'avgMood': 0.8,
        'moodDecline': 0.1, 'triggers': 0.1, 'activity': 0.9,
        'missed': 0.0, 'relapses': 0.0
    })
    print(f"  → {low_risk['riskLevel']} ({low_risk['confidence']:.0%}) — {low_risk['probabilities']}")

    print("\n✅ All models trained and tested successfully!")
