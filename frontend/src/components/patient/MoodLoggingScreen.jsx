import React, { useState } from 'react';
import { FaArrowLeft, FaSmile, FaFire, FaPen, FaCheck } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

export default function MoodLoggingScreen({ onBack, userId }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [cravingLevel, setCravingLevel] = useState(5);
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodOptions = [
    { emoji: '😊', label: 'Great', value: 'great', color: 'from-emerald-400 to-emerald-600', hoverColor: 'hover:from-emerald-500 hover:to-emerald-700' },
    { emoji: '😐', label: 'Okay', value: 'okay', color: 'from-blue-400 to-blue-600', hoverColor: 'hover:from-blue-500 hover:to-blue-700' },
    { emoji: '😔', label: 'Down', value: 'down', color: 'from-amber-400 to-amber-600', hoverColor: 'hover:from-amber-500 hover:to-amber-700' },
    { emoji: '😡', label: 'Angry', value: 'angry', color: 'from-red-400 to-red-600', hoverColor: 'hover:from-red-500 hover:to-red-700' }
  ];

  const aiSuggestions = [
    "Write how your day went...",
    "What made you feel this way today?",
    "Describe any challenges you faced...",
    "What are you grateful for today?",
    "How did you handle stress today?"
  ];

  const getCravingColor = (level) => {
    if (level <= 3) return 'from-sky-400 to-sky-600';
    if (level <= 6) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      alert('Please select your mood');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if userId is available
      if (!userId) {
        alert('User session not found. Please refresh the page.');
        setIsSubmitting(false);
        return;
      }
      
      // Map mood value to emoji and moodValue (1-4)
      // Scale: 4=Excellent, 3=Good, 2=Okay, 1=Low
      const moodMapping = {
        'great': { emoji: '😊', value: 4 },    // Excellent
        'okay': { emoji: '😐', value: 3 },     // Good (FIXED from 2)
        'down': { emoji: '😔', value: 2 },     // Okay (FIXED from 1)
        'angry': { emoji: '😡', value: 1 }     // Low/Angry
      };
      
      const moodData = moodMapping[selectedMood] || { emoji: '😐', value: 3 };
      
      console.log('🎯 Submitting mood entry:', { userId, mood: moodData.emoji, moodValue: moodData.value, craving: cravingLevel });
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Session expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      // Call backend API
      const response = await apiFetch(`/api/patients/${userId}/moods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood: moodData.emoji,
          moodValue: moodData.value,
          craving: cravingLevel,
          journal: journalText
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save mood');
      }
      
      const result = await response.json();
      console.log('✅ Mood saved successfully:', result);
      console.log('📡 Backend should now emit Socket.IO event to supervisor');
      
      // Reset form
      setSelectedMood(null);
      setCravingLevel(5);
      setJournalText('');
      
      // Go back to dashboard
      onBack();
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full px-6 py-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <FaArrowLeft className="text-blue-600" />
            </div>
            <span className="font-semibold">Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaSmile className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Log Your Mood</h1>
              <p className="text-sm text-gray-500">Track your emotional wellness journey</p>
            </div>
          </div>
          <div className="w-32"></div>
        </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Left Column - Mood Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
              <FaSmile className="text-white text-lg" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">How are you feeling today?</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedMood === mood.value
                    ? `bg-gradient-to-br ${mood.color} border-transparent text-white shadow-xl`
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
                }`}
              >
                {selectedMood === mood.value && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <FaCheck className="text-emerald-500 text-xs" />
                  </div>
                )}
                <div className="text-5xl mb-2">{mood.emoji}</div>
                <div className={`font-semibold text-base ${selectedMood === mood.value ? 'text-white' : 'text-gray-700'}`}>
                  {mood.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Craving Level */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
              <FaFire className="text-white text-lg" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Craving Level (0-10)</h2>
          </div>
          <div className="space-y-6">
            <div className="relative pt-2">
              <input
                type="range"
                min="0"
                max="10"
                value={cravingLevel}
                onChange={(e) => setCravingLevel(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, 
                    #0ea5e9 0%, #0ea5e9 ${(cravingLevel / 10) * 100}%, 
                    #e5e7eb ${(cravingLevel / 10) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-3 px-1">
                <div className="text-center">
                  <div className="font-semibold text-gray-700">0</div>
                  <div className="text-xs">No craving</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">5</div>
                  <div className="text-xs">Moderate</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">10</div>
                  <div className="text-xs">Intense</div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl text-white font-bold text-xl bg-gradient-to-r ${getCravingColor(cravingLevel)} shadow-lg`}>
                <FaFire className="text-2xl" />
                <span>Level {cravingLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Journal */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
            <FaPen className="text-white text-lg" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Journal Your Thoughts</h2>
        </div>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Start writing here... Express your feelings, thoughts, and what's on your mind."
          rows={5}
          className="w-full p-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none text-base transition-all bg-gray-50 focus:bg-white"
        />
        
        {/* Submit Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedMood}
            className={`flex items-center space-x-3 px-10 py-4 rounded-xl font-semibold text-base transition-all duration-300 ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : selectedMood
                ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving your mood...</span>
              </>
            ) : (
              <>
                <FaCheck className="text-lg" />
                <span>Save Mood Entry</span>
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}