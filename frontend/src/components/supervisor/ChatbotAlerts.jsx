import React, { useState, useEffect, useCallback } from 'react';
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ── Risk badge colors ── */
const riskColors = {
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  MED: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  LOW: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
};

const emotionIcons = {
  sadness: '😢',
  anxiety: '😰',
  anger: '😠',
  hope: '😊',
  neutral: '😐',
};

/* ═══════════════════════════════════════════════════
   Alert Detail Modal
   ═══════════════════════════════════════════════════ */
function AlertDetailModal({ alertId, onClose, onClosed }) {
  const [detail, setDetail] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!alertId) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/chat-alerts/${alertId}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDetail(data.alert);
        setChatHistory(data.chatHistory || []);
      } catch {
        setDetail(null);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [alertId]);

  const handleClose = async () => {
    setClosing(true);
    try {
      const res = await apiFetch(`/api/chat-alerts/${alertId}/close`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      onClosed(alertId);
    } catch {
      alert('Failed to close alert');
    }
    setClosing(false);
  };

  if (!alertId) return null;

  const rc = riskColors[detail?.risk] || riskColors.LOW;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">Alert Detail</h2>
            {detail && (
              <p className="text-blue-100 text-sm">
                {detail.patientId?.firstName} {detail.patientId?.lastName} &bull; {new Date(detail.createdAt).toLocaleString()}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-xl">&times;</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto">
            {/* Alert info cards */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className={`${rc.bg} ${rc.border} border rounded-xl p-3 text-center`}>
                  <p className="text-xs text-gray-500 mb-1">Risk Level</p>
                  <p className={`text-lg font-bold ${rc.text}`}>{detail.risk}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Emotion</p>
                  <p className="text-lg">{emotionIcons[detail.topEmotion]} {detail.topEmotion}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Intensity</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(detail.intensity || 0) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold">{((detail.intensity || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs text-red-400 font-medium mb-1">Summary</p>
                <p className="text-sm text-red-800">{detail.summary}</p>
              </div>

              {detail.triggerText && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium mb-1">Trigger Message</p>
                  <p className="text-sm text-gray-700 italic">"{detail.triggerText}"</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${detail.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {detail.status === 'open' ? '⚠ Open' : '✓ Closed'}
                  </span>
                  {detail.closedAt && (
                    <span className="text-xs text-gray-400 ml-2">
                      Closed {new Date(detail.closedAt).toLocaleString()}
                      {detail.closedBy && ` by ${detail.closedBy.firstName || ''} ${detail.closedBy.lastName || ''}`}
                    </span>
                  )}
                </div>
                {detail.status === 'open' && (
                  <button
                    onClick={handleClose}
                    disabled={closing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {closing ? 'Closing…' : '✓ Close Alert'}
                  </button>
                )}
              </div>
            </div>

            {/* Chat history */}
            {chatHistory.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Chat History (read-only)</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 rounded-xl p-3">
                  {chatHistory.map((m, i) => (
                    <div
                      key={m._id || i}
                      className={`flex ${m.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        m.sender === 'patient'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-700 border border-gray-200 rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className={`text-[10px] mt-1 ${m.sender === 'patient' ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400">Alert not found.</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ChatbotAlerts — Main export
   ═══════════════════════════════════════════════════ */
export default function ChatbotAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [liveCount, setLiveCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/chat-alerts?status=${statusFilter}` : `/api/chat-alerts`;
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      console.error('Failed to fetch chat alerts');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  /* ── Real-time Socket.io listener ── */
  useEffect(() => {
    const handleNewAlert = (payload) => {
      console.log('🚨 [ChatbotAlerts] new_alert received:', payload);
      setLiveCount(prev => prev + 1);

      // Prepend to list if filter matches
      if (statusFilter === 'open' || statusFilter === '') {
        setAlerts(prev => [payload, ...prev]);
      }
    };

    const handleAlertClosed = (payload) => {
      setAlerts(prev => prev.map(a => a._id === payload._id ? { ...a, status: 'closed', closedAt: payload.closedAt } : a));
    };

    socketService.on('new_alert', handleNewAlert);
    socketService.on('alert_closed', handleAlertClosed);

    return () => {
      socketService.off('new_alert', handleNewAlert);
      socketService.off('alert_closed', handleAlertClosed);
    };
  }, [statusFilter]);

  const handleAlertClosed = (alertId) => {
    setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'closed', closedAt: new Date().toISOString() } : a));
    setSelectedAlertId(null);
  };

  const filteredAlerts = alerts;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🛡️ Chatbot Risk Alerts
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time high-risk alerts from patient chatbot conversations
          </p>
        </div>
        {liveCount > 0 && (
          <div className="bg-red-100 text-red-700 text-sm font-semibold px-4 py-2 rounded-full animate-pulse">
            {liveCount} new alert{liveCount > 1 ? 's' : ''} received
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        {['open', 'closed', ''].map(status => (
          <button
            key={status || 'all'}
            onClick={() => { setStatusFilter(status); setLiveCount(0); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <button
          onClick={() => { fetchAlerts(); setLiveCount(0); }}
          className="ml-auto px-4 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400">Loading alerts…</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-500 font-medium">No {statusFilter || ''} alerts</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter === 'open' ? 'All clear — no open high-risk alerts right now.' : 'No alerts match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const rc = riskColors[alert.risk] || riskColors.LOW;
            const patient = alert.patientId || {};
            const patientName = typeof patient === 'object'
              ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
              : (alert.patientName || 'Unknown Patient');

            return (
              <div
                key={alert._id}
                onClick={() => setSelectedAlertId(alert._id)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer p-5 flex items-center gap-4"
              >
                {/* Risk badge */}
                <div className={`w-12 h-12 rounded-xl ${rc.bg} ${rc.border} border flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-sm font-bold ${rc.text}`}>{alert.risk}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 truncate">{patientName}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${alert.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{alert.summary}</p>
                </div>

                {/* Emotion + Intensity */}
                <div className="text-center flex-shrink-0 hidden sm:block">
                  <span className="text-2xl">{emotionIcons[alert.topEmotion] || '😐'}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{alert.topEmotion}</p>
                </div>

                {/* Intensity bar */}
                <div className="flex-shrink-0 hidden sm:block" style={{ width: '60px' }}>
                  <p className="text-[10px] text-gray-400 mb-1">Intensity</p>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(alert.intensity || 0) * 100}%` }} />
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-gray-300 flex-shrink-0">›</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAlertId && (
        <AlertDetailModal
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
          onClosed={handleAlertClosed}
        />
      )}
    </div>
  );
}
