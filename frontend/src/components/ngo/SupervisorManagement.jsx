import React, { useState, useEffect, useCallback } from 'react';
import { FaUserMd, FaEdit, FaTrash, FaSearch, FaUserCheck, FaUserTimes, FaSync, FaExclamationTriangle, FaUsers, FaCheck, FaTimes, FaClipboardList, FaUserTie, FaEnvelope, FaPhone, FaCalendar, FaCheckCircle, FaExclamationCircle, FaClock, FaTrophy } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';

const SupervisorManagement = ({ view, onNavigate, onRegisterContentRefresh }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Data states
  const [supervisors, setSupervisors] = useState([]);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  
  // Enhanced UI states
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedSupervisorForAssignment, setSelectedSupervisorForAssignment] = useState('');
  
  // Form state for adding new supervisor
  const [newSupervisor, setNewSupervisor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: [],
    licenseNumber: '',
    yearsOfExperience: ''
  });

  // Fetch supervisors from API
  const fetchSupervisors = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await apiFetch('/api/ngo/supervisors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch supervisors');
      }
      
      const result = await response.json();
      if (result.success) {
        setSupervisors(result.data);
      }
    } catch (err) {
      console.error('Fetch supervisors error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available supervisors (not in organization)
  const fetchAvailableSupervisors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await apiFetch('/api/ngo/supervisors/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableSupervisors(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch available supervisors error:', err);
    }
  }, []);

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await apiFetch('/api/ngo/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPatients(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch patients error:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSupervisors();
    fetchAvailableSupervisors();
    fetchPatients();
  }, [fetchSupervisors, fetchAvailableSupervisors, fetchPatients]);

  const refreshSupervisorList = useCallback(() => {
    fetchSupervisors();
    fetchAvailableSupervisors();
  }, [fetchSupervisors, fetchAvailableSupervisors]);

  const refreshAssignView = useCallback(() => {
    fetchSupervisors();
    fetchAvailableSupervisors();
    fetchPatients();
  }, [fetchSupervisors, fetchAvailableSupervisors, fetchPatients]);

  useEffect(() => {
    if (!onRegisterContentRefresh) return;
    const fn =
      view === 'list' || view === 'add'
        ? refreshSupervisorList
        : view === 'assign'
          ? refreshAssignView
          : null;
    onRegisterContentRefresh(fn);
    return () => onRegisterContentRefresh(null);
  }, [view, onRegisterContentRefresh, refreshSupervisorList, refreshAssignView]);

  // Socket listeners
  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket && user?.id) {
      socket.on('ngo:supervisor:assigned', () => {
        fetchSupervisors();
        fetchAvailableSupervisors();
      });
      
      socket.on('ngo:supervisor:removed', () => {
        fetchSupervisors();
        fetchAvailableSupervisors();
      });
      
      socket.on('ngo:patient:supervisor:changed', () => {
        fetchSupervisors();
        fetchPatients();
      });
      
      socket.on('supervisor:registered', () => {
        fetchAvailableSupervisors();
      });
    }
    
    return () => {
      if (socket) {
        socket.off('ngo:supervisor:assigned');
        socket.off('ngo:supervisor:removed');
        socket.off('ngo:patient:supervisor:changed');
        socket.off('supervisor:registered');
      }
    };
  }, [user, fetchSupervisors, fetchAvailableSupervisors, fetchPatients]);

  const filteredSupervisors = supervisors.filter(supervisor => {
    const matchesSearch = supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supervisor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && supervisor.isActive !== false) ||
                         (filterStatus === 'inactive' && supervisor.isActive === false);
    return matchesSearch && matchesStatus;
  });

  const handleAssignSupervisor = async (supervisorId) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // First approve the supervisor
      const approveResponse = await apiFetch(`/api/ngo/supervisors/${supervisorId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const approveResult = await approveResponse.json();
      
      if (approveResult.success) {
        setSuccessMessage('Supervisor approved and added to organization!');
        fetchSupervisors();
        fetchAvailableSupervisors();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(approveResult.message || 'Failed to approve supervisor');
      }
    } catch (err) {
      console.error('Approve supervisor error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSupervisor = async (supervisorId) => {
    if (!window.confirm('Are you sure you want to remove this supervisor from your organization?')) {
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await apiFetch(`/api/ngo/supervisors/${supervisorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Supervisor removed successfully!');
        fetchSupervisors();
        fetchAvailableSupervisors();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to remove supervisor');
      }
    } catch (err) {
      console.error('Remove supervisor error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPatientToSupervisor = async (patientId, supervisorId) => {
    if (!supervisorId) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await apiFetch(`/api/ngo/patients/${patientId}/assign-supervisor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ supervisorId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Patient assigned to supervisor!');
        fetchSupervisors();
        fetchPatients();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to assign patient');
      }
    } catch (err) {
      console.error('Assign patient error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSupervisor = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Create the supervisor user first
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newSupervisor,
          role: 'supervisor',
          password: 'TempPass123!' // Temporary password
        })
      });
      
      const result = await response.json();
      
      if (result.success || result.user) {
        // Then assign to organization
        const supervisorId = result.user?._id || result.userId;
        if (supervisorId) {
          await handleAssignSupervisor(supervisorId);
        }
        
        setSuccessMessage('Supervisor added successfully!');
        setNewSupervisor({
          name: '',
          email: '',
          phone: '',
          specialization: [],
          licenseNumber: '',
          yearsOfExperience: ''
        });
        
        // Navigate back to list
        if (onNavigate) {
          onNavigate('supervisors');
        }
      } else {
        throw new Error(result.message || 'Failed to create supervisor');
      }
    } catch (err) {
      console.error('Add supervisor error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supervisors...</p>
        </div>
      </div>
    );
  }

  // Success message banner
  const SuccessBanner = () => successMessage ? (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 mb-6 flex items-center dark:border-sky-800 dark:bg-sky-950/40">
      <FaCheck className="mr-3 text-sky-600 dark:text-sky-400" />
      <span className="font-medium text-sky-900 dark:text-sky-100">{successMessage}</span>
    </div>
  ) : null;

  // Error banner
  const ErrorBanner = () => error ? (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
      <FaExclamationTriangle className="text-red-500 mr-3" />
      <span className="text-red-700">{error}</span>
      <button 
        onClick={() => setError(null)}
        className="ml-auto text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  ) : null;

  if (view === 'list') {
    return (
      <div className="w-full space-y-6">
        <SuccessBanner />
        <ErrorBanner />

        {/* Search & filters — Recovery Road panel */}
        <div className="rounded-2xl p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/15">
          <div className="rounded-[14px] bg-white dark:bg-slate-900 p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="text"
                  placeholder="Search supervisors by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[160px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Supervisors', value: supervisors.length, icon: FaUserTie, from: 'from-blue-600', to: 'to-indigo-700' },
            { label: 'Active', value: supervisors.filter(s => s.isActive !== false).length, icon: FaCheckCircle, from: 'from-sky-500', to: 'to-cyan-600' },
            { label: 'Org Patients', value: patients.length, icon: FaUsers, from: 'from-violet-600', to: 'to-purple-700' },
            { label: 'Unassigned', value: patients.filter(p => !p.supervisor).length, icon: FaExclamationCircle, from: 'from-amber-500', to: 'to-orange-600' },
            { label: 'Pending approval', value: availableSupervisors.length, icon: FaClock, from: 'from-rose-500', to: 'to-pink-600' },
          ].map((tile, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tile.from} ${tile.to} p-5 text-white shadow-lg ring-1 ring-white/10`}
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{tile.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{tile.value}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                  <tile.icon className="text-xl text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Supervisor Approvals Section */}
        {availableSupervisors.length > 0 && (
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50/60 p-6 md:p-8 shadow-md shadow-amber-500/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FaClock className="text-amber-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                  <p className="text-sm text-gray-600">{availableSupervisors.length} supervisor{availableSupervisors.length !== 1 ? 's' : ''} awaiting your approval</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                Action Required
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSupervisors.map((supervisor) => (
                <div key={supervisor.id} className="bg-white rounded-xl p-5 border border-amber-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <FaUserTie className="text-white text-lg" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{supervisor.name}</h3>
                        <p className="text-sm text-gray-500">{supervisor.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendar className="mr-2 text-gray-400" />
                      <span>Registered: {new Date(supervisor.registeredAt).toLocaleDateString()}</span>
                    </div>
                    {supervisor.yearsOfExperience > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaTrophy className="mr-2 text-gray-400" />
                        <span>{supervisor.yearsOfExperience} years experience</span>
                      </div>
                    )}
                  </div>
                  
                  {supervisor.specialization && supervisor.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {supervisor.specialization.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {spec.replace('-', ' ')}
                        </span>
                      ))}
                      {supervisor.specialization.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{supervisor.specialization.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleAssignSupervisor(supervisor.id)}
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

        {/* Supervisor profiles + nested patients */}
        <div className="space-y-6">
          {filteredSupervisors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-12 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                <FaUserTie className="text-2xl" />
              </div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">No supervisors match your filters</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Try a different search or clear filters</p>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('assign')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
              >
                <FaUserCheck />
                Assign patients & supervisors
              </button>
            </div>
          ) : (
            filteredSupervisors.map((supervisor) => {
              const assignedPatients = patients.filter(p => p.supervisor?.id === supervisor.id);
              const activeUnderCare = assignedPatients.filter(p => p.isActive !== false).length;
              const highRisk = assignedPatients.filter(p => p.riskLevel === 'high').length;

              return (
                <article
                  key={supervisor.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-400/10 ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5"
                >
                  {/* Profile header */}
                  <div className="relative bg-gradient-to-r from-[#0f2744] via-[#1e3a8a] to-[#4338ca] px-6 py-6 text-white md:px-8 md:py-7">
                    <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" aria-hidden />
                    <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/30 backdrop-blur-md md:h-16 md:w-16">
                          <FaUserTie className="text-2xl text-white md:text-3xl" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold tracking-tight md:text-2xl">{supervisor.name}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-blue-100">
                            <span className="flex items-center gap-1.5 truncate">
                              <FaEnvelope className="shrink-0 opacity-80" />
                              <span className="truncate">{supervisor.email}</span>
                            </span>
                            {supervisor.phone && (
                              <span className="flex items-center gap-1.5">
                                <FaPhone className="shrink-0 opacity-80" />
                                {supervisor.phone}
                              </span>
                            )}
                          </div>
                          {supervisor.specialization && supervisor.specialization.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {supervisor.specialization.map((spec, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-medium backdrop-blur-sm"
                                >
                                  {spec.replace('-', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
                            supervisor.isActive !== false
                              ? 'bg-sky-400/25 text-sky-100 ring-1 ring-sky-300/40'
                              : 'bg-rose-500/30 text-rose-100 ring-1 ring-rose-300/40'
                          }`}
                        >
                          {supervisor.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metric strip */}
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/90 p-4 md:grid-cols-4 md:gap-4 md:p-5 dark:border-slate-700 dark:bg-slate-800/50">
                    {[
                      { label: 'Assigned', value: assignedPatients.length, accent: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50' },
                      { label: 'Active under care', value: activeUnderCare, accent: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
                      { label: 'Experience (yrs)', value: supervisor.yearsOfExperience || 0, accent: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
                      { label: 'High risk', value: highRisk, accent: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/35' },
                    ].map((m) => (
                      <div key={m.label} className={`rounded-xl ${m.bg} px-4 py-3 text-center ring-1 ring-black/5 dark:ring-white/10`}>
                        <p className={`text-2xl font-bold tabular-nums ${m.accent}`}>{m.value}</p>
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Nested assigned patients — always visible */}
                  <div className="bg-gradient-to-b from-slate-50 to-white px-5 py-6 md:px-8 md:py-7 dark:from-slate-900 dark:to-slate-900">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                          <FaClipboardList className="text-sm" />
                        </span>
                        Care roster
                        <span className="ml-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {assignedPatients.length}
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('assign')}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        Manage assignments →
                      </button>
                    </div>

                    {assignedPatients.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 py-10 text-center dark:border-slate-600 dark:bg-slate-800/40">
                        <FaUsers className="mx-auto mb-2 text-3xl text-slate-300 dark:text-slate-600" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">No patients assigned to this supervisor yet</p>
                        <p className="mt-1 text-sm text-slate-500">Use Assignments in the sidebar to link patients</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {assignedPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className={`group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800/80 ${
                              patient.riskLevel === 'high'
                                ? 'border-rose-200 ring-1 ring-rose-100 dark:border-rose-900/60 dark:ring-rose-950/50'
                                : patient.riskLevel === 'medium'
                                  ? 'border-amber-200 ring-1 ring-amber-50 dark:border-amber-900/50'
                                  : 'border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <div
                              className={`absolute left-0 top-0 h-full w-1 ${
                                patient.riskLevel === 'high'
                                  ? 'bg-rose-500'
                                  : patient.riskLevel === 'medium'
                                    ? 'bg-amber-400'
                                    : 'bg-sky-500'
                              }`}
                              aria-hidden
                            />
                            <div className="pl-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{patient.name}</p>
                                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{patient.email}</p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    patient.isActive !== false
                                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {patient.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span
                                  className={`rounded-lg px-2 py-1 font-semibold ${
                                    patient.riskLevel === 'high'
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                      : patient.riskLevel === 'medium'
                                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                                        : 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200'
                                  }`}
                                >
                                  Risk: {patient.riskLevel || 'low'}
                                </span>
                                <span className="rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                  Mood {patient.averageMood?.toFixed(1) ?? '—'}/10
                                </span>
                                {(patient.sobrietyDays != null && patient.sobrietyDays > 0) && (
                                  <span className="rounded-lg bg-violet-50 px-2 py-1 font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                    {patient.sobrietyDays}d sober
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 md:px-8 dark:border-slate-700 dark:bg-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setSelectedSupervisor(supervisor)}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                    >
                      <FaEdit />
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupervisor(supervisor.id)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <FaTrash />
                      Remove from org
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
        
        {/* Supervisor Details Modal */}
        {selectedSupervisor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedSupervisor.name}</h3>
                <button 
                  onClick={() => setSelectedSupervisor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedSupervisor.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{selectedSupervisor.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">License</label>
                  <p className="font-medium">{selectedSupervisor.licenseNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Specializations</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(selectedSupervisor.specialization || []).map((spec, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Assigned Patients ({selectedSupervisor.patients?.length || 0})</label>
                  <div className="mt-2 space-y-2">
                    {(selectedSupervisor.patients || []).map((patient, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{patient.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${patient.isActive !== false ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-600'}`}>
                          {patient.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                    {(!selectedSupervisor.patients || selectedSupervisor.patients.length === 0) && (
                      <p className="text-gray-500 text-sm">No patients assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'assign') {
    const unassignedPatients = patients.filter(p => !p.supervisor);
    const assignedPatients = patients.filter(p => p.supervisor);
    
    return (
      <div className="w-full space-y-6">
        <SuccessBanner />
        <ErrorBanner />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Unassigned patients', value: unassignedPatients.length, icon: FaExclamationCircle, from: 'from-amber-500', to: 'to-orange-600' },
            { label: 'Assigned patients', value: assignedPatients.length, icon: FaCheckCircle, from: 'from-sky-500', to: 'to-cyan-600' },
            { label: 'Active supervisors', value: supervisors.filter(s => s.isActive !== false).length, icon: FaUserTie, from: 'from-indigo-600', to: 'to-blue-700' },
          ].map((t, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.from} ${t.to} p-6 text-white shadow-lg ring-1 ring-white/10`}>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 dark:border-slate-600">
            <div className="flex items-center justify-between text-white">
              <h2 className="text-lg font-bold">Pending supervisor approvals</h2>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{availableSupervisors.length} pending</span>
            </div>
          </div>
          <div className="p-6">
          {availableSupervisors.length === 0 ? (
            <div className="text-center py-8">
              <FaUserTie className="text-gray-300 text-4xl mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No supervisors pending approval</p>
              <p className="text-gray-400 text-sm">New supervisor registrations will appear here for your approval</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSupervisors.map((supervisor) => (
                <div key={supervisor.id} className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 transition-all hover:border-indigo-300 hover:shadow-md dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FaUserTie className="text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{supervisor.name}</h3>
                        <p className="text-sm text-gray-500">{supervisor.email}</p>
                        <p className="text-xs text-yellow-600 font-medium mt-1">⏳ Pending Approval</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignSupervisor(supervisor.id)}
                      disabled={saving}
                      className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-colors"
                    >
                      <FaUserCheck className="inline mr-1" />
                      Approve
                    </button>
                  </div>
                  
                  {supervisor.specialization && supervisor.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {supervisor.specialization.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {spec.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Assignment Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Patients */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-orange-200 bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Unassigned patients</h2>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">{unassignedPatients.length}</span>
            </div>
            <div className="p-6">
            
            {unassignedPatients.length === 0 ? (
              <div className="py-10 text-center">
                <FaCheckCircle className="mx-auto mb-3 text-4xl text-sky-400" />
                <p className="font-medium text-slate-600 dark:text-slate-400">All patients have supervisors</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {unassignedPatients.map((patient) => (
                  <div key={patient.id} className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-orange-900/40 dark:bg-orange-950/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <FaUsers className="text-orange-600 text-sm" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{patient.name}</span>
                        <p className="text-xs text-gray-500">{patient.email}</p>
                      </div>
                    </div>
                    <select
                      onChange={(e) => handleAssignPatientToSupervisor(patient.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      defaultValue=""
                      disabled={saving}
                    >
                      <option value="" disabled>Assign to...</option>
                      {supervisors.filter(s => s.isActive !== false).map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} ({patients.filter(p => p.supervisor?.id === supervisor.id).length} patients)
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Current Assignments */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-cyan-700 bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Current assignments</h2>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">{assignedPatients.length}</span>
            </div>
            <div className="p-6">
            {assignedPatients.length === 0 ? (
              <div className="py-10 text-center">
                <FaClipboardList className="mx-auto mb-3 text-4xl text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500">No patient assignments yet</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {assignedPatients.map((patient) => (
                  <div key={patient.id} className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-900/40 dark:from-sky-950/30 dark:to-cyan-950/30">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/40">
                        <FaUsers className="text-sm text-cyan-700 dark:text-cyan-300" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{patient.name}</span>
                        <p className="text-xs text-gray-600">→ {patient.supervisor?.name || 'Supervisor'}</p>
                      </div>
                    </div>
                    <select
                      onChange={(e) => handleAssignPatientToSupervisor(patient.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      defaultValue={patient.supervisor?.id || ''}
                      disabled={saving}
                    >
                      {supervisors.filter(s => s.isActive !== false).map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'add') {
    return (
      <div className="w-full">
        <SuccessBanner />
        <ErrorBanner />

        <div className="flex justify-end mb-6">
          <button
            onClick={() => onNavigate && onNavigate('supervisors')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FaTimes />
            <span>Cancel</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleAddSupervisor} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaUserTie className="mr-3 text-purple-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupervisor.name}
                    onChange={(e) => setNewSupervisor({ ...newSupervisor, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newSupervisor.email}
                    onChange={(e) => setNewSupervisor({ ...newSupervisor, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newSupervisor.phone}
                    onChange={(e) => setNewSupervisor({ ...newSupervisor, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={newSupervisor.yearsOfExperience}
                    onChange={(e) => setNewSupervisor({ ...newSupervisor, yearsOfExperience: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Years of experience"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaClipboardList className="mr-3 text-purple-600" />
                Professional Information
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">Specializations</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'addiction', label: 'Addiction Counseling' },
                    { key: 'mental-health', label: 'Mental Health' },
                    { key: 'family-therapy', label: 'Family Therapy' },
                    { key: 'crisis', label: 'Crisis Intervention' },
                    { key: 'dual-diagnosis', label: 'Dual Diagnosis' },
                    { key: 'youth', label: 'Youth Counseling' },
                    { key: 'trauma', label: 'Trauma Therapy' },
                    { key: 'substance-abuse', label: 'Substance Abuse' }
                  ].map((spec) => (
                    <label key={spec.key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={newSupervisor.specialization.includes(spec.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSupervisor({ 
                              ...newSupervisor, 
                              specialization: [...newSupervisor.specialization, spec.key] 
                            });
                          } else {
                            setNewSupervisor({ 
                              ...newSupervisor, 
                              specialization: newSupervisor.specialization.filter(s => s !== spec.key) 
                            });
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{spec.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                <input
                  type="text"
                  value={newSupervisor.licenseNumber}
                  onChange={(e) => setNewSupervisor({ ...newSupervisor, licenseNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter license number"
                />
              </div>
            </div>

            {/* Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <FaExclamationCircle className="text-blue-600 text-lg mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">Important Information</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• A temporary password will be created for the new supervisor</li>
                    <li>• They will receive an email to set their own password</li>
                    <li>• The supervisor will be automatically assigned to your organization</li>
                    <li>• You can manage their patient assignments after creation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('supervisors')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving && <FaSync className="animate-spin" />}
                <span>{saving ? 'Creating Supervisor...' : 'Create Supervisor'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default SupervisorManagement;