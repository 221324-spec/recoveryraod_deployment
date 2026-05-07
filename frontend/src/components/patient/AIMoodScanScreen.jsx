import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaCamera, FaRedo, FaSpinner, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import EmotionDrivenSupportPanel from './EmotionDrivenSupportPanel';
import { apiFetch } from '../../config/env';

const EMOTION_DISPLAY = {
  happy:   { emoji: '😊', label: 'Happy',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  sad:     { emoji: '😢', label: 'Sad',     color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  anxious: { emoji: '😰', label: 'Anxious', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200' },
};

export default function AIMoodScanScreen({ onBack, userId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState('camera'); // camera | captured | analyzing | result | error
  const [capturedImage, setCapturedImage] = useState(null); // Blob
  const [capturedPreview, setCapturedPreview] = useState(null); // data URL for preview
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase('camera');
      setErrorMsg('');
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Camera access denied. Please allow camera permissions and try again.');
      setPhase('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get data URL for preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPreview(dataUrl);

    // Get blob for upload
    canvas.toBlob((blob) => {
      setCapturedImage(blob);
      setPhase('captured');
    }, 'image/jpeg', 0.9);
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setCapturedPreview(null);
    setResult(null);
    setErrorMsg('');
    setPhase('camera');
    startCamera();
  };

  const analyzePhoto = async () => {
    if (!capturedImage) return;
    setPhase('analyzing');
    stopCamera();

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('screenshot', capturedImage, 'mood_scan.jpg');

      const response = await apiFetch(`/api/patients/${userId}/ai-mood/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.status === 'DONE') {
          setResult(data.data);
          setPhase('result');
        } else if (data.data.status === 'FAILED') {
          const reason = data.data.failureReason;
          if (reason === 'NO_FACE_DETECTED') {
            setErrorMsg('No face was detected in the photo. Please try again with better lighting and face the camera directly.');
          } else if (reason === 'ML_SERVICE_UNAVAILABLE') {
            setErrorMsg('The emotion analysis service is currently unavailable. Please try again later.');
          } else {
            setErrorMsg('Analysis failed. Please try again.');
          }
          setPhase('error');
        }
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setPhase('error');
      }
    } catch (err) {
      console.error('Scan upload error:', err);
      setErrorMsg('Network error. Please check your connection and try again.');
      setPhase('error');
    }
  };

  const emotionInfo = result?.emotion ? EMOTION_DISPLAY[result.emotion] : null;
  const confidencePct = result?.confidence ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-all shadow-sm">
          <FaArrowLeft className="text-sm" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">AI Mood Scan</h1>
          <p className="text-xs text-slate-500">Capture a photo for emotion analysis</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* ─── CAMERA PHASE ────────────────────────────────── */}
        {phase === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl border border-slate-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 border-[3px] border-white/20 rounded-2xl pointer-events-none" />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-56 border-2 border-white/40 rounded-[50%] border-dashed" />
              </div>
            </div>
            <p className="text-xs text-center text-slate-500">Position your face within the oval and ensure good lighting</p>
            <button
              onClick={captureFrame}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm"
            >
              <FaCamera /> Capture Photo
            </button>
          </div>
        )}

        {/* ─── CAPTURED PHASE ──────────────────────────────── */}
        {phase === 'captured' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl border border-slate-200">
              <img
                src={capturedPreview}
                alt="Captured"
                className="w-full aspect-[4/3] object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Captured
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                <FaRedo className="text-sm" /> Retake
              </button>
              <button
                onClick={analyzePhoto}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
              >
                <FaCamera className="text-sm" /> Analyze
              </button>
            </div>
          </div>
        )}

        {/* ─── ANALYZING PHASE ─────────────────────────────── */}
        {phase === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
              <FaCamera className="absolute inset-0 m-auto text-violet-500 text-xl" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Analyzing your expression...</p>
            <p className="text-xs text-slate-400">This may take a few seconds</p>
            {capturedPreview && (
              <img src={capturedPreview} alt="Being analyzed" className="w-24 h-24 rounded-xl object-cover border-2 border-violet-200 shadow-sm mt-2" style={{ transform: 'scaleX(-1)' }} />
            )}
          </div>
        )}

        {/* ─── RESULT PHASE ────────────────────────────────── */}
        {phase === 'result' && result && emotionInfo && (
          <div className="space-y-5">
            {/* Result card */}
            <div className={`p-6 rounded-2xl border ${emotionInfo.border} ${emotionInfo.bg} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{emotionInfo.emoji}</span>
                  <div>
                    <h3 className={`text-2xl font-extrabold ${emotionInfo.color}`}>{emotionInfo.label}</h3>
                    <p className="text-xs text-slate-500">Detected emotion</p>
                  </div>
                </div>
                <FaCheckCircle className="text-emerald-500 text-xl" />
              </div>

              {/* Confidence bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600">Confidence</span>
                  <span className={`text-sm font-bold ${emotionInfo.color}`}>{confidencePct}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                  <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${confidencePct}%` }} />
                </div>
              </div>

              {/* Intensity level badge - NEW */}
              {result.intensity && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Intensity:</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    result.intensity.level === 'strong' ? 'bg-red-100 text-red-700 border border-red-200' :
                    result.intensity.level === 'moderate' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {result.intensity.level.charAt(0).toUpperCase() + result.intensity.level.slice(1)}
                  </span>
                  <div className="text-xs text-slate-500">({Math.round(result.intensity.score * 100)}%)</div>
                </div>
              )}

              {/* Quality Metrics - NEW */}
              {result.qualityMetrics && (
                <div className="mb-4 space-y-2 bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">📊 Image Quality</p>
                  
                  {/* Overall quality score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Overall</span>
                      <span className="text-xs font-bold text-slate-700">{Math.round(result.qualityMetrics.overallScore * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 rounded-full" style={{ width: `${result.qualityMetrics.overallScore * 100}%` }} />
                    </div>
                  </div>

                  {/* Detail metrics in compact grid */}
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                    <div className="bg-blue-50 rounded p-1.5 border border-blue-100">
                      <div className="text-gray-500">Sharpness</div>
                      <div className="font-bold text-blue-700">{Math.round(result.qualityMetrics.sharpness * 100)}%</div>
                    </div>
                    <div className="bg-amber-50 rounded p-1.5 border border-amber-100">
                      <div className="text-gray-500">Lighting</div>
                      <div className="font-bold text-amber-700">{Math.round(result.qualityMetrics.lighting * 100)}%</div>
                    </div>
                    <div className="bg-purple-50 rounded p-1.5 border border-purple-100">
                      <div className="text-gray-500">Face Size</div>
                      <div className="font-bold text-purple-700">{Math.round(result.qualityMetrics.faceSize * 100)}%</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Scanned: {new Date(result.dateTime).toLocaleString()}</span>
                {result.analysisSource === 'fallback_contextual' && (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <FaExclamationTriangle className="text-[10px]" />
                    Contextual analysis fallback
                  </span>
                )}
              </div>

              {result.analysisSource === 'fallback_contextual' && result.analysisNote && (
                <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {result.analysisNote}
                </p>
              )}

              {/* Screenshot preview */}
              {result.screenshotUrl && (
                <div className="mt-4">
                  <img
                    src={result.screenshotUrl}
                    alt="Scan screenshot"
                    className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow-sm"
                    style={{ transform: 'scaleX(-1)' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Support suggestions */}
            <EmotionDrivenSupportPanel
              emotion={result.emotion}
              scanId={result._id}
              patientId={userId}
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={retake} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                <FaRedo className="text-sm" /> Scan Again
              </button>
              <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg">
                Done
              </button>
            </div>
          </div>
        )}

        {/* ─── ERROR PHASE ─────────────────────────────────── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <FaTimesCircle className="text-red-400 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Scan Failed</h3>
            <p className="text-sm text-slate-500 max-w-xs">{errorMsg}</p>
            <button onClick={retake} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg">
              <FaRedo className="text-sm" /> Try Again
            </button>
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium">
              Go Back
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for screenshot capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
