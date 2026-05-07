import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { apiFetch } from '../../config/env';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function WeeklyMoodTrend({ userId, refreshTrigger }) {
  const [moodDistribution, setMoodDistribution] = useState({
    excellent: 0,
    good: 0,
    okay: 0,
    low: 0
  });
  const [weekData, setWeekData] = useState([]);
  const [improvement, setImprovement] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    fetchWeekData();
  }, [userId, refreshTrigger]);

  const fetchWeekData = async () => {
    try {
      // Fetch last 30 moods to get accurate distribution for the week
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/moods?range=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const moods = data.moods || [];
      
      // Filter to only last 7 days for distribution
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekMoods = moods.filter(m => new Date(m.createdAt) >= sevenDaysAgo);
      
      // Get last 7 days for chart
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const dailyMoods = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        
        const dayMood = moods.find(m => {
          const moodDate = new Date(m.createdAt).toDateString();
          return moodDate === date.toDateString();
        });
        
        dailyMoods.push({
          day: dayName,
          mood: dayMood?.mood || '😐',
          value: dayMood?.moodValue || 0,
          date: date
        });
      }
      
      // Calculate mood distribution (last 7 days only)
      const distribution = {
        excellent: weekMoods.filter(m => m.moodValue === 4).length,
        good: weekMoods.filter(m => m.moodValue === 3).length,
        okay: weekMoods.filter(m => m.moodValue === 2).length,
        low: weekMoods.filter(m => m.moodValue === 1).length
      };
      
      // Calculate improvement (comparing to average)
      const validDays = dailyMoods.filter(d => d.value > 0);
      const thisWeekAvg = validDays.length > 0 
        ? validDays.reduce((sum, d) => sum + d.value, 0) / validDays.length 
        : 0;
      const improvement = Math.round((thisWeekAvg / 4) * 100);
      
      setWeekData(dailyMoods);
      setMoodDistribution(distribution);
      setImprovement(improvement);
      setTotalEntries(weekMoods.length);
    } catch (error) {
      console.error('Error fetching week data:', error);
    }
  };

  const chartData = {
    labels: ['😄 Excellent', '😊 Good', '🙂 Okay', '😔 Low'],
    datasets: [
      {
        data: [
          moodDistribution.excellent,
          moodDistribution.good,
          moodDistribution.okay,
          moodDistribution.low
        ],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)', // Purple
          'rgba(34, 197, 94, 0.8)',  // Green
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(239, 68, 68, 0.8)'   // Red
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${value} days (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Weekly Distribution</h3>
        <p className="text-sm text-gray-600 mt-1">
          <span className="text-green-600 font-semibold">{improvement}%</span> mood score
        </p>
      </div>

      {/* Doughnut Chart - Compact */}
      <div className="relative mb-2 flex-shrink-0">
        <div style={{ height: '110px', position: 'relative', margin: '0 auto', maxWidth: '110px' }}>
          <Doughnut data={chartData} options={chartOptions} />
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-xl font-bold text-gray-900">{improvement}%</div>
          </div>
        </div>
      </div>

      {/* Legend & Stats - Compact vertically */}
      <div className="space-y-1.5 flex-1 mt-2">
        {[
          { label: 'Excellent', emoji: '😄', count: moodDistribution.excellent, color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
          { label: 'Good', emoji: '😊', count: moodDistribution.good, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
          { label: 'Okay', emoji: '🙂', count: moodDistribution.okay, color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
          { label: 'Low', emoji: '😔', count: moodDistribution.low, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' }
        ].map((item, index) => {
          const percentage = totalEntries > 0 ? ((item.count / totalEntries) * 100).toFixed(0) : 0;
          return (
            <div key={index} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${item.bgColor} transition-all hover:shadow-sm cursor-pointer`}>
              <div className="text-lg flex-shrink-0">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-semibold ${item.textColor}`}>{item.label}</span>
                  <span className={`text-xs font-bold ${item.textColor}`}>{percentage}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-1">
                  <div 
                    className={`${item.color} h-1 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-700 flex-shrink-0 w-4 text-right">{item.count}</span>
            </div>
          );
        })}
      </div>

      {/* Footer - Total Entries */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-center">
        <span className="text-xs text-gray-500">Total: </span>
        <span className="text-sm font-bold text-blue-600">{totalEntries} entries</span>
        <span className="text-xs text-gray-500"> this week</span>
      </div>
    </div>
  );
}
