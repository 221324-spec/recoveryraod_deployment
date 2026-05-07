import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaUserMd, FaExclamationTriangle, FaChartLine, FaPlus, FaEye, FaDownload, FaSmile, FaBed, FaComments, FaCalendarCheck, FaHeartbeat } from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import api from '../../api';

// Register Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const OrganizationDashboard = ({ onNavigate, onRegisterContentRefresh }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    organization: { name: '', type: '', status: '' },
    stats: {
      totalPatients: 0,
      activePatients: 0,
      totalSupervisors: 0,
      alertsThisMonth: 0,
      averageMoodScore: 5,
      successRate: 0,
      occupancyRate: 0,
      messagesThisWeek: 0,
      moodEntriesCount: 0
    },
    recentActivities: [],
    moodTrends: [],
    upcomingAppointments: [],
    recentMoods: []
  });

  // Fetch dashboard data — uses api axios instance (goes through Vite proxy, auto-attaches JWT)
  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const result = await api.get('/ngo/dashboard');
      if (result.data?.success) {
        setDashboardData(result.data.data);
      } else {
        throw new Error(result.data?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('NGO Dashboard fetch error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to fetch';
      if (msg.includes('Failed to fetch') || err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Please make sure the backend is running on port 5000.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket && user?.id) {
      socket.emit('join', { userId: user.id, role: 'ngo' });
      
      // Listen for organization updates
      socket.on('ngo:supervisor:assigned', (data) => {
        console.log('Supervisor assigned:', data);
        fetchDashboard();
      });
      
      socket.on('ngo:supervisor:removed', (data) => {
        console.log('Supervisor removed:', data);
        fetchDashboard();
      });
      
      socket.on('ngo:patient:assigned', (data) => {
        console.log('Patient assigned:', data);
        fetchDashboard();
      });
      
      socket.on('patient:mood:created', (data) => {
        console.log('New mood entry:', data);
        setDashboardData(prev => ({
          ...prev,
          recentActivities: [
            {
              id: Date.now(),
              type: 'mood_entry',
              description: 'New mood entry recorded',
              patient: data.patientName || 'Patient',
              timestamp: new Date()
            },
            ...prev.recentActivities.slice(0, 9)
          ]
        }));
      });
      
      socket.on('crisis:alert', (data) => {
        console.log('Crisis alert:', data);
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            alertsThisMonth: prev.stats.alertsThisMonth + 1
          }
        }));
      });
      
      socket.on('dashboard:stats:update', () => {
        fetchDashboard();
      });
    }
    
    return () => {
      if (socket) {
        socket.off('ngo:supervisor:assigned');
        socket.off('ngo:supervisor:removed');
        socket.off('ngo:patient:assigned');
        socket.off('patient:mood:created');
        socket.off('crisis:alert');
        socket.off('dashboard:stats:update');
      }
    };
  }, [user, fetchDashboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  useEffect(() => {
    if (!onRegisterContentRefresh) return;
    const fn = () => {
      setRefreshing(true);
      fetchDashboard();
    };
    onRegisterContentRefresh(fn);
    return () => onRegisterContentRefresh(null);
  }, [onRegisterContentRefresh, fetchDashboard]);

  const handleExportData = async () => {
    try {
      const result = await api.get('/ngo/reports?period=monthly');
      if (result.data?.success) {
        const data = result.data;
        // Create CSV
        const csvContent = [
          ['Metric', 'Value'],
          ['Organization', data.data?.organization?.name || 'N/A'],
          ['Total Patients', data.data?.summary?.totalPatients ?? 0],
          ['Total Supervisors', data.data?.summary?.totalSupervisors ?? 0],
          ['Average Mood', data.data?.summary?.averageMood ?? 'N/A'],
          ['Total Alerts', data.data?.summary?.totalAlerts ?? 0],
          ['Success Rate', (data.data?.summary?.successRate ?? 0) + '%']
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ngo-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data: ' + (err.response?.data?.message || err.message));
    }
  };

  const { stats, organization, recentActivities, moodTrends, upcomingAppointments, recentMoods } = dashboardData;

  // Mood trend chart data
  const moodChartData = {
    labels: moodTrends?.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Average Mood',
      data: moodTrends?.map(t => t.avgMood) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const moodChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { min: 0, max: 10 }
    }
  };

  // Patient distribution chart
  const patientDistribution = {
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [stats.activePatients, stats.totalPatients - stats.activePatients],
      backgroundColor: ['#22c55e', '#e5e7eb'],
      borderWidth: 0
    }]
  };

  const kpiData = [
    { 
      title: 'Total Supervisors', 
      value: stats.totalSupervisors.toString(), 
      icon: FaUserMd, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-100',
      change: '+2 this month'
    },
    { 
      title: 'Total Patients', 
      value: stats.totalPatients.toString(), 
      subtitle: `${stats.activePatients} active`,
      icon: FaUsers, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100',
      change: `${stats.activePatients} active`
    },
    { 
      title: 'Active Alerts', 
      value: stats.alertsThisMonth.toString(), 
      icon: FaExclamationTriangle, 
      color: stats.alertsThisMonth > 5 ? 'text-red-600' : 'text-yellow-600', 
      bgColor: stats.alertsThisMonth > 5 ? 'bg-red-100' : 'bg-yellow-100',
      change: 'This month'
    },
    { 
      title: 'Success Rate', 
      value: `${stats.successRate}%`, 
      icon: FaChartLine, 
      color: 'text-green-600', 
      bgColor: 'bg-green-100',
      change: stats.successRate >= 80 ? 'Excellent' : 'Good'
    }
  ];

  const quickActions = [
    { 
      title: 'Add Supervisor', 
      icon: FaPlus, 
      action: () => onNavigate && onNavigate('add'),
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
    },
    { 
      title: 'View Reports', 
      icon: FaEye, 
      action: () => onNavigate && onNavigate('monthly'),
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
    },
    { 
      title: 'Export Data', 
      icon: FaDownload, 
      action: handleExportData,
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
    }
  ];

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getActivityColor = (type) => {
    const colors = {
      'mood_entry': 'bg-green-500',
      'check_in': 'bg-blue-500',
      'session': 'bg-purple-500',
      'alert': 'bg-red-500',
      'assignment': 'bg-yellow-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-1">{kpi.change}</p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`text-xl ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Average Mood Score</p>
              <p className="text-3xl font-bold mt-1">{stats.averageMoodScore.toFixed(1)}/10</p>
            </div>
            <FaSmile className="text-4xl text-blue-200" />
          </div>
          <div className="mt-4 bg-blue-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${(stats.averageMoodScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Occupancy Rate</p>
              <p className="text-3xl font-bold mt-1">{stats.occupancyRate}%</p>
            </div>
            <FaBed className="text-4xl text-green-200" />
          </div>
          <div className="mt-4 bg-green-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${stats.occupancyRate}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Patients</p>
              <p className="text-3xl font-bold mt-1">{stats.activePatients}</p>
              <p className="text-purple-200 text-sm mt-1">of {stats.totalPatients} total</p>
            </div>
            <FaUsers className="text-4xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`flex items-center justify-center space-x-3 p-4 rounded-lg transition-colors border ${action.color}`}
            >
              <action.icon />
              <span className="font-medium">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trends Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Mood Trends (30 Days)</h2>
            <span className="text-sm text-purple-600">{stats.moodEntriesCount || 0} entries</span>
          </div>
          <div className="h-64">
            {moodTrends && moodTrends.length > 0 ? (
              <Line data={moodChartData} options={moodChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FaChartLine className="text-4xl mx-auto mb-2" />
                  <p>No mood data available yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Patient Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Status</h2>
          <div className="h-64 flex items-center justify-center">
            {stats.totalPatients > 0 ? (
              <div className="w-48">
                <Doughnut data={patientDistribution} />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <FaUsers className="text-4xl mx-auto mb-2" />
                <p>No patients yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments & Recent Moods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
            <FaCalendarCheck className="text-blue-500" />
          </div>
          {upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, i) => (
                <div key={apt.id || i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{apt.patient}</p>
                    <p className="text-sm text-gray-500">with {apt.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">
                      {new Date(apt.dateTime).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">{apt.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FaCalendarCheck className="text-3xl mx-auto mb-2" />
              <p>No upcoming appointments</p>
            </div>
          )}
        </div>

        {/* Recent Moods */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Mood Entries</h2>
            <FaHeartbeat className="text-pink-500" />
          </div>
          {recentMoods && recentMoods.length > 0 ? (
            <div className="space-y-3">
              {recentMoods.slice(0, 5).map((mood, i) => (
                <div key={mood.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mood.moodValue >= 7 ? 'bg-green-100 text-green-600' :
                      mood.moodValue >= 4 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {mood.moodValue || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{mood.mood || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        Craving: {mood.craving !== undefined ? mood.craving : 'N/A'}/10
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(mood.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FaSmile className="text-3xl mx-auto mb-2" />
              <p>No mood entries yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
          <span className="text-sm text-gray-500">Last 10 activities</span>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaChartLine className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No recent activities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div 
                key={activity.id || index} 
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                  <div>
                    <span className="text-gray-800">{activity.description}</span>
                    {activity.patient && (
                      <span className="text-gray-500 text-sm ml-2">- {activity.patient}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDashboard;