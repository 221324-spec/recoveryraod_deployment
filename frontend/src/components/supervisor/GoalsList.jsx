// frontend/src/pages/GoalsList.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';

export default function GoalsList() {
  const { user } = useAuth();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch goals based on role
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const endpoint =
          user.role === 'Supervisor' ? '/api/goals/supervisor' : '/api/goals/my';
        const res = await apiFetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch goals');
        const data = await res.json();
        setGoals(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [user]);

  // Real-time goal updates
  useEffect(() => {
    const handleGoalAssigned = (data) => {
      console.log('Supervisor received goal assigned:', data);
      // Add the new goal to the list
      setGoals(prev => [data.goal, ...prev]);
    };

    const handleGoalUpdated = (data) => {
      console.log('Supervisor goal updated:', data);
      // Refresh goals
      const fetchGoals = async () => {
        try {
          const token = localStorage.getItem('token');
          const endpoint = user.role === 'Supervisor' ? '/api/goals/supervisor' : '/api/goals/my';
          const res = await apiFetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch goals');
          const data = await res.json();
          setGoals(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchGoals();
    };

    const handleGoalProgressUpdated = (data) => {
      console.log('Supervisor goal progress updated:', data);
      // Update the specific goal's progress
      setGoals(prev => prev.map(g => 
        g._id === data.goalId ? { ...g, progress: data.progress } : g
      ));
    };

    socketService.on('goal:assigned', handleGoalAssigned);
    socketService.on('goal:updated', handleGoalUpdated);
    socketService.on('goal:progress:updated', handleGoalProgressUpdated);

    return () => {
      socketService.off('goal:assigned', handleGoalAssigned);
      socketService.off('goal:updated', handleGoalUpdated);
      socketService.off('goal:progress:updated', handleGoalProgressUpdated);
    };
  }, [user]);

  // Toggle milestone completion
  const toggleMilestone = async (goalId, index) => {
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch(`/api/goals/${goalId}/milestone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ index }),
      });
      if (!res.ok) throw new Error('Failed to update milestone');
      const updatedGoal = await res.json();
      setGoals((prev) =>
        prev.map((g) => (g._id === goalId ? updatedGoal : g))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error toggling milestone');
    }
  };

  // Delete goal (supervisor or admin)
  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete goal');
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error deleting goal');
    }
  };

  if (loading) return <p>Loading goals...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!goals.length) return <p>No goals found.</p>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 20 }}>
        {user.role === 'Supervisor' ? 'My Assigned Goals' : 'Your Goals'}
      </h2>

      {goals.map((goal) => (
        <div
          key={goal._id}
          style={{
            padding: 20,
            marginBottom: 20,
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            background: '#fff',
          }}
        >
          <h3 style={{ marginBottom: 8 }}>{goal.title}</h3>
          <p style={{ marginBottom: 8 }}>{goal.description}</p>
          <p style={{ marginBottom: 8 }}>
            <strong>Category:</strong> {goal.category} |{' '}
            <strong>Type:</strong> {goal.goalType}
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Supervisor:</strong> {goal.supervisor?.name || goal.supervisor?.username} |{' '}
            <strong>Patient:</strong> {goal.user?.name || goal.user?.username}
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Progress:</strong> {goal.progress}%
          </p>

          {goal.milestones?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong>Milestones:</strong>
              <ul style={{ paddingLeft: 20 }}>
                {goal.milestones.map((ms, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>
                    <label style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ms.completed || false}
                        onChange={() => toggleMilestone(goal._id, idx)}
                        disabled={
                          user.role === 'Patient' &&
                          goal.user?._id !== user._id
                        }
                        style={{ marginRight: 8 }}
                      />
                      {ms.title} {ms.completed ? '(Completed)' : ''}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(user.role === 'Supervisor' ||
            user.role === 'Admin') &&
            (goal.supervisor?._id === user._id || user.role === 'Admin') && (
              <button
                onClick={() => deleteGoal(goal._id)}
                style={{
                  padding: '8px 16px',
                  background: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Delete Goal
              </button>
            )}
        </div>
      ))}
    </div>
  );
}
