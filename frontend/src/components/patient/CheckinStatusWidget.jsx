import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaKey } from 'react-icons/fa';
import { apiFetch } from '../../config/env';

/**
 * CheckinStatusWidget — shows today's check-in completion + journal keyword insights.
 * Fetches from GET /api/patients/:id/checkin-status and GET /api/patients/:id/journal-keywords
 */
export default function CheckinStatusWidget({ userId }) {
  const [status, setStatus] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem('token');

    const fetchData = async () => {
      try {
        const [statusRes, kwRes] = await Promise.all([
          apiFetch(`/api/patients/${userId}/checkin-status`, { headers: { 'Authorization': `Bearer ${token}` } }),
          apiFetch(`/api/patients/${userId}/journal-keywords`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statusRes.ok) {
          const sData = await statusRes.json();
          setStatus(sData);
        }
        if (kwRes.ok) {
          const kData = await kwRes.json();
          setKeywords(kData.keywords || []);
        }
      } catch (err) {
        console.error('CheckinStatus fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  const items = [
    { label: 'Mood', done: status?.mood },
    { label: 'Craving', done: status?.craving },
    { label: 'Triggers', done: status?.triggers }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
      {/* Check-in Completion */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow">
          <FaCheckCircle className="text-white text-sm" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-800">Today's Check-in</h4>
          <p className="text-xs text-gray-500">{status?.complete ? 'All done!' : 'Incomplete'}</p>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            {item.done ? (
              <FaCheckCircle className="text-emerald-500" />
            ) : (
              <FaTimesCircle className="text-red-400" />
            )}
          </div>
        ))}
      </div>

      {/* Journal Keywords */}
      {keywords.length > 0 && (
        <>
          <div className="flex items-center space-x-2 mb-3">
            <FaKey className="text-purple-500 text-sm" />
            <h5 className="text-sm font-bold text-gray-700">Journal Insights</h5>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {kw.word} ({kw.count})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
