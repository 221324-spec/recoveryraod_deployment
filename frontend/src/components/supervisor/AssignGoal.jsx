// frontend/src/pages/AssignGoal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../config/env';

export default function AssignGoal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // GOAL STATE
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'Social',
    goalType: 'short-term',
    user: '',
    supervisor: user?.name || user?.username || '',
    dueDate: '',
  });

  // MILESTONES STATE
  const [milestones, setMilestones] = useState([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  // NEW MILESTONE INPUT STATES
  const [milestonePriority, setMilestonePriority] = useState('Medium');
  const [milestoneStatus, setMilestoneStatus] = useState('On track');
  const [milestoneStartDate, setMilestoneStartDate] = useState('');
  const [milestoneEndDate, setMilestoneEndDate] = useState('');

  // FETCH PATIENTS
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        // Support both user.id and user._id
        const userId = user._id || user.id;
        if (!userId) {
          console.error('No user ID found');
          setError('User not authenticated properly');
          return;
        }
        const res = await apiFetch(`/api/supervisors/${userId}/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw new Error('Your session has expired. Please log in again.');
          }
          throw new Error('Failed to fetch patients');
        }
        const data = await res.json();
        console.log('Fetched patients:', data);
        setPatients(data.patients || data || []);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err.message || 'Could not load patients');
      }
    };
    // Support both user.id and user._id
    const userId = user && (user._id || user.id);
    if (userId) {
      fetchPatients();
    }
  }, [user]);

  // ADD MILESTONE
  const addMilestone = () => {
    if (!milestoneInput.trim()) {
      alert('Please enter a milestone title.');
      return;
    }
    if (!milestoneStartDate || !milestoneEndDate) {
      alert('Please select a start and end date for the milestone.');
      return;
    }

    // Format dates for display in the card (e.g., "Dec 10")
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    setMilestones([
      ...milestones,
      {
        title: milestoneInput,
        completed: false,
        // Properties set by the supervisor
        priority: milestonePriority,
        status: milestoneStatus,
        startDate: formatDate(milestoneStartDate),
        endDate: formatDate(milestoneEndDate),
        // Supervisor initials for display
        assignedUser: user?.name ? user.name.split(' ')[0][0] + (user.name.split(' ')[1] ? user.name.split(' ')[1][0] : '') : 'AN',
      },
    ]);

    // Reset input fields
    setMilestoneInput('');
    setMilestonePriority('Medium');
    setMilestoneStatus('On track');
    setMilestoneStartDate('');
    setMilestoneEndDate('');
  };

  // REMOVE MILESTONE
  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // SUBMIT GOAL
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!newGoal.user) {
      setError('Please select a patient');
      setLoading(false);
      return;
    }

    if (milestones.length === 0) {
      setError('Please add at least one milestone');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const res = await apiFetch(`/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newGoal,
          // When sending to the backend, we only need the basic data.
          // The visual properties (priority, status, dates) are for the supervisor's view.
          milestones: milestones.map(({ title, completed }) => ({ title, completed })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        // Check if it's an authentication error
        if (err.message && err.message.includes('Invalid token')) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(err.message || 'Failed to assign goal');
      }

      const result = await res.json();

      setSuccessMessage(
        `Goal "${result.goalTitle}" assigned successfully`
      );

      // RESET FORM
      setNewGoal({
        title: '',
        description: '',
        category: 'Social',
        goalType: 'short-term',
        user: '',
        supervisor: user?.name || user?.username || '',
        dueDate: '',
      });
      setMilestones([]);

    } catch (err) {
      console.error('Goal assignment error:', err);
      if (err.message.includes('session has expired') || err.message.includes('Invalid token')) {
        setError(
          <div>
            <p>{err.message}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ACCESS CONTROL - Allow supervisors to access
  if (!user || user.role !== 'Supervisor') {
    console.log('Access control check:', { user, userRole: user?.role, isSupervisor: user?.role === 'Supervisor' });
    return (
      <div style={containerStyle}>
        <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
          Loading supervisor access... Please ensure you're logged in as a supervisor.
        </p>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Current user: {user ? `${user.name} (${user.role})` : 'Not logged in'}
        </p>
        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Debug: Token present: {localStorage.getItem('token') ? 'Yes' : 'No'}
        </p>
      </div>
    );
  }

  // Helper component for Milestone Tag (to match the image style)
  const Tag = ({ text, color, background }) => (
    <span style={{
      padding: '2px 6px',
      fontSize: 12,
      borderRadius: 4,
      fontWeight: 'bold',
      marginRight: 6,
      color: color,
      backgroundColor: background,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );

  // Helper component for Milestone Card
  const MilestoneCard = ({ milestone, index, onRemove }) => {
    // Determine colors for fixed text tags (just for visual representation based on the image)
    const priorityColors = {
      Low: { bg: '#e8f5e9', text: '#388e3c' }, // Light Green
      Medium: { bg: '#fffde7', text: '#fbc02d' }, // Light Yellow
      High: { bg: '#ffebee', text: '#d32f2f' }, // Light Red
    };
    const statusColors = {
      'On track': { bg: '#e0f7fa', text: '#00bcd4' }, // Light Cyan/Teal
      'At risk': { bg: '#fff3e0', text: '#ff9800' }, // Light Orange
      'Off track': { bg: '#fbe9e7', text: '#ff5722' }, // Light Deep Orange
    };

    const priorityInfo = priorityColors[milestone.priority] || priorityColors.Medium;
    const statusInfo = statusColors[milestone.status] || statusColors['On track'];

    return (
      <div style={milestoneCardStyle}>
        <div style={milestoneCardTitle}>
          <span style={checkboxStyle}>✔</span>
          {milestone.title}
        </div>
        <div style={milestoneCardTags}>
          <Tag text={milestone.priority} background={priorityInfo.bg} color={priorityInfo.text} />
          <Tag text={milestone.status} background={statusInfo.bg} color={statusInfo.text} />
        </div>
        <div style={milestoneCardFooter}>
          <span style={initialsStyle}>{milestone.assignedUser}</span>
          <span style={dateRangeStyle}>{milestone.startDate} – {milestone.endDate}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={removeBtnCard}
          >
            Remove
          </button>
        </div>
      </div>
    );
  };


  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Assign Goal</h2>

      {error && <p style={errorStyle}>{error}</p>}
      {successMessage && <p style={successStyle}>{successMessage}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        {/* LEFT COLUMN: Goal Details */}
        <div style={formColumnLeft}>
          <label htmlFor="goalTitle">Goal Title</label>
          <input
            id="goalTitle"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            required
            style={inputStyle}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={newGoal.description}
            onChange={(e) =>
              setNewGoal({ ...newGoal, description: e.target.value })
            }
            style={{ ...inputStyle, height: 80 }}
          />

          <label htmlFor="patientSelect">Select Patient</label>
          {patients.length === 0 ? (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '4px', 
              marginBottom: '10px',
              color: '#856404'
            }}>
              <strong>No patients assigned yet.</strong><br />
              Patients need to be assigned to you by an administrator or NGO coordinator before you can create goals for them.
              {error && <div style={{ marginTop: '5px', color: '#dc3545' }}>Error: {error}</div>}
            </div>
          ) : (
            <select
              id="patientSelect"
              value={newGoal.user}
              onChange={(e) => setNewGoal({ ...newGoal, user: e.target.value })}
              required
              style={inputStyle}
            >
              <option value="">-- Select Patient --</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.email || p.username})
                </option>
              ))}
            </select>
          )}

          {/* NEW MILESTONE INPUT FIELDS */}
          <label>Goal Steps (Milestones) - Input</label>
          
          <input
            value={milestoneInput}
            onChange={(e) => setMilestoneInput(e.target.value)}
            placeholder="e.g. Walk 10 minutes"
            style={inputStyle}
          />

          <div style={milestoneInputGroup}>
            <div>
              <label htmlFor="prioritySelect" style={milestoneLabel}>Priority</label>
              <select
                id="prioritySelect"
                value={milestonePriority}
                onChange={(e) => setMilestonePriority(e.target.value)}
                style={inputStyle}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="statusSelect" style={milestoneLabel}>Status</label>
              <select
                id="statusSelect"
                value={milestoneStatus}
                onChange={(e) => setMilestoneStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="On track">On track</option>
                <option value="At risk">At risk</option>
                <option value="Off track">Off track</option>
              </select>
            </div>
          </div>

          <div style={milestoneInputGroup}>
            <div>
              <label htmlFor="startDate" style={milestoneLabel}>Start Date</label>
              <input
                id="startDate"
                type="date"
                value={milestoneStartDate}
                onChange={(e) => setMilestoneStartDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="endDate" style={milestoneLabel}>End Date</label>
              <input
                id="endDate"
                type="date"
                value={milestoneEndDate}
                onChange={(e) => setMilestoneEndDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button type="button" onClick={addMilestone} style={addBtnStyle}>
              Add Milestone
            </button>
          </div>
          {/* END NEW MILESTONE INPUT FIELDS */}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Assigning...' : 'Assign Goal'}
          </button>
        </div>

        {/* RIGHT COLUMN: Milestone Display (Card View) */}
        <div style={formColumnRight}>
          <h3>Milestones Assigned</h3>
          {milestones.length === 0 ? (
            <p style={{ color: '#757575' }}>No milestones added yet. Use the fields on the left to add one.</p>
          ) : (
            <div style={milestonesListStyle}>
              {milestones.map((m, i) => (
                <MilestoneCard
                  key={i}
                  milestone={m}
                  index={i}
                  onRemove={removeMilestone}
                />
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

/* ---------- STYLES ---------- */

const containerStyle = {
  maxWidth: 1000, // Increased max width for two columns
  margin: '40px auto',
  padding: 24,
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const formStyle = {
  display: 'flex',
  gap: '30px', // Space between the two columns
};

const formColumnLeft = {
  flex: 1, // Takes up half the space (or slightly less, based on content)
};

const formColumnRight = {
  flex: 1.2, // Takes up slightly more space for the cards
  padding: '0 10px',
  borderLeft: '1px solid #eee',
};

const milestoneInputGroup = {
  display: 'flex',
  gap: '12px',
  marginBottom: 12,
};

const milestoneLabel = {
  display: 'block',
  marginBottom: 4,
  fontSize: 14,
  fontWeight: 'bold',
  color: '#444',
};

const milestonesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const milestoneCardStyle = {
  padding: 16,
  borderRadius: 8,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #ddd',
  backgroundColor: '#f7f7f7',
};

const milestoneCardTitle = {
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'bold',
  marginBottom: 8,
  color: '#333',
};

const checkboxStyle = {
  marginRight: 8,
  fontSize: 16,
  color: '#4CAF50', // Green check mark
};

const milestoneCardTags = {
  marginBottom: 10,
};

const milestoneCardFooter = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 12,
  color: '#757575',
};

const initialsStyle = {
  backgroundColor: '#9575cd', // Purple background for initials
  color: 'white',
  borderRadius: '50%',
  width: 20,
  height: 20,
  minWidth: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 10,
  fontWeight: 'bold',
  marginRight: 8,
};

const dateRangeStyle = {
  marginRight: 'auto', // Pushes remove button to the end
};

const removeBtnCard = {
  background: 'none',
  border: 'none',
  color: 'red',
  cursor: 'pointer',
  fontSize: 12,
};


const titleStyle = {
  textAlign: 'center',
  marginBottom: 20,
  color: '#1a237e',
};

const inputStyle = {
  width: '100%',
  padding: 10,
  marginBottom: 12,
  borderRadius: 6,
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: 12,
  background: '#1a73e8',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  cursor: 'pointer',
  marginTop: 12,
};

const addBtnStyle = {
  padding: '10px 14px',
  background: '#455a64',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};


const errorStyle = { color: 'red', fontWeight: 'bold' };
const successStyle = { color: 'green', fontWeight: 'bold' };