import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaChartLine, FaExclamationTriangle, FaSearch, FaEye, FaSmile, FaCalendar, FaTrophy, FaCheck, FaUserCheck, FaEnvelope, FaPhone, FaTimes, FaUserTie } from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const PatientManagement = ({ view, onRegisterContentRefresh }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [patients, setPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch patients from API
  const fetchPatients = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await apiFetch('/api/ngo/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const result = await response.json();
      if (result.success) {
        setPatients(result.data);
      }
    } catch (err) {
      console.error('Fetch patients error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available patients (not in organization)
  const fetchAvailablePatients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await apiFetch('/api/ngo/patients/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailablePatients(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch available patients error:', err);
    }
  }, []);

  // Approve and assign patient to organization
  const handleAssignPatient = async (patientId) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Approve the patient first
      const response = await apiFetch(`/api/ngo/patients/${patientId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Patient approved and added to organization!');
        fetchPatients();
        fetchAvailablePatients();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to approve patient');
      }
    } catch (err) {
      console.error('Approve patient error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPatients();
    fetchAvailablePatients();
  }, [fetchPatients, fetchAvailablePatients]);

  const refreshListData = useCallback(() => {
    fetchPatients();
    fetchAvailablePatients();
  }, [fetchPatients, fetchAvailablePatients]);

  useEffect(() => {
    if (!onRegisterContentRefresh) return;
    const fn =
      view === 'list' ? refreshListData : view === 'progress' || view === 'risks' ? fetchPatients : null;
    onRegisterContentRefresh(fn);
    return () => onRegisterContentRefresh(null);
  }, [view, onRegisterContentRefresh, refreshListData, fetchPatients]);

  // Socket listeners
  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket && user?.id) {
      socket.on('patient:mood:created', () => {
        fetchPatients();
      });
      
      socket.on('ngo:patient:assigned', () => {
        fetchPatients();
      });
      
      socket.on('ngo:patient:supervisor:changed', () => {
        fetchPatients();
      });
      
      socket.on('crisis:alert', () => {
        fetchPatients();
      });
      
      socket.on('patient:registered', () => {
        fetchPatients();
        fetchAvailablePatients();
      });
    }
    
    return () => {
      if (socket) {
        socket.off('patient:mood:created');
        socket.off('ngo:patient:assigned');
        socket.off('ngo:patient:supervisor:changed');
        socket.off('crisis:alert');
        socket.off('patient:registered');
      }
    };
  }, [user, fetchPatients]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.supervisor?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' ? patient.isActive : !patient.isActive);
    const matchesRisk = filterRisk === 'all' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-cyan-800 bg-cyan-100 dark:bg-cyan-950/50 dark:text-cyan-200';
      case 'medium': return 'text-amber-800 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200';
      case 'high': return 'text-red-700 bg-red-100 dark:bg-red-950/45 dark:text-red-300';
      default: return 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Calculate statistics
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.isActive).length,
    lowRisk: patients.filter(p => p.riskLevel === 'low').length,
    mediumRisk: patients.filter(p => p.riskLevel === 'medium').length,
    highRisk: patients.filter(p => p.riskLevel === 'high').length,
    avgMood: patients.length > 0 
      ? (patients.reduce((sum, p) => sum + (p.averageMood || 0), 0) / patients.length).toFixed(1)
      : 0,
    avgProgress: patients.length > 0
      ? Math.round(patients.reduce((sum, p) => sum + (p.sobrietyDays || 0), 0) / patients.length)
      : 0
  };

  // Chart data for progress trends
  const progressChartData = {
    labels: patients.slice(0, 10).map(p => p.name.split(' ')[0]),
    datasets: [{
      label: 'Sobriety Days',
      data: patients.slice(0, 10).map(p => p.sobrietyDays || 0),
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Risk distribution chart
  const riskChartData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [stats.lowRisk, stats.mediumRisk, stats.highRisk],
      backgroundColor: ['#06b6d4', '#f59e0b', '#e11d48'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Patients</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPatients}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="w-full space-y-6">
        {/* KPI tiles — Recovery Road palette */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total patients', value: stats.total, icon: FaUsers, from: 'from-blue-600', to: 'to-indigo-700' },
            { label: 'Active', value: stats.active, icon: FaChartLine, from: 'from-sky-500', to: 'to-cyan-600' },
            { label: 'Avg mood', value: `${stats.avgMood}/10`, icon: FaSmile, from: 'from-violet-600', to: 'to-purple-700' },
            { label: 'High risk', value: stats.highRisk, icon: FaExclamationTriangle, from: 'from-rose-600', to: 'to-red-700' },
            { label: 'Pending approval', value: availablePatients.length, icon: FaUserCheck, from: 'from-amber-500', to: 'to-orange-600' },
          ].map((tile, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tile.from} ${tile.to} p-5 text-white shadow-lg ring-1 ring-white/10`}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{tile.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums md:text-3xl">{tile.value}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                  <tile.icon className="text-lg text-white md:text-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/15">
          <div className="rounded-[14px] bg-white dark:bg-slate-900 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="text"
                  placeholder="Search patients by name or supervisor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 lg:min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 lg:min-w-[160px]"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/40">
            <div className="flex items-center">
              <FaCheck className="mr-2 text-sky-600" />
              <p className="font-medium text-sky-900 dark:text-sky-100">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Pending Patient Approvals Section */}
        {availablePatients.length > 0 && (
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50/50 p-6 md:p-8 shadow-md shadow-amber-500/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FaUserCheck className="text-amber-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Pending Patient Approvals</h2>
                  <p className="text-sm text-gray-600">{availablePatients.length} patient{availablePatients.length !== 1 ? 's' : ''} awaiting your approval</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                Action Required
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePatients.map((patient) => (
                <div key={patient.id} className="bg-white rounded-xl p-5 border border-amber-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <FaUsers className="text-white text-lg" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {patient.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaPhone className="mr-2 text-gray-400" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendar className="mr-2 text-gray-400" />
                      <span>Registered: {new Date(patient.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAssignPatient(patient.id)}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md shadow-indigo-500/20"
                  >
                    <FaUserCheck />
                    <span>Approve & Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient roster */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-400/10 ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 px-6 py-5 text-white md:flex-row md:items-center md:justify-between dark:border-slate-600">
            <h2 className="text-lg font-bold md:text-xl">Organization roster</h2>
            <div className="flex items-center gap-2 text-sm text-indigo-100">
              <FaUsers className="text-indigo-200" />
              <span className="font-semibold text-white">{filteredPatients.length}</span> shown ·{' '}
              <span>{filteredPatients.filter((p) => p.isActive !== false).length} active</span>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                <FaUsers className="text-2xl" />
              </div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">No patients match filters</p>
              <p className="mt-1 text-slate-500">Adjust search or risk filters</p>
            </div>
          ) : (
            <div className="space-y-4 p-4 md:p-6">
              {filteredPatients.map((patient) => {
                const pct = Math.min(100, Math.round(((patient.sobrietyDays || 0) / 30) * 100));
                const stripe =
                  patient.riskLevel === 'high'
                    ? 'bg-rose-500'
                    : patient.riskLevel === 'medium'
                      ? 'bg-amber-400'
                      : 'bg-sky-500';
                return (
                  <div
                    key={patient.id}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-600 dark:bg-slate-800/90"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1 ${stripe}`} aria-hidden />
                    <div className="flex flex-col gap-4 p-5 pl-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                          <FaUsers className="text-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{patient.name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                patient.isActive !== false
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {patient.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${getRiskColor(patient.riskLevel)}`}>
                              {(patient.riskLevel?.charAt(0).toUpperCase() || '') + (patient.riskLevel?.slice(1) || 'unknown')}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 truncate">
                              <FaEnvelope className="shrink-0 text-indigo-400" />
                              <span className="truncate">{patient.email}</span>
                            </span>
                            {patient.phone && (
                              <span className="flex items-center gap-1.5">
                                <FaPhone className="shrink-0 text-indigo-400" />
                                {patient.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-400">
                              <FaUserTie className="shrink-0 opacity-80" />
                              {patient.supervisor?.name || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="rounded-lg bg-violet-50 px-3 py-2 dark:bg-violet-950/35">
                            <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{patient.averageMood?.toFixed(1) || 0}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600/80 dark:text-violet-400/90">Mood</p>
                          </div>
                          <div className="rounded-lg bg-cyan-50 px-3 py-2 dark:bg-cyan-950/35">
                            <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">{patient.sobrietyDays || 0}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700/80 dark:text-cyan-400/90">Sober</p>
                          </div>
                          <div className="rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/35">
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{patient.recoveryPoints || 0}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700/80 dark:text-blue-400/90">Pts</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPatient(patient)}
                            className="rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                            title="View details"
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignPatient(patient.id)}
                            disabled={saving}
                            className="rounded-xl border border-violet-200 bg-violet-50 p-2.5 text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                            title="Approve patient"
                          >
                            <FaUserCheck />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50/80 px-5 pb-4 pt-0 dark:border-slate-700 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between pb-2 pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Recovery momentum (30d baseline)</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Enhanced Patient Details Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUsers className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPatient.isActive !== false 
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' 
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {selectedPatient.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(selectedPatient.riskLevel)}`}>
                          {selectedPatient.riskLevel?.charAt(0).toUpperCase() + selectedPatient.riskLevel?.slice(1) || 'Unknown'} Risk
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPatient(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-gray-500 text-xl" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaEnvelope className="mr-2 text-purple-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-500">Email Address</label>
                      <p className="font-medium text-gray-800">{selectedPatient.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-500">Phone Number</label>
                      <p className="font-medium text-gray-800">{selectedPatient.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaUserTie className="mr-2 text-purple-600" />
                    Assignment Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-gray-500">Assigned Supervisor</label>
                        <p className="font-medium text-gray-800">{selectedPatient.supervisor?.name || 'Unassigned'}</p>
                      </div>
                      {selectedPatient.supervisor && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Supervisor Email</p>
                          <p className="font-medium text-gray-800">{selectedPatient.supervisor.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recovery Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaTrophy className="mr-2 text-purple-600" />
                    Recovery Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{selectedPatient.averageMood?.toFixed(1) || 0}</div>
                      <div className="text-sm text-purple-700">Average Mood (1-10)</div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(selectedPatient.averageMood || 0) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-950/40 dark:to-sky-950/40 rounded-lg p-6 text-center ring-1 ring-cyan-200/60 dark:ring-cyan-900/50">
                      <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300 mb-2">{selectedPatient.sobrietyDays || 0}</div>
                      <div className="text-sm text-cyan-800 dark:text-cyan-200">Days Sober</div>
                      <div className="w-full bg-cyan-200/80 dark:bg-cyan-900/50 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-sky-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (selectedPatient.sobrietyDays || 0) / 30 * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{selectedPatient.recoveryPoints || 0}</div>
                      <div className="text-sm text-blue-700">Recovery Points</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (selectedPatient.recoveryPoints || 0) / 100 * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaCalendar className="mr-2 text-purple-600" />
                    Recent Activity
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-red-600">{selectedPatient.alertCount || 0}</div>
                        <div className="text-sm text-gray-600">Alerts This Month</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{selectedPatient.goalsCompleted || 0}</div>
                        <div className="text-sm text-gray-600">Goals Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{selectedPatient.sessionsAttended || 0}</div>
                        <div className="text-sm text-gray-600">Sessions Attended</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{selectedPatient.positiveDays || 0}</div>
                        <div className="text-sm text-gray-600">Positive Days</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mood Trend Chart */}
                {selectedPatient.moodTrend && selectedPatient.moodTrend.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaSmile className="mr-2 text-purple-600" />
                      Mood Trend (Last 7 Days)
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="h-48">
                        <Line
                          data={{
                            labels: selectedPatient.moodTrend.map((_, i) => `Day ${i + 1}`),
                            datasets: [{
                              label: 'Mood Score',
                              data: selectedPatient.moodTrend.map(m => m.value),
                              borderColor: 'rgb(147, 51, 234)',
                              backgroundColor: 'rgba(147, 51, 234, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointBackgroundColor: 'rgb(147, 51, 234)',
                              pointBorderColor: '#fff',
                              pointBorderWidth: 2,
                              pointRadius: 6
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { 
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff'
                              }
                            },
                            scales: { 
                              y: { 
                                min: 0, 
                                max: 10,
                                grid: { color: 'rgba(0, 0, 0, 0.1)' }
                              },
                              x: {
                                grid: { color: 'rgba(0, 0, 0, 0.1)' }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAssignPatient(selectedPatient.id);
                    setSelectedPatient(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Assigning...' : 'Assign to Organization'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'progress') {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Avg mood', value: `${stats.avgMood}/10`, icon: FaSmile, from: 'from-violet-600', to: 'to-purple-700' },
            { label: 'Avg sober days', value: stats.avgProgress, icon: FaCalendar, from: 'from-sky-500', to: 'to-cyan-600' },
            { label: 'At-risk count', value: stats.highRisk, icon: FaExclamationTriangle, from: 'from-rose-600', to: 'to-orange-700' },
          ].map((t, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.from} ${t.to} p-6 text-white shadow-lg ring-1 ring-white/10`}>
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{t.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{t.value}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                  <t.icon className="text-2xl text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">Sobriety trajectory · top 10</h2>
          <p className="mb-4 text-sm text-slate-500">Clinical pulse across your cohort</p>
          <div className="h-64">
            <Line data={progressChartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Individual progress</h2>
          <div className="space-y-3">
            {patients.slice(0, 10).map((patient) => (
              <div
                key={patient.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
                    <FaUsers />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{patient.name}</h3>
                    <p className="text-sm text-slate-500">Supervisor: {patient.supervisor?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="rounded-lg bg-violet-50 px-4 py-2 text-center dark:bg-violet-950/40">
                    <p className="font-bold text-violet-700 dark:text-violet-300">{patient.averageMood?.toFixed(1) || 0}</p>
                    <p className="text-[10px] font-semibold uppercase text-violet-600/80">Mood</p>
                  </div>
                  <div className="rounded-lg bg-cyan-50 px-4 py-2 text-center dark:bg-cyan-950/35">
                    <p className="font-bold text-cyan-700 dark:text-cyan-300">{patient.sobrietyDays || 0}</p>
                    <p className="text-[10px] font-semibold uppercase text-cyan-700/80">Days sober</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getRiskColor(patient.riskLevel)}`}>
                    {patient.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'risks') {
    const highRiskPatients = patients.filter(p => p.riskLevel === 'high');
    
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 p-6 text-center text-white shadow-lg ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">Low risk</p>
            <p className="mt-3 text-4xl font-bold tabular-nums">{stats.lowRisk}</p>
            <p className="mt-2 text-sm text-cyan-100">Stable cohort</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-center text-white shadow-lg ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">Medium</p>
            <p className="mt-3 text-4xl font-bold tabular-nums">{stats.mediumRisk}</p>
            <p className="mt-2 text-sm text-amber-100">Watch closely</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 p-6 text-center text-white shadow-lg ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">High risk</p>
            <p className="mt-3 text-4xl font-bold tabular-nums">{stats.highRisk}</p>
            <p className="mt-2 text-sm text-rose-100">Intervention priority</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-500">Distribution</h3>
            <div className="h-36">
              <Doughnut data={riskChartData} options={{ ...chartOptions, cutout: '60%' }} />
            </div>
          </div>
        </div>

        {/* High Risk Patients Alert */}
        {highRiskPatients.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <FaExclamationTriangle className="text-red-600 text-xl mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">High Risk Patients Requiring Attention</h3>
                <p className="text-red-700 mt-2">The following patients need immediate intervention:</p>
                <ul className="mt-3 space-y-2">
                  {highRiskPatients.map((patient) => (
                    <li key={patient.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-800">{patient.name}</span>
                        <p className="text-sm text-gray-600">Mood: {patient.averageMood?.toFixed(1) || 0}/10 | {patient.alertCount || 0} alerts</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setSelectedPatient(patient)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 px-6 py-4 dark:border-slate-600">
            <h2 className="text-lg font-bold text-white">Risk assessment · full roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mood Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className={`hover:bg-gray-50 ${patient.riskLevel === 'high' ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{patient.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(patient.riskLevel)}`}>
                        {patient.riskLevel?.charAt(0).toUpperCase() + patient.riskLevel?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.averageMood?.toFixed(1) || 0}/10
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${patient.alertCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {patient.alertCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.supervisor?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => setSelectedPatient(patient)}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Patient Details Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedPatient.name}</h3>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getRiskColor(selectedPatient.riskLevel)}`}>
                  <p className="font-semibold">Risk Level: {selectedPatient.riskLevel?.toUpperCase()}</p>
                  <p className="text-sm mt-1">
                    {selectedPatient.riskLevel === 'high' ? 'This patient requires immediate attention and intervention.' :
                     selectedPatient.riskLevel === 'medium' ? 'This patient needs regular monitoring.' :
                     'This patient is stable and progressing well.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedPatient.averageMood?.toFixed(1) || 0}</p>
                    <p className="text-xs text-gray-500">Avg Mood</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedPatient.sobrietyDays || 0}</p>
                    <p className="text-xs text-gray-500">Sobriety Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{selectedPatient.alertCount || 0}</p>
                    <p className="text-xs text-gray-500">Alerts</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Assigned Supervisor</label>
                  <p className="font-medium">{selectedPatient.supervisor?.name || 'Unassigned'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Contact</label>
                  <p className="font-medium">{selectedPatient.email}</p>
                  <p className="text-sm text-gray-500">{selectedPatient.phone || 'No phone'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default PatientManagement;