import React, { useState } from 'react';
import { FaArrowLeft, FaBrain, FaHeart, FaUsers, FaClock, FaAngry, FaSadTear, FaGlassCheers, FaBriefcase, FaHandHoldingHeart, FaDollarSign, FaHeartbeat, FaExclamationTriangle, FaPlus, FaCheck, FaLightbulb } from 'react-icons/fa';
import api from '../../api';

export default function TriggerLoggingScreen({ onBack, userId }) {
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FaLightbulb');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const predefinedTriggers = [
    { id: 'stress', name: 'Stress', icon: FaBrain, color: 'from-red-400 to-red-600', hoverColor: 'hover:from-red-500 hover:to-red-700' },
    { id: 'loneliness', name: 'Loneliness', icon: FaHeart, color: 'from-blue-400 to-blue-600', hoverColor: 'hover:from-blue-500 hover:to-blue-700' },
    { id: 'social-pressure', name: 'Social Pressure', icon: FaUsers, color: 'from-purple-400 to-purple-600', hoverColor: 'hover:from-purple-500 hover:to-purple-700' },
    { id: 'boredom', name: 'Boredom', icon: FaClock, color: 'from-gray-400 to-gray-600', hoverColor: 'hover:from-gray-500 hover:to-gray-700' },
    { id: 'anger', name: 'Anger', icon: FaAngry, color: 'from-red-500 to-red-700', hoverColor: 'hover:from-red-600 hover:to-red-800' },
    { id: 'anxiety', name: 'Anxiety', icon: FaExclamationTriangle, color: 'from-yellow-400 to-yellow-600', hoverColor: 'hover:from-yellow-500 hover:to-yellow-700' },
    { id: 'sadness', name: 'Sadness', icon: FaSadTear, color: 'from-blue-500 to-blue-700', hoverColor: 'hover:from-blue-600 hover:to-blue-800' },
    { id: 'celebration', name: 'Celebration', icon: FaGlassCheers, color: 'from-sky-400 to-sky-600', hoverColor: 'hover:from-sky-500 hover:to-sky-700' },
    { id: 'work-pressure', name: 'Work Pressure', icon: FaBriefcase, color: 'from-orange-400 to-orange-600', hoverColor: 'hover:from-orange-500 hover:to-orange-700' },
    { id: 'relationship', name: 'Relationship Issues', icon: FaHandHoldingHeart, color: 'from-pink-400 to-pink-600', hoverColor: 'hover:from-pink-500 hover:to-pink-700' },
    { id: 'financial', name: 'Financial Stress', icon: FaDollarSign, color: 'from-green-400 to-green-600', hoverColor: 'hover:from-green-500 hover:to-green-700' },
    { id: 'health', name: 'Health Concerns', icon: FaHeartbeat, color: 'from-rose-400 to-rose-600', hoverColor: 'hover:from-rose-500 hover:to-rose-700' }
  ];

  const iconOptions = [
    { name: 'FaLightbulb', component: FaLightbulb },
    { name: 'FaBrain', component: FaBrain },
    { name: 'FaHeart', component: FaHeart },
    { name: 'FaExclamationTriangle', component: FaExclamationTriangle },
    { name: 'FaAngry', component: FaAngry },
    { name: 'FaSadTear', component: FaSadTear }
  ];

  const toggleTrigger = (triggerId) => {
    setSelectedTriggers(prev => 
      prev.includes(triggerId) 
        ? prev.filter(id => id !== triggerId)
        : [...prev, triggerId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTriggers.length === 0 && !customTrigger) {
      alert('Please select at least one trigger or add a custom trigger');
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
      
      const triggersToSend = selectedTriggers.map(triggerId => {
        const trigger = predefinedTriggers.find(t => t.id === triggerId);
        return trigger ? trigger.name : triggerId;
      });
      
      const requestBody = { triggers: triggersToSend };
      if (customTrigger && customTrigger.trim()) {
        requestBody.customTrigger = { name: customTrigger, icon: selectedIcon };
      }
      
      // Use api instance — auto-injects Authorization header
      const result = await api.post(`/patients/${resolvedUserId}/triggers`, requestBody);
      console.log('Trigger saved successfully:', result.data);
      
      setSelectedTriggers([]);
      setCustomTrigger('');
      setSelectedIcon('T');
      onBack();
    } catch (error) {
      console.error('Error saving trigger:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save trigger';
      alert('Failed to save trigger: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomTrigger = () => {
    if (!customTrigger.trim()) return;
    
    // Add to predefined triggers for future use
    const newTrigger = {
      id: `custom-${Date.now()}`,
      name: customTrigger,
      icon: selectedIcon,
      color: 'bg-indigo-500'
    };
    
    setCustomTrigger('');
    setSelectedIcon('⚡');
    setShowCustomForm(false);
    
    // Auto-select the newly created trigger
    setSelectedTriggers(prev => [...prev, newTrigger.id]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
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
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaExclamationTriangle className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Log Your Triggers</h1>
                <p className="text-sm text-gray-600">Identify what challenges you today</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <FaLightbulb className="text-orange-500 text-xl flex-shrink-0" />
              <p className="text-gray-700 font-medium">
                Select the triggers you experienced today. Understanding your triggers helps build better coping strategies.
              </p>
            </div>
          </div>
        </div>

        {/* Predefined Triggers Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="text-white text-lg" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Common Triggers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {predefinedTriggers.map((trigger) => {
              const IconComponent = trigger.icon;
              return (
                <button
                  key={trigger.id}
                  onClick={() => toggleTrigger(trigger.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    selectedTriggers.includes(trigger.id)
                      ? `bg-gradient-to-br ${trigger.color} border-transparent text-white shadow-xl`
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
                  }`}
                >
                  {selectedTriggers.includes(trigger.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <FaCheck className="text-emerald-500 text-xs" />
                    </div>
                  )}
                  <div className="flex justify-center mb-3">
                    <IconComponent className="text-3xl" />
                  </div>
                  <div className={`font-semibold text-sm text-center ${selectedTriggers.includes(trigger.id) ? 'text-white' : 'text-gray-700'}`}>
                    {trigger.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Triggers Display */}
        {selectedTriggers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Selected Triggers ({selectedTriggers.length}):</h3>
            <div className="flex flex-wrap gap-3">
              {selectedTriggers.map((triggerId) => {
                const trigger = predefinedTriggers.find(t => t.id === triggerId);
                if (!trigger) return null;
                const IconComponent = trigger.icon;
                return (
                  <span key={triggerId} className={`inline-flex items-center px-4 py-2 rounded-xl text-white text-sm font-semibold bg-gradient-to-r ${trigger.color} shadow-md`}>
                    <IconComponent className="mr-2" />
                    {trigger.name}
                    <button 
                      onClick={() => toggleTrigger(triggerId)}
                      className="ml-2 text-white hover:text-red-200 font-bold text-lg"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Trigger Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                <FaPlus className="text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Add Custom Trigger</h2>
            </div>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {showCustomForm ? 'Cancel' : '+ Add Custom'}
            </button>
          </div>

          {showCustomForm && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 space-y-5 border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trigger Name</label>
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder="Enter your custom trigger..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((iconOption) => {
                    const IconComponent = iconOption.component;
                    return (
                      <button
                        key={iconOption.name}
                        onClick={() => setSelectedIcon(iconOption.name)}
                        className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedIcon === iconOption.name
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <IconComponent className="text-xl text-gray-700" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={addCustomTrigger}
                disabled={!customTrigger.trim()}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  customTrigger.trim()
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Custom Trigger
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedTriggers.length === 0 && !customTrigger)}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : (selectedTriggers.length > 0 || customTrigger)
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white hover:from-orange-600 hover:via-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving your triggers...</span>
              </>
            ) : (
              <>
                <FaCheck className="text-xl" />
                <span>Save Trigger Log</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}