import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
import { apiFetch } from '../../config/env';
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ActivityTracker({ userId, refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [timeRange, setTimeRange] = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId, timeRange, refreshTrigger]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/activities?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setActivities(data.activities || []);
      
      // Calculate total points from completed activities
      const completedPoints = (data.activities || [])
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.points || 0), 0);
      setTotalPoints(completedPoints);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getCategoryColor = (category) => {
    const colors = {
      physical: 'rgba(34, 197, 94, 0.8)',
      mental: 'rgba(59, 130, 246, 0.8)',
      social: 'rgba(168, 85, 247, 0.8)',
      creative: 'rgba(249, 115, 22, 0.8)',
      spiritual: 'rgba(236, 72, 153, 0.8)',
      educational: 'rgba(14, 165, 233, 0.8)'
    };
    return colors[category] || 'rgba(107, 114, 128, 0.8)';
  };

  // Prepare data for bar chart - activities by category
  const categoryData = activities.reduce((acc, activity) => {
    const cat = activity.category || 'other';
    if (!acc[cat]) acc[cat] = { completed: 0, pending: 0, scheduled: 0, points: 0 };
    acc[cat][activity.status] = (acc[cat][activity.status] || 0) + 1;
    if (activity.status === 'completed') {
      acc[cat].points += activity.points || 0;
    }
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: 'Completed',
        data: Object.values(categoryData).map(d => d.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Pending',
        data: Object.values(categoryData).map(d => d.pending),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Scheduled',
        data: Object.values(categoryData).map(d => d.scheduled),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          afterLabel: (context) => {
            const category = context.label;
            const points = categoryData[category]?.points || 0;
            return points > 0 ? `Total Points: ${points}` : '';
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false
        },
        ticks: {
          font: { size: 10 }
        }
      },
      y: {
        stacked: false,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 1,
          font: { size: 10 }
        }
      }
    }
  };

  const completedCount = activities.filter(a => a.status === 'completed').length;
  const pendingCount = activities.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          <p className="text-gray-500 text-sm">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex flex-col">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="mr-2 text-2xl">🎯</span>
            Activity Progress
          </h3>
          <p className="text-xs text-gray-500 mt-1">Track your recovery journey</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
          {['7', '14', '30'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                timeRange === days
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
          <div className="text-xs text-green-600 font-medium">Total Points</div>
          <div className="text-2xl font-bold text-green-700 mt-1 flex items-center">
            <span className="mr-1">⭐</span>
            {totalPoints}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">Completed</div>
          <div className="text-2xl font-bold text-blue-700 mt-1 flex items-center">
            <span className="mr-1">✅</span>
            {completedCount}
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-3 border border-yellow-100">
          <div className="text-xs text-yellow-600 font-medium">Pending</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1 flex items-center">
            <span className="mr-1">⏳</span>
            {pendingCount}
          </div>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="flex-1 min-h-0 space-y-4">
          {/* Chart */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100" style={{ height: '220px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Activity List */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Recent Activities</div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {activities.slice(0, 8).map((activity, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{activity.icon || '🎯'}</span>
                        <span className="font-medium text-gray-800 text-sm">{activity.activity}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                      {activity.notes && (
                        <p className="text-xs text-gray-500 mt-1 ml-7">{activity.notes.substring(0, 60)}{activity.notes.length > 60 ? '...' : ''}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2 ml-7 text-xs text-gray-400">
                        <span className="flex items-center">
                          <span className="mr-1">⭐</span>
                          {activity.points} pts
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📁</span>
                          {activity.category}
                        </span>
                        {activity.time && (
                          <span className="flex items-center">
                            <span className="mr-1">🕐</span>
                            {activity.time}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm">No activities logged yet</p>
            <p className="text-xs mt-1">Start tracking your progress</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
