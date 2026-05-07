import React, { useState } from 'react';
import { FaWind, FaPen, FaQuoteLeft, FaCalendarCheck, FaHeart, FaCheckCircle } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

const SUPPORT_MAP = {
  anxious: [
    {
      type: 'BREATHING',
      icon: <FaWind />,
      title: 'Guided Breathing',
      description: 'Try box breathing: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 times.',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      type: 'JOURNAL_PROMPT',
      icon: <FaPen />,
      title: 'Journaling Prompt',
      description: 'Write about what\'s on your mind right now. What specific worry feels strongest?',
      color: 'from-violet-500 to-purple-500'
    },
    {
      type: 'QUOTE',
      icon: <FaQuoteLeft />,
      title: 'Motivational Thought',
      description: '"You don\'t have to control your thoughts. You just have to stop letting them control you." — Dan Millman',
      color: 'from-amber-500 to-orange-500'
    }
  ],
  sad: [
    {
      type: 'JOURNAL_PROMPT',
      icon: <FaPen />,
      title: 'Express Yourself',
      description: 'Write down three things you\'re grateful for today, no matter how small they seem.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      type: 'COPING_TIP',
      icon: <FaHeart />,
      title: 'Coping Strategy',
      description: 'Reach out to someone you trust. A short conversation can shift your perspective.',
      color: 'from-rose-500 to-pink-500'
    },
    {
      type: 'QUOTE',
      icon: <FaQuoteLeft />,
      title: 'Words of Encouragement',
      description: '"Even the darkest night will end, and the sun will rise." — Victor Hugo',
      color: 'from-amber-500 to-orange-500'
    }
  ],
  neutral: [
    {
      type: 'CHECKIN_REMINDER',
      icon: <FaCalendarCheck />,
      title: 'Check-In Reminder',
      description: 'Take a moment to log your mood and how your day went. Consistency matters!',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      type: 'JOURNAL_PROMPT',
      icon: <FaPen />,
      title: 'Quick Reflection',
      description: 'What\'s one thing that went well today? Write it down to build awareness.',
      color: 'from-violet-500 to-purple-500'
    }
  ],
  happy: [
    {
      type: 'QUOTE',
      icon: <FaHeart />,
      title: 'Keep It Going!',
      description: 'Great to see you\'re feeling positive! Your progress is worth celebrating. 🎉',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      type: 'JOURNAL_PROMPT',
      icon: <FaPen />,
      title: 'Capture This Moment',
      description: 'What helped you feel good today? Writing it down can help you recreate it.',
      color: 'from-violet-500 to-purple-500'
    }
  ]
};

export default function EmotionDrivenSupportPanel({ emotion, scanId, patientId }) {
  const [clickedActions, setClickedActions] = useState(new Set());
  const suggestions = SUPPORT_MAP[emotion] || SUPPORT_MAP.neutral;

  const handleActionClick = async (actionType) => {
    if (clickedActions.has(actionType)) return;

    try {
      const token = localStorage.getItem('token');
      await apiFetch(`/api/patients/${patientId}/ai-mood/support-action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, emotion, actionType })
      });
      setClickedActions(prev => new Set([...prev, actionType]));
    } catch (e) {
      console.error('support action log error:', e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
        <h4 className="font-bold text-slate-800 text-sm">Suggested Support</h4>
        <p className="text-[11px] text-slate-500">Based on your detected mood — tap any suggestion to try it</p>
      </div>
      <div className="p-4 space-y-3">
        {suggestions.map((s, i) => {
          const clicked = clickedActions.has(s.type);
          return (
            <button
              key={i}
              onClick={() => handleActionClick(s.type)}
              disabled={clicked}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                clicked
                  ? 'bg-emerald-50 border-emerald-200 cursor-default'
                  : 'bg-white border-slate-200 hover:shadow-md hover:border-violet-200 hover:bg-violet-50/30 cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-sm shadow-sm flex-shrink-0`}>
                  {clicked ? <FaCheckCircle /> : s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-800">{s.title}</h5>
                    {clicked && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">Done</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
