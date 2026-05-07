import React, { useState, useEffect } from 'react';
import { FaDumbbell, FaRunning, FaBook, FaMusic, FaPaintBrush, FaUsers } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

export default function ActivityLogCard({ userId, refreshTrigger, onLogActivity }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, weeklyPoints: 0, topActivity: null });

  useEffect(() => {
    fetchActivities();
  }, [userId, refreshTrigger]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/activities?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.activities) {
        const activityData = data.activities || [];
        setActivities(activityData);
        
        // Calculate stats
        const total = activityData.length;
        const weeklyPoints = activityData
          .filter(a => {
            const activityDate = new Date(a.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return activityDate >= weekAgo;
          })
          .reduce((sum, a) => sum + (a.points || 0), 0);
        
        // Find most frequent activity type - use 'activity' field
        const activityCounts = {};
        activityData.forEach(a => {
          const activityName = a.activity || 'Unknown';
          activityCounts[activityName] = (activityCounts[activityName] || 0) + 1;
        });
        const topActivity = Object.keys(activityCounts).length > 0
          ? Object.keys(activityCounts).reduce((a, b) => activityCounts[a] > activityCounts[b] ? a : b)
          : null;
        
        setStats({ total, weeklyPoints, topActivity });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const normalizedType = type ? type.toLowerCase() : '';
    const icons = {
      'exercise': <FaRunning className="text-blue-600" />,
      'meditation': <FaDumbbell className="text-purple-600" />,
      'reading': <FaBook className="text-green-600" />,
      'music': <FaMusic className="text-pink-600" />,
      'art': <FaPaintBrush className="text-orange-600" />,
      'social': <FaUsers className="text-indigo-600" />,
      'therapy': <FaUsers className="text-teal-600" />,
      'therapy session': <FaUsers className="text-teal-600" />,
    };
    return icons[normalizedType] || <FaDumbbell className="text-gray-600" />;
  };

  const getActivityColor = (type) => {
    const normalizedType = type ? type.toLowerCase() : '';
    const colors = {
      'exercise': 'bg-blue-50 border-blue-200',
      'meditation': 'bg-purple-50 border-purple-200',
      'reading': 'bg-green-50 border-green-200',
      'music': 'bg-pink-50 border-pink-200',
      'art': 'bg-orange-50 border-orange-200',
      'social': 'bg-indigo-50 border-indigo-200',
      'therapy': 'bg-teal-50 border-teal-200',
      'therapy session': 'bg-teal-50 border-teal-200',
    };
    return colors[normalizedType] || 'bg-gray-50 border-gray-200';
  };

  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaDumbbell className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Activity Log</h3>
            <p className="text-sm text-gray-500">Track your wellness activities</p>
          </div>
        </div>
        <button
          onClick={onLogActivity}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          + Log Activity
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-xs font-semibold text-blue-700 mt-1">Total Activities</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-3xl font-bold text-green-900">{stats.weeklyPoints}</div>
          <div className="text-xs font-semibold text-green-700 mt-1">Weekly Points</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-lg font-bold text-purple-900">{stats.topActivity || 'None'}</div>
          <div className="text-xs font-semibold text-purple-700 mt-1">Top Activity</div>
        </div>
      </div>

      {/* Recent Activities List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Activities</h4>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaDumbbell className="text-gray-400 text-2xl" />
            </div>
            <p className="text-sm text-gray-500 mb-3">No activities logged yet</p>
            <button
              onClick={onLogActivity}
              className="text-sm text-blue-600 font-semibold hover:text-blue-700"
            >
              Log your first activity →
            </button>
          </div>
        ) : (
          activities.map((activity, index) => {
            const activityName = activity.activity || 'Unknown Activity';
            const activityIcon = activity.icon || '';
            const status = activity.status || 'completed';
            
            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getActivityColor(activityName)}`}
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {activityIcon ? <span className="text-xl">{activityIcon}</span> : getActivityIcon(activityName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-bold text-gray-900">{capitalizeFirst(activityName)}</h5>
                    <span className="text-xs font-semibold text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${
                      status === 'completed' ? 'text-green-600' : 
                      status === 'pending' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {capitalizeFirst(status)}
                    </span>
                    {activity.points && (
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs font-bold text-green-600 border border-green-200">
                        +{activity.points} pts
                      </span>
                    )}
                  </div>
                  {activity.notes && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{activity.notes}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View All Link */}
      {activities.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={onLogActivity}
            className="text-sm text-blue-600 font-semibold hover:text-blue-700"
          >
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
}
