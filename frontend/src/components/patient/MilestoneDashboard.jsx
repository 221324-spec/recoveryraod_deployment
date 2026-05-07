import React, { useEffect, useState } from "react";

const MilestoneDashboard = ({ userId, onBack }) => {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    // Fetch milestones from backend
    const fetchMilestones = async () => {
      // Replace with API call
      const data = [
        { id: 1, milestone: "Finish first week exercises", completed: true },
        { id: 2, milestone: "Read chapter 3", completed: false },
      ];
      setMilestones(data);
    };
    fetchMilestones();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Milestone Dashboard</h2>
      {milestones.length === 0 ? (
        <p>No milestones yet.</p>
      ) : (
        <ul>
          {milestones.map((m) => (
            <li key={m.id}>
              {m.milestone} —{" "}
              {m.completed ? (
                <span style={{ color: "green" }}>Completed</span>
              ) : (
                <span style={{ color: "red" }}>Pending</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MilestoneDashboard;
