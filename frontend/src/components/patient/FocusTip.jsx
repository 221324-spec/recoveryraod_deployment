import React from 'react';

export default function FocusTip() {
  const tips = [
    {
      title: "Focus on what you can control today...",
      icon: "🎯"
    },
    {
      title: "Take 5 deep breaths when feeling overwhelmed",
      icon: "🌬️"
    },
    {
      title: "Remember: Progress, not perfection",
      icon: "✨"
    },
    {
      title: "One day at a time, one step at a time",
      icon: "👣"
    }
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm flex-shrink-0">
          {randomTip.icon}
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 mb-1">Focus on</h4>
          <p className="text-sm font-medium text-gray-900">{randomTip.title}</p>
        </div>
      </div>
    </div>
  );
}
