import React, { useState, useEffect, useCallback } from 'react';
import { FaBrain, FaSearch, FaImage, FaTimes, FaExclamationTriangle, FaChartBar, FaSync, FaFilter } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

const EMOTION_META = {
  happy: { label: 'Happy', emoji: '😊', color: 'emerald', bg: 'bg-emerald-100 text-emerald-700' },
  sad: { label: 'Sad', emoji: '😢', color: 'blue', bg: 'bg-blue-100 text-blue-700' },
  anxious: { label: 'Anxious', emoji: '😰', color: 'amber', bg: 'bg-amber-100 text-amber-700' },
  neutral: { label: 'Neutral', emoji: '😐', color: 'slate', bg: 'bg-slate-100 text-slate-700' },
};

export default function SupervisorAIMoodScansPanel() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ emotion: '', patientName: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState(null); // scanId
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [weeklyDist, setWeeklyDist] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [mismatchFlags, setMismatchFlags] = useState([]);

  const supervisorId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.id || u._id || u.userId || '';
    } catch { return ''; }
  })();

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.emotion) params.set('emotion', filters.emotion);
      if (filters.status) params.set('status', filters.status);
      const url = `/api/supervisors/${supervisorId}/ai-mood/scans?${params}`;
      const res = await apiFetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load AI mood scans');
      const json = await res.json();
      const payload = json.data || json;
      let list = payload.scans || [];
      // client-side patient name filter
      if (filters.patientName.trim()) {
        const q = filters.patientName.toLowerCase();
        list = list.filter(s => {
          const name = s.patientName || s.patientId?.firstName || s.patientId?.name || '';
          return name.toLowerCase().includes(q);
        });
      }
      setScans(list);
      setMismatchFlags(payload.mismatchFlags || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [supervisorId, filters.emotion, filters.status, filters.patientName]);

  const fetchWeekly = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch(`/api/supervisors/${supervisorId}/ai-mood/weekly-distribution`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const json = await res.json();
      const weeklyData = json.data || json;
      // weeklyData is an array of { week, happy, sad, anxious, neutral }
      // Convert to totals for the bar chart
      const totals = { happy: 0, sad: 0, anxious: 0, neutral: 0 };
      if (Array.isArray(weeklyData)) {
        weeklyData.forEach(w => {
          totals.happy += w.happy || 0;
          totals.sad += w.sad || 0;
          totals.anxious += w.anxious || 0;
          totals.neutral += w.neutral || 0;
        });
      } else if (typeof weeklyData === 'object') {
        Object.assign(totals, weeklyData);
      }
      setWeeklyDist(totals);
    } catch { /* silent */ }
  }, [supervisorId]);

  useEffect(() => { if (supervisorId) { fetchScans(); fetchWeekly(); } }, [fetchScans, fetchWeekly, supervisorId]);

  const openScreenshot = async (scanId) => {
    setScreenshotModal(scanId);
    setScreenshotLoading(true);
    setScreenshotUrl(null);
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch(`/api/supervisors/${supervisorId}/ai-mood/scans/${scanId}/screenshot`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Screenshot not available');
      const blob = await res.blob();
      setScreenshotUrl(URL.createObjectURL(blob));
    } catch {
      setScreenshotUrl('error');
    } finally {
      setScreenshotLoading(false);
    }
  };

  const closeScreenshot = () => {
    if (screenshotUrl && screenshotUrl !== 'error') URL.revokeObjectURL(screenshotUrl);
    setScreenshotModal(null);
    setScreenshotUrl(null);
  };

  const totalScans = scans.length;
  const emotionCounts = scans.reduce((acc, s) => {
    if (s.emotion) acc[s.emotion] = (acc[s.emotion] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FaBrain />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI Mood Scans</h2>
              <p className="text-sm text-slate-500">{totalScans} scan{totalScans !== 1 ? 's' : ''} from patients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChart(!showChart)} className="px-3 py-2 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 text-sm font-medium flex items-center gap-1.5 transition-colors">
              <FaChartBar /> Weekly
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium flex items-center gap-1.5 transition-colors">
              <FaFilter /> Filter
            </button>
            <button onClick={fetchScans} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium flex items-center gap-1.5 transition-colors">
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {Object.entries(EMOTION_META).map(([key, meta]) => (
            <div key={key} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-2xl mb-1">{meta.emoji}</div>
              <div className="text-lg font-bold text-slate-800">{emotionCounts[key] || 0}</div>
              <div className="text-[11px] text-slate-500 font-medium">{meta.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Emotion</label>
            <select value={filters.emotion} onChange={e => setFilters(f => ({ ...f, emotion: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none">
              <option value="">All</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="anxious">Anxious</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Name</label>
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-2.5 text-slate-400 text-xs" />
              <input value={filters.patientName} onChange={e => setFilters(f => ({ ...f, patientName: e.target.value }))} placeholder="Search…" className="border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm w-44 focus:ring-2 focus:ring-violet-300 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none">
              <option value="">All</option>
              <option value="DONE">Done</option>
              <option value="FAILED">Failed</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>
          <button onClick={() => setFilters({ emotion: '', patientName: '', status: '' })} className="text-xs text-slate-500 hover:text-red-500 underline">Clear</button>
        </div>
      )}

      {/* Mismatch Flags */}
      {mismatchFlags.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FaExclamationTriangle className="text-amber-600" />
            <h3 className="font-bold text-amber-800 text-sm">Possible Masking Detected</h3>
          </div>
          <p className="text-xs text-amber-700 mb-3">These patients report high manual mood scores but show negative emotions in AI scans — may require closer follow-up.</p>
          <div className="flex flex-wrap gap-2">
            {mismatchFlags.map((f, i) => (
              <span key={i} className="px-3 py-1.5 bg-white rounded-lg border border-amber-200 text-sm font-medium text-amber-800 shadow-sm">
                {f.patientName || f.patientId} — Avg self-report: {f.avgManualMood?.toFixed(1)}, Negative scans: {f.negativeScans}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Distribution Chart */}
      {showChart && weeklyDist && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Weekly Emotion Distribution</h3>
          <div className="space-y-3">
            {Object.entries(EMOTION_META).map(([key, meta]) => {
              const count = weeklyDist[key] || 0;
              const total = Object.values(weeklyDist).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{meta.emoji}</span>
                  <span className="text-xs font-medium text-slate-600 w-16">{meta.label}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${
                      key === 'happy' ? 'from-emerald-400 to-emerald-500' :
                      key === 'sad' ? 'from-blue-400 to-blue-500' :
                      key === 'anxious' ? 'from-amber-400 to-amber-500' :
                      'from-slate-300 to-slate-400'
                    } transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-12 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scans Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent" />
            <span className="text-sm font-medium">Loading scans…</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button onClick={fetchScans} className="mt-3 text-sm text-blue-600 underline">Retry</button>
        </div>
      ) : scans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">🧠</div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No AI Mood Scans Yet</h3>
          <p className="text-sm text-slate-500">Scans will appear here once patients use the AI Mood Detection feature.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Emotion</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Confidence</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Screenshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((scan) => {
                  const meta = EMOTION_META[scan.emotion] || EMOTION_META.neutral;
                  const patientName = scan.patientName
                    || (scan.patientId?.firstName
                      ? `${scan.patientId.firstName} ${scan.patientId.lastName || ''}`.trim()
                      : scan.patientId?.name)
                    || 'Unknown';
                  return (
                    <tr key={scan._id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{patientName}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(scan.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                        <span className="text-slate-400">{new Date(scan.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg}`}>
                          {meta.emoji} {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {scan.confidence != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.round(scan.confidence * 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{Math.round(scan.confidence * 100)}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          scan.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                          scan.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{scan.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {scan.screenshot?.fileId ? (
                          <button onClick={() => openScreenshot(scan._id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 text-xs font-medium transition-colors">
                            <FaImage /> View
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeScreenshot}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800">Patient Screenshot</h4>
              <button onClick={closeScreenshot} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <FaTimes className="text-slate-500" />
              </button>
            </div>
            <div className="p-5 flex items-center justify-center min-h-[200px]">
              {screenshotLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
              ) : screenshotUrl === 'error' ? (
                <p className="text-sm text-red-500">Screenshot could not be loaded.</p>
              ) : screenshotUrl ? (
                <img src={screenshotUrl} alt="Patient scan" className="max-w-full rounded-xl border border-slate-200 shadow-sm" />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
