import React, { useEffect, useState } from "react";
import { FaCrown, FaMedal, FaTrophy } from "react-icons/fa";
import { apiFetch } from '../../config/env';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await apiFetch("/api/progress/leaderboard", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setLeaderboard(data);
      } catch (err) {
        console.error("❌ Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading)
    return (
      <p className="text-center text-lg font-medium text-gray-600 mt-10">
        ⏳ Loading leaderboard...
      </p>
    );

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <FaTrophy className="trophy-icon" />
        <h2>Leaderboard</h2>
      </div>

      {/* Table */}
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Total Points</th>
            <th>Games Played</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, index) => {
            let rankIcon = null;
            if (index === 0) rankIcon = <FaCrown className="rank-icon gold" />;
            else if (index === 1) rankIcon = <FaMedal className="rank-icon silver" />;
            else if (index === 2) rankIcon = <FaMedal className="rank-icon bronze" />;

            return (
              <tr key={player._id}>
                <td className="rank-cell">
                  {rankIcon ? rankIcon : `#${index + 1}`}
                </td>
                <td>{player._id}</td>
                <td className="points">{player.totalPoints}</td>
                <td>{player.gamesPlayed.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ========================= CSS ========================= */

const styles = `
.leaderboard-container {
  max-width: 900px;
  margin: 3rem auto;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: fadeIn 0.5s ease-in-out;
}

.leaderboard-header {
  background: linear-gradient(135deg, #7ebcfaff, #0077cc);
  color: white;
  padding: 1.5rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.leaderboard-header h2 {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.trophy-icon {
  font-size: 1.8rem;
  color: gold;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 14px;
  text-align: center;
}

.leaderboard-table th {
  background: #f4f7fb;
  color: #004080;
  font-weight: 600;
  border-bottom: 2px solid #e0e6ef;
}

.leaderboard-table tbody tr:nth-child(even) {
  background: #f9fbfd;
}

.leaderboard-table tbody tr:hover {
  background: #eef6ff;
  transition: background 0.2s ease-in-out;
}

.rank-cell {
  font-weight: bold;
  font-size: 1.1rem;
}

.rank-icon {
  font-size: 1.4rem;
}

.rank-icon.gold {
  color: gold;
}
.rank-icon.silver {
  color: silver;
}
.rank-icon.bronze {
  color: #cd7f32;
}

.points {
  font-weight: bold;
  color: #004080;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

// Inject styles into document head dynamically
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
