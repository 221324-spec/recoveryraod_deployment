import React, { useState, useEffect } from 'react';
import { FaClipboardList, FaFilter, FaSync, FaDownload } from 'react-icons/fa';
import socketService from '../../services/socketService';
import { getCurrentUserId } from '../../services/chatService';
import api from '../../api';
import { apiFetch } from '../../config/env';

export default function RelapseTracker() {
  const [relapses, setRelapses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);
  const [exportingPatient, setExportingPatient] = useState('');
  const [exporting, setExporting] = useState(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const supervisorId = getCurrentUserId();

  const fetchRelapses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (severityFilter) params.append('severity', severityFilter);
      if (patientFilter) params.append('patientId', patientFilter);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);

      const result = await api.get(`/supervisors/${supervisorId}/relapses?${params.toString()}`);
      setRelapses(result.data.relapses || []);
      setPatients(result.data.patients || []);
    } catch (err) {
      console.error('Error fetching relapses:', err);
      if (err.response?.status === 404) {
        // Route not found — show empty state instead of error
        setRelapses([]);
        setPatients([]);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch relapses');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supervisorId) {
      fetchRelapses();
      socketService.connect(supervisorId);
    }

    const handleRelapseLogged = (data) => {
      console.log('Warning: Real-time relapse logged:', data);
      setRealtimeUpdates(prev => [{
        type: 'relapse', data, timestamp: new Date()
      }, ...prev].slice(0, 5));
      if (data.relapse) {
        setRelapses(prev => [data.relapse, ...prev]);
      }
    };

    socketService.on('relapse:logged', handleRelapseLogged);
    return () => { socketService.off('relapse:logged', handleRelapseLogged); };
  }, []);

  useEffect(() => {
    if (supervisorId) fetchRelapses();
  }, [severityFilter, patientFilter, dateFrom, dateTo]);

  const getSeverityBadge = (severity) => {
    if (severity === 'relapse') {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Relapse</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">Slip</span>;
  };

  const handleExportCSV = async () => {
    if (!exportingPatient) return;
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/supervisors/${supervisorId}/patients/${exportingPatient}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const data = await response.json();
      const summary = data.summary;

      // Build CSV
      const rows = [['Date', 'Mood', 'MoodValue', 'Craving', 'Journal', 'Triggers', 'Activities', 'Relapse']];
      (summary.dailyBreakdown || []).forEach(d => {
        rows.push([
          d.date,
          d.mood || '',
          d.moodValue ?? '',
          d.craving ?? '',
          (d.journal || '').replace(/"/g, '""'),
          (d.triggers || []).join('; '),
          (d.activities || []).join('; '),
          d.relapse ? `${d.relapse.severity} - ${d.relapse.substanceType}` : ''
        ]);
      });

      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-summary-${exportingPatient}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .modern-scrollbar::-webkit-scrollbar { width: 8px; }
        .modern-scrollbar::-webkit-scrollbar-track { background: rgba(148,163,184,0.1); border-radius: 10px; }
        .modern-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom,#8B5CF6,#6366F1); border-radius: 10px; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6 overflow-y-auto modern-scrollbar">
        {/* Real-time Notifications */}
        {realtimeUpdates.length > 0 && (
          <div className="mb-6 space-y-3">
            {realtimeUpdates.slice(0, 2).map((update, index) => (
              <div key={index} className="bg-white border-l-4 border-red-500 rounded-lg shadow-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">!</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">New Relapse Logged</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {update.data?.relapse?.patientName || 'A patient'} � {update.data?.relapse?.severity || 'incident'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(update.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaClipboardList className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Relapse & Incident Tracker</h2>
              <p className="text-sm text-gray-500">{relapses.length} records from {patients.length} patients</p>
            </div>
          </div>
          <button onClick={fetchRelapses} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm">
            <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-purple-500" />
            <h3 className="font-semibold text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">All</option>
                <option value="slip">Slip</option>
                <option value="relapse">Relapse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Patient</label>
              <select value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">All Patients</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Export CSV */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <FaDownload className="text-emerald-500" />
            <h3 className="font-semibold text-gray-700">Export Patient Summary (CSV)</h3>
          </div>
          <div className="flex items-center gap-3">
            <select value={exportingPatient} onChange={(e) => setExportingPatient(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="">Select a patient...</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <button onClick={handleExportCSV} disabled={!exportingPatient || exporting} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${!exportingPatient || exporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              <FaDownload /> {exporting ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>
        )}

        {/* Relapses Table */}
        {relapses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
            <div className="text-5xl mb-4">&#x2705;</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Relapses Found</h3>
            <p className="text-gray-500">No relapse incidents match the current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Date/Time</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Severity</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Substance</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Craving</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Mood</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Triggers</th>
                  </tr>
                </thead>
                <tbody>
                  {relapses.map((relapse, index) => (
                    <tr key={relapse._id || index} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(relapse.patientName || '?')[0]}
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{relapse.patientName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(relapse.dateTime)}</td>
                      <td className="px-6 py-4">{getSeverityBadge(relapse.severity)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{relapse.substanceType || '\u2014'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            relapse.cravingLevelAtRelapse >= 7 ? 'bg-red-500' :
                            relapse.cravingLevelAtRelapse >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {relapse.cravingLevelAtRelapse}
                          </div>
                          <span className="text-xs text-gray-500">/10</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{relapse.moodAtRelapse || '\u2014'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(relapse.triggers || []).slice(0, 3).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">{t}</span>
                          ))}
                          {(relapse.triggers || []).length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{relapse.triggers.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {relapses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-gray-800">{relapses.length}</div>
              <div className="text-sm text-gray-500 mt-1">Total Incidents</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-red-600">{relapses.filter(r => r.severity === 'relapse').length}</div>
              <div className="text-sm text-gray-500 mt-1">Relapses</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-yellow-600">{relapses.filter(r => r.severity === 'slip').length}</div>
              <div className="text-sm text-gray-500 mt-1">Slips</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {relapses.length > 0 ? (relapses.reduce((sum, r) => sum + (r.cravingLevelAtRelapse || 0), 0) / relapses.length).toFixed(1) : '\u2014'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg Craving Level</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
