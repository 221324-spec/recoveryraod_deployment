import React, { useState, useEffect } from 'react';
import { getCurrentUser, getAssignedSupervisor } from '../../services/chatService';
import api from '../../api';
import { apiFetch } from '../../config/env';

export default function AppointmentsScreen({ onBack }) {
  const [view, setView] = useState('calendar'); // 'calendar' or 'schedule'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisor, setSupervisor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const appointmentTypes = [
    { value: 'therapy', label: 'Individual Therapy', icon: '💬', duration: '60 min' },
    { value: 'group', label: 'Group Therapy', icon: '👥', duration: '90 min' },
    { value: 'psychiatrist', label: 'Psychiatrist', icon: '🏥', duration: '45 min' },
    { value: 'counselor', label: 'Counselor Check-in', icon: '🤝', duration: '30 min' },
    { value: 'medical', label: 'Medical Check-up', icon: '🩺', duration: '30 min' },
    { value: 'intake', label: 'Intake Assessment', icon: '📋', duration: '120 min' }
  ];

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Load user data and appointments on mount
  useEffect(() => {
    const user = getCurrentUser();
    let assignedSupervisor = getAssignedSupervisor();
    
    setCurrentUser(user);
    
    // If no supervisor in localStorage, try fetching fresh profile from backend
    const refreshSupervisor = async () => {
      if (!assignedSupervisor) {
        try {
          const response = await api.get('/auth/me');
          const freshUser = response.data.user;
          if (freshUser?.assignedSupervisor) {
            const stored = getCurrentUser();
            if (stored) {
              stored.assignedSupervisor = freshUser.assignedSupervisor;
              localStorage.setItem('user', JSON.stringify(stored));
            }
            assignedSupervisor = typeof freshUser.assignedSupervisor === 'object'
              ? freshUser.assignedSupervisor
              : { id: freshUser.assignedSupervisor, _id: freshUser.assignedSupervisor };
          }
        } catch (err) {
          console.error('Error refreshing supervisor:', err);
        }
      }
      setSupervisor(assignedSupervisor);
    };
    
    refreshSupervisor();
    
    // Load appointments from API if supervisor assigned
    const loadAppointments = async () => {
      setLoading(true);
      try {
        const uid = user?.id || user?._id;
        if (uid) {
          const token = localStorage.getItem('token');
          const response = await apiFetch(`/api/appointments/${uid}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAppointments(data.appointments || []);
          }
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
      setLoading(false);
    };
    
    loadAppointments();
  }, []);

  // Get providers - only show assigned supervisor if they have one
  const getProviders = () => {
    if (!supervisor) return [];
    return [{
      value: supervisor._id || supervisor.id,
      name: supervisor.name || 'Your Supervisor',
      specialty: supervisor.specialization || 'Recovery Support',
      available: timeSlots // All slots available by default
    }];
  };

  const providers = getProviders();

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProviderData = (value) => {
    return providers.find(p => p.value === value);
  };

  const getAvailableTimes = () => {
    if (!provider) return timeSlots;
    const providerData = getProviderData(provider);
    return providerData ? providerData.available : timeSlots;
  };

  const handleSchedule = async () => {
    if (!appointmentType || !provider || !selectedDate || !selectedTime) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const appointmentData = appointmentTypes.find(type => type.value === appointmentType);
      const providerData = getProviderData(provider);
      
      const token = localStorage.getItem('token');
      const uid = currentUser?.id || currentUser?._id;
      const response = await apiFetch(`/api/appointments/${uid}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: appointmentData.label,
          providerId: provider,
          providerName: providerData?.name,
          date: selectedDate,
          time: selectedTime,
          duration: appointmentData.duration,
          notes: notes,
          icon: appointmentData.icon
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(prev => [...prev, data.appointment]);
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    }
    
    setIsSubmitting(false);
    
    // Reset form and go back to calendar view
    setAppointmentType('');
    setProvider('');
    setSelectedTime('');
    setNotes('');
    setView('calendar');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Show "no supervisor assigned" state
  if (!loading && !supervisor) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <div></div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg">
              📅
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Supervisor Assigned</h3>
            <p className="text-gray-600 max-w-md mb-6">
              You need to be assigned a supervisor before you can schedule appointments. 
              Once an NGO administrator assigns you to a supervisor, you'll be able to book sessions here.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800">What to expect</p>
                  <p className="text-sm text-blue-700 mt-1">
                    After being assigned a supervisor, you can schedule individual therapy sessions, 
                    check-ins, and other appointments directly through this screen.
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={onBack}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>←</span>
          <span>Back to Home</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'calendar' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView('schedule')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'schedule' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Schedule New
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Upcoming Appointments */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Appointments</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-gray-600">No upcoming appointments</p>
                <p className="text-sm text-gray-500 mt-1">Schedule your first appointment with {supervisor?.name || 'your supervisor'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id || appointment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{appointment.icon || '📅'}</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{appointment.type}</h3>
                          <p className="text-sm text-gray-600">with {appointment.providerName || appointment.provider || supervisor?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(appointment.date)} at {appointment.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                        </span>
                        <div className="mt-2 space-x-2">
                          <button className="text-blue-600 text-sm hover:underline">Reschedule</button>
                          <button className="text-red-600 text-sm hover:underline">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setView('schedule')}
              className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <div className="text-3xl mb-2">📅</div>
              <div className="font-semibold text-blue-800">Schedule New Appointment</div>
              <div className="text-sm text-blue-600">Book your next session</div>
            </button>
            <button className="p-6 bg-sky-50 border-2 border-sky-200 rounded-xl hover:bg-sky-100 transition-colors">
              <div className="text-3xl mb-2">🆘</div>
              <div className="font-semibold text-sky-800">Emergency Contact</div>
              <div className="text-sm text-sky-600">24/7 crisis support</div>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Appointment Type */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">Appointment Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {appointmentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAppointmentType(type.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    appointmentType === type.value
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-semibold text-sm">{type.label}</div>
                  <div className="text-xs opacity-75">{type.duration}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">Select Provider</label>
            {providers.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <p className="font-medium">No provider available</p>
                <p className="text-sm mt-1">You need to be assigned a supervisor to book appointments.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((prov) => (
                  <button
                    key={prov.value}
                    onClick={() => setProvider(prov.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      provider === prov.value
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{prov.name}</div>
                    <div className="text-sm opacity-75">{prov.specialty}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time Selection */}
          {provider && (
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">Available Times</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {getAvailableTimes().map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 rounded-lg border transition-colors ${
                      selectedTime === time
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific concerns or topics you'd like to discuss..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSchedule}
            disabled={isSubmitting || !appointmentType || !provider || !selectedDate || !selectedTime}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : (appointmentType && provider && selectedDate && selectedTime)
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Scheduling appointment...</span>
              </div>
            ) : (
              'Schedule Appointment'
            )}
          </button>
        </div>
      )}
    </div>
  );
}