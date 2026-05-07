import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
import { apiFetch } from '../../config/env';
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function TriggerAnalytics({ userId, refreshTrigger }) {
  const [triggerData, setTriggerData] = useState({ top: null, counts: {} });
  const [recentTriggers, setRecentTriggers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTriggerData();
  }, [userId, refreshTrigger]);

  const fetchTriggerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Fetch top triggers
      const topResponse = await apiFetch(`/api/patients/${userId}/triggers/top?range=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const topData = await topResponse.json();
      setTriggerData(topData);

      // Fetch recent triggers
      const recentResponse = await apiFetch(`/api/patients/${userId}/triggers?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recentData = await recentResponse.json();
      setRecentTriggers(recentData.triggers || []);
    } catch (error) {
      console.error('Error fetching trigger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTriggerIcon = (triggerName) => {
    const icons = {
      stress: '😰',
      loneliness: '😔',
      anxiety: '😟',
      'social-pressure': '👥',
      boredom: '😑',
      anger: '😠',
      sadness: '😢',
      celebration: '🎉',
      'work-pressure': '💼',
      relationship: '💔',
      financial: '💰',
      health: '🏥'
    };
    return icons[triggerName?.toLowerCase()] || '⚡';
  };

  const getTriggerColor = (index) => {
    const colors = [
      'rgba(239, 68, 68, 0.8)',   // Red
      'rgba(249, 115, 22, 0.8)',  // Orange
      'rgba(234, 179, 8, 0.8)',   // Yellow
      'rgba(34, 197, 94, 0.8)',   // Green
      'rgba(59, 130, 246, 0.8)',  // Blue
      'rgba(168, 85, 247, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
      'rgba(20, 184, 166, 0.8)',  // Teal
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <p className="text-gray-500 text-sm">Loading trigger analytics...</p>
        </div>
      </div>
    );
  }

  const sortedTriggers = Object.entries(triggerData.counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const doughnutData = {
    labels: sortedTriggers.map(([name]) => name),
    datasets: [{
      data: sortedTriggers.map(([, count]) => count),
      backgroundColor: sortedTriggers.map((_, index) => getTriggerColor(index)),
      borderColor: '#fff',
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const barData = {
    labels: sortedTriggers.map(([name]) => name),
    datasets: [{
      label: 'Occurrences',
      data: sortedTriggers.map(([, count]) => count),
      backgroundColor: sortedTriggers.map((_, index) => getTriggerColor(index)),
      borderRadius: 8,
      barThickness: 30
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 12,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          generateLabels: (chart) => {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label} (${data.datasets[0].data[i]})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  const barOptions = {
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
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="mr-2 text-2xl">⚡</span>
            Trigger Analysis
          </h3>
          <p className="text-xs text-gray-500 mt-1">Identify your patterns</p>
        </div>
        
        {triggerData.top && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-xl border border-purple-200">
            <div className="text-xs text-purple-600 font-medium">Top Trigger</div>
            <div className="text-lg font-bold text-purple-700 flex items-center mt-1">
              {getTriggerIcon(triggerData.top)}
              <span className="ml-2">{triggerData.top}</span>
            </div>
          </div>
        )}
      </div>

      {sortedTriggers.length > 0 ? (
        <div className="flex-1 min-h-0 space-y-4">
          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-4" style={{ height: '280px' }}>
            {/* Doughnut Chart */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-sm font-semibold text-gray-700 mb-2">Distribution</div>
              <div style={{ height: 'calc(100% - 30px)' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-sm font-semibold text-gray-700 mb-2">Frequency</div>
              <div style={{ height: 'calc(100% - 30px)' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Recent Triggers Timeline */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {recentTriggers.slice(0, 5).map((trigger, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    {trigger.triggers && trigger.triggers.length > 0 ? (
                      trigger.triggers.map((t, i) => (
                        <span key={i} className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md text-xs border border-gray-200">
                          <span>{getTriggerIcon(t)}</span>
                          <span className="text-gray-700 font-medium">{t}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No triggers</span>
                    )}
                    {trigger.customTrigger && (
                      <span className="flex items-center space-x-1 bg-indigo-100 px-2 py-1 rounded-md text-xs border border-indigo-200">
                        <span>{trigger.customTrigger.icon}</span>
                        <span className="text-indigo-700 font-medium">{trigger.customTrigger.name}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(trigger.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-sm">No triggers logged yet</p>
            <p className="text-xs mt-1">Start identifying your triggers</p>
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
