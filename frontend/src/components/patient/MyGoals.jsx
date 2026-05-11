import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import socketService from '../../services/socketService';
import { apiFetch } from '../../config/env';
import { jsPDF } from "jspdf";
import "./MyGoals.css";

export default function MyGoals({ userId, onBack }) {
  const { token, user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [note, setNote] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [historyExpanded, setHistoryExpanded] = useState({});

  const mapGoalForUI = (g) => ({
    ...g,
    milestones: (g.milestones || []).map((m) => ({
      ...m,
      status: m.completed ? "Done" : "To Do",
    })),
  });

  const attachProgressHistory = async (mappedGoals, authToken) => {
    // Fetch progress history per goal so progress notes persist across reloads.
    const withHistory = await Promise.all(
      mappedGoals.map(async (g) => {
        try {
          const res = await apiFetch(`/api/goal-progress/${g._id}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );
          if (!res.ok) return { ...g, progressHistory: g.progressHistory || [] };
          const history = await res.json();
          const normalized = (history || []).map((h) => ({
            ...h,
            date: h.createdAt || h.date,
          }));
          return { ...g, progressHistory: normalized };
        } catch (e) {
          console.error('Error fetching goal progress history:', e);
          return { ...g, progressHistory: g.progressHistory || [] };
        }
      })
    );
    return withHistory;
  };

  // Fetch goals and map backend milestones to frontend status
  useEffect(() => {
    if (!token) {
      console.error('No auth token available for fetching goals');
      setMessage('Please log in to view your goals');
      setMessageType('error');
      return;
    }
    
    console.log('Fetching goals with token:', token ? 'present' : 'missing');
    
    const fetchGoals = async () => {
      try {
        const res = await apiFetch(`/api/goals/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Goals API response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Goals API response data:', data);
        const goalsArray = Array.isArray(data) ? data : (data.goals || []);
        const mappedGoals = goalsArray.map(mapGoalForUI);
        const enriched = await attachProgressHistory(mappedGoals, token);
        console.log('Mapped goals:', enriched.length, 'goals');
        setGoals(enriched);
      } catch (err) {
        console.error('Error fetching goals:', err);
        setMessage('Failed to load goals: ' + err.message);
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
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
      (async () => {
        try {
          const res = await apiFetch(`/api/goals/my`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          const goalsArray = Array.isArray(data) ? data : (data.goals || []);
          const mappedGoals = goalsArray.map(mapGoalForUI);
          const enriched = await attachProgressHistory(mappedGoals, token);
          setGoals(enriched);
        } catch (e) {
          console.error(e);
        }
      })();
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

  // --- Certificate Generation ---
  const generateCertificate = (goal) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setLineWidth(5);
    doc.setDrawColor(44, 62, 80);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(44, 62, 80);
    doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 50, { align: "center" });

    doc.setFontSize(20);
    doc.setFont("helvetica", "normal");
    doc.text("This is to certify that", pageWidth / 2, 70, { align: "center" });

    doc.setFontSize(30);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(192, 57, 43);
    doc.text(user?.name || "Valued Achiever", pageWidth / 2, 90, { align: "center" });

    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("has successfully completed the goal:", pageWidth / 2, 110, { align: "center" });

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(`"${goal.title}"`, pageWidth / 2, 125, { align: "center" });

    doc.setFontSize(14);
    doc.text(`Category: ${goal.category}`, pageWidth / 2, 140, { align: "center" });
    doc.text(`Completed on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 150, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(60, 175, 120, 175);
    doc.line(170, 175, 230, 175);
    doc.setFontSize(10);
    doc.text("Program Director", 90, 180, { align: "center" });
    doc.text("Department Head", 200, 180, { align: "center" });

    doc.save(`${goal.title.replace(/\s+/g, '_')}_Certificate.pdf`);
  };

  const toggleMilestone = async (goalId, index) => {
    try {
      const res = await apiFetch(`/api/goals/${goalId}/milestone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ index }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update milestone');
      }

      const updatedGoal = await res.json();

      setGoals((prev) =>
        prev.map((g) => {
          if (g._id !== goalId) return g;
          const mapped = mapGoalForUI(updatedGoal);
          // Preserve loaded progress history in UI.
          return { ...mapped, progressHistory: g.progressHistory || [] };
        })
      );
    } catch (err) {
      console.error(err);
      setMessage('Error updating milestone: ' + err.message);
      setMessageType('error');
    }
  };

  // Submit progress note
  const submitProgress = async (goalId) => {
    const currentGoal = goals.find((g) => g._id === goalId);
    const total = currentGoal.milestones.length;
    const done = currentGoal.milestones.filter((m) => !!m.completed).length;
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
                    date: data.createdAt || new Date(),
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
            const totalMilestones = goal.milestones ? goal.milestones.length : 0;
            const doneMilestones = goal.milestones
              ? goal.milestones.filter((m) => !!m.completed).length
              : 0;
            const currentProgress = totalMilestones
              ? Math.round((doneMilestones / totalMilestones) * 100)
              : 0;

            const overdue = goal.dueDate && new Date(goal.dueDate) < new Date();
            const isExpanded = expandedGoals[goal._id];
            const isCompleted = currentProgress >= 100 && totalMilestones > 0;

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

                {/* Certificate Download Button - visible when goal is 100% complete */}
                {isCompleted && (
                  <div className="certificate-download-area" style={{ margin: "10px 0" }}>
                    <button
                      className="btn-certificate"
                      onClick={() => generateCertificate(goal)}
                      style={{
                        backgroundColor: "#27ae60",
                        color: "white",
                        padding: "10px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        width: "100%",
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      🏆 Claim Your Certificate
                    </button>
                  </div>
                )}

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

                    {goal.milestones?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="section-small-title">Milestones</h4>
                        <div className="space-y-2">
                          {goal.milestones.map((m, idx) => (
                            <label
                              key={m._id || idx}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={!!m.completed}
                                onChange={() => toggleMilestone(goal._id, idx)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${m.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {m.title}
                                </div>
                                {m.completed && m.completedAt && (
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    Completed {new Date(m.completedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              {m.completed && (
                                <span className="text-xs text-green-600 font-semibold">✓ Done</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

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
