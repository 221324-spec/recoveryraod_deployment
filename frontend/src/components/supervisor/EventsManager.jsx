import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaCalendarAlt, FaStar, FaCheck, FaSpinner, FaTimes, FaGlobe } from 'react-icons/fa';
import API from '../../api';

const EVENT_TYPES = [
  { value: 'anti-narcotics-day', label: 'Anti-Narcotics Day' },
  { value: 'rehab-drive', label: 'Rehab Drive' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'awareness-campaign', label: 'Awareness Campaign' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'community-event', label: 'Community Event' },
  { value: 'other', label: 'Other' }
];

const STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700'
};

const emptyForm = {
  title: '', description: '', type: 'awareness-campaign', date: '', endDate: '',
  location: 'Online', isNational: false, pointsReward: 10, badge: '', maxParticipants: 0
};

export default function EventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [participantsModal, setParticipantsModal] = useState(null); // eventId
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await API.put(`/events/${editing}`, form);
      } else {
        await API.post('/events', form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm });
      await fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setEditing(event._id);
    setForm({
      title: event.title, description: event.description || '', type: event.type,
      date: event.date ? event.date.slice(0, 10) : '', endDate: event.endDate ? event.endDate.slice(0, 10) : '',
      location: event.location, isNational: event.isNational, pointsReward: event.pointsReward,
      badge: event.badge || '', maxParticipants: event.maxParticipants || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await API.delete(`/events/${id}`);
      await fetchEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const viewParticipants = async (eventId) => {
    try {
      setParticipantsModal(eventId);
      setLoadingParticipants(true);
      const res = await API.get(`/events/${eventId}/participants`);
      setParticipants(res.data);
    } catch (err) {
      console.error('Failed to fetch participants', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleMarkAttended = async (participationId) => {
    try {
      await API.put(`/events/participation/${participationId}/attend`);
      if (participantsModal) viewParticipants(participantsModal);
    } catch (err) {
      alert('Failed to mark attended');
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Events & Campaigns</h2>
          <p className="text-gray-500 text-sm mt-1">Create and manage recovery events, campaigns, and awareness programs</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ ...emptyForm }); }}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Event' : 'New Event'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" value={form.location} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points Reward</label>
              <input type="number" name="pointsReward" value={form.pointsReward} onChange={handleChange} min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge Name</label>
              <input name="badge" value={form.badge} onChange={handleChange} placeholder="e.g. Anti-Narcotics Champion"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants (0 = unlimited)</label>
              <input type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isNational" checked={form.isNational} onChange={handleChange} id="isNational"
              className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="isNational" className="text-sm font-medium text-gray-700">National Event (visible to all patients)</label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <FaSpinner className="animate-spin" />}
              {editing ? 'Update' : 'Create'} Event
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
            <FaCalendarAlt className="mx-auto text-4xl mb-3 text-gray-300" />
            <p className="font-medium">No events created yet</p>
            <p className="text-sm mt-1">Click "Create Event" to get started</p>
          </div>
        ) : events.map(event => (
          <div key={event._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
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
                    {new Date(event.date).toLocaleDateString()}
                    {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString()}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaStar className="text-yellow-400" />
                    {event.pointsReward} pts
                  </span>
                  {event.badge && <span className="text-purple-600">🏅 {event.badge}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => viewParticipants(event._id)}
                  className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-1">
                  <FaUsers /> Participants
                </button>
                <button onClick={() => handleEdit(event)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(event._id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Participants Modal */}
      {participantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setParticipantsModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Event Participants</h3>
              <button onClick={() => setParticipantsModal(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            {loadingParticipants ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-blue-500 text-xl" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No participants yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">
                        {p.patientId?.firstName && p.patientId?.lastName
                          ? `${p.patientId.firstName} ${p.patientId.lastName}`
                          : p.patientId?.name || p.patientId?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Registered {new Date(p.registeredAt).toLocaleDateString()}
                        {p.status === 'attended' && ` • Attended ${new Date(p.attendedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'attended' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.status}
                      </span>
                      {p.status === 'registered' && (
                        <button onClick={() => handleMarkAttended(p._id)}
                          className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1">
                          <FaCheck className="text-xs" /> Mark Attended
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
