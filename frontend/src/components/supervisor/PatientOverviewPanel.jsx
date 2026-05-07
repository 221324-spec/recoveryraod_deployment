import React, { useState, useEffect } from 'react';
import { 
  FaUsers,
  FaUserMd,
  FaCalendarCheck,
  FaChartLine,
  FaEllipsisH,
  FaTrash,
  FaPen,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import socketService from '../../services/socketService';
import { apiService, getCurrentUserId } from '../../services/chatService';
import { apiFetch } from '../../config/env';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PatientOverviewPanel = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeRange, setActiveTimeRange] = useState('Last Week');
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);

  useEffect(() => {
    // Listen for real-time patient updates
    const handleMoodUpdate = (data) => {
      console.log('🎯 Real-time mood update received:', data);
      console.log('📊 Mood details:', {
        patientId: data.patientId,
        mood: data.moodEntry?.mood,
        moodValue: data.moodEntry?.moodValue,
        craving: data.moodEntry?.craving
      });
      setRealtimeUpdates(prev => [{
        type: 'mood',
        patientId: data.patientId,
        data: data.moodEntry,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
      
      // Update patient stats if available
      if (data.stats) {
        setPatients(prev => prev.map(p => {
          if (p.id === data.patientId || p.id === data.patientId.toString()) {
            console.log('📊 Updating patient from mood event:', p.name, data.stats);
            return { 
              ...p, 
              avgMood: data.stats.avgMood, 
              streakDays: data.stats.streakDays,
              status: data.stats.avgMood >= 3.5 ? 'stable' : data.stats.avgMood >= 2.5 ? 'mild-risk' : 'high-risk'
            };
          }
          return p;
        }));
      }
    };

    const handleTriggerUpdate = (data) => {
      console.log('🎯 Real-time trigger update received:', data);
      setRealtimeUpdates(prev => [{
        type: 'trigger',
        patientId: data.patientId,
        data: data.entry,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
    };

    const handleActivityUpdate = (data) => {
      console.log('🎯 Real-time activity update received:', data);
      setRealtimeUpdates(prev => [{
        type: 'activity',
        patientId: data.patientId,
        data: data.entry,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
    };

    const handleStatsUpdate = (data) => {
      console.log('🎯 Real-time stats update received:', data);
      if (data.stats && data.patientId) {
        setPatients(prev => prev.map(p => {
          if (p.id === data.patientId || p.id === data.patientId.toString()) {
            console.log('📊 Updating patient stats:', p.name, data.stats);
            return {
              ...p, 
              avgMood: data.stats.avgMood || p.avgMood,
              streakDays: data.stats.streakDays || p.streakDays,
              progress: Math.min(95, (data.stats.recoveryPoints || 0) / 10),
              status: data.stats.avgMood >= 3.5 ? 'stable' : data.stats.avgMood >= 2.5 ? 'mild-risk' : 'high-risk'
            };
          }
          return p;
        }));
      }
    };

    socketService.on('patient:mood:created', handleMoodUpdate);
    socketService.on('patient:trigger:created', handleTriggerUpdate);
    socketService.on('patient:activity:created', handleActivityUpdate);
    socketService.on('dashboard:stats:update', handleStatsUpdate);

    return () => {
      socketService.off('patient:mood:created', handleMoodUpdate);
      socketService.off('patient:trigger:created', handleTriggerUpdate);
      socketService.off('patient:activity:created', handleActivityUpdate);
      socketService.off('dashboard:stats:update', handleStatsUpdate);
    };
  }, []);

  useEffect(() => {
    const loadRealPatients = async () => {
      try {
        console.log('📥 Loading real patients from API...');
        const apiPatients = await apiService.getPatients();
        console.log('✅ Patients loaded:', apiPatients);
        
        if (apiPatients && apiPatients.length > 0) {
          // Fetch stats for each patient
          const patientsWithStats = await Promise.all(
            apiPatients.map(async (patient) => {
              try {
                const token = localStorage.getItem('token');
                const response = await apiFetch(`/api/patients/${patient._id}/moods/stats?range=7`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const statsData = await response.json();
                
                return {
                  id: patient._id,
                  name: patient.name || 'Unknown Patient',
                  status: statsData.avgMood >= 3.5 ? 'stable' : statsData.avgMood >= 2.5 ? 'mild-risk' : 'high-risk',
                  streakDays: statsData.streakDays || 0,
                  avgMood: statsData.avgMood || 0,
                  missedCheckIns: 7 - (statsData.totalCheckIns || 0),
                  avatar: patient.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P',
                  progress: Math.min(95, (statsData.recoveryPoints || 0) / 10),
                  department: patient.role === 'patient' ? 'Recovery Program' : 'Unknown'
                };
              } catch (error) {
                console.error(`Error fetching stats for patient ${patient._id}:`, error);
                return {
                  id: patient._id,
                  name: patient.name || 'Unknown Patient',
                  status: 'unknown',
                  streakDays: 0,
                  avgMood: 0,
                  missedCheckIns: 0,
                  avatar: patient.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P',
                  progress: 0,
                  department: 'Recovery Program'
                };
              }
            })
          );
          
          console.log('📊 Patients with stats:', patientsWithStats);
          setPatients(patientsWithStats);
        } else {
          console.log('No patients assigned to this supervisor');
          setPatients([]);
        }
      } catch (error) {
        console.error('❌ Error loading patients:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRealPatients();
  }, []);

  const totalPatients = patients.length;
  const stablePatients = patients.filter((p) => p.status === 'stable').length;
  const mildRiskPatients = patients.filter((p) => p.status === 'mild-risk').length;
  const highRiskPatients = patients.filter((p) => p.status === 'high-risk').length;
  const averageRecoveryRate = patients.length ? Math.round(patients.reduce((sum, p) => sum + p.progress, 0) / patients.length) : 0;
  const topPerformers = [...patients].sort((a, b) => b.progress - a.progress).slice(0, 3);
  const recentPatients = [...patients].slice(-3).reverse();
  const totalCheckIns = patients.reduce((sum, p) => sum + (7 - p.missedCheckIns), 0);

  const doughnutData = {
    labels: ['Stable', 'At Risk', 'High Risk'],
    datasets: [{
      data: [stablePatients, mildRiskPatients, highRiskPatients],
      backgroundColor: ['#c7d2fe', '#3b82f6', '#1e40af'],
      borderWidth: 0,
      cutout: '70%',
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 6 }
    }
  };

  const riskBarData = {
    labels: ['Stable', 'Mild Risk', 'High Risk', 'In Recovery', 'New Admits', 'Discharged'],
    datasets: [{
      data: [stablePatients * 200, mildRiskPatients * 150, highRiskPatients * 100, stablePatients * 180, mildRiskPatients * 80, highRiskPatients * 50],
      backgroundColor: '#3b82f6',
      borderRadius: 4,
      barThickness: 28,
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11, weight: 'bold' } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#0f172a', font: { size: 11, weight: 'bold' } }, beginAtZero: true }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[700px] bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 overflow-y-scroll custom-scrollbar">
      {/* Real-time Update Notifications */}
      {realtimeUpdates.length > 0 && (
        <div className="fixed top-20 right-6 z-50 space-y-2 max-w-sm">
          {realtimeUpdates.slice(0, 3).map((update, index) => (
            <div
              key={index}
              className="bg-white border-l-4 border-blue-500 rounded-lg shadow-xl p-4 animate-slide-in-right"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {update.type === 'mood' && '😊'}
                  {update.type === 'trigger' && '⚡'}
                  {update.type === 'activity' && '🏃'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {update.type === 'mood' && 'New Mood Entry'}
                    {update.type === 'trigger' && 'Trigger Logged'}
                    {update.type === 'activity' && 'Activity Completed'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Patient updated their {update.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-4 gap-5 mb-8">
          <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                <FaUsers className="text-white text-lg" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                <span>↑</span>
                <span>12%</span>
              </div>
            </div>
            <div>
              <p className="text-base font-extrabold mb-1.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Total Patients</p>
              <h2 className="text-3xl font-bold text-black mb-1">{totalPatients}</h2>
              <p className="text-xs font-bold" style={{color: '#000', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>vs past month</p>
            </div>
          </div>
          <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform duration-300">
                <FaExclamationTriangle className="text-white text-lg" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                <span>↑</span>
                <span>12%</span>
              </div>
            </div>
            <div>
              <p className="text-base font-extrabold mb-1.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Unresolved Alerts</p>
              <h2 className="text-3xl font-bold text-black mb-1">5</h2>
              <p className="text-xs font-bold" style={{color: '#000', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>vs past week</p>
            </div>
          </div>
          <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform duration-300">
                <FaCalendarCheck className="text-white text-lg" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                <span>↑</span>
                <span>15%</span>
              </div>
            </div>
            <div>
              <p className="text-base font-extrabold mb-1.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Weekly Check-ins</p>
              <h2 className="text-3xl font-bold text-black mb-1">{totalCheckIns}</h2>
              <p className="text-xs font-bold" style={{color: '#000', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>vs past week</p>
            </div>
          </div>
          <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                <FaChartLine className="text-white text-lg" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                <span>↑</span>
                <span>5%</span>
              </div>
            </div>
            <div>
              <p className="text-base font-extrabold mb-1.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Recovery Rate</p>
              <h2 className="text-3xl font-bold text-black mb-1">{averageRecoveryRate}%</h2>
              <p className="text-xs font-bold" style={{color: '#000', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>vs past month</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Patient Status</h3>
                <p className="text-xs font-bold mt-0.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Risk category breakdown</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                <FaEllipsisH className="text-sm" />
              </button>
            </div>
            <div className="flex items-center gap-8">
              <div className="relative w-48 h-48">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs font-bold" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Total Patients</p>
                  <p className="text-2xl font-bold text-black mt-1">{totalPatients}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-indigo-200 rounded-full"></span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-black">Stable</span>
                      <span className="text-sm font-bold text-black">{stablePatients}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-200 rounded-full" style={{ width: `${(stablePatients / totalPatients) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-black">At Risk</span>
                      <span className="text-sm font-bold text-black">{mildRiskPatients}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(mildRiskPatients / totalPatients) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-blue-800 rounded-full"></span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-black">High Risk</span>
                      <span className="text-sm font-bold text-black">{highRiskPatients}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-800 rounded-full" style={{ width: `${(highRiskPatients / totalPatients) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Risk Distribution</h3>
                <p className="text-xs font-bold mt-0.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Recovery program analytics</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Total Cases</span>
                <span className="text-sm font-bold text-black">{totalPatients}</span>
              </div>
            </div>
            <div className="h-52">
              <Bar data={riskBarData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="text-base font-bold" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Top Performers</h3>
                <p className="text-xs font-bold mt-0.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Highest recovery progress</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 hover:bg-white p-2 rounded-lg transition-colors">
                <FaEllipsisH className="text-sm" />
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="text-left text-xs font-extrabold text-black px-6 py-3">Patient</th>
                  <th className="text-left text-xs font-extrabold text-black px-6 py-3">Progress</th>
                  <th className="text-left text-xs font-extrabold text-black px-6 py-3">Status</th>
                  <th className="text-right text-xs font-extrabold text-black px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-105 transition-transform">{patient.avatar}</div>
                        <span className="text-sm font-bold text-black">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${patient.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-black min-w-[3rem] text-right">{patient.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${patient.status === 'stable' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : patient.status === 'mild-risk' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${patient.status === 'stable' ? 'bg-indigo-500' : patient.status === 'mild-risk' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                        {patient.status === 'stable' ? 'Stable' : patient.status === 'mild-risk' ? 'At Risk' : 'High Risk'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><FaTrash className="text-xs" /></button>
                        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><FaPen className="text-xs" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="text-base font-bold" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Recent Patients</h3>
                <p className="text-xs font-bold mt-0.5" style={{color: '#000 !important', fontWeight: 'bold', textShadow: 'none', WebkitTextStroke: '0px', WebkitTextFillColor: '#000', MozTextFillColor: '#000', msTextFillColor: '#000', textDecoration: 'none', background: 'none', boxShadow: 'none', filter: 'none', opacity: 1}}>Latest admissions</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 hover:bg-white p-2 rounded-lg transition-colors">
                <FaEllipsisH className="text-sm" />
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="text-left text-xs font-extrabold text-black px-6 py-3">Name</th>
                  <th className="text-left text-xs font-extrabold text-black px-6 py-3">Department</th>
                  <th className="text-left text-xs font-extrabold text-black px-6 py-3">Status</th>
                  <th className="text-right text-xs font-extrabold text-black px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-105 transition-transform">{patient.avatar}</div>
                        <span className="text-sm font-bold text-black">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black font-bold">{patient.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${patient.status === 'stable' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : patient.status === 'mild-risk' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${patient.status === 'stable' ? 'bg-indigo-500' : patient.status === 'mild-risk' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                        {patient.status === 'stable' ? 'Stable' : patient.status === 'mild-risk' ? 'At Risk' : 'High Risk'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><FaTrash className="text-xs" /></button>
                        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><FaPen className="text-xs" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOverviewPanel;
