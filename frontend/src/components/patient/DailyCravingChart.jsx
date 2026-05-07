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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DailyCravingChart({ userId, refreshTrigger }) {
  const [cravingData, setCravingData] = useState([]);
  const [timeRange, setTimeRange] = useState('7');
  const [stats, setStats] = useState({ avgCraving: 0, peakCraving: 0, lowCraving: 0, trend: 'stable' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCravingData();
  }, [userId, timeRange, refreshTrigger]);

  const fetchCravingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/moods?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      const moods = data.moods || [];
      
      // Calculate stats
      const cravings = moods.map(m => m.craving || 0);
      const avgCraving = cravings.length > 0 
        ? cravings.reduce((a, b) => a + b, 0) / cravings.length 
        : 0;
      const peakCraving = cravings.length > 0 ? Math.max(...cravings) : 0;
      const lowCraving = cravings.length > 0 ? Math.min(...cravings) : 0;
      
      // Calculate trend (comparing first half to second half)
      const midpoint = Math.floor(cravings.length / 2);
      const firstHalf = cravings.slice(0, midpoint);
      const secondHalf = cravings.slice(midpoint);
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
      
      let trend = 'stable';
      if (secondAvg < firstAvg - 0.5) trend = 'improving';
      else if (secondAvg > firstAvg + 0.5) trend = 'increasing';

      setStats({ avgCraving, peakCraving, lowCraving, trend });
      setCravingData(moods);
    } catch (error) {
      console.error('Error fetching craving data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCravingLevel = (craving) => {
    if (craving <= 3) return { label: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (craving <= 6) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const chartData = {
    labels: cravingData.map(entry => {
      const date = new Date(entry.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Craving Level',
        data: cravingData.map(entry => entry.craving || 0),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
          gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Safe Threshold',
        data: Array(cravingData.length).fill(3),
        borderColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          padding: 15,
          font: { size: 11, family: "'Inter', sans-serif", weight: '600' },
          color: '#374151',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const date = new Date(cravingData[index].createdAt);
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          },
          afterLabel: (context) => {
            const index = context.dataIndex;
            const level = getCravingLevel(context.parsed.y);
            return [`Level: ${level.label}`, `Time: ${new Date(cravingData[index].createdAt).toLocaleTimeString()}`];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          font: { size: 10, weight: '500' },
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false
        },
        ticks: {
          stepSize: 2,
          font: { size: 11, weight: '500' },
          color: '#6B7280',
          callback: (value) => value
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  const getTrendIcon = () => {
    if (stats.trend === 'improving') return '📉';
    if (stats.trend === 'increasing') return '📈';
    return '➡️';
  };

  const getTrendColor = () => {
    if (stats.trend === 'improving') return 'text-green-600 bg-green-50 border-green-200';
    if (stats.trend === 'increasing') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-gray-500 text-sm font-medium">Analyzing cravings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl p-6 shadow-lg border border-red-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-3 text-2xl">🔥</span>
            Daily Craving Trends
          </h3>
          <p className="text-sm text-gray-500 mt-1">Monitor your craving patterns</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
          {['7', '14', '30'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                timeRange === days
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-xl p-3 shadow-md">
          <div className="text-xs font-semibold opacity-90">Avg Craving</div>
          <div className="text-2xl font-bold mt-1">{stats.avgCraving.toFixed(1)}<span className="text-sm">/10</span></div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-3 shadow-md">
          <div className="text-xs font-semibold opacity-90">Peak Level</div>
          <div className="text-2xl font-bold mt-1">{stats.peakCraving}<span className="text-sm">/10</span></div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-3 shadow-md">
          <div className="text-xs font-semibold opacity-90">Lowest</div>
          <div className="text-2xl font-bold mt-1">{stats.lowCraving}<span className="text-sm">/10</span></div>
        </div>
        <div className={`rounded-xl p-3 shadow-md border-2 ${getTrendColor()}`}>
          <div className="text-xs font-semibold">Trend</div>
          <div className="text-xl font-bold mt-1 flex items-center">
            <span className="mr-2">{getTrendIcon()}</span>
            <span className="capitalize text-sm">{stats.trend}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {cravingData.length > 0 ? (
        <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-red-100" style={{ minHeight: '300px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-3">🔥</div>
            <p className="text-sm font-medium">No craving data available</p>
            <p className="text-xs mt-1">Start tracking to see your trends</p>
          </div>
        </div>
      )}

      {/* Craving Level Guide */}
      <div className="mt-4 pt-4 border-t border-red-100">
        <div className="text-xs font-semibold text-gray-700 mb-2">Craving Level Guide</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="text-xs font-semibold text-green-700">Low (0-3)</div>
            <div className="text-lg">✅</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
            <div className="text-xs font-semibold text-yellow-700">Moderate (4-6)</div>
            <div className="text-lg">⚠️</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            <div className="text-xs font-semibold text-red-700">High (7-10)</div>
            <div className="text-lg">🚨</div>
          </div>
        </div>
      </div>
    </div>
  );
}
