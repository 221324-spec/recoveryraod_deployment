import React, { useState, useEffect } from 'react';
import { FaBolt, FaExclamationTriangle, FaFire, FaWind, FaClock } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

export default function TriggerLogCard({ userId, refreshTrigger, onLogTrigger }) {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, weeklyCount: 0, commonTrigger: null });

  useEffect(() => {
    fetchTriggers();
  }, [userId, refreshTrigger]);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/triggers?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.triggers) {
        const triggerData = data.triggers || [];
        setTriggers(triggerData);
        
        // Calculate stats
        const total = triggerData.length;
        const weeklyCount = triggerData.filter(t => {
          const triggerDate = new Date(t.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return triggerDate >= weekAgo;
        }).length;
        
        // Find most common trigger from the triggers array
        const triggerCounts = {};
        triggerData.forEach(t => {
          if (t.triggers && Array.isArray(t.triggers)) {
            t.triggers.forEach(trigger => {
              triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
            });
          }
          if (t.customTrigger && t.customTrigger.name) {
            triggerCounts[t.customTrigger.name] = (triggerCounts[t.customTrigger.name] || 0) + 1;
          }
        });
        const commonTrigger = Object.keys(triggerCounts).length > 0
          ? Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b)
          : null;
        
        setStats({ total, weeklyCount, commonTrigger });
      }
    } catch (error) {
      console.error('Error fetching triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTriggerIcon = (type) => {
    const normalizedType = type ? type.toLowerCase() : '';
    const icons = {
      'stress': <FaBolt className="text-yellow-600" />,
      'anxiety': <FaExclamationTriangle className="text-orange-600" />,
      'craving': <FaFire className="text-red-600" />,
      'social pressure': <FaWind className="text-blue-600" />,
      'social': <FaWind className="text-blue-600" />,
      'environment': <FaClock className="text-purple-600" />,
      'loneliness': <FaExclamationTriangle className="text-indigo-600" />,
    };
    return icons[normalizedType] || <FaBolt className="text-gray-600" />;
  };

  const getTriggerColor = (type) => {
    const normalizedType = type ? type.toLowerCase() : '';
    const colors = {
      'stress': 'bg-yellow-50 border-yellow-200',
      'anxiety': 'bg-orange-50 border-orange-200',
      'craving': 'bg-red-50 border-red-200',
      'social pressure': 'bg-blue-50 border-blue-200',
      'social': 'bg-blue-50 border-blue-200',
      'environment': 'bg-purple-50 border-purple-200',
      'loneliness': 'bg-indigo-50 border-indigo-200',
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaBolt className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Trigger Log</h3>
            <p className="text-sm text-gray-500">Monitor and manage triggers</p>
          </div>
        </div>
        <button
          onClick={onLogTrigger}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          + Log Trigger
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="text-3xl font-bold text-red-900">{stats.total}</div>
          <div className="text-xs font-semibold text-red-700 mt-1">Total Triggers</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="text-3xl font-bold text-orange-900">{stats.weeklyCount}</div>
          <div className="text-xs font-semibold text-orange-700 mt-1">This Week</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="text-lg font-bold text-yellow-900">{stats.commonTrigger || 'None'}</div>
          <div className="text-xs font-semibold text-yellow-700 mt-1">Most Common</div>
        </div>
      </div>

      {/* Recent Triggers List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Triggers</h4>
        {triggers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaBolt className="text-gray-400 text-2xl" />
            </div>
            <p className="text-sm text-gray-500 mb-3">No triggers logged yet</p>
            <button
              onClick={onLogTrigger}
              className="text-sm text-red-600 font-semibold hover:text-red-700"
            >
              Log your first trigger →
            </button>
          </div>
        ) : (
          triggers.map((trigger, index) => {
            // Get the first trigger from the array or custom trigger
            const firstTrigger = trigger.triggers && trigger.triggers.length > 0 
              ? trigger.triggers[0] 
              : trigger.customTrigger?.name || 'Unknown';
            const allTriggers = trigger.triggers || [];
            const hasMultiple = allTriggers.length > 1;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getTriggerColor(firstTrigger)}`}
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {getTriggerIcon(firstTrigger)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-bold text-gray-900">
                      {capitalizeFirst(firstTrigger)}
                      {hasMultiple && (
                        <span className="ml-2 text-xs font-semibold text-gray-500">
                          +{allTriggers.length - 1} more
                        </span>
                      )}
                    </h5>
                    <span className="text-xs font-semibold text-gray-500">
                      {new Date(trigger.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {hasMultiple && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {allTriggers.slice(1).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                          {capitalizeFirst(t)}
                        </span>
                      ))}
                    </div>
                  )}
                  {trigger.customTrigger && trigger.customTrigger.name && (
                    <div className="mt-2">
                      <span className="px-2 py-0.5 bg-purple-100 rounded-full text-xs font-bold text-purple-700 border border-purple-200">
                        {trigger.customTrigger.icon} {trigger.customTrigger.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View All Link */}
      {triggers.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={onLogTrigger}
            className="text-sm text-red-600 font-semibold hover:text-red-700"
          >
            View all triggers →
          </button>
        </div>
      )}
    </div>
  );
}
