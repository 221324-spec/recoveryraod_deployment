import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaTrophy, FaStar, FaUsers, FaCheck, FaTimes, FaSpinner, FaGlobe } from 'react-icons/fa';
import API from '../../api';

const TYPE_LABELS = {
  'anti-narcotics-day': '🚫 Anti-Narcotics Day',
  'rehab-drive': '🏥 Rehab Drive',
  'webinar': '💻 Webinar',
  'seminar': '🎤 Seminar',
  'awareness-campaign': '📢 Awareness Campaign',
  'workshop': '🛠️ Workshop',
  'community-event': '🤝 Community Event',
  'other': '📌 Other'
};

const STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700'
};

export default function EventsCalendar() {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [rewards, setRewards] = useState({ totalPoints: 0, badges: [], eventsAttended: 0 });
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [tab, setTab] = useState('upcoming'); // upcoming | my-events | rewards
  const [filterType, setFilterType] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [evRes, myRes, rwRes] = await Promise.all([
        API.get('/events'),
        API.get('/events/my/events'),
        API.get('/events/my/rewards')
      ]);
      setEvents(evRes.data);
      setMyEvents(myRes.data);
      setRewards(rwRes.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleJoin = async (eventId) => {
    try {
      setJoiningId(eventId);
      await API.post(`/events/${eventId}/join`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join event');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCancel = async (eventId) => {
    if (!window.confirm('Cancel your registration?')) return;
    try {
      await API.post(`/events/${eventId}/cancel`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const myEventIds = new Set(myEvents.map(p => p.eventId?._id));

  const filteredEvents = events.filter(e => {
    if (tab === 'upcoming' && (e.status === 'cancelled')) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        <span className="ml-3 text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rewards Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
            <FaStar className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{rewards.totalPoints}</p>
            <p className="text-sm text-gray-600">Total Points</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
            <FaTrophy className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{rewards.badges.length}</p>
            <p className="text-sm text-gray-600">Badges Earned</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <FaCheck className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{rewards.eventsAttended}</p>
            <p className="text-sm text-gray-600">Events Attended</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'upcoming', label: 'All Events' },
          { key: 'my-events', label: 'My Events' },
          { key: 'rewards', label: 'Badges & Points' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Type Filter (for All Events tab) */}
      {tab === 'upcoming' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!filterType ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Types
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterType === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* All Events List */}
      {tab === 'upcoming' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaCalendarAlt className="mx-auto text-4xl mb-3 text-gray-300" />
              <p className="font-medium">No events found</p>
            </div>
          ) : filteredEvents.map(event => (
            <div key={event._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[event.status]}`}>
                      {event.status}
                    </span>
                    {event.isNational && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 flex items-center gap-1">
                        <FaGlobe className="text-xs" /> National
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-400" />
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-red-400" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaStar className="text-yellow-400" />
                      {event.pointsReward} pts
                    </span>
                    {event.badge && (
                      <span className="flex items-center gap-1">
                        <FaTrophy className="text-purple-400" />
                        {event.badge}
                      </span>
                    )}
                    {event.maxParticipants > 0 && (
                      <span className="flex items-center gap-1">
                        <FaUsers className="text-green-400" />
                        Max {event.maxParticipants}
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-2 text-xs text-gray-400">{TYPE_LABELS[event.type] || event.type}</span>
                </div>
                <div className="flex-shrink-0">
                  {myEventIds.has(event._id) ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-1">
                        <FaCheck /> Registered
                      </span>
                      {event.status !== 'completed' && (
                        <button
                          onClick={() => handleCancel(event._id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ) : event.status !== 'completed' && event.status !== 'cancelled' ? (
                    <button
                      onClick={() => handleJoin(event._id)}
                      disabled={joiningId === event._id}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {joiningId === event._id ? <FaSpinner className="animate-spin" /> : null}
                      Join Event
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Events */}
      {tab === 'my-events' && (
        <div className="space-y-4">
          {myEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaCalendarAlt className="mx-auto text-4xl mb-3 text-gray-300" />
              <p className="font-medium">You haven't joined any events yet</p>
              <p className="text-sm mt-1">Browse the events tab and join one!</p>
            </div>
          ) : myEvents.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{p.eventId?.title || 'Event'}</h3>
                  <p className="text-sm text-gray-500 mt-1">{p.eventId?.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-400" />
                      {p.eventId?.date ? new Date(p.eventId.date).toLocaleDateString() : ''}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.status === 'attended' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {p.pointsEarned > 0 && (
                    <span className="flex items-center gap-1 text-yellow-600 font-bold">
                      <FaStar /> +{p.pointsEarned} pts
                    </span>
                  )}
                  {p.badgeEarned && (
                    <span className="block mt-1 text-sm text-purple-600 font-medium">🏅 {p.badgeEarned}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges & Points */}
      {tab === 'rewards' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Points Summary</h4>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
                <p className="text-4xl font-bold text-yellow-600">{rewards.totalPoints}</p>
                <p className="text-sm text-gray-600 mt-1">Total points from {rewards.eventsAttended} events</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Badges Collection</h4>
              {rewards.badges.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-center text-gray-500">
                  <p className="text-sm">No badges yet. Attend events to earn badges!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {rewards.badges.map((badge, idx) => (
                    <span key={idx} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold flex items-center gap-1">
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
