import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
import { apiFetch } from '../../config/env';
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedMoodTrends({ userId, refreshTrigger }) {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // '7d', '14d', '30d'

  useEffect(() => {
    fetchMoodData();
  }, [userId, refreshTrigger, timeRange]);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const limit = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      const response = await apiFetch(`/api/patients/${userId}/moods?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.moods) {
        setMoodData(data.moods.reverse()); // Oldest first for chart
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (moodValue) => {
    if (moodValue >= 3.5) return '😊';
    if (moodValue >= 2.5) return '😐';
    if (moodValue >= 1.5) return '😔';
    return '😠';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = {
    labels: moodData.map(entry => formatDate(entry.createdAt || entry.timestamp)),
    datasets: [
      {
        label: 'Mood Score',
        data: moodData.map(entry => entry.moodValue || 3),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Craving Level',
        data: moodData.map(entry => entry.craving || 5),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(220, 38, 38)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: (context) => {
            return formatDate(moodData[context[0].dataIndex]?.createdAt);
          },
          label: (context) => {
            const entry = moodData[context.dataIndex];
            if (context.datasetIndex === 0) {
              const emoji = getMoodEmoji(entry?.moodValue);
              return `${context.dataset.label}: ${context.parsed.y} ${emoji}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}/10`;
          },
          afterLabel: (context) => {
            if (context.datasetIndex === 0) {
              const entry = moodData[context.dataIndex];
              return entry?.journal ? `\nNote: ${entry.journal.substring(0, 50)}...` : '';
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        min: 0,
        max: 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 2,
          font: {
            size: 11
          }
        }
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 text-sm">Loading mood trends...</p>
        </div>
      </div>
    );
  }

  const latestMood = moodData[moodData.length - 1];
  const avgMood = moodData.length > 0 
    ? (moodData.reduce((sum, entry) => sum + (entry.moodValue || 3), 0) / moodData.length).toFixed(1)
    : 0;
  const avgCraving = moodData.length > 0
    ? (moodData.reduce((sum, entry) => sum + (entry.craving || 5), 0) / moodData.length).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="mr-2 text-2xl">📈</span>
            Mood & Craving Trends
          </h3>
          <p className="text-xs text-gray-500 mt-1">Track your emotional journey</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['7d', '14d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '14d' ? '2 Weeks' : '1 Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
          <div className="text-xs text-blue-600 font-medium mb-1">Avg Mood</div>
          <div className="text-2xl font-bold text-blue-700">{avgMood}/4</div>
          <div className="text-xs text-blue-500 mt-1">{getMoodEmoji(parseFloat(avgMood))}</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
          <div className="text-xs text-red-600 font-medium mb-1">Avg Craving</div>
          <div className="text-2xl font-bold text-red-700">{avgCraving}/10</div>
          <div className="text-xs text-red-500 mt-1">
            {parseFloat(avgCraving) <= 3 ? 'Low ✅' : parseFloat(avgCraving) <= 6 ? 'Medium ⚠️' : 'High 🚨'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
          <div className="text-xs text-green-600 font-medium mb-1">Entries</div>
          <div className="text-2xl font-bold text-green-700">{moodData.length}</div>
          <div className="text-xs text-green-500 mt-1">Tracked</div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {moodData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">No mood data yet</p>
              <p className="text-xs mt-1">Start logging your moods to see trends</p>
            </div>
          </div>
        )}
      </div>

      {/* Latest Entry Info */}
      {latestMood && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getMoodEmoji(latestMood.moodValue)}</span>
              <div>
                <div className="font-medium text-gray-700">Latest: {latestMood.mood || 'N/A'}</div>
                <div className="text-xs text-gray-500">
                  {new Date(latestMood.createdAt || latestMood.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Craving</div>
              <div className={`text-lg font-bold ${
                latestMood.craving <= 3 ? 'text-green-600' : 
                latestMood.craving <= 6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {latestMood.craving}/10
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
