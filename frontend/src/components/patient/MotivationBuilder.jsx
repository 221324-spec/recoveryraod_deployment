import React, { useState } from 'react';
import './MotivationBuilder.css';
import { apiFetch } from '../../config/env';

const motivationsList = [
  { label: "Family", icon: "👨‍👩‍👧‍👦" },
  { label: "Health", icon: "💪" },
  { label: "Career", icon: "💼" },
  { label: "Spirituality", icon: "🕊️" },
  { label: "Freedom", icon: "🕊️" },
  { label: "Sobriety Milestones", icon: "🏅" },
  { label: "Helping Others", icon: "🤝" },
  { label: "Self-Respect", icon: "🧍‍♂️" },
  { label: "Financial Stability", icon: "💰" },
  { label: "Creativity", icon: "🎨" },
  { label: "Personal Growth", icon: "🌱" },
  { label: "Peace of Mind", icon: "🧘‍♂️" }
];

const quotes = [
  "Your future is created by what you do today.",
  "Recovery is not a race, it's a journey.",
  "Small steps every day lead to big change.",
  "You didn’t come this far to only come this far.",
  "Stay focused. Your reason is stronger than your excuse."
];

function MotivationBuilder() {
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false);
  const [custom, setCustom] = useState('');
  const [quote, setQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  const [points, setPoints] = useState(0); // ✅ Points state

  const toggleSelect = (item) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(m => m !== item));
      setPoints(points - 10); // ✅ Deduct points if unselected
    } else {
      setSelected([...selected, item]);
      setPoints(points + 10); // ✅ Add points for each selection
    }
  };

  const handleAddCustom = () => {
    if (custom.trim() !== "") {
      toggleSelect(custom.trim());
      setCustom('');
    }
  };

  const handleSave = async () => {
    setSaved(true);

    // ✅ Save progress to MongoDB
    try {
      const token = localStorage.getItem('token');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = stored._id || stored.id || 'unknown';
      const game = "MotivationBuilder";

      const response = await apiFetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, game, points })
      });

      const data = await response.json();
      console.log("📤 Progress save response:", data);
    } catch (error) {
      console.error("❌ Error saving progress:", error);
    }
  };

  return (
    <div className="motivation-container">
      <h1>🌟 Motivation Builder</h1>
      <p className="quote-bar">💬 {quote}</p>
      <button
        className="refresh-quote-btn"
        onClick={() =>
          setQuote(quotes[Math.floor(Math.random() * quotes.length)])
        }
      >
        🔁 New Quote
      </button>

      <p className="subtitle">Select what keeps you moving forward:</p>
      <div className="motivation-grid">
        {motivationsList.map(item => (
          <div
            key={item.label}
            className={`motivation-card ${selected.includes(item.label) ? 'selected' : ''}`}
            onClick={() => toggleSelect(item.label)}
          >
            <span className="icon">{item.icon}</span> {item.label}
          </div>
        ))}
      </div>

      <div className="custom-motivation">
        <input
          type="text"
          placeholder="Add your own reason..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button onClick={handleAddCustom}>Add</button>
      </div>

      <button
        className="save-btn"
        onClick={handleSave}
        disabled={selected.length === 0}
      >
        Save Vision Board
      </button>

      {saved && (
        <div className="vision-board">
          <h2>🎯 Your Vision Board</h2>
          <div className="vision-list">
            {selected.map((item, index) => (
              <div key={index} className="vision-item">{item}</div>
            ))}
          </div>
          <p className="quote">“Keep going. You have powerful reasons to stay strong.”</p>
          <p className="points-earned">⭐ Points Earned: {points}</p>
        </div>
      )}
    </div>
  );
}

export default MotivationBuilder;
