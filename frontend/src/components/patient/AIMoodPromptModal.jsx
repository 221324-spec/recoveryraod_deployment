import React, { useEffect } from 'react';
import { FaCamera, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

/**
 * AIMoodPromptModal — shown when backend says shouldPrompt=true.
 * Props: reasons[], onAccept(), onDecline(), onDismiss(), patientId
 */
export default function AIMoodPromptModal({ reasons, onAccept, onDecline, onDismiss, patientId }) {
  // Log SHOWN on mount
  useEffect(() => {
    const logShown = async () => {
      try {
        const token = localStorage.getItem('token');
        await apiFetch(`/api/patients/${patientId}/ai-mood/prompt-log`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'SHOWN', reasonCodes: reasons.map(r => r.code) })
        });
      } catch (e) { console.error('prompt log error:', e); }
    };
    logShown();
  }, [patientId, reasons]);

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      await apiFetch(`/api/patients/${patientId}/ai-mood/prompt-log`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPTED', reasonCodes: reasons.map(r => r.code) })
      });
    } catch (e) { console.error(e); }
    onAccept();
  };

  const handleDecline = async () => {
    try {
      const token = localStorage.getItem('token');
      await apiFetch(`/api/patients/${patientId}/ai-mood/prompt-log`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINED', reasonCodes: reasons.map(r => r.code) })
      });
    } catch (e) { console.error(e); }
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 relative">
          <button onClick={onDismiss} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <FaTimes />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FaCamera className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Mood Check</h3>
              <p className="text-violet-200 text-sm">Quick facial expression analysis</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-slate-700 text-sm mb-4">
            We noticed some patterns that suggest a quick mood check might be helpful:
          </p>

          <div className="space-y-2 mb-5">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                <FaExclamationTriangle className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-800">{r.message}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            A quick AI-powered scan can help us understand how you're really feeling. It takes just a few seconds — 
            your camera will capture a single photo for analysis.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
            >
              <FaCamera className="text-sm" />
              Start AI Mood Scan
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-3 text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
