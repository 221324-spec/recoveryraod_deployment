import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler as ChartFiller,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { FaChartLine, FaPen, FaSmile, FaBolt } from 'react-icons/fa';
import socketService from '../../services/socketService';
import { apiService, getCurrentUserId } from '../../services/chatService';
import { apiFetch } from '../../config/env';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartFiller
);

export default function DailyLogsViewer({ selectedPatient, onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [directoryFilter, setDirectoryFilter] = useState('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [logs, setLogs] = useState([]);

  // Listen for real-time patient activity updates
  useEffect(() => {
    const handleMoodUpdate = (data) => {
      if (!selectedPatient || data.patientId !== selectedPatient.id) return;
      
      console.log('📊 Real-time mood log received:', data);
      const mapMoodToValue = (m) => {
        if (!m) return 0;
        const lower = String(m).toLowerCase();
        if (lower === 'great' || lower === '😊' || lower === '😄' || lower === 'happy') return 4;
        if (lower === 'okay' || lower === '😐' || lower === 'neutral') return 3;
        if (lower === 'down' || lower === '😔' || lower === 'sad') return 2;
        if (lower === 'angry' || lower === '😡' || lower === '😠') return 1;
        return 3;
      };

      const newLog = {
        source: 'mood',
        date: data.moodEntry.timestamp || data.moodEntry.createdAt || new Date().toISOString(),
        moodRaw: data.moodEntry.mood,
        moodValue: data.moodEntry.moodValue || mapMoodToValue(data.moodEntry.mood),
        craving: data.moodEntry.craving || 0,
        journal: data.moodEntry.journal || '',
      };

      setLogs(prev => [newLog, ...prev]);
    };

    const handleTriggerUpdate = (data) => {
      if (!selectedPatient || data.patientId !== selectedPatient.id) return;
      
      console.log('📊 Real-time trigger log received:', data);
      const newLog = {
        source: 'trigger',
        date: data.entry.timestamp || data.entry.createdAt || new Date().toISOString(),
        triggers: data.entry.triggers || [],
        customTrigger: data.entry.customTrigger || null,
      };

      setLogs(prev => [newLog, ...prev]);
    };

    const handleActivityUpdate = (data) => {
      if (!selectedPatient || data.patientId !== selectedPatient.id) return;
      
      console.log('📊 Real-time activity log received:', data);
      const newLog = {
        source: 'activity',
        date: data.entry.timestamp || data.entry.createdAt || new Date().toISOString(),
        activity: data.entry.activity || data.entry.label || 'Activity',
        status: data.entry.status || 'completed',
        points: data.entry.points || 0,
        notes: data.entry.notes || '',
      };

      setLogs(prev => [newLog, ...prev]);
    };

    socketService.on('patient:mood:created', handleMoodUpdate);
    socketService.on('patient:trigger:created', handleTriggerUpdate);
    socketService.on('patient:activity:created', handleActivityUpdate);

    return () => {
      socketService.off('patient:mood:created', handleMoodUpdate);
      socketService.off('patient:trigger:created', handleTriggerUpdate);
      socketService.off('patient:activity:created', handleActivityUpdate);
    };
  }, [selectedPatient]);

  useEffect(() => {
    // Fetch real patients from API
    const loadRealPatients = async () => {
      try {
        console.log('📥 Loading real patients for daily logs...');
        const apiPatients = await apiService.getPatients();
        console.log('✅ Patients loaded:', apiPatients);
        
        if (apiPatients && apiPatients.length > 0) {
          const formattedPatients = apiPatients.map(patient => ({
            id: patient._id,
            name: patient.name || 'Unknown Patient',
            age: patient.age || null,
            status: 'stable',
            avatar: patient.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'
          }));
          
          setPatients(formattedPatients);
          
          // Auto-select the first patient if none selected
          if (!selectedPatient && formattedPatients.length > 0) {
            const firstPatient = formattedPatients[0];
            if (firstPatient && onSelectPatient) {
              console.log('✅ Auto-selecting patient for daily logs:', firstPatient.name);
              onSelectPatient(firstPatient);
            }
          }
        } else {
          console.log('No patients assigned to this supervisor');
          setPatients([]);
        }
      } catch (error) {
        console.error('❌ Error loading patients:', error);
        setPatients([]);
      }
    };
    
    loadRealPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setLogs([]);
      return;
    }
    
    // Fetch real patient logs from API
    const loadPatientLogs = async () => {
      try {
        console.log('📥 Loading logs for patient:', selectedPatient.name, selectedPatient.id);
        
        // Helper to map mood values (labels or emojis) to numeric
        const mapMoodToValue = (m) => {
          if (!m) return 0;
          const lower = String(m).toLowerCase();
          if (lower === 'great' || lower === '😊' || lower === '😄' || lower === 'happy') return 4;
          if (lower === 'okay' || lower === '😐' || lower === 'neutral') return 3;
          if (lower === 'down' || lower === '😔' || lower === 'sad') return 2;
          if (lower === 'angry' || lower === '😡' || lower === '😠') return 1;
          const n = Number(m);
          return Number.isFinite(n) ? n : 0;
        };
        
        // Fetch moods, triggers, and activities from API
        const token = localStorage.getItem('token');
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
        const [moodsRes, triggersRes, activitiesRes] = await Promise.all([
          apiFetch(`/api/patients/${selectedPatient.id}/moods?range=30`, authHeaders).then(r => r.ok ? r.json() : { moods: [] }),
          apiFetch(`/api/patients/${selectedPatient.id}/triggers?limit=30`, authHeaders).then(r => r.ok ? r.json() : { triggers: [] }),
          apiFetch(`/api/patients/${selectedPatient.id}/activities`, authHeaders).then(r => r.ok ? r.json() : { activities: [] })
        ]);

        console.log('📊 API Responses:', { 
          moods: moodsRes.moods?.length, 
          triggers: triggersRes.triggers?.length, 
          activities: activitiesRes.activities?.length 
        });

        const normalizedMood = (moodsRes.moods || []).map((e) => ({
          source: 'mood',
          date: e.timestamp || e.createdAt || new Date().toISOString(),
          moodRaw: e.mood,
          moodValue: e.moodValue || mapMoodToValue(e.mood),
          craving: typeof e.craving === 'number' ? e.craving : Number(e.craving) || 0,
          journal: e.journal || '',
        }));

        const normalizedActivity = (activitiesRes.activities || []).map((e) => ({
          source: 'activity',
          date: e.timestamp || e.createdAt || new Date().toISOString(),
          activity: e.activity || e.label || 'Activity',
          status: e.status || 'completed',
          points: e.points || 0,
          notes: e.notes || '',
        }));

        const normalizedTrigger = (triggersRes.triggers || []).map((e) => ({
          source: 'trigger',
          date: e.timestamp || e.createdAt || new Date().toISOString(),
          triggers: e.triggers || [],
          customTrigger: e.customTrigger || null,
        }));

        const combined = [...normalizedMood, ...normalizedActivity, ...normalizedTrigger]
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('✅ Logs loaded:', combined.length, 'entries');
        setLogs(combined);
      } catch (err) {
        console.error('❌ Failed to load patient logs from API:', err);
        setLogs([]);
      }
    };
    
    loadPatientLogs();
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesFilter = directoryFilter === 'all' ? true : p.status === directoryFilter;
      const matchesSearch = p.name.toLowerCase().includes(directorySearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [patients, directoryFilter, directorySearch]);

  // Compute stats from normalized logs; only use relevant sources
  const moodEntries = logs.filter((l) => l.source === 'mood');
  const activityEntries = logs.filter((l) => l.source === 'activity');
  const triggerEntries = logs.filter((l) => l.source === 'trigger');

  const checkIns = moodEntries.length;
  const avgMood = moodEntries.length ? (moodEntries.reduce((s, l) => s + (l.moodValue || 0), 0) / moodEntries.length).toFixed(1) : '0.0';
  const avgCraving = moodEntries.length ? (moodEntries.reduce((s, l) => s + (l.craving || 0), 0) / moodEntries.length).toFixed(1) : '0.0';

  const chartData = useMemo(
    () => ({
      // Chart shows only mood & craving over time (mood entries)
      labels: moodEntries.map((l) => new Date(l.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Mood',
          data: moodEntries.map((l) => l.moodValue),
          borderColor: 'rgba(59,130,246,1)',
          backgroundColor: 'rgba(59,130,246,0.08)',
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Craving',
          data: moodEntries.map((l) => l.craving),
          borderColor: 'rgba(239,68,68,1)',
          backgroundColor: 'rgba(239,68,68,0.08)',
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [moodEntries]
  );

  const activityData = useMemo(() => {
    // Count activities from activityEntries (these come from patient activityLog)
    const counts = activityEntries.reduce((acc, l) => {
      const name = l.activity || 'Activity';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Activity Frequency',
          data: Object.values(counts),
          backgroundColor: Object.keys(counts).map((_, i) => `rgba(${50 + i * 30}, ${120 + i * 10}, ${200 - i * 20}, 0.8)`),
        },
      ],
    };
  }, [activityEntries]);

  const chartOptions = { responsive: true, maintainAspectRatio: false };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Daily Logs Viewer</h2>
        <p className="text-sm text-gray-600">Realtime-style analytics for selected patient.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <aside className="col-span-1 bg-white p-3 rounded-lg border border-gray-200">
          <div className="font-semibold mb-2">Patient Directory</div>
          <div className="flex gap-2 mb-3">
            <select
              value={directoryFilter}
              onChange={(e) => setDirectoryFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="stable">Stable</option>
              <option value="mild-risk">Mild Risk</option>
              <option value="high-risk">High Risk</option>
            </select>
            <input
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              placeholder="Search"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-2">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient && onSelectPatient(p)}
                className={`w-full text-left p-2 rounded hover:bg-gray-50 border border-gray-100 ${selectedPatient?.id === p.id ? 'ring-2 ring-indigo-300' : ''}`}>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">{p.age} yrs • {p.status.replace('-', ' ')}</div>
              </button>
            ))}
            {!filteredPatients.length && <div className="text-xs text-gray-500">No patients</div>}
          </div>
        </aside>

        <main className="col-span-3 bg-white p-4 rounded-lg border border-gray-200">
          {selectedPatient ? (
            <div>
              <h3 className="font-semibold flex items-center gap-3"><FaChartLine /> {selectedPatient.name}</h3>

              <div className="mt-4 grid grid-cols-4 gap-4">
                <StatCard label="Check-ins" value={checkIns} icon={<FaPen />} />
                <StatCard label="Avg Mood" value={`${avgMood} / 4`} icon={<FaSmile />} />
                <StatCard label="Avg Craving" value={`${avgCraving} / 10`} icon={<FaBolt />} />
                <StatCard label="Total Activities" value={activityEntries.length} icon={<FaChartLine />} />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4">
                <StatCard label="Most Frequent Activity" value={(() => {
                  const counts = activityEntries.reduce((acc, l) => { const name = l.activity || 'Activity'; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
                  const entries = Object.entries(counts);
                  if (!entries.length) return '—';
                  entries.sort((a,b) => b[1] - a[1]);
                  return `${entries[0][0]} (${entries[0][1]})`;
                })()} />
                <StatCard label="Mood Variability" value={(() => {
                  if (!moodEntries.length) return '0.00';
                  const mean = moodEntries.reduce((s,l) => s + (l.moodValue || 0), 0) / moodEntries.length;
                  const variance = moodEntries.reduce((s,l) => s + Math.pow((l.moodValue || 0) - mean, 2), 0) / moodEntries.length;
                  return Math.sqrt(variance).toFixed(2);
                })()} />
                <StatCard label="Last Check-in" value={(() => {
                  if (!moodEntries.length) return '—';
                  const latest = moodEntries.slice().sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                  return new Date(latest.date).toLocaleDateString();
                })()} />
                <StatCard label="Positive Days %" value={(() => {
                  if (!moodEntries.length) return '0%';
                  const positive = moodEntries.filter(l => (l.moodValue || 0) >= 3).length;
                  return `${Math.round((positive / moodEntries.length) * 100)}%`;
                })()} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="h-56 bg-white p-3 border rounded">
                  <div className="text-sm font-semibold mb-2">Mood & Craving Trends</div>
                  <div className="h-40">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
                <div className="h-56 bg-white p-3 border rounded">
                  <div className="text-sm font-semibold mb-2">Activity Frequency</div>
                  <div className="h-40">
                    <Bar data={activityData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="Select a patient to view logs" />
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="p-3 bg-gray-50 rounded flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-lg text-gray-700 shadow-sm">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-500">{message}</div>
  );
}
