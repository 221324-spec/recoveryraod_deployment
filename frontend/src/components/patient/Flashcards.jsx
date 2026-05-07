import React, { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import { apiFetch } from '../../config/env';

const questions = [
  { question: "What is one healthy way to cope with cravings?", options: ["Ignore them completely", "Practice deep breathing or grounding exercises", "Give in immediately", "Avoid all social interaction"], correctIndex: 1 },
  { question: "Why is self-reflection important in recovery?", options: ["To punish yourself for mistakes", "To understand triggers and celebrate progress", "To compare yourself to others", "To ignore your feelings"], correctIndex: 1 },
  { question: "What does the 5-4-3-2-1 grounding technique use?", options: ["Counting breaths only", "Your five senses", "Math problems", "Physical exercise"], correctIndex: 1 },
  { question: "How can music therapy support recovery?", options: ["By increasing anxiety", "By distracting you from healing", "By promoting relaxation and emotional healing", "By replacing counseling"], correctIndex: 2 },
  { question: "What should you do when facing a relapse trigger?", options: ["Pause, breathe, and use coping strategies", "Avoid your support network", "Ignore the feelings", "Immediately give in"], correctIndex: 0 },
];

export default function FlashcardsMultipleChoice() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [points, setPoints] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const successSound = useRef(null);
  const errorSound = useRef(null);

  useEffect(() => {
    successSound.current = new Audio("/success.wav");
    errorSound.current = new Audio("/error.wav");
  }, []);

  const q = questions[current];

  const handleOptionClick = (index) => {
    if (showFeedback) return;

    setSelected(index);
    setShowFeedback(true);

    if (index === q.correctIndex) {
      setPoints((p) => p + 1);
      try { successSound.current?.play(); } catch {}
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      try { errorSound.current?.play(); } catch {}
    }
  };

  const handleNext = async () => {
    setSelected(null);
    setShowFeedback(false);
    setShowConfetti(false);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setGameOver(true);

      // ✅ Save progress to MongoDB when game ends
      try {
        const token = localStorage.getItem('token');
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = stored._id || stored.id || 'unknown';
        const game = "FlashcardsMultipleChoice";
        const res = await apiFetch("/api/progress/save", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ userId, game, points }),
        });
        const data = await res.json();
        console.log("📤 Progress save response:", data);
      } catch (err) {
        console.error("❌ Error saving progress:", err);
      }
    }
  };

  const handleRestart = () => {
    setGameOver(false);
    setCurrent(0);
    setPoints(0);
    setSelected(null);
    setShowFeedback(false);
    setShowConfetti(false);
  };

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: transparent; }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(-45deg, #a1c4fd, #c2e9fb, #fbc2eb, #a6c1ee)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 20s ease infinite",
          zIndex: -1,
          filter: "brightness(0.9)",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 480,
          margin: "3rem auto",
          background: "rgba(240, 248, 255, 0.95)",
          padding: "2rem",
          borderRadius: 12,
          boxShadow: "0 8px 20px rgba(0,0,0,0.1), 0 0 15px 3px rgba(0, 64, 128, 0.3)",
          color: "#004080",
          userSelect: "none",
        }}
      >
        {showConfetti && <Confetti recycle={false} numberOfPieces={150} />}

        {!gameOver && (
          <>
            <h2>
              Question {current + 1} / {questions.length}
            </h2>

            <p style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", minHeight: "72px" }}>
              {q.question}
            </p>

            <div>
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIndex;
                const isSelected = i === selected;

                let bg = "white";
                let color = "#004080";
                let border = "2px solid #004080";
                if (showFeedback) {
                  if (isCorrect) {
                    bg = "#a8e6cf";
                    color = "#004d00";
                    border = "2px solid #004d00";
                  } else if (isSelected && !isCorrect) {
                    bg = "#ff8b94";
                    color = "#660000";
                    border = "2px solid #660000";
                  }
                } else if (isSelected) {
                  bg = "#d0ebff";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(i)}
                    disabled={showFeedback}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 20px",
                      marginBottom: "0.75rem",
                      fontSize: "1rem",
                      borderRadius: 8,
                      border,
                      backgroundColor: bg,
                      color,
                      cursor: showFeedback ? "default" : "pointer",
                      textAlign: "left",
                      userSelect: "none",
                      transition: "background-color 0.3s, color 0.3s",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!showFeedback}
              style={{
                marginTop: "1rem",
                padding: "10px 24px",
                fontSize: "1rem",
                borderRadius: "8px",
                backgroundColor: showFeedback ? "#004080" : "#a0a0a0",
                color: "white",
                border: "none",
                cursor: showFeedback ? "pointer" : "not-allowed",
              }}
            >
              {current === questions.length - 1 ? "Finish" : "Next"}
            </button>

            <p style={{ marginTop: "1rem", fontWeight: "600", color: "#004080" }}>
              Points: {points} / {questions.length}
            </p>
          </>
        )}

        {gameOver && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 9999,
          }}>
            <div style={{
              background: "white", padding: "2rem", borderRadius: 12,
              maxWidth: 440, textAlign: "center",
            }}>
              <h2 style={{ color: "#004080", marginBottom: "1rem" }}>🎉 Quiz Completed!</h2>
              <p style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "#004080" }}>
                Your Points: {points} / {questions.length}
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
                <button onClick={handleRestart} style={{
                  backgroundColor: "#004080", color: "white", padding: "10px 20px",
                  fontSize: "1rem", border: "none", borderRadius: 8, cursor: "pointer",
                }}>
                  Restart Quiz
                </button>
              </div>

              <Confetti recycle={false} numberOfPieces={300} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
