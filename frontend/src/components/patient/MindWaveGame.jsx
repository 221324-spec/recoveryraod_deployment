import React, { useState, useEffect } from "react";
import "./MindWaveGame.css";

const affirmations = [
  "I am stronger than my cravings.",
  "Each breath is a new beginning.",
  "I am healing and growing.",
  "I deserve peace and happiness.",
];

const kindnessTargets = ["Myself", "A Loved One", "All Beings", "The World"];

function MindWaveGame() {
  const [phase, setPhase] = useState(0);
  const [timer, setTimer] = useState(15);
  const [collected, setCollected] = useState([]);
  const [kindnessDone, setKindnessDone] = useState(false);

  useEffect(() => {
    if (phase === 1 && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer, phase]);

  const handleAffirmationClick = (msg) => {
    if (!collected.includes(msg)) {
      setCollected([...collected, msg]);
    }
  };

  const handleKindnessDone = () => {
    setKindnessDone(true);
  };

  return (
    <div className="mindwave-container">
      {phase === 0 && (
        <div className="intro-screen">
          <h1>🧘‍♂️ Welcome to MindWave</h1>
          <p>Ride the wave of recovery through mindfulness, affirmations, and kindness.</p>
          <button onClick={() => setPhase(1)} className="game-btn">Start Journey</button>
        </div>
      )}

      {phase === 1 && (
        <div className="wave-phase">
          <h2>🌊 Craving Surfing</h2>
          <p>Close your eyes. Notice your craving like a wave—let it rise and fall.</p>
          <div className="wave-animation"></div>
          <p>Time Left: {timer}s</p>
          {timer === 0 && (
            <button onClick={() => setPhase(2)} className="game-btn">Next</button>
          )}
        </div>
      )}

      {phase === 2 && (
        <div className="affirmation-phase">
          <h2>🧠 Recovery Affirmations</h2>
          <p>Tap each bubble to internalize its message.</p>
          <div className="bubble-container">
            {affirmations.map((msg, i) => (
              <div
                key={i}
                className={`affirmation-bubble ${collected.includes(msg) ? "collected" : ""}`}
                onClick={() => handleAffirmationClick(msg)}
              >
                {msg}
              </div>
            ))}
          </div>
          {collected.length === affirmations.length && (
            <button onClick={() => setPhase(3)} className="game-btn">Next</button>
          )}
        </div>
      )}

      {phase === 3 && (
        <div className="kindness-phase">
          <h2>💖 Loving-Kindness Meditation</h2>
          <p>Silently repeat these wishes for each target:</p>
          <ul className="kindness-list">
            {kindnessTargets.map((target, i) => (
              <li key={i}>
                May {target} be happy. May {target} be free. May {target} feel peace.
              </li>
            ))}
          </ul>
          {!kindnessDone ? (
            <button onClick={handleKindnessDone} className="game-btn">I've Reflected</button>
          ) : (
            <button onClick={() => setPhase(4)} className="game-btn">Finish</button>
          )}
        </div>
      )}

      {phase === 4 && (
        <div className="end-screen">
          <h2>🎉 You’ve Completed MindWave</h2>
          <p>Take this peace into your day. Come back whenever you need strength.</p>
          <button onClick={() => {
            setPhase(0);
            setCollected([]);
            setKindnessDone(false);
            setTimer(15);
          }} className="game-btn">Restart</button>
        </div>
      )}
    </div>
  );
}

export default MindWaveGame;
