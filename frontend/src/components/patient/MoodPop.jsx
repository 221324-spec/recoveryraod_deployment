import React, { useEffect, useState } from "react";
import api from "../../api";
import "./MoodPop.css";

const COLORS = ["green", "red"];

function MoodPop() {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [speed, setSpeed] = useState(1500);
  const [badge, setBadge] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    if (gameOver || success) return;

    const interval = setInterval(() => {
      const newBubble = {
        id: Date.now(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
      setBubbles((prev) => [...prev, newBubble]);

      if (score > 0 && score % 5 === 0 && speed > 500) {
        setSpeed((s) => s - 100);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [score, speed, gameOver, success]);

  const handleBubbleClick = (id, color) => {
    if (color === "green") {
      setScore((prev) => prev + 1);
      setPointsEarned((prev) => prev + 1);
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    } else if (color === "red") {
      const element = document.getElementById(`bubble-${id}`);
      if (element) {
        element.classList.add("popped");
        setTimeout(() => {
          setBubbles((prev) => prev.filter((b) => b.id !== id));
        }, 300);
      }

      if (lives > 1) {
        setLives((prev) => prev - 1);
      } else {
        setLives(0);
        setGameOver(true);
      }
    }
  };

  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
    }
    if (score >= 15) {
      setBadge(true);
      setSuccess(true);
    }
  }, [lives, score]);

  useEffect(() => {
    if (gameOver || success) {
      const saveScore = async () => {
        try {
          const token = localStorage.getItem('token');
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = stored._id || stored.id || 'unknown';
          await api.post('/progress/save', {
            userId,
            game: "MoodPop",
            points: pointsEarned,
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          console.error("Error saving progress:", err);
        }
      };

      saveScore();
    }
  }, [gameOver, success, pointsEarned]); // ✅ fixed warning here

  const handleRestart = () => {
    setBubbles([]);
    setScore(0);
    setPointsEarned(0);
    setLives(3);
    setSpeed(1500);
    setBadge(false);
    setGameOver(false);
    setSuccess(false);
  };

  return (
    <div className="moodpop-container">
      <h1>🎈 Mood Pop</h1>
      <p className="goal">
        Goal: Tap 15 green balloons to become a Focus Master. Avoid red ones!
      </p>

      <div className="stats">
        <span>Score: {score}</span>
        <span>Lives: {lives}</span>
      </div>

      {badge && <div className="badge">🏆 Focus Master!</div>}

      <div className="bubble-area">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            id={`bubble-${bubble.id}`}
            className={`bubble ${bubble.color}`}
            onClick={() => handleBubbleClick(bubble.id, bubble.color)}
          ></div>
        ))}
      </div>

      {(gameOver || success) && (
        <div className="overlay">
          <div className="message-box">
            <h2>{gameOver ? "💀 Game Over" : "🎉 Focus Master Achieved!"}</h2>
            <p>
              {gameOver
                ? "You ran out of lives."
                : "Amazing attention control!"}
            </p>
            <p className="earned">🏅 Points Earned: {pointsEarned}</p>
            <button onClick={handleRestart}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoodPop;
