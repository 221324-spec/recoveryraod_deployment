import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import socketService from "../../services/socketService";
import { apiFetch } from "../../config/env";

const clampProgress = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const MilestoneDashboard = ({ userId, onBack }) => {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGoals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`/api/goals/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to load goals");
      }
      const data = await res.json();
      const goalsArray = Array.isArray(data) ? data : data.goals || [];
      setGoals(
        goalsArray.map((g) => ({
          ...g,
          milestones: g.milestones || [],
          progress: clampProgress(g.progress),
        }))
      );
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Real-time updates (patient)
  useEffect(() => {
    if (!token) return;

    const handleGoalCreated = () => fetchGoals();
    const handleGoalUpdated = () => fetchGoals();

    const handleGoalProgressUpdated = (payload) => {
      if (!payload?.goalId) return;
      setGoals((prev) =>
        prev.map((g) => {
          if (g._id !== payload.goalId) return g;
          const updated = { ...g, progress: clampProgress(payload.progress) };
          if (typeof payload.milestoneIndex === "number" && g.milestones?.[payload.milestoneIndex]) {
            const milestones = [...g.milestones];
            milestones[payload.milestoneIndex] = {
              ...milestones[payload.milestoneIndex],
              completed: !!payload.completed,
              completedAt: payload.completed ? new Date().toISOString() : undefined,
            };
            updated.milestones = milestones;
          }
          return updated;
        })
      );
    };

    socketService.on("goal:created", handleGoalCreated);
    socketService.on("goal:updated", handleGoalUpdated);
    socketService.on("goal:progress:updated", handleGoalProgressUpdated);

    return () => {
      socketService.off("goal:created", handleGoalCreated);
      socketService.off("goal:updated", handleGoalUpdated);
      socketService.off("goal:progress:updated", handleGoalProgressUpdated);
    };
  }, [fetchGoals, token]);

  const toggleMilestone = async (goalId, index) => {
    if (!token) return;
    try {
      const res = await apiFetch(`/api/goals/${goalId}/milestone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ index }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to update milestone");
      }

      const updatedGoal = await res.json();
      setGoals((prev) =>
        prev.map((g) => (g._id === goalId ? { ...updatedGoal, milestones: updatedGoal.milestones || [] } : g))
      );
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to update milestone");
    }
  };

  const summary = useMemo(() => {
    const allMilestones = goals.flatMap((g) => (g.milestones || []).map((m) => ({ ...m, goalId: g._id })));
    const total = allMilestones.length;
    const done = allMilestones.filter((m) => !!m.completed).length;
    return { total, done };
  }, [goals]);

  if (!token) {
    return (
      <div className="p-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          Please log in to view milestones.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Milestone Dashboard</h2>
          <p className="text-sm text-gray-500">Track your goal milestones and completion status</p>
        </div>
        {typeof onBack === "function" && (
          <button onClick={onBack} className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
            Back
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Completed <span className="font-semibold text-gray-800">{summary.done}</span> of{" "}
            <span className="font-semibold text-gray-800">{summary.total}</span> milestones
          </div>
          <div className="text-sm font-medium text-gray-700">
            {summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-blue-500 transition-all duration-300"
            style={{
              width:
                summary.total && summary.done === summary.total
                  ? "100%"
                  : `${summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%`,
              // Fallback in case utility classes are overridden/missed
              backgroundColor: 'rgb(59 130 246)',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10 text-gray-500">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span>Loading milestones...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">🎯</div>
          <p className="text-gray-600 text-lg">No goals assigned yet.</p>
          <p className="text-gray-500 text-sm mt-2">Your supervisor will assign goals here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const total = goal.milestones?.length || 0;
            const done = goal.milestones?.filter((m) => !!m.completed).length || 0;
            const progress = total ? Math.round((done / total) * 100) : clampProgress(goal.progress);

            return (
              <div key={goal._id} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-gray-800 truncate">{goal.title}</div>
                    <div className="text-sm text-gray-500">{goal.category} • {goal.goalType}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    progress === 100 ? 'bg-green-100 text-green-800' :
                    progress >= 50 ? 'bg-blue-100 text-blue-800' :
                    progress > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {progress}%
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      progress === 100 ? 'bg-green-500' :
                      progress >= 50 ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: progress === 100 ? '100%' : `${progress}%` }}
                  />
                </div>

                {goal.milestones?.length > 0 && (
                  <div className="space-y-2">
                    {goal.milestones.map((ms, idx) => (
                      <label
                        key={ms._id || idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={!!ms.completed}
                          onChange={() => toggleMilestone(goal._id, idx)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${ms.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {ms.title}
                          </div>
                          {ms.completed && ms.completedAt && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              Completed {new Date(ms.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {ms.completed && <span className="text-xs text-green-600 font-semibold">✓ Done</span>}
                      </label>
                    ))}
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

export default MilestoneDashboard;
