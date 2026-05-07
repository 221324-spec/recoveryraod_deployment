import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
import { apiFetch } from '../../config/env';
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

export default function DailyMoodTrendChart({ userId, refreshTrigger }) {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodData();
  }, [userId, refreshTrigger]);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/moods?range=14`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const moods = data.moods || [];
      
      // Create 14-day data
      const dailyData = [];
      const today = new Date();
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayMood = moods.find(m => {
          const moodDate = new Date(m.createdAt).toDateString();
          return moodDate === date.toDateString();
        });
        
        dailyData.push({
          date: date,
          mood: dayMood?.mood || '',
          moodValue: dayMood?.moodValue || 0,
          journal: dayMood?.journal || ''
        });
      }
      
      setMoodData(dailyData);
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600"></div>
          <p className="text-gray-500 text-base font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Dual area chart matching reference image (This Week vs Last Week)
  const currentWeekData = moodData.slice(7, 14).map(d => d.moodValue); // Last 7 days
  const pastWeekData = moodData.slice(0, 7).map(d => d.moodValue);    // Previous 7 days
  
  const chartData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Last Week',
        data: pastWeekData,
        fill: true,
        borderColor: 'rgb(52, 211, 153)',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(52, 211, 153, 0.5)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(167, 243, 208, 0.4)');
          gradient.addColorStop(0.5, 'rgba(110, 231, 183, 0.5)');
          gradient.addColorStop(1, 'rgba(52, 211, 153, 0.6)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(52, 211, 153)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      },
      {
        label: 'This Week',
        data: currentWeekData,
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.5)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(147, 197, 253, 0.4)');
          gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.5)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.6)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 11,
            weight: '500'
          },
          color: '#6b7280',
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(i),
              index: i
            }));
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return moodData[context[0].dataIndex].date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });
          },
          label: (context) => {
            const value = context.parsed.y;
            const datasetLabel = context.dataset.label;
            const labels = ['', '😔 Low', '🙂 Okay', '😊 Good', '😄 Excellent'];
            const moodLabel = labels[value] || 'No data';
            return value > 0 ? `${datasetLabel}: ${moodLabel} (${value}/4)` : `${datasetLabel}: No mood logged`;
          },
          afterLabel: (context) => {
            const { journal } = moodData[context.dataIndex];
            if (journal) {
              return `\n"${journal.substring(0, 50)}${journal.length > 50 ? '...' : ''}"`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
            weight: '500'
          },
          color: '#9ca3af',
          padding: 8,
          callback: function(value) {
            if (value === 0 || value === 5) return '';
            const labels = ['', '😔', '🙂', '😊', '😄'];
            return labels[value] || '';
          }
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          lineWidth: 1,
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: {
          font: {
            size: 10,
            weight: '500'
          },
          color: '#9ca3af',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 14
        },
        grid: {
          display: false,
          drawBorder: false
        },
        border: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="mb-3">
        <h3 className="text-base font-bold text-gray-900">Mood & Emotional Trend</h3>
        <p className="text-xs text-gray-500">Comparing this week with last week</p>
      </div>

      <div style={{ height: '400px' }} className="relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
