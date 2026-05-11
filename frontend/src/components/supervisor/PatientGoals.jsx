import React, { useEffect, useState } from "react";
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';

const PatientGoals = ({ selectedPatient }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatientGoals = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Get all goals assigned by this supervisor
        const res = await apiFetch(`/api/goals/supervisor`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch goals');
        const data = await res.json();
        
        // Filter goals for the selected patient if one is selected
        const filteredGoals = selectedPatient 
          ? data.filter(g => g.user?._id === selectedPatient._id || g.user?._id === selectedPatient.id)
          : data;
        
        setGoals(filteredGoals);
      } catch (err) {
        console.error('Error fetching patient goals:', err);
        setError(err.message || 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientGoals();
  }, [selectedPatient]);

  // Real-time goal updates
  useEffect(() => {
    const handleGoalProgress = (data) => {
      console.log('Goal progress updated:', data);
      setGoals(prev => prev.map(g => {
        if (g._id !== data.goalId) return g;

        const next = { ...g, progress: Number(data.progress) };

        // If backend provides milestoneIndex/completed, update checkbox state too.
        if (typeof data.milestoneIndex === 'number' && Array.isArray(g.milestones) && g.milestones[data.milestoneIndex]) {
          const milestones = [...g.milestones];
          milestones[data.milestoneIndex] = {
            ...milestones[data.milestoneIndex],
            completed: !!data.completed,
          };
          next.milestones = milestones;
        }

        return next;
      }));
    };

    const handleGoalAssigned = (data) => {
      console.log('New goal assigned:', data);
      // Add to list if it's for the current patient or no patient selected
      if (!selectedPatient || data.patientId === selectedPatient._id || data.patientId === selectedPatient.id) {
        setGoals(prev => [data.goal, ...prev]);
      }
    };

    socketService.on('goal:progress:updated', handleGoalProgress);
    socketService.on('goal:assigned', handleGoalAssigned);

    return () => {
      socketService.off('goal:progress:updated', handleGoalProgress);
      socketService.off('goal:assigned', handleGoalAssigned);
    };
  }, [selectedPatient]);

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
      setGoals(prev => prev.map(g => g._id === goalId ? updatedGoal : g));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating milestone');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading goals...</span>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      {error}
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {selectedPatient ? `${selectedPatient.name}'s Goals` : 'All Patient Goals'}
      </h2>
      
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">🎯</div>
          <p className="text-gray-600 text-lg">No goals assigned yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Use the "Assign Goal" section to create goals for your patients.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const totalMilestones = Array.isArray(goal.milestones) ? goal.milestones.length : 0;
            const doneMilestones = totalMilestones
              ? goal.milestones.filter((m) => !!m.completed).length
              : 0;

            const rawProgress = totalMilestones
              ? Math.round((doneMilestones / totalMilestones) * 100)
              : Number(goal.progress);

            const progress = Math.max(0, Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 0));

            return (
              <div key={goal._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                {/* Goal Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{goal.title}</h3>
                    <p className="text-sm text-gray-500">
                      Patient: <span className="font-medium">{goal.user?.name || 'Unknown'}</span>
                      {' • '}{goal.category} • {goal.goalType}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    progress === 100 ? 'bg-green-100 text-green-800' :
                    progress >= 50 ? 'bg-blue-100 text-blue-800' :
                    progress > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {progress}% Complete
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      progress === 100 ? 'bg-green-500' :
                      progress >= 50 ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                    style={{
                      width: progress === 100 ? '100%' : `${progress}%`,
                      // Fallback in case utility classes are overridden/missed
                      backgroundColor:
                        progress === 100
                          ? 'rgb(34 197 94)'
                          : progress >= 50
                            ? 'rgb(59 130 246)'
                            : 'rgb(234 179 8)',
                    }}
                  ></div>
                </div>

                {/* Description */}
                {goal.description && (
                  <p className="text-gray-600 text-sm mb-4">{goal.description}</p>
                )}

                {/* Milestones */}
                {goal.milestones?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h4>
                    <div className="space-y-2">
                      {goal.milestones.map((ms, idx) => (
                        <label
                          key={idx}
                          className="flex items-center p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={ms.completed || false}
                            onChange={() => toggleMilestone(goal._id, idx)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className={`ml-3 text-sm ${ms.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {ms.title}
                          </span>
                          {ms.completed && (
                            <span className="ml-auto text-xs text-green-600 font-medium">✓ Done</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Date */}
                {goal.dueDate && (
                  <div className="mt-4 text-sm text-gray-500">
                    Due: {new Date(goal.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientGoals;
