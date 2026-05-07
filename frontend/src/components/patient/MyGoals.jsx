import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';
import "./MyGoals.css";

export default function MyGoals({ userId, onBack }) {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [note, setNote] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [historyExpanded, setHistoryExpanded] = useState({});

  // Fetch goals and map backend milestones to frontend status
  useEffect(() => {
    if (!token) {
      console.error('No auth token available for fetching goals');
      setMessage('Please log in to view your goals');
      setMessageType('error');
      return;
    }
    
    console.log('Fetching goals with token:', token ? 'present' : 'missing');
    
    apiFetch(`/api/goals/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        console.log('Goals API response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Goals API response data:', data);
        // Handle both array response and object with goals property
        const goalsArray = Array.isArray(data) ? data : (data.goals || []);
        const mappedGoals = goalsArray.map((g) => ({
          ...g,
          milestones: (g.milestones || []).map((m) => ({
            ...m,
            status: m.completed ? "Done" : "To Do",
          })),
        }));
        console.log('Mapped goals:', mappedGoals.length, 'goals');
        setGoals(mappedGoals);
      })
      .catch(err => {
        console.error('Error fetching goals:', err);
        setMessage('Failed to load goals: ' + err.message);
        setMessageType('error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Real-time goal updates
  useEffect(() => {
    const handleGoalCreated = (data) => {
      console.log('Patient received new goal:', data);
      // Add the new goal to the list
      const newGoal = {
        ...data.goal,
        milestones: data.goal.milestones.map((m) => ({
          ...m,
          status: m.completed ? "Done" : "To Do",
        })),
      };
      setGoals(prev => [newGoal, ...prev]);
      setMessage("A new goal has been assigned to you!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 5000);
    };

    const handleGoalUpdated = (data) => {
      console.log('Patient goal updated:', data);
      // Refresh goals or update specific goal
      apiFetch(`/api/goals/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const goalsArray = Array.isArray(data) ? data : (data.goals || []);
          const mappedGoals = goalsArray.map((g) => ({
            ...g,
            milestones: (g.milestones || []).map((m) => ({
              ...m,
              status: m.completed ? "Done" : "To Do",
            })),
          }));
          setGoals(mappedGoals);
        })
        .catch(console.error);
    };

    const handleGoalProgressUpdated = (data) => {
      console.log('Patient goal progress updated:', data);
      // Update the specific goal's progress
      setGoals(prev => prev.map(g => 
        g._id === data.goalId 
          ? { ...g, progress: data.progress, milestones: g.milestones.map((m, idx) => 
              idx === data.milestoneIndex ? { ...m, completed: data.completed, status: data.completed ? "Done" : "To Do" } : m
            )}
          : g
      ));
      setMessage(data.message);
      setMessageType("info");
      setTimeout(() => setMessage(""), 3000);
    };

    socketService.on('goal:created', handleGoalCreated);
    socketService.on('goal:updated', handleGoalUpdated);
    socketService.on('goal:progress:updated', handleGoalProgressUpdated);

    return () => {
      socketService.off('goal:created', handleGoalCreated);
      socketService.off('goal:updated', handleGoalUpdated);
      socketService.off('goal:progress:updated', handleGoalProgressUpdated);
    };
  }, [token]);

  const getStatus = (v) => {
    if (v === 0) return "Not Started";
    if (v < 100) return "In Progress";
    return "Completed";
  };

  const toggleGoalExpand = (id) =>
    setExpandedGoals((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleHistoryExpand = (id) =>
    setHistoryExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Persist milestone status
  const updateMilestoneStatus = async (goalId, milestoneId, currentStatus) => {
    let nextStatus = "To Do";
    if (currentStatus === "To Do") nextStatus = "Doing";
    else if (currentStatus === "Doing") nextStatus = "Done";
    else return;

    try {
      const res = await apiFetch(`/api/goal-progress/milestones/update-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalId, milestoneId, status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update milestone on server");

      setGoals((prevGoals) =>
        prevGoals.map((g) => {
          if (g._id === goalId) {
            return {
              ...g,
              milestones: g.milestones.map((m) =>
                m._id === milestoneId ? { ...m, status: nextStatus } : m
              ),
            };
          }
          return g;
        })
      );
    } catch (err) {
      console.error(err);
      setMessage("Error updating milestone: " + err.message);
      setMessageType("error");
    }
  };

  // Submit progress note
  const submitProgress = async (goalId) => {
    const currentGoal = goals.find((g) => g._id === goalId);
    const total = currentGoal.milestones.length;
    const done = currentGoal.milestones.filter((m) => m.status === "Done").length;
    const currentProgress = total ? Math.round((done / total) * 100) : 0;
    const currentNote = note[goalId] || "";

    if (!currentNote.trim()) {
      setMessage("Please add a note for your progress update");
      setMessageType("error");
      return;
    }

    try {
      setLoadingId(goalId);
      const res = await apiFetch(`/api/goal-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalId, progress: currentProgress, note: currentNote }),
      });

      if (!res.ok) {
        setMessage("Server error while updating progress");
        setMessageType("error");
        return;
      }

      const data = await res.json();
      setMessage("Progress updated successfully!");
      setMessageType("success");

      setGoals((prev) =>
        prev.map((g) =>
          g._id === goalId
            ? {
                ...g,
                progressHistory: [
                  ...(g.progressHistory || []),
                  {
                    _id: data._id || Date.now(),
                    date: new Date(),
                    progress: currentProgress,
                    note: currentNote,
                  },
                ],
              }
            : g
        )
      );
      setNote({ ...note, [goalId]: "" });
    } catch (err) {
      setMessage("Error: " + err.message);
      setMessageType("error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="goals-container">
      <h2 className="header-title">My Assigned Goals</h2>

      {message && <div className={`alert ${messageType}`}>{message}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading your assigned goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Goals Assigned Yet</h3>
          <p className="text-gray-500 max-w-md">
            You currently have no goals assigned. Your supervisor will assign recovery goals here. Once assigned, you can track your progress and milestones.
          </p>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const totalMilestones = goal.milestones.length;
            const doneMilestones = goal.milestones.filter((m) => m.status === "Done").length;
            const currentProgress = totalMilestones
              ? Math.round((doneMilestones / totalMilestones) * 100)
              : 0;

            const overdue = goal.dueDate && new Date(goal.dueDate) < new Date();
            const isExpanded = expandedGoals[goal._id];

            return (
              <div
                key={goal._id}
                className={`goal-card-new ${
                  overdue ? "border-danger" : ""
                } ${isExpanded ? "expanded-card" : ""}`}
              >
                <div className="goal-top">
                  <div>
                    <h3 className="goal-title-new">{goal.title}</h3>
                    <p className="goal-meta">
                      <span>{goal.category}</span> • <span>{goal.goalType}</span>
                    </p>
                  </div>
                  {goal.dueDate && (
                    <span className={`goal-date ${overdue ? "overdue" : ""}`}>
                      Due {new Date(goal.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="progress-section">
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-fill-new"
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span className="progress-percent">{currentProgress}%</span>
                    <span className="progress-status">{getStatus(currentProgress)}</span>
                  </div>
                </div>

                <button
                  className="expand-btn"
                  onClick={() => toggleGoalExpand(goal._id)}
                >
                  {isExpanded
                    ? "Close Goal Details"
                    : "Open Goal Details & Milestones"}
                </button>

                {isExpanded && (
                  <div className="goal-details-expanded">
                    <div className="update-section">
                      <h4 className="section-small-title">Update Goal Note</h4>
                      <textarea
                        rows="1"
                        className="note-field-small"
                        placeholder="What have you achieved?"
                        value={note[goal._id] || ""}
                        onChange={(e) =>
                          setNote({ ...note, [goal._id]: e.target.value })
                        }
                      ></textarea>
                    </div>

                    <div className="kanban-board">
                      <div className="kanban-column">
                        <h5>To Do</h5>
                        {goal.milestones
                          ?.filter((m) => m.status === "To Do")
                          .map((m) => (
                            <div
                              key={m._id}
                              className="milestone-item-kanban"
                              onClick={() =>
                                updateMilestoneStatus(goal._id, m._id, "To Do")
                              }
                            >
                              <span className="milestone-title-kanban">
                                {m.title}
                              </span>
                              <div className="milestone-tags">
                                <span className="priority low">Task</span>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="kanban-column">
                        <h5>Doing</h5>
                        {goal.milestones
                          ?.filter((m) => m.status === "Doing")
                          .map((m) => (
                            <div
                              key={m._id}
                              className="milestone-item-kanban"
                              onClick={() =>
                                updateMilestoneStatus(goal._id, m._id, "Doing")
                              }
                            >
                              <span className="milestone-title-kanban">
                                {m.title}
                              </span>
                              <div className="milestone-tags">
                                <span className="status on-track">Doing</span>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="kanban-column">
                        <h5>Done</h5>
                        {goal.milestones
                          ?.filter((m) => m.status === "Done")
                          .map((m) => (
                            <div
                              key={m._id}
                              className="milestone-item-kanban done"
                            >
                              <span className="milestone-title-kanban">
                                {m.title}
                              </span>
                              <div className="milestone-tags">
                                <span className="status on-track">Done</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Submit Update Button */}
                    <div className="submit-update-wrapper">
                      <button
                        onClick={() => submitProgress(goal._id)}
                        disabled={loadingId === goal._id}
                        className="btn-submit-update"
                      >
                        {loadingId === goal._id ? "Submitting..." : "Submit Update"}
                      </button>
                    </div>

                    {goal.progressHistory?.length > 0 && (
                      <div className="history-wrapper">
                        <button
                          onClick={() => toggleHistoryExpand(goal._id)}
                          className="history-toggle"
                        >
                          {historyExpanded[goal._id]
                            ? "Hide History"
                            : "Show Progress History"}
                        </button>
                        {historyExpanded[goal._id] && (
                          <div className="history-content">
                            {goal.progressHistory.map((p) => (
                              <div key={p._id} className="history-row">
                                <span>
                                  {new Date(p.date).toLocaleDateString()}
                                </span>
                                <span className="history-progress">{p.progress}%</span>
                                <span className="history-note">{p.note}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
