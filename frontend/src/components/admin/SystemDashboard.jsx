import React, { useState, useEffect, useRef } from 'react';
import { FaBuilding, FaUsers, FaUserCircle, FaExclamationTriangle } from 'react-icons/fa';
import socketService from '../../services/socketService';
import { normalizeRoleKey } from '../../utils/roles';
import api from '../../api';
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
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const KPICard = ({ title, value, icon: Icon, gradient, accent, onClick }) => (
  <div
    className={`relative overflow-hidden bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`absolute top-0 left-0 right-0 h-1 ${accent}`}></div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-4xl font-extrabold text-slate-900 leading-none">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="text-white text-2xl" />
      </div>
    </div>
  </div>
);

const SystemDashboard = ({
  syncRef,
  onConnectionStatusChange,
  onLastUpdatedChange,
  onRefreshingChange
} = {}) => {
  const [stats, setStats] = useState({
    totalNGOs: 0,
    totalSupervisors: 0,
    totalPatients: 0,
    riskAlertsToday: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [alertsChartData, setAlertsChartData] = useState(null);
  const [moodChartData, setMoodChartData] = useState(null);
  const [moodDistribution, setMoodDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const loadAllDataRef = useRef(async () => {});

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?._id || user?.id;
    const userRole = normalizeRoleKey(user?.role || user?.roleKey);
    const token = localStorage.getItem('token');
    
    console.log('Admin Dashboard: User role:', userRole, 'userId:', userId, 'token:', token ? 'present' : 'missing');
    
    // Check if user is admin - show warning but don't redirect
    if (!token || !userId) {
      console.warn('No token or userId found');
      setError('Please login to access the admin dashboard');
    } else if (userRole !== 'admin') {
      console.warn('User is not an admin (role:', userRole, ')');
      setError(`Current user role is "${userRole}". Please login as admin to see real data.`);
    }
    
    console.log('Admin Dashboard: Initializing with userId:', userId, 'token:', token ? 'present' : 'missing');
    
    // Initial data load - always try to load
    loadAllData();
    
    // Set up auto-refresh every 15 seconds for better sync
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      loadAllData();
    }, 15000);

    // Connect socket with userId - always try to connect
    let resubscribeInterval;
    if (userId) {
      console.log('Admin Dashboard: Connecting socket for user:', userId);
      socketService.connect(userId);
      
      // Small delay to ensure socket connects, then subscribe
      setTimeout(() => {
        console.log('Admin Dashboard: Emitting admin:subscribe');
        socketService.emit('admin:subscribe', { userId, role: 'admin' });
        // Also emit admin:subscribe:alerts for alerts room
        socketService.emit('admin:subscribe:alerts', { userId });
      }, 500);
      
      // Re-subscribe every 30 seconds to ensure connection stays active
      resubscribeInterval = setInterval(() => {
        if (socketService.isConnected) {
          socketService.emit('admin:subscribe', { userId, role: 'admin' });
        }
      }, 30000);
    }
    
    // Check initial connection status
    if (socketService.isConnected) {
      setConnectionStatus('connected');
    }
    
    // Track connection status
    socketService.on('connect', () => {
      console.log('Socket connected - subscribing to admin events');
      setConnectionStatus('connected');
      // Re-subscribe after reconnection
      if (userId) {
        socketService.emit('admin:subscribe', { userId, role: 'admin' });
      }
    });
    
    socketService.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });
    
    // Listen for stats updates (real-time from backend)
    socketService.on('stats:updated', (data) => {
      console.log('Stats updated from socket:', data);
      if (data) {
        setStats(prev => ({ ...prev, ...data }));
        setLastUpdated(new Date());
      }
    });
    
    // Listen for new geo-fence alerts (real-time)
    socketService.on('geofence:alert', (data) => {
        console.log('New geo-fence alert received:', data);
        setAlerts(prev => [formatAlert(data), ...prev].slice(0, 20));
        setStats(prev => ({ ...prev, riskAlertsToday: prev.riskAlertsToday + 1 }));
        setLastUpdated(new Date());
      });
      
      // Listen for new patient registrations
      socketService.on('patient:registered', (data) => {
        console.log('New patient registered:', data);
        setStats(prev => ({ ...prev, totalPatients: prev.totalPatients + 1 }));
        setLastUpdated(new Date());
      });
      
      // Listen for new supervisor registrations
      socketService.on('supervisor:registered', (data) => {
        console.log('New supervisor registered:', data);
        setStats(prev => ({ ...prev, totalSupervisors: prev.totalSupervisors + 1 }));
        setLastUpdated(new Date());
      });
      
      // Listen for new organization registrations
      socketService.on('organization:created', (data) => {
        console.log('New organization created:', data);
        setStats(prev => ({ ...prev, totalNGOs: prev.totalNGOs + 1 }));
        setLastUpdated(new Date());
      });
      
      // Listen for mood entries (to update charts)
      socketService.on('mood:logged', (data) => {
        console.log('New mood logged:', data);
        // Refresh mood analytics and all data
        fetchMoodAnalytics();
        fetchSystemStats();
        setLastUpdated(new Date());
      });
      
      // Listen for activity logs
      socketService.on('activity:logged', (data) => {
        console.log('New activity logged:', data);
        // Refresh analytics when activity is logged
        fetchMoodAnalytics();
        setLastUpdated(new Date());
      });
      
      // Listen for trigger logs (risk indicators)
      socketService.on('trigger:logged', (data) => {
        console.log('New trigger logged:', data);
        // Triggers can indicate risk, refresh alerts
        fetchGlobalAlerts();
        fetchAlertAnalytics();
        setLastUpdated(new Date());
      });
      
      // Listen for alerts update
      socketService.on('alerts:updated', (data) => {
        console.log('Alerts updated:', data);
        if (data?.alerts) {
          setAlerts(data.alerts.slice(0, 20).map(formatAlertFromAPI));
          setLastUpdated(new Date());
        }
      });

    return () => {
      clearInterval(refreshInterval);
      if (resubscribeInterval) clearInterval(resubscribeInterval);
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('geofence:alert');
      socketService.off('patient:registered');
      socketService.off('supervisor:registered');
      socketService.off('organization:created');
      socketService.off('mood:logged');
      socketService.off('activity:logged');
      socketService.off('trigger:logged');
      socketService.off('stats:updated');
      socketService.off('alerts:updated');
    };
  }, []);

  // Mirror live state up to AdminDashboard header
  useEffect(() => {
    onConnectionStatusChange?.(connectionStatus);
  }, [connectionStatus, onConnectionStatusChange]);

  useEffect(() => {
    if (lastUpdated) onLastUpdatedChange?.(lastUpdated);
  }, [lastUpdated, onLastUpdatedChange]);

  useEffect(() => {
    onRefreshingChange?.(refreshing);
  }, [refreshing, onRefreshingChange]);

  // Expose sync handler to parent header's "Sync Now" button
  useEffect(() => {
    if (syncRef) {
      syncRef.current = loadAllData;
    }
    return () => {
      if (syncRef) syncRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRef]);

  const formatAlertFromAPI = (alert) => ({
    patient: alert.patientName || alert.patient?.name || 'Unknown',
    event: alert.type === 'geofence' ? (alert.eventType === 'entered' ? 'Entered Zone' : 'Exited Zone') : 'Alert',
    zone: alert.zoneName || alert.geoFence?.name || 'N/A',
    time: formatTimeAgo(alert.createdAt),
    severity: alert.alertSeverity || alert.severity || 'Info',
    createdAt: alert.createdAt
  });

  const loadAllData = async () => {
    setRefreshing(true);
    console.log('Loading all dashboard data...');
    try {
      await Promise.all([
        fetchSystemStats(),
        fetchGlobalAlerts(),
        fetchAlertAnalytics(),
        fetchMoodAnalytics()
      ]);
      setLastUpdated(new Date());
      // Clear error if data loads successfully
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    }
    setRefreshing(false);
    setLoading(false);
  };

  const fetchSystemStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      const result = response.data;
      
      if (result.success && result.data) {
        const newStats = {
          totalNGOs: result.data.totalNGOs || 0,
          totalSupervisors: result.data.totalSupervisors || 0,
          totalPatients: result.data.totalPatients || 0,
          riskAlertsToday: result.data.riskAlertsToday || 0
        };
        setStats(newStats);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Access denied. Please login as admin (admin@admin.com)');
      } else {
        setError('Failed to connect to server');
      }
    }
  };

  const fetchGlobalAlerts = async () => {
    try {
      const response = await api.get('/admin/alerts?limit=20');
      const result = response.data;
      
      if (result.success && result.data?.alerts) {
        setAlerts(result.data.alerts.map(alert => ({
          patient: alert.patientName || alert.patient?.name || 'Unknown',
          event: alert.type === 'geofence' ? (alert.eventType === 'entered' ? 'Entered Zone' : 'Exited Zone') : 'Alert',
          zone: alert.zoneName || alert.geoFence?.name || 'N/A',
          time: formatTimeAgo(alert.createdAt),
          severity: alert.alertSeverity || alert.severity || 'Info',
          createdAt: alert.createdAt
        })));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching global alerts:', error);
      setLoading(false);
    }
  };

  const fetchAlertAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics/alerts');
      const result = response.data;
      if (result.success && result.data) {
        // Process alerts per day data for line chart
        const alertsPerDay = result.data.alertsPerDay || [];
        const last7Days = getLast7Days();
        
        // Map data to last 7 days
        const dataMap = {};
        alertsPerDay.forEach(item => {
          dataMap[item.date] = item.count;
        });

        // Check if we have any actual data
        const hasData = alertsPerDay.length > 0;
        
        const chartData = {
          labels: last7Days.map(d => d.label),
          datasets: [{
            label: 'Alerts',
            data: last7Days.map(d => dataMap[d.dateKey] || 0),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(239, 68, 68)',
            pointBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        };
        
        // If no data, use sample data to show chart functionality
        if (!hasData) {
          chartData.datasets[0].data = [2, 4, 1, 5, 3, 6, 2];
        }
        
        setAlertsChartData(chartData);
      } else {
        setAlertsChartData(getDefaultAlertChartData());
      }
    } catch (error) {
      console.error('Error fetching alert analytics:', error);
      // Set default chart data on error
      setAlertsChartData(getDefaultAlertChartData());
    }
  };

  const fetchMoodAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics/moods');
      const result = response.data;
      if (result.success && result.data) {
        // Process mood data for bar chart - API returns moodsPerDay array with {date, count}
        const moodsPerDay = result.data.moodsPerDay || [];
        const last7Days = getLast7Days();
        
        const dataMap = {};
        moodsPerDay.forEach(item => {
          dataMap[item.date] = item.count;
        });

        const chartData = {
          labels: last7Days.map(d => d.label),
          datasets: [{
            label: 'Mood Logs',
            data: last7Days.map(d => dataMap[d.dateKey] || 0),
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(20, 184, 166, 0.8)',
              'rgba(99, 102, 241, 0.8)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(168, 85, 247)',
              'rgb(249, 115, 22)',
              'rgb(236, 72, 153)',
              'rgb(20, 184, 166)',
              'rgb(99, 102, 241)'
            ],
            borderWidth: 2,
            borderRadius: 8
          }]
        };
        setMoodChartData(chartData);

        // Process mood distribution for doughnut chart - API returns {moodDistribution: {mood: count}}
        const distribution = result.data.moodDistribution || {};
        const moodColors = {
          happy: 'rgba(34, 197, 94, 0.8)',    // Green
          calm: 'rgba(59, 130, 246, 0.8)',    // Blue
          anxious: 'rgba(249, 115, 22, 0.8)', // Orange
          sad: 'rgba(168, 85, 247, 0.8)',     // Purple
          angry: 'rgba(239, 68, 68, 0.8)'     // Red
        };
        
        const labels = Object.keys(distribution);
        const data = Object.values(distribution);
        const colors = labels.map(mood => moodColors[mood.toLowerCase()] || 'rgba(156, 163, 175, 0.8)');
        
        if (labels.length > 0) {
          const distributionData = {
            labels: labels.map(capitalizeFirst),
            datasets: [{
              data: data,
              backgroundColor: colors,
              borderWidth: 0
            }]
          };
          setMoodDistribution(distributionData);
        } else {
          setMoodDistribution(getDefaultMoodDistribution());
        }
      } else {
        setMoodChartData(getDefaultMoodChartData());
        setMoodDistribution(getDefaultMoodDistribution());
      }
    } catch (error) {
      console.error('Error fetching mood analytics:', error);
      setMoodChartData(getDefaultMoodChartData());
      setMoodDistribution(getDefaultMoodDistribution());
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        dateKey: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

  const capitalizeFirst = (str) => {
    if (!str) return 'Unknown';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getDefaultAlertChartData = () => ({
    labels: getLast7Days().map(d => d.label),
    datasets: [{
      label: 'Alerts',
      data: [3, 5, 2, 8, 4, 6, 3],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(239, 68, 68)',
      pointBorderColor: '#fff',
      pointRadius: 5
    }]
  });

  const getDefaultMoodChartData = () => ({
    labels: getLast7Days().map(d => d.label),
    datasets: [{
      label: 'Mood Logs',
      data: [12, 19, 8, 15, 22, 14, 18],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
      borderRadius: 8
    }]
  });

  const getDefaultMoodDistribution = () => ({
    labels: ['Happy', 'Calm', 'Anxious', 'Sad', 'Angry'],
    datasets: [{
      data: [35, 25, 20, 12, 8],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  });

  const formatAlert = (data) => ({
    patient: data.patient?.name || 'Unknown',
    event: data.alert?.eventType === 'entered' ? 'Entered Zone' : 'Exited Zone',
    zone: data.zone?.name || 'Unknown Zone',
    time: 'Just now',
    severity: data.zone?.riskCategory || data.alert?.alertSeverity || 'High',
    createdAt: new Date()
  });

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const kpiData = [
    {
      title: 'Total NGOs',
      value: stats.totalNGOs.toLocaleString(),
      icon: FaBuilding,
      gradient: 'from-blue-500 to-indigo-600',
      accent: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      onClick: () => console.log('Navigate to NGOs')
    },
    {
      title: 'Total Supervisors',
      value: stats.totalSupervisors.toLocaleString(),
      icon: FaUsers,
      gradient: 'from-sky-500 to-cyan-600',
      accent: 'bg-gradient-to-r from-sky-500 to-cyan-600',
      onClick: () => console.log('Navigate to Supervisors')
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      icon: FaUserCircle,
      gradient: 'from-purple-500 to-fuchsia-600',
      accent: 'bg-gradient-to-r from-purple-500 to-fuchsia-600',
      onClick: () => console.log('Navigate to Patients')
    },
    {
      title: 'Risk Alerts Today',
      value: stats.riskAlertsToday.toLocaleString(),
      icon: FaExclamationTriangle,
      gradient: 'from-rose-500 to-red-600',
      accent: 'bg-gradient-to-r from-rose-500 to-red-600',
      onClick: () => console.log('Navigate to Alerts')
    }
  ];

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: { size: 12 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 12 }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 12 }
        }
      }
    },
    cutout: '65%'
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Keep latest loadAllData for socket-driven pulls (refs socket handlers registered before fetch fns exist)
  useEffect(() => {
    loadAllDataRef.current = loadAllData;
  });

  // NGO dashboards & backend mutations notify admins — debounce full REST refresh to avoid storms
  useEffect(() => {
    let debounceTimer;
    const scheduleFullPull = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void loadAllDataRef.current?.();
      }, 550);
    };

    socketService.on('admin:data:refresh', scheduleFullPull);
    socketService.on('ngo:patient:assigned', scheduleFullPull);
    socketService.on('ngo:supervisor:assigned', scheduleFullPull);
    socketService.on('ngo:supervisor:removed', scheduleFullPull);
    socketService.on('ngo:patient:supervisor:changed', scheduleFullPull);
    socketService.on('dashboard:stats:update', scheduleFullPull);
    socketService.on('system:update', scheduleFullPull);
    socketService.on('crisis:alert', scheduleFullPull);

    return () => {
      clearTimeout(debounceTimer);
      socketService.off('admin:data:refresh', scheduleFullPull);
      socketService.off('ngo:patient:assigned', scheduleFullPull);
      socketService.off('ngo:supervisor:assigned', scheduleFullPull);
      socketService.off('ngo:supervisor:removed', scheduleFullPull);
      socketService.off('ngo:patient:supervisor:changed', scheduleFullPull);
      socketService.off('dashboard:stats:update', scheduleFullPull);
      socketService.off('system:update', scheduleFullPull);
      socketService.off('crisis:alert', scheduleFullPull);
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0" />
          <div className="flex-1">
            <span className="text-red-800 font-semibold">{error}</span>
            <p className="text-red-600 text-sm mt-1">Admin credentials: admin@admin.com / admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold shadow-sm"
          >
            Logout & Re-Login
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 font-medium">Loading dashboard data...</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts Per Day - Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Alerts Per Day</h3>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-64">
            {alertsChartData ? (
              <Line data={alertsChartData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="animate-pulse">Loading chart...</div>
              </div>
            )}
          </div>
        </div>

        {/* Mood Logs Per Day - Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Mood Logs Per Day</h3>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-64">
            {moodChartData ? (
              <Bar data={moodChartData} options={barChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="animate-pulse">Loading chart...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mood Distribution & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Mood Distribution - Doughnut Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-4">Mood Distribution</h3>
          <div className="h-64">
            {moodDistribution ? (
              <Doughnut data={moodDistribution} options={doughnutOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="animate-pulse">Loading chart...</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-4">Quick Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100">
              <div className="text-3xl font-extrabold text-blue-700">{stats.totalNGOs}</div>
              <div className="text-xs font-semibold text-blue-900 mt-1 uppercase tracking-wider">Active NGOs</div>
            </div>
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl text-center border border-sky-100">
              <div className="text-3xl font-extrabold text-sky-700">{stats.totalSupervisors}</div>
              <div className="text-xs font-semibold text-sky-900 mt-1 uppercase tracking-wider">Supervisors</div>
            </div>
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl text-center border border-purple-100">
              <div className="text-3xl font-extrabold text-purple-700">{stats.totalPatients}</div>
              <div className="text-xs font-semibold text-purple-900 mt-1 uppercase tracking-wider">Patients</div>
            </div>
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl text-center border border-rose-100">
              <div className="text-3xl font-extrabold text-rose-700">{stats.riskAlertsToday}</div>
              <div className="text-xs font-semibold text-rose-900 mt-1 uppercase tracking-wider">Today's Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts Stream */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-base font-bold text-slate-900">Global Alerts Stream</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Zone Name</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Severity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No alerts yet
                  </td>
                </tr>
              ) : (
                alerts.map((alert, index) => (
                  <tr key={index} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900 hover:text-blue-600">{alert.patient}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{alert.event}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{alert.zone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{alert.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                        alert.severity === 'Critical' ? 'bg-red-100 text-red-800 ring-1 ring-red-200' :
                        alert.severity === 'High' ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-200' :
                        alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                        'bg-blue-100 text-blue-800 ring-1 ring-blue-200'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;