import React, { useState } from 'react';
import { FaArrowLeft, FaSpa, FaComments, FaRunning, FaPencilAlt, FaUsers, FaWalking, FaBook, FaWind, FaMusic, FaPalette, FaYinYang, FaHandsHelping, FaCalendarAlt, FaClock, FaClipboardCheck, FaHourglassHalf, FaCheckCircle, FaStickyNote, FaCheck, FaTrophy } from 'react-icons/fa';
import api from '../../api';

export default function ActivityLoggingScreen({ onBack, userId }) {
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [status, setStatus] = useState('scheduled'); // 'scheduled', 'completed', 'pending'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activityOptions = [
    { value: 'meditation', label: 'Meditation', icon: FaSpa, points: 15, category: 'Wellness', color: 'from-purple-400 to-purple-600' },
    { value: 'therapy', label: 'Therapy Session', icon: FaComments, points: 25, category: 'Support', color: 'from-blue-400 to-blue-600' },
    { value: 'exercise', label: 'Exercise', icon: FaRunning, points: 20, category: 'Physical', color: 'from-red-400 to-red-600' },
    { value: 'journaling', label: 'Journaling', icon: FaPencilAlt, points: 10, category: 'Mental', color: 'from-yellow-400 to-yellow-600' },
    { value: 'group-session', label: 'Group Session', icon: FaUsers, points: 20, category: 'Social', color: 'from-green-400 to-green-600' },
    { value: 'walking', label: 'Walking', icon: FaWalking, points: 15, category: 'Physical', color: 'from-teal-400 to-teal-600' },
    { value: 'reading', label: 'Reading', icon: FaBook, points: 10, category: 'Mental', color: 'from-indigo-400 to-indigo-600' },
    { value: 'breathing', label: 'Breathing Exercise', icon: FaWind, points: 12, category: 'Wellness', color: 'from-cyan-400 to-cyan-600' },
    { value: 'music', label: 'Music Therapy', icon: FaMusic, points: 15, category: 'Wellness', color: 'from-pink-400 to-pink-600' },
    { value: 'art', label: 'Art Therapy', icon: FaPalette, points: 18, category: 'Creative', color: 'from-orange-400 to-orange-600' },
    { value: 'yoga', label: 'Yoga', icon: FaYinYang, points: 20, category: 'Physical', color: 'from-emerald-400 to-emerald-600' },
    { value: 'volunteer', label: 'Volunteer Work', icon: FaHandsHelping, points: 25, category: 'Social', color: 'from-rose-400 to-rose-600' }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'completed': return { gradient: 'from-emerald-400 to-emerald-600', icon: FaCheckCircle };
      case 'scheduled': return { gradient: 'from-blue-400 to-blue-600', icon: FaCalendarAlt };
      case 'pending': return { gradient: 'from-amber-400 to-amber-600', icon: FaHourglassHalf };
      default: return { gradient: 'from-gray-400 to-gray-600', icon: FaClipboardCheck };
    }
  };

  const getActivityByValue = (value) => {
    const activity = activityOptions.find(activity => activity.value === value);
    if (activity) {
      // For backward compatibility with backend, store a simple emoji representation
      const emojiMap = {
        'meditation': '🧘', 'therapy': '💬', 'exercise': '🏃', 'journaling': '📝',
        'group-session': '👥', 'walking': '🚶', 'reading': '📚', 'breathing': '🌬️',
        'music': '🎵', 'art': '🎨', 'yoga': '🧘‍♀️', 'volunteer': '🤝'
      };
      return { ...activity, iconEmoji: emojiMap[value] || '✓' };
    }
    return activity;
  };

  const handleSubmit = async () => {
    if (!selectedActivity || !selectedDate || !selectedTime) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Resolve userId from prop or localStorage
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            resolvedUserId = parsed?.id || parsed?._id || parsed?.userId;
          }
        } catch (e) {}
      }

      if (!resolvedUserId) {
        alert('User session not found. Please refresh the page.');
        setIsSubmitting(false);
        return;
      }
      
      const activity = getActivityByValue(selectedActivity);
      
      // Use api instance — auto-injects Authorization header
      const result = await api.post(`/patients/${resolvedUserId}/activities`, {
        activity: activity.label,
        icon: activity.iconEmoji,
        points: activity.points,
        category: activity.category,
        date: selectedDate,
        time: selectedTime,
        status: status,
        notes: notes
      });
      console.log('Activity saved successfully:', result.data);
      
      setSelectedActivity('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedTime('');
      setStatus('scheduled');
      setNotes('');
      onBack();
    } catch (error) {
      console.error('Error saving activity:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save activity';
      alert('Failed to save activity: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedActivityData = selectedActivity ? getActivityByValue(selectedActivity) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <FaArrowLeft className="text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaClipboardCheck className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Log Activity</h1>
                <p className="text-sm text-gray-600">Track your wellness journey</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Left Column - Activity Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <FaClipboardCheck className="text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Select Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
              {activityOptions.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <button
                    key={activity.value}
                    onClick={() => setSelectedActivity(activity.value)}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedActivity === activity.value
                        ? `bg-gradient-to-br ${activity.color} border-transparent text-white shadow-xl`
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {selectedActivity === activity.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <FaCheck className="text-emerald-500 text-xs" />
                      </div>
                    )}
                    <div className="flex justify-center mb-2">
                      <IconComponent className="text-2xl" />
                    </div>
                    <div className={`font-semibold text-xs text-center mb-1 ${selectedActivity === activity.value ? 'text-white' : 'text-gray-700'}`}>
                      {activity.label}
                    </div>
                    <div className={`text-xs text-center ${selectedActivity === activity.value ? 'text-white opacity-90' : 'text-gray-500'}`}>
                      +{activity.points} pts
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Selected Activity Info */}
            {selectedActivityData && (
              <div className={`bg-gradient-to-r ${selectedActivityData.color} rounded-xl p-4 mt-4 text-white`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    {React.createElement(selectedActivityData.icon, { className: "text-2xl" })}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedActivityData.label}</h3>
                    <p className="text-sm opacity-90">
                      {selectedActivityData.category} • +{selectedActivityData.points} points
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Date & Time */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Schedule</h2>
            </div>
            
            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      selectedTime === time
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-transparent text-white shadow-lg'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Status & Notes */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <FaClipboardCheck className="text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Status & Notes</h2>
            </div>
            
            {/* Status Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending' }
                ].map((statusOption) => {
                  const statusConfig = getStatusColor(statusOption.value);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <button
                      key={statusOption.value}
                      onClick={() => setStatus(statusOption.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        status === statusOption.value
                          ? `bg-gradient-to-r ${statusConfig.gradient} border-transparent text-white shadow-lg`
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="text-xl" />
                        <span className="font-semibold">{statusOption.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <FaStickyNote className="text-gray-600" />
                <span>Notes</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this activity..."
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section - Points Preview & Submit */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          {/* Points Preview */}
          {selectedActivityData && status === 'completed' && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <FaTrophy className="text-emerald-500 text-3xl" />
                <span className="text-gray-800 font-bold text-xl">
                  You'll earn +{selectedActivityData.points} wellness points!
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedActivity || !selectedDate || !selectedTime}
              className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : (selectedActivity && selectedDate && selectedTime)
                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Saving activity...</span>
                </>
              ) : (
                <>
                  <FaCheck className="text-xl" />
                  <span>Save Activity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}