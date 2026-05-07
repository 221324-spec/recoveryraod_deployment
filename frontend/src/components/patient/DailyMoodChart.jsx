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

export default function DailyMoodChart({ userId, refreshTrigger }) {
  const [moodData, setMoodData] = useState([]);
  const [timeRange, setTimeRange] = useState('7');
  const [stats, setStats] = useState({ positiveCount: 0, neutralCount: 0, negativeCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodData();
  }, [userId, timeRange, refreshTrigger]);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/moods?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const moods = data.moods || [];
      
      // Categorize moods
      let positiveCount = 0;
      let neutralCount = 0;
      let negativeCount = 0;

      moods.forEach(entry => {
        const value = entry.moodValue || 2;
        if (value >= 3) positiveCount++;
        else if (value === 2) neutralCount++;
        else negativeCount++;
      });

      setStats({ positiveCount, neutralCount, negativeCount });
      setMoodData(moods);
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (moodValue) => {
    if (moodValue >= 4) return 'rgba(16, 185, 129, 0.8)';    // Excellent - Green
    if (moodValue === 3) return 'rgba(59, 130, 246, 0.8)';   // Good - Blue
    if (moodValue === 2) return 'rgba(251, 191, 36, 0.8)';   // Neutral - Amber
    return 'rgba(239, 68, 68, 0.8)';                          // Low - Red
  };

  const chartData = {
    labels: moodData.map(entry => {
      const date = new Date(entry.createdAt);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Mood Level',
      data: moodData.map(entry => entry.moodValue || 2),
      backgroundColor: moodData.map(entry => getMoodColor(entry.moodValue)),
      borderColor: moodData.map(entry => getMoodColor(entry.moodValue).replace('0.8', '1')),
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 40
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const date = new Date(moodData[index].createdAt);
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          },
          label: (context) => {
            const labels = ['', 'Very Low', 'Low', 'Good', 'Excellent'];
            return `Mood: ${labels[context.parsed.y]} (${context.parsed.y}/4)`;
          },
          afterLabel: (context) => {
            const index = context.dataIndex;
            const mood = moodData[index].mood;
            const journal = moodData[index].journal;
            const lines = [mood ? `Feeling: ${mood}` : ''];
            if (journal) {
              lines.push(`Note: ${journal.substring(0, 50)}${journal.length > 50 ? '...' : ''}`);
            }
            return lines.filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          font: { size: 10, weight: '600' },
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        max: 4,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false
        },
        ticks: {
          stepSize: 1,
          font: { size: 11, weight: '600' },
          color: '#6B7280',
          callback: (value) => {
            const labels = ['', 'Very Low', 'Low', 'Good', 'Excellent'];
            return labels[value] || '';
          }
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart'
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 text-sm font-medium">Loading mood data...</p>
        </div>
      </div>
    );
  }

  const totalMoods = stats.positiveCount + stats.neutralCount + stats.negativeCount;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-blue-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-3 text-2xl">😊</span>
            Daily Mood Patterns
          </h3>
          <p className="text-sm text-gray-500 mt-1">Track your emotional journey</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
          {['7', '14', '30'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                timeRange === days
                  ? 'bg-white text-blue-600 shadow-sm'
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
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-3 shadow-md">
          <div className="text-xs font-semibold opacity-90">Positive Days</div>
          <div className="text-2xl font-bold mt-1">
            {stats.positiveCount}
            <span className="text-sm ml-1">😊</span>
          </div>
          {totalMoods > 0 && (
            <div className="text-xs opacity-80 mt-1">
              {((stats.positiveCount / totalMoods) * 100).toFixed(0)}% of days
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-xl p-3 shadow-md">
          <div className="text-xs font-semibold opacity-90">Neutral Days</div>
          <div className="text-2xl font-bold mt-1">
            {stats.neutralCount}
            <span className="text-sm ml-1">😐</span>
          </div>
          {totalMoods > 0 && (
            <div className="text-xs opacity-80 mt-1">
              {((stats.neutralCount / totalMoods) * 100).toFixed(0)}% of days
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl p-3 shadow-md">
          <div className="text-xs font-semibold opacity-90">Difficult Days</div>
          <div className="text-2xl font-bold mt-1">
            {stats.negativeCount}
            <span className="text-sm ml-1">😔</span>
          </div>
          {totalMoods > 0 && (
            <div className="text-xs opacity-80 mt-1">
              {((stats.negativeCount / totalMoods) * 100).toFixed(0)}% of days
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {moodData.length > 0 ? (
        <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100" style={{ minHeight: '300px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-3">😊</div>
            <p className="text-sm font-medium">No mood data available</p>
            <p className="text-xs mt-1">Start logging to see your patterns</p>
          </div>
        </div>
      )}

      {/* Mood Scale Reference */}
      <div className="mt-4 pt-4 border-t border-blue-100">
        <div className="text-xs font-semibold text-gray-700 mb-2">Mood Scale Reference</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { level: 4, label: 'Excellent', emoji: '😄', color: 'bg-green-50 border-green-200 text-green-700' },
            { level: 3, label: 'Good', emoji: '😊', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { level: 2, label: 'Low', emoji: '😐', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { level: 1, label: 'Very Low', emoji: '😔', color: 'bg-red-50 border-red-200 text-red-700' }
          ].map(item => (
            <div key={item.level} className={`border rounded-lg p-2 text-center ${item.color}`}>
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-xs opacity-70">Level {item.level}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
