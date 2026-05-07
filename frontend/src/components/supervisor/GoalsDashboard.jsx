// frontend/src/pages/GoalsDashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/env';

export default function GoalsDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'Social',
    goalType: 'short-term',
    user: ''
  });

  const getToken = () => localStorage.getItem('token');

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const token = getToken();
    if (!token) {
      setError('No token found. Please log in.');
      setLoading(false);
      return;
    }

    const endpoint = user.role === 'Supervisor' ? 'supervisor' : 'my';

    try {
      const res = await apiFetch(`/api/goals/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to fetch goals');
      }

      const data = await res.json();
      // Ensure milestones array exists for each goal
      const safeData = data.map(goal => ({
        ...goal,
        milestones: goal.milestones || [],
        progress: goal.progress || 0,
        completed: goal.completed || false,
      }));
      setGoals(safeData);
    } catch (err) {
      console.error('fetchGoals error:', err);
      setError(err.message || 'Could not fetch goals');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Toggle milestone
  const toggleMilestone = async (goalId, index) => {
    try {
      const res = await apiFetch(`/api/goals/${goalId}/milestone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ index }),
      });

      if (!res.ok) throw new Error('Failed to update milestone');

      const updated = await res.json();
      setGoals(g => g.map(goal => (goal._id === updated._id ? updated : goal)));
    } catch (err) {
      console.error(err);
      alert('Could not toggle milestone');
    }
  };

  // Download certificate
  const downloadCertificate = async (goalId, title) => {
    try {
      const res = await apiFetch(`/api/goals/${goalId}/certificate`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to get certificate');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'certificate'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('downloadCertificate error:', err);
      alert('Could not download certificate');
    }
  };

  // Create new goal (supervisors)
  const createGoal = async e => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.user) return;

    setCreating(true);
    setError('');

    try {
      const res = await apiFetch(`/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(newGoal),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Create failed');
      }

      await res.json();
      alert('Goal created successfully');
      setNewGoal({ title: '', description: '', category: 'Social', goalType: 'short-term', user: '' });
      fetchGoals(); // refresh list
    } catch (err) {
      console.error('createGoal error:', err);
      setError(err.message || 'Could not create goal');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2>Goals Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Goals List */}
      <section style={{ marginBottom: 30 }}>
        <h3>Your Goals</h3>
        {loading ? (
          <p>Loading goals...</p>
        ) : goals.length === 0 ? (
          <p>No goals found. {user.role === 'Supervisor' ? 'Create one below.' : ''}</p>
        ) : (
          goals.map(goal => (
            <div key={goal._id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
              <h4>
                {goal.title} {goal.completed && <span style={{ color: 'green' }}>(Completed)</span>}
              </h4>
              <p>{goal.description}</p>
              <p>Category: {goal.category} • Type: {goal.goalType} • Progress: {goal.progress}%</p>

              {/* Milestones */}
              <div>
                <strong>Milestones:</strong>
                <ul>
                  {goal.milestones.map((m, idx) => (
                    <li key={idx}>
                      <label>
                        <input
                          type="checkbox"
                          checked={m.completed || false}
                          onChange={() => toggleMilestone(goal._id, idx)}
                        />{' '}
                        {m.title} {m.completed && m.completedAt ? ` (at ${new Date(m.completedAt).toLocaleDateString()})` : ''}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {goal.completed ? (
                <button onClick={() => downloadCertificate(goal._id, goal.title)}>Download Certificate</button>
              ) : (
                <small>Complete all milestones to unlock certificate</small>
              )}
            </div>
          ))
        )}
      </section>

      {/* Create Goal Form (supervisors only) */}
      {user.role === 'Supervisor' && (
        <section>
          <h3>Create Goal</h3>
          <form onSubmit={createGoal} style={{ maxWidth: 600 }}>
            <input
              placeholder="Title"
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              required
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <textarea
              placeholder="Description"
              value={newGoal.description}
              onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <input
              placeholder="Patient userId"
              value={newGoal.user}
              onChange={e => setNewGoal({ ...newGoal, user: e.target.value })}
              required
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}>
                <option>Social</option>
                <option>Emotional</option>
                <option>Physical</option>
                <option>Other</option>
              </select>
              <select value={newGoal.goalType} onChange={e => setNewGoal({ ...newGoal, goalType: e.target.value })}>
                <option value="short-term">Short-term</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>
            <button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Goal'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
