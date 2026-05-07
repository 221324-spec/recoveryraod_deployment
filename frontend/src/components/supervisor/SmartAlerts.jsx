import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaCheckCircle,
  FaChartBar, FaBullseye, FaChartLine, FaMapMarkerAlt,
  FaShieldAlt, FaBrain, FaRobot, FaCog, FaSync, FaTimes,
  FaArrowUp, FaArrowDown, FaMinus, FaUserShield, FaHeartbeat,
  FaServer, FaDatabase, FaEye,
  FaProjectDiagram
} from 'react-icons/fa';
import socketService from '../../services/socketService';
import { getCurrentUserId } from '../../services/chatService';
import { apiFetch } from '../../config/env';

/* ================================================================
   SMART ALERTS — COMMAND CENTER
   Professional dark-themed monitoring dashboard
   ================================================================ */

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [geoFenceAlerts, setGeoFenceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [showNotification, setShowNotification] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('alerts'); // 'alerts' | 'geofence' | 'insights'
  const [insightTab, setInsightTab] = useState('sentiment');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const liveRef = useRef(null);

  // ── Socket + Data ───────────────────────────────────────────────
  useEffect(() => {
    fetchAlerts(); fetchGeoFenceAlerts(); fetchAIInsights();
    const supervisorId = getCurrentUserId();
    if (supervisorId) socketService.connect(supervisorId);

    const handleGeoFenceAlert = (data) => {
      setShowNotification({ type: 'geofence', message: `${data.patient?.name || 'Patient'} entered risky zone: ${data.zone?.name || 'Unknown'}`, severity: data.zone?.riskCategory || 'High', timestamp: new Date() });
      setTimeout(() => setShowNotification(null), 10000);
      setGeoFenceAlerts(prev => [{ _id: data.alert?._id || Date.now(), patient: data.patient, geoFence: data.zone, eventType: 'entered', alertSeverity: data.zone?.riskCategory || 'High', alertStatus: 'new', entryTime: new Date().toISOString(), location: data.alert?.location }, ...prev]);
      setRealtimeAlerts(prev => [{ type: 'geofence_alert', data, timestamp: new Date() }, ...prev].slice(0, 15));
    };
    const handleGeoFenceExit = (data) => {
      setGeoFenceAlerts(prev => prev.map(a => a._id === data.alert?._id ? { ...a, alertStatus: 'resolved', exitTime: new Date().toISOString() } : a));
      setRealtimeAlerts(prev => [{ type: 'geofence_exit', data, timestamp: new Date() }, ...prev].slice(0, 15));
    };
    const handleNewAlert = (data) => {
      setRealtimeAlerts(prev => [{ type: 'new_alert', data, timestamp: new Date() }, ...prev].slice(0, 15));
      if (data.alert) setAlerts(prev => [data.alert, ...prev]);
    };
    const handleMoodAlert = (data) => {
      if (data.stats && data.stats.avgMood < 2.5)
        setRealtimeAlerts(prev => [{ type: 'mood_warning', patientId: data.patientId, data: data.stats, timestamp: new Date() }, ...prev].slice(0, 15));
    };
    const handleTriggerAlert = (data) => {
      setRealtimeAlerts(prev => [{ type: 'trigger_warning', patientId: data.patientId, data: data.entry, timestamp: new Date() }, ...prev].slice(0, 15));
    };
    const handleSOSAlert = (data) => {
      setShowNotification({ type: 'sos', message: `SOS from ${data.alert?.title || 'a patient'} — immediate help requested`, severity: 'Critical', timestamp: new Date() });
      setTimeout(() => setShowNotification(null), 15000);
      if (data.alert) {
        setAlerts(prev => [{ ...data.alert, id: data.alert._id, displayType: 'critical', status: 'active', patient: data.alert.title, timestamp: data.alert.createdAt, riskScore: null, actions: ['Contact immediately', 'Schedule urgent session'] }, ...prev]);
      }
      setRealtimeAlerts(prev => [{ type: 'sos_alert', data, timestamp: new Date() }, ...prev].slice(0, 15));
    };
    const handleRiskAlert = (data) => {
      setShowNotification({ type: 'risk', message: `High relapse risk detected — score: ${data.riskScore || 'N/A'}`, severity: 'High', timestamp: new Date() });
      setTimeout(() => setShowNotification(null), 10000);
      if (data.alert) {
        setAlerts(prev => [{ ...data.alert, id: data.alert._id, displayType: 'warning', status: 'active', patient: data.alert.title, timestamp: data.alert.createdAt, riskScore: data.riskScore || null, actions: ['Review patient', 'Increase monitoring'] }, ...prev]);
      }
      setRealtimeAlerts(prev => [{ type: 'risk_alert', data, timestamp: new Date() }, ...prev].slice(0, 15));
    };

    socketService.on('geofence:alert', handleGeoFenceAlert);
    socketService.on('geofence:exit', handleGeoFenceExit);
    socketService.on('alert:new', handleNewAlert);
    socketService.on('patient:mood:created', handleMoodAlert);
    socketService.on('patient:trigger:created', handleTriggerAlert);
    socketService.on('sos:alert', handleSOSAlert);
    socketService.on('risk:alert', handleRiskAlert);
    return () => {
      socketService.off('geofence:alert', handleGeoFenceAlert);
      socketService.off('geofence:exit', handleGeoFenceExit);
      socketService.off('alert:new', handleNewAlert);
      socketService.off('patient:mood:created', handleMoodAlert);
      socketService.off('patient:trigger:created', handleTriggerAlert);
      socketService.off('sos:alert', handleSOSAlert);
      socketService.off('risk:alert', handleRiskAlert);
    };
  }, []);

  const fetchGeoFenceAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await apiFetch('/api/alerts/geofence', { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.success && d.data) setGeoFenceAlerts(d.data); }
    } catch (e) { console.error('Error fetching geo-fence alerts:', e); }
  };
  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const sid = getCurrentUserId(); if (!sid) return;
      const r = await apiFetch(`/api/supervisors/${sid}/ai-insights`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.success && d.data) setAiInsights(d.data); }
    } catch (e) { console.error('Error fetching AI insights:', e); }
    finally { setInsightsLoading(false); }
  };
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await apiFetch('/api/alerts?limit=50', { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.data?.alerts) {
          setAlerts(d.data.alerts.map(a => ({
            ...a, id: a._id,
            displayType: (a.type === 'crisis' || a.type === 'error' || a.priority === 'urgent') ? 'critical' : (a.type === 'warning' || a.priority === 'high') ? 'warning' : 'info',
            status: !a.isActive ? 'resolved' : a.responses?.some(r => r.response === 'acknowledged') ? 'acknowledged' : 'active',
            patient: a.createdBy?.name || a.conditions?.customCondition || 'System',
            timestamp: a.createdAt,
            riskScore: a.conditions?.moodThreshold || null,
            actions: a.type === 'crisis' ? ['Contact immediately', 'Schedule urgent session'] : ['Review details', 'Monitor patient']
          })));
        }
      }
    } catch (e) { console.error('Error fetching alerts:', e); }
    finally { setLoading(false); }
  };

  const handleAcknowledgeGeoFence = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const r = await apiFetch(`/api/alerts/geofence/${alertId}/acknowledge`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'Acknowledged by supervisor' }) });
      if (r.ok) setGeoFenceAlerts(prev => prev.map(a => a._id === alertId ? { ...a, alertStatus: 'acknowledged', acknowledgedAt: new Date() } : a));
    } catch (e) { console.error('Error acknowledging geo-fence alert:', e); }
  };
  const handleAcknowledge = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await apiFetch(`/api/alerts/${alertId}/response`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ response: 'acknowledged', notes: 'Acknowledged by supervisor' }) });
      setAlerts(prev => prev.map(a => (a.id || a._id) === alertId ? { ...a, status: 'acknowledged' } : a));
    } catch (e) { console.error('Acknowledge error:', e); }
  };
  const handleResolve = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await apiFetch(`/api/alerts/${alertId}/response`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ response: 'action-taken', notes: 'Resolved by supervisor' }) });
      setAlerts(prev => prev.map(a => (a.id || a._id) === alertId ? { ...a, status: 'resolved' } : a));
    } catch (e) { console.error('Resolve error:', e); }
  };
  const handleRefresh = useCallback(() => { fetchAlerts(); fetchGeoFenceAlerts(); fetchAIInsights(); }, []);

  // ── Derived ─────────────────────────────────────────────────────
  const filteredAlerts = useMemo(() => filter === 'all' ? alerts : alerts.filter(a => a.displayType === filter), [alerts, filter]);
  const counts = useMemo(() => ({
    critical: alerts.filter(a => a.displayType === 'critical' && a.status === 'active').length,
    warning: alerts.filter(a => a.displayType === 'warning' && a.status === 'active').length,
    info: alerts.filter(a => a.displayType === 'info' && a.status === 'active').length,
    geo: geoFenceAlerts.filter(a => a.alertStatus === 'new').length,
    resolved: alerts.filter(a => a.status === 'resolved').length + geoFenceAlerts.filter(a => a.alertStatus === 'resolved').length,
    total: alerts.filter(a => a.status === 'active').length + geoFenceAlerts.filter(a => a.alertStatus === 'new').length,
  }), [alerts, geoFenceAlerts]);

  const eventMeta = (type) => ({
    mood_warning:    { emoji: '😔', label: 'Low Mood',        cls: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    trigger_warning: { emoji: '⚡', label: 'Trigger',         cls: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    new_alert:       { emoji: '🚨', label: 'New Alert',       cls: 'text-red-400 border-red-500/30 bg-red-500/10' },
    sos_alert:       { emoji: '🆘', label: 'SOS',             cls: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
    risk_alert:      { emoji: '⚠️', label: 'High Risk',       cls: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
    geofence_alert:  { emoji: '📍', label: 'Geo-Fence',       cls: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
    geofence_exit:   { emoji: '✅', label: 'Zone Exit',       cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  }[type] || { emoji: '📢', label: 'Event', cls: 'text-slate-400 border-slate-500/30 bg-slate-500/10' });

  // ── Loading ─────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-full min-h-screen bg-[#0B0F1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FaShieldAlt className="text-cyan-400 text-xl" />
          </div>
        </div>
        <div className="text-cyan-400/80 text-sm font-mono tracking-widest uppercase animate-pulse">Initializing Command Center</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes scanline{0%{top:-100%}100%{top:100%}}
        @keyframes glow-pulse{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes slide-in{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fade-up{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .scan-line{position:relative;overflow:hidden}
        .scan-line::after{content:'';position:absolute;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(34,211,238,.15),transparent);animation:scanline 4s linear infinite;pointer-events:none}
        .anim-glow{animation:glow-pulse 2s ease-in-out infinite}
        .anim-slide{animation:slide-in .4s ease-out both}
        .anim-fade{animation:fade-up .5s ease-out both}
        .d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}.d5{animation-delay:.25s}
        .cc-scroll::-webkit-scrollbar{width:4px}
        .cc-scroll::-webkit-scrollbar-track{background:rgba(15,23,42,.5)}
        .cc-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#06b6d4,#8b5cf6);border-radius:99px}
        .hex-bg{background-image:url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z' fill='%2306b6d4' fill-opacity='.03' fill-rule='evenodd'/%3E%3C/svg%3E")}
      `}</style>

      {/* ── NOTIFICATION TOAST ──────────────────────────────────── */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-[100] anim-slide max-w-sm">
          <div className={`rounded-lg border shadow-2xl shadow-black/40 overflow-hidden ${
            showNotification.severity === 'Critical' ? 'bg-red-950/90 border-red-500/40' :
            showNotification.severity === 'High' ? 'bg-orange-950/90 border-orange-500/40' :
            'bg-cyan-950/90 border-cyan-500/40'
          }`} style={{ backdropFilter: 'blur(20px)' }}>
            <div className={`h-0.5 ${
              showNotification.severity === 'Critical' ? 'bg-red-500' :
              showNotification.severity === 'High' ? 'bg-orange-500' : 'bg-cyan-500'
            }`} />
            <div className="px-4 py-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                showNotification.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                showNotification.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                'bg-cyan-500/20 text-cyan-400'
              }`}>
                {showNotification.type === 'geofence' ? <FaMapMarkerAlt /> : showNotification.type === 'sos' ? <FaExclamationTriangle /> : <FaShieldAlt />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {showNotification.type === 'geofence' ? 'Geo-Fence' : showNotification.type === 'sos' ? 'SOS' : 'Risk'} Alert
                  </span>
                  <button onClick={() => setShowNotification(null)} className="text-white/40 hover:text-white/80 ml-2"><FaTimes className="text-[10px]" /></button>
                </div>
                <p className="text-[11px] text-white/70 mt-1 leading-relaxed">{showNotification.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    showNotification.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    showNotification.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>{showNotification.severity}</span>
                  <span className="text-[9px] text-white/30 font-mono">{new Date(showNotification.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ────────────────────────────────────────── */}
      <div className="h-full min-h-screen bg-[#0B0F1A] hex-bg text-white overflow-hidden flex flex-col">

        {/* ── TOP BAR ──────────────────────────────────────────── */}
        <header className="flex-shrink-0 border-b border-white/[.06] bg-[#0d1117]/80" style={{ backdropFilter: 'blur(12px)' }}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <FaShieldAlt className="text-white text-sm" />
                </div>
                {counts.total > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0d1117] animate-pulse">
                    {counts.total}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Smart Alerts Command Center
                </h1>
                <p className="text-[11px] text-slate-500 font-mono tracking-wide">ML-POWERED MONITORING • REAL-TIME ANALYSIS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
              </div>
              <button onClick={handleRefresh}
                className="w-9 h-9 rounded-lg bg-white/[.04] border border-white/[.08] flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
                <FaSync className="text-xs" />
              </button>
            </div>
          </div>

          {/* ── LIVE TICKER ──────────────────────────────────────── */}
          {realtimeAlerts.length > 0 && (
            <div className="border-t border-white/[.04] bg-black/20 px-4 py-2 overflow-hidden" ref={liveRef}>
              <div className="flex gap-4 overflow-x-auto cc-scroll pb-0.5">
                {realtimeAlerts.slice(0, 8).map((ev, i) => {
                  const m = eventMeta(ev.type);
                  return (
                    <div key={i} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md border text-[11px] font-medium ${m.cls}`}>
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                      <span className="text-white/20 font-mono text-[9px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* ── STAT RIBBON ──────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-white/[.04] bg-[#0d1117]/40">
          <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto cc-scroll">
            {[
              { key: 'all', label: 'All Active', count: counts.total, color: 'cyan', icon: <FaEye /> },
              { key: 'critical', label: 'Critical', count: counts.critical, color: 'red', icon: <FaExclamationTriangle /> },
              { key: 'warning', label: 'Warning', count: counts.warning, color: 'amber', icon: <FaExclamationCircle /> },
              { key: 'geofence', label: 'Geo-Fence', count: counts.geo, color: 'orange', icon: <FaMapMarkerAlt /> },
              { key: 'info', label: 'Info', count: counts.info, color: 'sky', icon: <FaInfoCircle /> },
              { key: 'resolved', label: 'Resolved', count: counts.resolved, color: 'emerald', icon: <FaCheckCircle /> },
            ].map(s => {
              const isActive = (s.key === 'all' && filter === 'all' && activePanel === 'alerts') ||
                               (s.key === 'geofence' && activePanel === 'geofence') ||
                               (s.key !== 'all' && s.key !== 'geofence' && s.key !== 'resolved' && filter === s.key);
              return (
                <button key={s.key}
                  onClick={() => {
                    if (s.key === 'geofence') { setActivePanel('geofence'); }
                    else if (s.key === 'resolved') { setFilter('all'); setActivePanel('alerts'); }
                    else { setFilter(s.key === 'all' ? 'all' : s.key); setActivePanel('alerts'); }
                  }}
                  className={`flex-shrink-0 group flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? `bg-${s.color}-500/15 border-${s.color}-500/30 text-${s.color}-400 shadow-lg shadow-${s.color}-500/5`
                      : 'bg-white/[.02] border-white/[.06] text-slate-500 hover:text-slate-300 hover:border-white/[.12] hover:bg-white/[.04]'
                  }`}
                  style={isActive ? { backgroundColor: `var(--tw-${s.color}-bg, rgba(${s.color === 'red' ? '239,68,68' : s.color === 'amber' ? '245,158,11' : s.color === 'orange' ? '249,115,22' : s.color === 'sky' ? '14,165,233' : s.color === 'emerald' ? '16,185,129' : '6,182,212'},.12))`, borderColor: `rgba(${s.color === 'red' ? '239,68,68' : s.color === 'amber' ? '245,158,11' : s.color === 'orange' ? '249,115,22' : s.color === 'sky' ? '14,165,233' : s.color === 'emerald' ? '16,185,129' : '6,182,212'},.25)` } : {}}
                >
                  <span className={isActive ? '' : 'opacity-50 group-hover:opacity-100 transition-opacity'}>{s.icon}</span>
                  <span>{s.label}</span>
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/10' : 'bg-white/[.04]'
                  }`}>{s.count}</span>
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={() => setActivePanel('insights')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                activePanel === 'insights'
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-lg shadow-violet-500/5'
                  : 'bg-white/[.02] border-white/[.06] text-slate-500 hover:text-slate-300 hover:border-white/[.12] hover:bg-white/[.04]'
              }`}
            >
              <FaBrain className={activePanel === 'insights' ? 'text-violet-400' : ''} />
              <span>AI Insights</span>
              {aiInsights?.mlModels?.ready && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ─────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto cc-scroll p-6">

            {/* ═══════ ALERTS PANEL ═══════════════════════════════ */}
            {activePanel === 'alerts' && (
              <div className="anim-fade">
                {filteredAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                      <FaCheckCircle className="text-emerald-500/60 text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-300 mb-2">All Clear</h3>
                    <p className="text-sm text-slate-600 max-w-xs">No active alerts. Incidents from SOS, risk evaluations, and system events will appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert, idx) => {
                      const isExpanded = expandedAlert === (alert.id || alert._id);
                      const sevColors = {
                        critical: { border: 'border-red-500/30', bg: 'bg-red-500/5', icon: 'bg-red-500/20 text-red-400', dot: 'bg-red-500', badge: 'bg-red-500/15 text-red-400 ring-red-500/20' },
                        warning:  { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-400 ring-amber-500/20' },
                        info:     { border: 'border-sky-500/30', bg: 'bg-sky-500/5', icon: 'bg-sky-500/20 text-sky-400', dot: 'bg-sky-500', badge: 'bg-sky-500/15 text-sky-400 ring-sky-500/20' },
                      }[alert.displayType] || { border: 'border-slate-500/30', bg: 'bg-slate-500/5', icon: 'bg-slate-500/20 text-slate-400', dot: 'bg-slate-500', badge: 'bg-slate-500/15 text-slate-400 ring-slate-500/20' };
                      const statusColors = {
                        active: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20',
                        acknowledged: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
                        resolved: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
                      };

                      return (
                        <div key={alert.id || alert._id}
                          className={`anim-fade d${Math.min(idx + 1, 5)} rounded-xl border transition-all duration-300 cursor-pointer hover:border-white/[.12] ${sevColors.border} ${sevColors.bg}`}
                          style={{ backdropFilter: 'blur(8px)' }}
                          onClick={() => setExpandedAlert(isExpanded ? null : (alert.id || alert._id))}
                        >
                          <div className="px-5 py-4 flex items-center gap-4">
                            {/* severity icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${sevColors.icon}`}>
                              {alert.displayType === 'critical' ? <FaExclamationTriangle /> : alert.displayType === 'warning' ? <FaExclamationCircle /> : <FaInfoCircle />}
                            </div>
                            {/* main */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-white truncate">{alert.title}</h4>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${statusColors[alert.status] || ''}`}>
                                  {alert.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1"><FaUserShield className="text-cyan-500/50" /> {alert.patient}</span>
                                {alert.riskScore != null && (
                                  <span className="flex items-center gap-1">
                                    <FaBullseye className={alert.riskScore > 70 ? 'text-red-400/60' : alert.riskScore > 40 ? 'text-amber-400/60' : 'text-emerald-400/60'} />
                                    <span className="font-semibold text-white/60">{alert.riskScore}%</span>
                                  </span>
                                )}
                                <span className="font-mono text-[10px] text-slate-600">{new Date(alert.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            {/* actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {alert.status === 'active' && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id || alert._id); }}
                                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/20 hover:bg-amber-500/25 transition-all">
                                    Ack
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleResolve(alert.id || alert._id); }}
                                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/25 transition-all">
                                    Resolve
                                  </button>
                                </>
                              )}
                              {alert.status === 'acknowledged' && (
                                <button onClick={(e) => { e.stopPropagation(); handleResolve(alert.id || alert._id); }}
                                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/25 transition-all">
                                  Resolve
                                </button>
                              )}
                            </div>
                          </div>
                          {/* expanded detail */}
                          {isExpanded && (
                            <div className="border-t border-white/[.04] px-5 py-4 anim-fade">
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">{alert.message}</p>
                              <div className="flex flex-wrap gap-2">
                                {alert.actions?.map((a, i) => (
                                  <span key={i} className="text-[10px] font-medium px-3 py-1 rounded-md bg-white/[.04] border border-white/[.06] text-slate-400">{a}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════ GEO-FENCE PANEL ════════════════════════════ */}
            {activePanel === 'geofence' && (
              <div className="anim-fade">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Geo-Fence Monitoring</h2>
                    <p className="text-[11px] text-slate-500">Boundary violation alerts • {geoFenceAlerts.filter(a => a.alertStatus === 'new').length} active</p>
                  </div>
                </div>
                {geoFenceAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
                      <FaMapMarkerAlt className="text-slate-600 text-xl" />
                    </div>
                    <p className="text-sm text-slate-600">No geo-fence alerts recorded.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {geoFenceAlerts.map((alert, idx) => {
                      const isNew = alert.alertStatus === 'new';
                      const isAck = alert.alertStatus === 'acknowledged';
                      return (
                        <div key={alert._id || idx}
                          className={`anim-fade d${Math.min(idx + 1, 5)} rounded-xl border p-4 transition-all ${
                            isNew ? 'border-red-500/25 bg-red-500/[.04]' :
                            isAck ? 'border-amber-500/20 bg-amber-500/[.03]' :
                            'border-emerald-500/20 bg-emerald-500/[.03]'
                          }`}
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                              alert.alertSeverity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              alert.alertSeverity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              alert.alertSeverity === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-sky-500/20 text-sky-400'
                            }`}>
                              <FaMapMarkerAlt />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-bold text-white">{alert.patient?.name || 'Unknown'}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  alert.alertSeverity === 'Critical' ? 'bg-red-500/15 text-red-400' :
                                  alert.alertSeverity === 'High' ? 'bg-orange-500/15 text-orange-400' :
                                  'bg-amber-500/15 text-amber-400'
                                }`}>{alert.alertSeverity}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  isNew ? 'bg-red-500/15 text-red-400' : isAck ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                                }`}>{isNew ? 'NEW' : isAck ? 'ACK' : 'RESOLVED'}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-2">
                                {alert.eventType === 'entered' ? '⚠ Entered' : '✓ Exited'} <span className="text-white/70 font-medium">{alert.geoFence?.name || 'Unknown Zone'}</span>
                              </p>
                              <div className="flex flex-wrap gap-3 text-[10px] text-slate-600 font-mono">
                                <span>Type: {alert.geoFence?.zoneType || 'N/A'}</span>
                                <span>{new Date(alert.entryTime).toLocaleString()}</span>
                                {alert.exitTime && <span>Exit: {new Date(alert.exitTime).toLocaleString()}</span>}
                              </div>
                            </div>
                            {isNew && (
                              <button onClick={() => handleAcknowledgeGeoFence(alert._id)}
                                className="flex-shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/25 transition-all">
                                Acknowledge
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════ AI INSIGHTS PANEL ══════════════════════════ */}
            {activePanel === 'insights' && (
              <div className="anim-fade">
                {/* header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <FaBrain />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">AI Insights & ML Analytics</h2>
                      <p className="text-[11px] text-slate-500">
                        {aiInsights ? `${aiInsights.patientCount} patient${aiInsights.patientCount !== 1 ? 's' : ''} monitored • scikit-learn pipeline` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  {aiInsights?.mlModels?.pythonActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Python ML Active</span>
                    </div>
                  )}
                </div>

                {/* insight tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/[.03] border border-white/[.06] mb-6">
                  {[
                    { id: 'sentiment', label: 'Sentiment', icon: <FaHeartbeat /> },
                    { id: 'risk',      label: 'Risk',      icon: <FaBullseye /> },
                    { id: 'patterns',  label: 'Patterns',  icon: <FaChartLine /> },
                    { id: 'trends',    label: 'Trends',    icon: <FaChartBar /> },
                    { id: 'ml',        label: 'ML Engine',   icon: <FaRobot /> },
                  ].map(t => (
                    <button key={t.id} onClick={() => setInsightTab(t.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold flex-1 justify-center transition-all ${
                        insightTab === t.id
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[.03] border border-transparent'
                      }`}>
                      {t.icon} <span className="hidden md:inline">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* insight content */}
                {insightsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                    <span className="text-xs text-slate-500 font-mono tracking-wide">Analyzing patient data...</span>
                  </div>
                ) : !aiInsights ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FaInfoCircle className="text-slate-700 text-2xl mb-3" />
                    <p className="text-sm text-slate-500">Could not load insights. Try refreshing.</p>
                  </div>
                ) : (
                  <div className="anim-fade">
                    {/* ── SENTIMENT ─────────────────────────────────── */}
                    {insightTab === 'sentiment' && (
                      <div className="space-y-4">
                        <DarkCard className="border-violet-500/15">
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            <FaBrain className="inline text-violet-400 mr-1.5" />
                            <span className="text-violet-400 font-semibold">scikit-learn</span> TF-IDF + Random Forest (risk) and TF-IDF + SVM (emotion) merged with keyword/regex safety patterns via Python REST API.
                          </p>
                        </DarkCard>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <MetricTile label="Texts Analyzed" value={aiInsights.sentimentAnalysis.textsAnalyzed} sub="7 days" color="violet" />
                          <MetricTile label="Avg Mood" value={aiInsights.sentimentAnalysis.avgMood} sub="/10" color="indigo" />
                          <MetricTile label="High-Risk" value={aiInsights.sentimentAnalysis.highRiskTexts} sub="flags" color="red" />
                          <MetricTile label="Med-Risk" value={aiInsights.sentimentAnalysis.medRiskTexts} sub="flags" color="amber" />
                        </div>
                        {/* emotion bar */}
                        {aiInsights.sentimentAnalysis.textsAnalyzed > 0 && (() => {
                          const ed = aiInsights.sentimentAnalysis.emotionDistribution;
                          const total = Object.values(ed).reduce((s, v) => s + v, 0) || 1;
                          const emos = [
                            { k: 'hope', c: 'bg-emerald-500', label: 'Hope' },
                            { k: 'neutral', c: 'bg-slate-500', label: 'Neutral' },
                            { k: 'anxiety', c: 'bg-amber-500', label: 'Anxiety' },
                            { k: 'sadness', c: 'bg-blue-500', label: 'Sadness' },
                            { k: 'anger', c: 'bg-red-500', label: 'Anger' },
                          ].filter(e => (ed[e.k] || 0) > 0);
                          return (
                            <DarkCard>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Emotion Distribution</div>
                              <div className="flex rounded-full overflow-hidden h-2.5 bg-slate-800 mb-3">
                                {emos.map(e => <div key={e.k} className={`${e.c} transition-all duration-700`} style={{ width: `${((ed[e.k] || 0) / total) * 100}%` }} />)}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {emos.map(e => (
                                  <span key={e.k} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span className={`w-2 h-2 rounded-full ${e.c}`} /> {e.label} ({ed[e.k]})
                                  </span>
                                ))}
                              </div>
                            </DarkCard>
                          );
                        })()}
                        <div className="text-[10px] text-slate-600 font-mono flex gap-4">
                          <span>Journals: {aiInsights.sentimentAnalysis.journalsAnalyzed}</span>
                          <span>Chats: {aiInsights.sentimentAnalysis.chatsAnalyzed}</span>
                          <span>Updated: {new Date(aiInsights.sentimentAnalysis.lastUpdated).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )}

                    {/* ── RISK ──────────────────────────────────────── */}
                    {insightTab === 'risk' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <MetricTile label="High Risk" value={aiInsights.riskAssessment.highRiskCount} color="red" />
                          <MetricTile label="Medium" value={aiInsights.riskAssessment.medRiskCount} color="amber" />
                          <MetricTile label="Low Risk" value={aiInsights.riskAssessment.lowRiskCount} color="emerald" />
                        </div>
                        {/* avg score gauge */}
                        <DarkCard>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400">Average Risk Score</span>
                            <span className={`text-xl font-black ${
                              aiInsights.riskAssessment.avgRiskScore >= 75 ? 'text-red-400' :
                              aiInsights.riskAssessment.avgRiskScore >= 55 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>{aiInsights.riskAssessment.avgRiskScore}<span className="text-xs text-slate-600">/100</span></span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div className={`h-2.5 rounded-full transition-all duration-1000 ${
                              aiInsights.riskAssessment.avgRiskScore >= 75 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                              aiInsights.riskAssessment.avgRiskScore >= 55 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                              'bg-gradient-to-r from-emerald-600 to-emerald-400'
                            }`} style={{ width: `${aiInsights.riskAssessment.avgRiskScore}%` }} />
                          </div>
                        </DarkCard>
                        {/* high-risk list */}
                        {aiInsights.riskAssessment.highRiskPatients.length > 0 && (
                          <DarkCard className="!p-0 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[.04]">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                                <FaExclamationTriangle className="text-[8px]" /> High-Risk Patients
                              </span>
                            </div>
                            {aiInsights.riskAssessment.highRiskPatients.map((p, i) => (
                              <div key={i} className="px-4 py-3 flex items-center justify-between border-b border-white/[.02] last:border-0 hover:bg-white/[.02] transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                                    <FaUserShield className="text-red-400 text-[10px]" />
                                  </div>
                                  <span className="text-xs font-semibold text-white">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-slate-500">{p.topFactors?.slice(0, 2).join(', ')}</span>
                                  <span className="text-sm font-black text-red-400">{p.score}</span>
                                </div>
                              </div>
                            ))}
                          </DarkCard>
                        )}
                        <div className="text-[10px] text-slate-600 font-mono flex gap-4">
                          <span>{aiInsights.riskAssessment.factorsEvaluated} factors</span>
                          <span>Last: {new Date(aiInsights.riskAssessment.lastEvaluated).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )}

                    {/* ── PATTERNS ──────────────────────────────────── */}
                    {insightTab === 'patterns' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <MetricTile label="Triggers" value={aiInsights.patternRecognition.totalTriggers} sub="7 days" color="rose" />
                          <MetricTile label="Activity Rate" value={`${aiInsights.patternRecognition.activityCompletionRate}%`} color="sky" />
                        </div>
                        {aiInsights.patternRecognition.topTriggers.length > 0 ? (
                          <DarkCard>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Top Triggers (7d)</div>
                            <div className="space-y-3">
                              {aiInsights.patternRecognition.topTriggers.map((t, i) => {
                                const pct = Math.min(100, (t.count / (aiInsights.patternRecognition.topTriggers[0]?.count || 1)) * 100);
                                return (
                                  <div key={i}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-slate-300">{t.name}</span>
                                      <span className="text-xs font-bold text-rose-400">{t.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-gradient-to-r from-rose-600 to-pink-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </DarkCard>
                        ) : (
                          <DarkCard><p className="text-xs text-slate-500 italic text-center py-4">No trigger data in the last 7 days.</p></DarkCard>
                        )}
                      </div>
                    )}

                    {/* ── TRENDS ────────────────────────────────────── */}
                    {insightTab === 'trends' && (
                      <div className="space-y-3">
                        <DarkTrendRow label="Mood Trend" value={aiInsights.predictiveTrends.moodTrend} positive={aiInsights.predictiveTrends.moodTrend > 0} neutral={aiInsights.predictiveTrends.moodTrend === 0} />
                        <DarkTrendRow label="Craving Trend" value={aiInsights.predictiveTrends.cravingTrend} positive={aiInsights.predictiveTrends.cravingTrend < 0} neutral={aiInsights.predictiveTrends.cravingTrend === 0} invert />
                        <DarkCard className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Relapses (7d)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-white">{aiInsights.predictiveTrends.relapses7d}</span>
                            <span className="text-[10px] text-slate-600">vs {aiInsights.predictiveTrends.relapsesPrev7d} prior</span>
                          </div>
                        </DarkCard>
                        <DarkCard>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-400">Check-in Rate</span>
                            <span className={`text-lg font-black ${
                              aiInsights.predictiveTrends.checkinRate >= 70 ? 'text-emerald-400' :
                              aiInsights.predictiveTrends.checkinRate >= 40 ? 'text-amber-400' : 'text-red-400'
                            }`}>{aiInsights.predictiveTrends.checkinRate}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-700 ${
                              aiInsights.predictiveTrends.checkinRate >= 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                              aiInsights.predictiveTrends.checkinRate >= 40 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                              'bg-gradient-to-r from-red-600 to-red-400'
                            }`} style={{ width: `${aiInsights.predictiveTrends.checkinRate}%` }} />
                          </div>
                        </DarkCard>
                        <DarkCard className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Active Alerts</span>
                          <span className="text-lg font-black text-orange-400">{aiInsights.predictiveTrends.activeAlerts}</span>
                        </DarkCard>
                      </div>
                    )}

                    {/* ── ML ENGINE ─────────────────────────────────── */}
                    {insightTab === 'ml' && (
                      <div className="space-y-4">
                        {aiInsights.mlModels?.ready && aiInsights.mlModels.textRiskClassifier ? (
                          <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                              <MLModelCard
                                title="Text Risk" algo={aiInsights.mlModels.textRiskClassifier.algorithm || 'TF-IDF + RF'}
                                acc={aiInsights.mlModels.textRiskClassifier.accuracy}
                                cv={aiInsights.mlModels.textRiskClassifier.cvAccuracy}
                                samples={aiInsights.mlModels.textRiskClassifier.samplesUsed}
                                icon={<FaShieldAlt />} color="violet"
                              />
                              <MLModelCard
                                title="Emotion" algo={aiInsights.mlModels.emotionClassifier.algorithm || 'TF-IDF + SVM'}
                                acc={aiInsights.mlModels.emotionClassifier.accuracy}
                                cv={aiInsights.mlModels.emotionClassifier.cvAccuracy}
                                samples={aiInsights.mlModels.emotionClassifier.samplesUsed}
                                icon={<FaHeartbeat />} color="pink"
                              />
                              <MLModelCard
                                title="Risk Pred" algo={aiInsights.mlModels.riskFeatureClassifier.algorithm || 'GBM'}
                                acc={aiInsights.mlModels.riskFeatureClassifier.accuracy}
                                cv={aiInsights.mlModels.riskFeatureClassifier.cvAccuracy}
                                samples={aiInsights.mlModels.riskFeatureClassifier.samplesUsed}
                                icon={<FaBullseye />} color="amber"
                              />
                            </div>
                            {/* Architecture */}
                            <DarkCard className="scan-line overflow-hidden">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80 mb-5 flex items-center gap-2">
                                <FaProjectDiagram /> System Architecture
                              </div>
                              <div className="flex items-center justify-center gap-3 mb-5">
                                {[
                                  { icon: <FaDatabase />, name: 'React', port: ':3000', c: 'cyan' },
                                  { icon: <FaServer />, name: 'Express', port: ':5000', c: 'violet' },
                                  { icon: '🐍', name: 'Flask ML', port: ':5001', c: 'emerald' },
                                ].map((n, i) => (
                                  <React.Fragment key={n.name}>
                                    {i > 0 && <div className="flex items-center"><div className="w-8 h-px bg-gradient-to-r from-slate-700 to-slate-600" /><span className="text-slate-600 text-[8px] mx-0.5">▶</span><div className="w-8 h-px bg-gradient-to-r from-slate-600 to-slate-700" /></div>}
                                    <div className="flex flex-col items-center gap-1.5">
                                      <div className={`w-11 h-11 rounded-xl bg-${n.c}-500/10 border border-${n.c}-500/20 flex items-center justify-center text-${n.c}-400 text-sm`}
                                        style={{ backgroundColor: `rgba(${n.c === 'cyan' ? '6,182,212' : n.c === 'violet' ? '139,92,246' : '16,185,129'},.1)`, borderColor: `rgba(${n.c === 'cyan' ? '6,182,212' : n.c === 'violet' ? '139,92,246' : '16,185,129'},.2)`, color: n.c === 'cyan' ? '#22d3ee' : n.c === 'violet' ? '#a78bfa' : '#34d399' }}>
                                        {n.icon}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-300">{n.name}</span>
                                      <span className="text-[9px] text-slate-600 font-mono">{n.port}</span>
                                    </div>
                                  </React.Fragment>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                                Risk: <span className="text-cyan-400 font-semibold">60% rule-based + 40% ML</span> • Text: scikit-learn + regex safety patterns
                              </p>
                            </DarkCard>
                          </>
                        ) : aiInsights.mlModels?.ready && aiInsights.mlModels.textClassifier ? (
                          <DarkCard>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-300">Text Classifier (JS Fallback)</span>
                              <span className="text-sm font-bold text-emerald-400">{aiInsights.mlModels.textClassifier.accuracy}%</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Naive Bayes (natural.js) • {aiInsights.mlModels.textClassifier.samplesUsed} samples</p>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${aiInsights.mlModels.textClassifier.accuracy}%` }} />
                            </div>
                          </DarkCard>
                        ) : (
                          <DarkCard className="text-center py-8">
                            <FaCog className="text-red-400/60 text-2xl mx-auto mb-3 animate-spin" style={{ animationDuration: '3s' }} />
                            <p className="text-xs text-red-400 font-medium mb-1">ML models are offline</p>
                            <p className="text-[10px] text-slate-600 font-mono">python ml_service/app.py</p>
                          </DarkCard>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function DarkCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/[.06] bg-white/[.02] p-4 ${className}`}
      style={{ backdropFilter: 'blur(8px)' }}>
      {children}
    </div>
  );
}

function MetricTile({ label, value, sub, color = 'cyan' }) {
  const colors = {
    cyan: 'border-cyan-500/20 text-cyan-400',
    violet: 'border-violet-500/20 text-violet-400',
    indigo: 'border-indigo-500/20 text-indigo-400',
    red: 'border-red-500/20 text-red-400',
    amber: 'border-amber-500/20 text-amber-400',
    emerald: 'border-emerald-500/20 text-emerald-400',
    rose: 'border-rose-500/20 text-rose-400',
    sky: 'border-sky-500/20 text-sky-400',
    orange: 'border-orange-500/20 text-orange-400',
    pink: 'border-pink-500/20 text-pink-400',
  };
  return (
    <div className={`rounded-xl border bg-white/[.02] p-4 ${colors[color] || colors.cyan}`} style={{ backdropFilter: 'blur(8px)' }}>
      <div className="text-2xl font-black">{value}{sub && <span className="text-xs text-slate-600 ml-0.5">{sub}</span>}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function DarkTrendRow({ label, value, positive, neutral, invert }) {
  const abs = Math.abs(value);
  return (
    <DarkCard className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className={`text-base font-black flex items-center gap-1 ${
        positive ? 'text-emerald-400' : neutral ? 'text-slate-500' : 'text-red-400'
      }`}>
        {neutral ? <FaMinus className="text-xs" /> : (invert ? value < 0 : value > 0) ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
        {abs}%
      </span>
    </DarkCard>
  );
}

function MLModelCard({ title, algo, acc, cv, samples, icon, color = 'cyan' }) {
  const accColor = acc >= 90 ? 'text-emerald-400' : acc >= 75 ? 'text-cyan-400' : acc >= 60 ? 'text-amber-400' : 'text-red-400';
  const barGrad = acc >= 90 ? 'from-emerald-600 to-emerald-400' : acc >= 75 ? 'from-cyan-600 to-cyan-400' : acc >= 60 ? 'from-amber-600 to-amber-400' : 'from-red-600 to-red-400';
  const colorMap = {
    violet: { bg: 'rgba(139,92,246,.1)', border: 'rgba(139,92,246,.2)', text: '#a78bfa' },
    pink:   { bg: 'rgba(236,72,153,.1)', border: 'rgba(236,72,153,.2)', text: '#f472b6' },
    amber:  { bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)', text: '#fbbf24' },
    cyan:   { bg: 'rgba(6,182,212,.1)', border: 'rgba(6,182,212,.2)', text: '#22d3ee' },
  };
  const cm = colorMap[color] || colorMap.cyan;
  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4 hover:border-white/[.1] transition-colors" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
          style={{ backgroundColor: cm.bg, borderColor: cm.border, border: `1px solid ${cm.border}`, color: cm.text }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white truncate">{title}</div>
          <div className="text-[9px] text-slate-500 font-mono">{algo}</div>
        </div>
        <div className={`text-lg font-black ${accColor}`}>{acc}<span className="text-[10px] text-slate-600">%</span></div>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
        <div className={`bg-gradient-to-r ${barGrad} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${acc}%` }} />
      </div>
      <div className="flex items-center gap-2 text-[9px] text-slate-600 font-mono">
        <span>{samples} samples</span>
        {cv && <><span>•</span><span>CV: {cv}%</span></>}
      </div>
    </div>
  );
}
