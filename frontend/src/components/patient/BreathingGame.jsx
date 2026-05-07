import React, { useState, useEffect, useRef } from "react";
import "./breathing.css";
import api from "../../api";

const BreathingGame = () => {
  const [phase, setPhase] = useState("Select Time");
  const [circleClass, setCircleClass] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [timer, setTimer] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [wasStopped, setWasStopped] = useState(false);
  const [withMusic, setWithMusic] = useState(true);

  const breathIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const firstBreathRef = useRef(true); // ✅ Track first breath

  // ✅ Save to MongoDB when session completes
  useEffect(() => {
    if (completed && breathCount > 0) {
      const saveScore = async () => {
        try {
          const token = localStorage.getItem('token');
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = stored._id || stored.id || 'unknown';
          await api.post('/progress/save', {
            userId,
            game: "BreathingGame",
            points: 10
          }, { headers: { Authorization: `Bearer ${token}` } });
          console.log("✅ Calm Points saved to DB");
        } catch (err) {
          console.error("❌ Error saving BreathingGame score:", err);
        }
      };
      saveScore();
    }
  }, [completed, breathCount]);

  useEffect(() => {
    setTimer(0);
    setIsRunning(false);
    setCompleted(false);
    setWasStopped(false);
    setBreathCount(0);
    setPhase("Select Time");
    setCircleClass("");
    clearInterval(timerIntervalRef.current);
    clearInterval(breathIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (isRunning && timer < sessionTime) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    if (timer >= sessionTime && isRunning) {
      setIsRunning(false);
      setCompleted(true);
      setPhase("Well done!");
      clearInterval(timerIntervalRef.current);
      clearInterval(breathIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isRunning, timer, sessionTime]);

  useEffect(() => {
    if (!isRunning) return;

    const phases = [
      { name: "Breathe In", class: "grow", duration: 4000 },
      { name: "Hold", class: "", duration: 7000 },
      { name: "Breathe Out", class: "shrink", duration: 8000 },
      { name: "Hold", class: "", duration: 7000 },
    ];

    let index = 0;

    const runPhase = () => {
      const current = phases[index];
      setPhase(current.name);
      setCircleClass(current.class);

      if (current.name === "Breathe In") {
        if (firstBreathRef.current) {
          // ✅ Skip counting the very first auto-started breath
          firstBreathRef.current = false;
        } else {
          setBreathCount((prev) => prev + 1);
        }
      }

      breathIntervalRef.current = setTimeout(() => {
        index = (index + 1) % phases.length;
        runPhase();
      }, current.duration);
    };

    runPhase();

    return () => clearTimeout(breathIntervalRef.current);
  }, [isRunning]);

  const startSession = (minutes) => {
    clearInterval(timerIntervalRef.current);
    clearInterval(breathIntervalRef.current);
    setTimer(0);
    setBreathCount(0);
    setCompleted(false);
    setWasStopped(false);
    firstBreathRef.current = true; // ✅ Reset on new session
    setSessionTime(minutes * 60);
    setIsRunning(true);
    setPhase("Breathe In");
    setCircleClass("grow"); // ✅ expand at start

    if (withMusic && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Music playback failed:", err);
      });
    }
  };

  const stopSession = () => {
    setIsRunning(false);
    setWasStopped(true);
    setPhase("Session Paused");
    setCircleClass("");
    clearInterval(timerIntervalRef.current);
    clearInterval(breathIntervalRef.current);
    if (audioRef.current) audioRef.current.pause();
  };

  const resumeSession = () => {
    setIsRunning(true);
    setPhase("Resuming...");
    if (withMusic && audioRef.current) audioRef.current.play();
  };

  return (
    <div className="breathing-container">
      <h2 className="breathing-title">🧘 Calm Breather</h2>

      {!isRunning && !completed && timer === 0 && !wasStopped && (
        <div className="time-select">
          <div className="music-toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={withMusic}
                onChange={(e) => setWithMusic(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <span className="music-label">
              {withMusic ? "With Music 🎶" : "Without Music 🔇"}
            </span>
          </div>

          <p className="choose-text">Choose a session duration:</p>

          <div className="time-buttons">
            <button onClick={() => startSession(2)} className="start-btn">2 Minutes</button>
            <button onClick={() => startSession(3)} className="start-btn">3 Minutes</button>
            <button onClick={() => startSession(5)} className="start-btn">5 Minutes</button>
          </div>
        </div>
      )}

      {(isRunning || wasStopped) && !completed && (
        <>
          <div className="square-container">
            <div className={`breathing-circle ${circleClass}`}></div>
            <div className="moving-ball"></div>
          </div>

          <p className="phase-text">{phase}</p>
          <p className="timer-text">
            {Math.floor((sessionTime - timer) / 60)}:
            {String((sessionTime - timer) % 60).padStart(2, "0")}
          </p>
          <p className="breath-count">Breaths Completed: {breathCount}</p>

          {isRunning && (
            <button onClick={stopSession} className="stop-btn">
              Stop Session
            </button>
          )}

          {!isRunning && wasStopped && (
            <button onClick={resumeSession} className="start-btn">
              Resume Breathing
            </button>
          )}
        </>
      )}

      {completed && (
        <div className="complete-message">
          <h3>🎉 Breathing Session Completed</h3>
          <p>You completed {breathCount} full breaths</p>
          <p>You earned 10 Calm Points</p>
        </div>
      )}

      <audio ref={audioRef} loop>
        <source src="/relaxing-music.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default BreathingGame;
