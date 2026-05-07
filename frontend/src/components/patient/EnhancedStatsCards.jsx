import React, { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { apiFetch } from '../../config/env';

export default function EnhancedStatsCards({ userId, refreshTrigger }) {
  const [stats, setStats] = useState({
    streakDays: 0,
    avgMood: 0,
    totalCheckIns: 0,
    avgCraving: 0,
    triggersMapped: 0,
    recoveryPoints: 0
  });
  const [prevStats, setPrevStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId, refreshTrigger]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch mood stats
      const moodResponse = await apiFetch(`/api/patients/${userId}/moods/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const moodData = await moodResponse.json();

      // Fetch trigger stats
      const triggerResponse = await apiFetch(`/api/patients/${userId}/triggers/top?range=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const triggerData = await triggerResponse.json();

      // Fetch user points
      const userResponse = await apiFetch(`/api/patients/${userId}/points`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      const newStats = {
        streakDays: moodData.streakDays || 0,
        avgMood: parseFloat((moodData.avgMood || 0).toFixed(1)),
        totalCheckIns: moodData.totalCheckIns || 0,
        avgCraving: parseFloat((moodData.avgCraving || 0).toFixed(1)),
        triggersMapped: Object.keys(triggerData.counts || {}).length,
        recoveryPoints: userData.points || 0
      };

      setPrevStats(stats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return 'neutral';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const TrendIndicator = ({ trend, value }) => {
    if (trend === 'up') {
      return (
        <span className="flex items-center text-xs text-green-600 font-medium">
          <span className="mr-1">↑</span>
          <span>{value > 0 ? `+${value}` : value}</span>
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="flex items-center text-xs text-red-600 font-medium">
          <span className="mr-1">↓</span>
          <span>{value}</span>
        </span>
      );
    }
    return null;
  };

  const StatCard = ({ title, value, icon, gradient, previous, unit = '', isGood = 'up', decimals = 0 }) => {
    const trend = getTrend(value, previous);
    const diff = value - previous;
    
    // For some stats, down is good (e.g., craving)
    const trendColor = isGood === 'down' 
      ? (trend === 'down' ? 'text-green-600' : trend === 'up' ? 'text-red-600' : 'text-gray-600')
      : (trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600');

    return (
      <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-opacity-20 border-white`}>
        <div className="flex items-start justify-between mb-2">
          <div className="text-sm font-medium text-white opacity-90">{title}</div>
          <span className="text-3xl">{icon}</span>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-white">
              {loading ? (
                <div className="h-9 w-20 bg-white bg-opacity-20 rounded animate-pulse"></div>
              ) : (
                <CountUp 
                  end={value} 
                  decimals={decimals}
                  duration={1.5}
                  separator=","
                  suffix={unit}
                  preserveValue={true}
                />
              )}
            </div>
            {!loading && previous !== undefined && diff !== 0 && (
              <div className={`mt-1 ${trendColor} flex items-center space-x-1 text-xs font-semibold bg-white bg-opacity-20 rounded-full px-2 py-0.5 w-fit`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                <span>{Math.abs(diff).toFixed(decimals)}{unit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard
        title="Recovery Streak"
        value={stats.streakDays}
        icon="🔥"
        gradient="from-orange-500 to-red-500"
        previous={prevStats.streakDays}
        unit=" days"
        isGood="up"
      />

      <StatCard
        title="Total Check-ins"
        value={stats.totalCheckIns}
        icon="✅"
        gradient="from-blue-500 to-indigo-600"
        previous={prevStats.totalCheckIns}
        isGood="up"
      />

      <StatCard
        title="Avg Mood"
        value={stats.avgMood}
        icon="😊"
        gradient="from-green-500 to-emerald-600"
        previous={prevStats.avgMood}
        unit="/4"
        decimals={1}
        isGood="up"
      />

      <StatCard
        title="Avg Craving"
        value={stats.avgCraving}
        icon="💭"
        gradient="from-purple-500 to-pink-500"
        previous={prevStats.avgCraving}
        unit="/10"
        decimals={1}
        isGood="down"
      />

      <StatCard
        title="Triggers Mapped"
        value={stats.triggersMapped}
        icon="⚡"
        gradient="from-yellow-500 to-orange-500"
        previous={prevStats.triggersMapped}
        isGood="up"
      />

      <StatCard
        title="Recovery Points"
        value={stats.recoveryPoints}
        icon="⭐"
        gradient="from-cyan-500 to-blue-600"
        previous={prevStats.recoveryPoints}
        unit=" pts"
        isGood="up"
      />
    </div>
  );
}
