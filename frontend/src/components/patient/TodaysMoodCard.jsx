import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/env';

export default function TodaysMoodCard({ userId, onLogMood, refreshTrigger }) {
  const [todaysMood, setTodaysMood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysMood();
  }, [userId, refreshTrigger]);

  const fetchTodaysMood = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/moods?range=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const moods = data.moods || [];
      const today = moods.find(m => {
        const moodDate = new Date(m.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        return moodDate === todayDate;
      });
      setTodaysMood(today);
    } catch (error) {
      console.error('Error fetching today mood:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500">Todays Mood</h3>
        {todaysMood && (
          <span className="text-xs text-gray-400">
            {new Date(todaysMood.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>
      {todaysMood ? (
        <div className="flex items-center space-x-4">
          <span className="text-4xl">{todaysMood.mood}</span>
          <div>
            <p className="text-base font-semibold text-gray-900">Checked in today</p>
            <p className="text-sm text-green-600 font-medium mt-0.5">Keep up the good work!</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-3">
            Tap once to reflect. Takes only 3 seconds.
          </p>
          <button
            onClick={onLogMood}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
          >
            Check-in today
          </button>
        </div>
      )}
    </div>
  );
}
