import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { apiFetch } from '../../config/env';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function WeeklyMoodDistribution({ userId, refreshTrigger }) {
  const [weeklyData, setWeeklyData] = useState({
    moodDistribution: {},
    totalEntries: 0,
    dominantMood: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, [userId, refreshTrigger]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/moods?range=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      const moods = data.moods || [];
      const distribution = {};
      
      moods.forEach(entry => {
        const mood = entry.mood || 'Unknown';
        distribution[mood] = (distribution[mood] || 0) + 1;
      });

      const sortedMoods = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
      const dominantMood = sortedMoods[0] ? sortedMoods[0][0] : null;

      setWeeklyData({
        moodDistribution: distribution,
        totalEntries: moods.length,
        dominantMood
      });
    } catch (error) {
      console.error('Error fetching weekly mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodLabel = (emoji) => {
    const labels = {
      '😄': 'Excellent',
      '😊': 'Happy',
      '🙂': 'Good',
      '😐': 'Neutral',
      '😔': 'Low',
      '😞': 'Very Low'
    };
    return labels[emoji] || emoji;
  };

  const getMoodColor = (mood) => {
    const colors = {
      '😄': 'rgba(16, 185, 129, 1)',    // Emerald
      '😊': 'rgba(59, 130, 246, 1)',    // Blue
      '🙂': 'rgba(34, 211, 238, 1)',    // Cyan
      '😐': 'rgba(251, 191, 36, 1)',    // Amber
      '😔': 'rgba(249, 115, 22, 1)',    // Orange
      '😞': 'rgba(239, 68, 68, 1)'      // Red
    };
    return colors[mood] || 'rgba(156, 163, 175, 1)';
  };

  const chartData = {
    labels: Object.keys(weeklyData.moodDistribution).map(mood => getMoodLabel(mood)),
    datasets: [{
      data: Object.values(weeklyData.moodDistribution),
      backgroundColor: Object.keys(weeklyData.moodDistribution).map(mood => getMoodColor(mood)),
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 15
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#374151',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} entries (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-500 text-sm font-medium">Loading weekly analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 shadow-lg border border-purple-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-3 text-2xl">📊</span>
            Weekly Mood Distribution
          </h3>
          <p className="text-sm text-gray-500 mt-1">Last 7 days analysis</p>
        </div>
        
        {weeklyData.dominantMood && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-md">
            <div className="text-xs font-medium">Dominant Mood</div>
            <div className="text-2xl font-bold flex items-center mt-1">
              {weeklyData.dominantMood}
              <span className="ml-2 text-base">{getMoodLabel(weeklyData.dominantMood)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
          <div className="text-xs text-purple-600 font-semibold">Total Entries</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{weeklyData.totalEntries}</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
          <div className="text-xs text-purple-600 font-semibold">Unique Moods</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {Object.keys(weeklyData.moodDistribution).length}
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
          <div className="text-xs text-purple-600 font-semibold">Avg/Day</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {(weeklyData.totalEntries / 7).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {weeklyData.totalEntries > 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center bg-white/40 rounded-xl p-4 backdrop-blur-sm border border-purple-100">
          <div style={{ height: '320px', width: '100%' }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-sm font-medium">No mood entries this week</p>
            <p className="text-xs mt-1">Start logging to see your distribution</p>
          </div>
        </div>
      )}

      {/* Mood Legend with Percentages */}
      {weeklyData.totalEntries > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-100">
          <div className="text-xs font-semibold text-gray-700 mb-2">Detailed Breakdown</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(weeklyData.moodDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count]) => {
                const percentage = ((count / weeklyData.totalEntries) * 100).toFixed(1);
                return (
                  <div key={mood} className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg border border-purple-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{mood}</span>
                      <span className="text-xs font-medium text-gray-700">{getMoodLabel(mood)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{count}</div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
