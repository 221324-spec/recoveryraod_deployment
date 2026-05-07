import React, { useState, useEffect } from 'react';
import { FaBrain, FaLightbulb, FaRobot } from 'react-icons/fa';

export default function AIGuidanceWidget({ userId }) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    // Simulate fetching NLP-based suggestion from the ML/Chatbot service
    const fetchSuggestion = async () => {
      try {
        setLoading(true);
        // Simulate network delay for NLP processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const suggestions = [
          "Based on your recent activity, you've shown great resilience. Try focusing on the 'Urge Surfing' technique today if cravings arise. Keep maintaining this positive momentum!",
          "NLP analysis indicates elevated stress. Remember to pause and take deep breaths. Consider trying the 5-4-3-2-1 grounding technique.",
          "Your logs show a strong positive trend this week! This is a great time to tackle a new learning topic or set a micro-goal for tomorrow."
        ];
        
        // Pick a random suggestion for simulation purposes
        setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
      } catch (err) {
        setSuggestion("Stay mindful of your triggers today. Remember to pause and breathe when feeling overwhelmed.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestion();
  }, [userId]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-5 shadow-xl border border-indigo-100 flex-1 flex flex-col justify-center relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 opacity-5">
        <FaBrain className="text-8xl text-indigo-500" />
      </div>
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <FaRobot className="text-white text-sm" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">AI Coach Insight</h4>
        </div>
        <FaLightbulb className="text-yellow-500 text-lg animate-pulse" />
      </div>
      
      <div className="relative z-10 flex-1 flex items-center bg-white bg-opacity-60 p-3 rounded-xl border border-white border-opacity-50">
        {loading ? (
          <div className="animate-pulse space-y-2 w-full">
            <div className="h-2 bg-indigo-200 rounded w-full"></div>
            <div className="h-2 bg-indigo-200 rounded w-5/6"></div>
            <div className="h-2 bg-indigo-200 rounded w-4/6"></div>
          </div>
        ) : (
          <p className="text-xs text-gray-700 italic font-medium leading-relaxed">
            "{suggestion}"
          </p>
        )}
      </div>
    </div>
  );
}
