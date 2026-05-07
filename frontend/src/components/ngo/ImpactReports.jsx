import React, { useState, useEffect, useCallback } from 'react';
import { FaFileAlt, FaDownload, FaCalendarAlt, FaChartBar, FaUsers, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const ImpactReports = ({ view, onRegisterContentRefresh }) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);

  // Fetch reports from API
  const fetchReports = useCallback(async (period = 'monthly') => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await apiFetch(`/api/ngo/reports?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch based on view
  useEffect(() => {
    if (view === 'monthly') {
      fetchReports('monthly');
    } else if (view === 'quarterly') {
      fetchReports('quarterly');
    } else {
      fetchReports('monthly');
    }
  }, [view, fetchReports]);

  const triggerContentRefresh = useCallback(() => {
    if (view === 'quarterly') fetchReports('quarterly');
    else if (view === 'monthly') fetchReports(selectedPeriod);
    else fetchReports('monthly');
  }, [view, selectedPeriod, fetchReports]);

  useEffect(() => {
    if (!onRegisterContentRefresh) return;
    onRegisterContentRefresh(triggerContentRefresh);
    return () => onRegisterContentRefresh(null);
  }, [onRegisterContentRefresh, triggerContentRefresh]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket && user?.id) {
      socket.on('ngo:patient:assigned', () => fetchReports(selectedPeriod));
      socket.on('patient:mood:created', () => fetchReports(selectedPeriod));
      socket.on('crisis:alert', () => fetchReports(selectedPeriod));
    }
    
    return () => {
      if (socket) {
        socket.off('ngo:patient:assigned');
        socket.off('patient:mood:created');
        socket.off('crisis:alert');
      }
    };
  }, [user, fetchReports, selectedPeriod]);

  // Export to CSV
  const exportToCSV = (data, filename) => {
    const csvRows = [];
    
    // Get headers
    if (data.length > 0) {
      csvRows.push(Object.keys(data[0]).join(','));
    }
    
    // Get values
    for (const row of data) {
      const values = Object.values(row).map(val => {
        if (typeof val === 'object') return JSON.stringify(val);
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Track export
    setExportHistory(prev => [{
      id: Date.now(),
      name: filename,
      format: 'CSV',
      date: new Date().toLocaleDateString()
    }, ...prev].slice(0, 10));
  };

  // Default data structure if API returns empty
  const defaultReportData = {
    summary: {
      totalPatients: 0,
      activePatients: 0,
      totalSupervisors: 0,
      avgMood: 0,
      successRate: 0,
      criticalAlerts: 0
    },
    moodTrends: [],
    activitySummary: { moodEntries: 0, messages: 0, alerts: 0, appointments: 0 },
    alertSummary: { total: 0, critical: 0, resolved: 0, pending: 0 },
    monthlyData: [],
    quarterlyData: []
  };

  const data = reportData || defaultReportData;

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // Mood trend chart data
  const moodTrendChartData = {
    labels: data.moodTrends?.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Average Mood',
      data: data.moodTrends?.map(m => m.avgMood) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Activity distribution chart
  const activityChartData = {
    labels: ['Mood Entries', 'Messages', 'Alerts', 'Appointments'],
    datasets: [{
      data: [
        data.activitySummary?.moodEntries || 0,
        data.activitySummary?.messages || 0,
        data.activitySummary?.alerts || 0,
        data.activitySummary?.appointments || 0
      ],
      backgroundColor: ['#8b5cf6', '#3b82f6', '#ef4444', '#22c55e'],
      borderWidth: 0
    }]
  };

  // Alert distribution chart
  const alertChartData = {
    labels: ['Critical', 'Resolved', 'Pending'],
    datasets: [{
      data: [
        data.alertSummary?.critical || 0,
        data.alertSummary?.resolved || 0,
        data.alertSummary?.pending || 0
      ],
      backgroundColor: ['#ef4444', '#22c55e', '#eab308'],
      borderWidth: 0
    }]
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Reports</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchReports(selectedPeriod)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (view === 'monthly') {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              fetchReports(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.summary?.totalPatients || 0}</p>
              <p className="text-xs text-gray-500">Total Patients</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.summary?.activePatients || 0}</p>
              <p className="text-xs text-gray-500">Active Patients</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{data.summary?.totalSupervisors || 0}</p>
              <p className="text-xs text-gray-500">Supervisors</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{data.summary?.avgMood?.toFixed(1) || 0}</p>
              <p className="text-xs text-gray-500">Avg Mood</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{data.summary?.successRate || 0}%</p>
              <p className="text-xs text-gray-500">Success Rate</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{data.summary?.criticalAlerts || 0}</p>
              <p className="text-xs text-gray-500">Critical Alerts</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Trends */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Mood Trends</h2>
              <button
                onClick={() => exportToCSV(data.moodTrends || [], 'mood-trends')}
                className="text-purple-600 hover:text-purple-800"
              >
                <FaDownload />
              </button>
            </div>
            <div className="h-64">
              {data.moodTrends?.length > 0 ? (
                <Line data={moodTrendChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <p>No mood data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Activity Distribution</h2>
            </div>
            <div className="h-64">
              <Doughnut data={activityChartData} options={{ ...chartOptions, cutout: '60%' }} />
            </div>
          </div>
        </div>

        {/* Activity Summary Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Activity Summary</h2>
            <button
              onClick={() => exportToCSV([data.activitySummary], 'activity-summary')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <FaDownload />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <FaChartBar className="text-purple-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{data.activitySummary?.moodEntries || 0}</p>
              <p className="text-sm text-gray-600">Mood Entries</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <FaUsers className="text-blue-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{data.activitySummary?.messages || 0}</p>
              <p className="text-sm text-gray-600">Messages</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <FaExclamationTriangle className="text-red-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{data.activitySummary?.alerts || 0}</p>
              <p className="text-sm text-gray-600">Alerts</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <FaCalendarAlt className="text-green-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{data.activitySummary?.appointments || 0}</p>
              <p className="text-sm text-gray-600">Appointments</p>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alert Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48">
              <Doughnut data={alertChartData} options={{ ...chartOptions, cutout: '50%' }} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total Alerts</span>
                <span className="font-bold text-gray-800">{data.alertSummary?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Critical</span>
                <span className="font-bold text-red-600">{data.alertSummary?.critical || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Resolved</span>
                <span className="font-bold text-green-600">{data.alertSummary?.resolved || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Pending</span>
                <span className="font-bold text-yellow-600">{data.alertSummary?.pending || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'quarterly') {
    // Quarterly comparison chart
    const quarterlyChartData = {
      labels: data.quarterlyData?.map(q => q.quarter) || ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Patients',
          data: data.quarterlyData?.map(q => q.totalPatients) || [0, 0, 0, 0],
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
        },
        {
          label: 'Success Rate %',
          data: data.quarterlyData?.map(q => q.successRate) || [0, 0, 0, 0],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        }
      ]
    };

    return (
      <div className="w-full space-y-6">
        {/* Quarterly Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Current Quarter Overview</h2>
            <button
              onClick={() => exportToCSV([data.summary], 'quarterly-summary')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <FaDownload />
              <span>Download Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{data.summary?.totalPatients || 0}</div>
              <div className="text-sm text-purple-700">Total Patients</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{data.summary?.successRate || 0}%</div>
              <div className="text-sm text-green-700">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{data.summary?.totalSupervisors || 0}</div>
              <div className="text-sm text-blue-700">Total Supervisors</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600">{data.summary?.avgMood?.toFixed(1) || 0}</div>
              <div className="text-sm text-indigo-700">Avg Mood Score</div>
            </div>
          </div>

          {/* Key Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Active Patients</span>
                  <span className="font-medium">{data.summary?.activePatients || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Critical Alerts</span>
                  <span className="font-medium text-red-600">{data.summary?.criticalAlerts || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Mood Entries</span>
                  <span className="font-medium">{data.activitySummary?.moodEntries || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  Patient engagement rate: {data.summary?.activePatients && data.summary?.totalPatients 
                    ? Math.round((data.summary.activePatients / data.summary.totalPatients) * 100) : 0}%
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  Average mood trend: {data.summary?.avgMood >= 5 ? 'Positive' : 'Needs attention'}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  Alert resolution rate: {data.alertSummary?.total && data.alertSummary?.resolved
                    ? Math.round((data.alertSummary.resolved / data.alertSummary.total) * 100) : 0}%
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quarterly Comparison Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quarterly Performance Comparison</h2>
          <div className="h-64">
            <Bar data={quarterlyChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'export') {
    return (
      <div className="w-full space-y-6">
        {/* Export Options */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Generation Options</h2>

          <div className="space-y-6">
            {/* Monthly Report Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaFileAlt className="text-blue-600 text-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Monthly Impact Report</h3>
                    <p className="text-sm text-gray-600">Detailed monthly performance analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    fetchReports('monthly').then(() => {
                      exportToCSV([{
                        ...data.summary,
                        ...data.activitySummary,
                        period: 'Monthly'
                      }], 'monthly-impact-report');
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FaDownload />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium">CSV</span>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <span className="ml-2 font-medium">Summary + Activity</span>
                </div>
                <div>
                  <span className="text-gray-600">Period:</span>
                  <span className="ml-2 font-medium">Current Month</span>
                </div>
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <span className="ml-2 font-medium">On-demand</span>
                </div>
              </div>
            </div>

            {/* Quarterly Report Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaCalendarAlt className="text-purple-600 text-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Quarterly Impact Summary</h3>
                    <p className="text-sm text-gray-600">Comprehensive quarterly overview</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    fetchReports('quarterly').then(() => {
                      exportToCSV([{
                        ...data.summary,
                        ...data.alertSummary,
                        period: 'Quarterly'
                      }], 'quarterly-impact-report');
                    });
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FaDownload />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium">CSV</span>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <span className="ml-2 font-medium">Full Summary</span>
                </div>
                <div>
                  <span className="text-gray-600">Period:</span>
                  <span className="ml-2 font-medium">Current Quarter</span>
                </div>
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <span className="ml-2 font-medium">On-demand</span>
                </div>
              </div>
            </div>

            {/* Mood Data Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaChartBar className="text-green-600 text-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Mood Trend Data</h3>
                    <p className="text-sm text-gray-600">Raw mood data for analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => exportToCSV(data.moodTrends || [], 'mood-trend-data')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FaDownload />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium">CSV</span>
                </div>
                <div>
                  <span className="text-gray-600">Records:</span>
                  <span className="ml-2 font-medium">{data.moodTrends?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <span className="ml-2 font-medium">Daily Mood Averages</span>
                </div>
                <div>
                  <span className="text-gray-600">Access:</span>
                  <span className="ml-2 font-medium">NGO Admin</span>
                </div>
              </div>
            </div>

            {/* Alert Data Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Alert Summary Data</h3>
                    <p className="text-sm text-gray-600">Critical incident reports</p>
                  </div>
                </div>
                <button 
                  onClick={() => exportToCSV([data.alertSummary], 'alert-summary-data')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FaDownload />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium">CSV</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Alerts:</span>
                  <span className="ml-2 font-medium">{data.alertSummary?.total || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Critical:</span>
                  <span className="ml-2 font-medium text-red-600">{data.alertSummary?.critical || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Access:</span>
                  <span className="ml-2 font-medium">NGO Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Exports</h2>
          {exportHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaFileAlt className="text-4xl mx-auto mb-3 text-gray-300" />
              <p>No exports yet. Generate a report to see history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <FaFileAlt className="text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <p className="text-sm text-gray-600">{item.format}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ImpactReports;