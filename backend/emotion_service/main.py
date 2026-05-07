"""
Module V — AI Emotion Detection Microservice
FastAPI service using DeepFace for facial emotion recognition.
Runs on port 8001.
"""
import io
import traceback
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RecoveryRoad Emotion Detection", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Emotion mapping: DeepFace classes -> our 4 labels
EMOTION_MAP = {
    "happy": "happy",
    "neutral": "neutral",
    "sad": "sad",
    "sadness": "sad",
    "fear": "anxious",
    "angry": "anxious",
    "disgust": "anxious",
    "surprise": "neutral",
}

# Weighted scoring: use ALL emotion scores to pick the best mapped label
# rather than relying solely on DeepFace's dominant_emotion
LABEL_WEIGHTS = {
    "happy":   {"happy": 1.0},
    "sad":     {"sad": 1.0, "sadness": 1.0},
    "anxious": {"fear": 1.0, "angry": 0.8, "disgust": 0.6},
    "neutral": {"neutral": 1.0, "surprise": 0.5},
}

MODEL_VERSION = "deepface-v2"

# Eagerly load DeepFace on startup so first request doesn't timeout
print("⏳ Loading DeepFace model (first time may download ~100MB)...")
from deepface import DeepFace as _deepface
try:
    dummy = np.zeros((224, 224, 3), dtype=np.uint8)
    _deepface.analyze(dummy, actions=["emotion"], enforce_detection=False, silent=True)
    print("✅ DeepFace emotion model loaded and warmed up")
except Exception as e:
    print(f"⚠️ DeepFace warmup note: {e} (model will load on first request)")

def get_deepface():
    return _deepface


def get_image_sharpness(img):
    """Compute image sharpness score using Laplacian variance."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalize to 0-1 range (typical range: 100-1000 for sharp images)
    sharpness = min(1.0, laplacian_var / 500.0)
    return float(sharpness)


def get_face_size_ratio(img, face_cascade):
    """Estimate what % of image is covered by detected face."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0:
        return 0.0
    largest_face = max(faces, key=lambda f: f[2] * f[3])
    face_area = largest_face[2] * largest_face[3]
    img_area = img.shape[0] * img.shape[1]
    ratio = face_area / img_area
    return float(min(1.0, ratio * 4))  # Scale up since faces are typically 10-25% of frame


def assess_lighting_quality(img):
    """Assess lighting quality using brightness histogram."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    # Good brightness: 90-170 (0-255 scale)
    # Score: 1.0 at optimal, lower at extremes
    if 90 <= mean_brightness <= 170:
        lighting = 1.0 - abs(mean_brightness - 130) / 130.0
    else:
        lighting = max(0.0, 1.0 - abs(mean_brightness - 130) / 200.0)
    return float(lighting)


def preprocess_image(img):
    """Improve image quality for better emotion detection."""
    # Auto brightness/contrast using CLAHE on LAB color space
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # Histogram equalization for further contrast
    hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV)
    hsv[:, :, 2] = cv2.equalizeHist(hsv[:, :, 2])
    enhanced = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # Light denoise
    enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 5, 5, 7, 21)
    return enhanced


def compute_mapped_emotion(emotion_scores):
    """
    Use weighted aggregation of ALL emotion scores to determine our 4-label emotion.
    Also compute intensity and confidence calibrated by emotion_scores.
    Returns: (best_label, confidence, label_scores, intensity_level, intensity_score)
    """
    label_scores = {}
    for label, weight_map in LABEL_WEIGHTS.items():
        score = 0.0
        for raw_emotion, weight in weight_map.items():
            score += emotion_scores.get(raw_emotion, 0.0) * weight
        label_scores[label] = score

    best_label = max(label_scores, key=label_scores.get)
    best_score = label_scores[best_label]
    total = sum(label_scores.values())
    confidence = (best_score / total) if total > 0 else 0.25

    # Intensity: measure how dominant the emotion is vs others
    # High intensity = one emotion much stronger than others
    # Low intensity = emotions are mixed/ambiguous
    sorted_scores = sorted(label_scores.values(), reverse=True)
    intensity_score = (sorted_scores[0] - sorted_scores[1]) / total if len(sorted_scores) > 1 else 0.5
    intensity_score = float(max(0.0, min(1.0, intensity_score)))
    
    # Classify intensity
    if intensity_score >= 0.7:
        intensity_level = "strong"
    elif intensity_score >= 0.4:
        intensity_level = "moderate"
    else:
        intensity_level = "mild"

    return best_label, confidence, label_scores, intensity_level, intensity_score


@app.get("/health")
def health():
    return {"ok": True, "service": "emotion-detection", "modelVersion": MODEL_VERSION}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accepts a single image (JPEG/PNG/WebP).
    Returns emotion label, confidence, intensity, and detailed quality metrics.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(
                status_code=200,
                content={"ok": False, "error": "INVALID_IMAGE"}
            )

        # Compute image quality metrics BEFORE preprocessing
        original_height, original_width = img.shape[:2]
        sharpness = get_image_sharpness(img)
        lighting = assess_lighting_quality(img)
        
        # Load cascade for face size estimation
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        face_size_ratio = get_face_size_ratio(img, face_cascade)

        # Preprocess for better accuracy
        img = preprocess_image(img)

        # Call DeepFace for emotion analysis
        DeepFace = get_deepface()
        results = None
        detection_used = "auto"

        try:
            results = DeepFace.analyze(
                img,
                actions=["emotion"],
                enforce_detection=True,
                detector_backend="opencv",
                silent=True
            )
            detection_used = "opencv"
        except ValueError:
            # No face found with opencv, try with skip detection on full image
            try:
                results = DeepFace.analyze(
                    img,
                    actions=["emotion"],
                    enforce_detection=False,
                    silent=True
                )
                detection_used = "fallback"
            except Exception:
                return JSONResponse(
                    status_code=200,
                    content={"ok": False, "error": "NO_FACE_DETECTED"}
                )

        if results is None:
            return JSONResponse(
                status_code=200,
                content={"ok": False, "error": "NO_FACE_DETECTED"}
            )

        # DeepFace returns a list; take first result
        result = results[0] if isinstance(results, list) else results
        raw_emotion = result.get("dominant_emotion", "neutral")
        emotion_scores = result.get("emotion", {})

        # Use weighted aggregation for more accurate mapping
        mapped_emotion, confidence, label_scores, intensity_level, intensity_score = compute_mapped_emotion(emotion_scores)

        # Compute quality score (0-1, where 1 is ideal)
        quality_score = (sharpness + lighting + min(1.0, face_size_ratio * 1.5)) / 3.0
        
        # Adjust confidence based on quality
        # High quality boosts confidence, low quality reduces it
        quality_factor = 0.85 + (quality_score * 0.15)  # 0.85-1.0 range
        adjusted_confidence = min(0.99, max(0.5, confidence * quality_factor))

        # Emit verbose analysis
        print(f"🔍 Emotion Detection Analysis:")
        print(f"   Emotion: {mapped_emotion} (intensity: {intensity_level})")
        print(f"   Confidence: {confidence:.3f} → {adjusted_confidence:.3f} (quality-adjusted)")
        print(f"   Quality Metrics → Sharpness: {sharpness:.2f}, Lighting: {lighting:.2f}, Face Size: {face_size_ratio:.2f}")
        print(f"   Raw DeepFace: {raw_emotion} | Detection: {detection_used}")
        print(f"   All Scores: {emotion_scores}")

        return JSONResponse(
            status_code=200,
            content={
                "ok": True,
                "emotion": mapped_emotion,
                "confidence": float(round(adjusted_confidence, 3)),
                "intensity": {
                    "level": intensity_level,
                    "score": float(round(intensity_score, 3))
                },
                "quality": {
                    "overallScore": float(round(quality_score, 3)),
                    "sharpness": float(round(sharpness, 3)),
                    "lighting": float(round(lighting, 3)),
                    "faceSize": float(round(face_size_ratio, 3))
                },
                "raw": {
                    "dominant_emotion": raw_emotion,
                    "scores": {k: float(round(v, 2)) for k, v in emotion_scores.items()},
                    "mapped_scores": {k: float(round(v, 2)) for k, v in label_scores.items()},
                    "detection": detection_used
                },
                "modelVersion": MODEL_VERSION,
                "imageResolution": [original_width, original_height]
            }
        )

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=200,
            content={"ok": False, "error": "INFERENCE_FAILED", "detail": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    print("🧠 Starting Emotion Detection Service on port 8001...")
    get_deepface()  # Pre-load model
    uvicorn.run(app, host="0.0.0.0", port=8001)
