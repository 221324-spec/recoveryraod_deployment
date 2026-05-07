import React, { useState } from "react";
import "./RecoveryWheelGame.css";
import { motion } from "framer-motion";

const segments = [
  "Flashcards",
  "Trivia",
  "Image Puzzle",
  "Motivation Builder",
  "Grounding Exercise",
  "Mood Pop",
];

export default function RecoveryWheelGame({ onSelectGame }) {
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rotation, setRotation] = useState(0);

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    const anglePerSegment = 360 / segments.length;
    const extraSpins = 5;

    // pick a random degree instead of random index
    const randomDegrees = Math.floor(Math.random() * 360);

    const finalRotation = extraSpins * 360 + randomDegrees;

    const newRotation = rotation + finalRotation;
    setRotation(newRotation);

    setTimeout(() => {
      // pointer is fixed at 270° (top)
      const pointerAngle = 270;

      // actual angle where wheel stopped
      const normalizedRotation = ((newRotation % 360) + 360) % 360;

      // find angle under pointer
      const landingAngle = (pointerAngle - normalizedRotation + 360) % 360;

      // which segment does this angle fall into?
      const index = Math.floor(landingAngle / anglePerSegment);

      setSelected(segments[index]);
      setSpinning(false);
    }, 4000);
  };

  // Navigation handlers
  const handleStartFlashcards = () => onSelectGame("flashcards");
  const handleStartGrounding = () => onSelectGame("groundingexercise");
  const handleStartTrivia = () => onSelectGame("triviagame");
  const handleStartImagePuzzle = () => onSelectGame("imagepuzzle");
  const handleStartMotivationBuilder = () => onSelectGame("motivationbuilder");
  const handleStartMoodPop = () => onSelectGame("moodpop");

  const renderSelectedContent = () => {
    switch (selected) {
      case "Flashcards":
        return (
          <div>
            <p>🃏 Flashcards Mini Game: Ready to start?</p>
            <button onClick={handleStartFlashcards} style={buttonStyle}>
              Start Now
            </button>
          </div>
        );
      case "Grounding Exercise":
        return (
          <div>
            <p>🌳 Try the 5-4-3-2-1 grounding technique.</p>
            <button onClick={handleStartGrounding} style={buttonStyle}>
              Start Now
            </button>
          </div>
        );
      case "Trivia":
        return (
          <div>
            <p>❓ Trivia Time: Test your knowledge!</p>
            <button onClick={handleStartTrivia} style={buttonStyle}>
              Start Now
            </button>
          </div>
        );
      case "Image Puzzle":
        return (
          <div>
            <p>🧩 Solve an inspiring image puzzle.</p>
            <button onClick={handleStartImagePuzzle} style={buttonStyle}>
              Start Now
            </button>
          </div>
        );
      case "Motivation Builder":
        return (
          <div>
            <p>🪞 Reflect on: “What made you smile today?”</p>
            <button
              onClick={handleStartMotivationBuilder}
              style={buttonStyle}
            >
              Start Now
            </button>
          </div>
        );
      case "Mood Pop":
        return (
          <div>
            <p>Tap green, avoid red. Sharpen your reaction and control.</p>
            <button onClick={handleStartMoodPop} style={buttonStyle}>
              Start Now
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "8px",
    backgroundColor: "#004080",
    color: "white",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
  };

  return (
    <div className="wheel-container">
      <h1 className="title">🌀 The Recovery Wheel</h1>

      <div className="wheel-wrapper">
        {/* ✅ Wheel */}
        <motion.div
          className="wheel"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: "easeInOut" }}
        >
          {segments.map((label, index) => {
            const rotate = (360 / segments.length) * index;
            return (
              <div
                key={index}
                className="wheel-segment"
                style={{ transform: `rotate(${rotate}deg)` }}
              >
                <span style={{ transform: `rotate(-${rotate}deg)` }}>
                  {label}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* ✅ Pointer */}
        <div className="wheel-pointer"></div>
      </div>

      <button className="spin-button" onClick={spinWheel} disabled={spinning}>
        {spinning ? "Spinning..." : "Spin the Wheel"}
      </button>

      {selected && (
        <div className="result-box">
          <h2>You got: {selected}</h2>
          {renderSelectedContent()}
        </div>
      )}
    </div>
  );
}
