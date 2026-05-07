import React, { useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaFire, FaSmile, FaCheck, FaCalendarAlt, FaStickyNote, FaMapMarkerAlt } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

const moodOptions = [
  { emoji: '😊', label: 'Great', value: 'great', color: 'from-emerald-400 to-emerald-600' },
  { emoji: '🙂', label: 'Good', value: 'good', color: 'from-sky-400 to-sky-600' },
  { emoji: '😐', label: 'Okay', value: 'okay', color: 'from-yellow-400 to-yellow-600' },
  { emoji: '😟', label: 'Bad', value: 'bad', color: 'from-orange-400 to-orange-600' },
  { emoji: '😢', label: 'Terrible', value: 'terrible', color: 'from-red-400 to-red-600' },
  { emoji: '😰', label: 'Anxious', value: 'anxious', color: 'from-purple-400 to-purple-600' }
];

const triggerOptions = [
  { id: 'stress', name: 'Stress' },
  { id: 'loneliness', name: 'Loneliness' },
  { id: 'boredom', name: 'Boredom' },
  { id: 'peer_pressure', name: 'Peer Pressure' },
  { id: 'family_conflict', name: 'Family Conflict' },
  { id: 'work_pressure', name: 'Work Pressure' },
  { id: 'financial', name: 'Financial Issues' },
  { id: 'social_event', name: 'Social Event' },
  { id: 'pain', name: 'Physical Pain' },
  { id: 'insomnia', name: 'Insomnia' },
  { id: 'anger', name: 'Anger' },
  { id: 'celebration', name: 'Celebration' }
];

export default function RelapseLoggingScreen({ onBack, userId }) {
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [substanceType, setSubstanceType] = useState('');
  const [severity, setSeverity] = useState('slip');
  const [cravingLevel, setCravingLevel] = useState(5);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [notes, setNotes] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const toggleTrigger = (triggerId) => {
    setSelectedTriggers(prev =>
      prev.includes(triggerId) ? prev.filter(t => t !== triggerId) : [...prev, triggerId]
    );
  };

  const getCravingColor = (level) => {
    if (level <= 3) return 'from-emerald-400 to-emerald-600';
    if (level <= 6) return 'from-yellow-400 to-orange-500';
    return 'from-red-500 to-red-700';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async () => {
    if (!substanceType.trim()) {
      showToast('Please enter the substance type.', 'error');
      return;
    }
    if (!selectedMood) {
      showToast('Please select your mood at the time.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        dateTime: new Date(dateTime).toISOString(),
        substanceType: substanceType.trim(),
        severity,
        cravingLevelAtRelapse: cravingLevel,
        moodAtRelapse: selectedMood,
        triggers: selectedTriggers.map(id => triggerOptions.find(t => t.id === id)?.name || id),
        notes: notes.trim() || undefined,
        location: locationLabel.trim() ? { label: locationLabel.trim() } : undefined
      };

      const response = await apiFetch(`/api/patients/${userId}/relapses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save relapse log');
      }

      showToast('Relapse logged successfully. Stay strong — help is here.', 'success');
      // Reset form after brief delay so user sees toast
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error saving relapse:', error);
      showToast('Failed to save: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-semibold transition-all duration-300 ${
          toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors group"
          >
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <FaArrowLeft className="text-red-600" />
            </div>
            <span className="font-semibold">Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaExclamationTriangle className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Log a Relapse / Slip</h1>
              <p className="text-sm text-gray-500">Honesty is part of recovery — no judgement here</p>
            </div>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Left Column */}
          <div className="space-y-6">
            {/* Date/Time & Severity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="text-white text-lg" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">When & What</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Substance Type *</label>
                  <input
                    type="text"
                    value={substanceType}
                    onChange={(e) => setSubstanceType(e.target.value)}
                    placeholder="e.g. Alcohol, Nicotine, Cannabis..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Severity</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSeverity('slip')}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all duration-200 ${
                        severity === 'slip'
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {severity === 'slip' && <FaCheck className="inline mr-2 text-xs" />}
                      Slip (minor)
                    </button>
                    <button
                      onClick={() => setSeverity('relapse')}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all duration-200 ${
                        severity === 'relapse'
                          ? 'bg-red-100 border-red-400 text-red-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {severity === 'relapse' && <FaCheck className="inline mr-2 text-xs" />}
                      Relapse (significant)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mood at Time */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <FaSmile className="text-white text-lg" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Mood at the Time *</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedMood === mood.value
                        ? `bg-gradient-to-br ${mood.color} border-transparent text-white shadow-xl`
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 shadow-md'
                    }`}
                  >
                    {selectedMood === mood.value && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <FaCheck className="text-emerald-500 text-xs" />
                      </div>
                    )}
                    <div className="text-3xl mb-1">{mood.emoji}</div>
                    <div className={`font-semibold text-xs ${selectedMood === mood.value ? 'text-white' : 'text-gray-700'}`}>
                      {mood.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Craving Level */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <FaFire className="text-white text-lg" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Craving Level at Relapse (0-10)</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={cravingLevel}
                  onChange={(e) => setCravingLevel(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #0ea5e9 0%, #0ea5e9 ${(cravingLevel / 10) * 100}%, 
                      #e5e7eb ${(cravingLevel / 10) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>0 — None</span>
                  <span>5 — Moderate</span>
                  <span>10 — Intense</span>
                </div>
                <div className="text-center">
                  <span className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold text-lg bg-gradient-to-r ${getCravingColor(cravingLevel)} shadow-lg`}>
                    <FaFire />
                    <span>{cravingLevel}/10</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Triggers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="text-white text-lg" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">What Triggered It?</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {triggerOptions.map((trigger) => (
                  <button
                    key={trigger.id}
                    onClick={() => toggleTrigger(trigger.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      selectedTriggers.includes(trigger.id)
                        ? 'bg-orange-100 border-orange-400 text-orange-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {selectedTriggers.includes(trigger.id) && <FaCheck className="inline mr-1 text-xs" />}
                    {trigger.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes & Location */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                  <FaStickyNote className="text-white text-lg" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Notes & Location</h2>
              </div>
              <div className="space-y-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What happened? How do you feel now? Any thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 resize-none"
                />
                <div className="flex items-center space-x-2">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <input
                    type="text"
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    placeholder="Location (optional) — e.g. Home, Bar, Friend's place"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-12 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 ${
              isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 hover:shadow-2xl hover:scale-105'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Log Relapse'}
          </button>
        </div>

        {/* Encouragement Message */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm italic">
            "A setback is not a failure. Logging it is a sign of strength and commitment to your recovery."
          </p>
        </div>
      </div>
    </div>
  );
}
