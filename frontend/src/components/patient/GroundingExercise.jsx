import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { apiFetch } from "../../config/env";

// Quotes tailored for recovery/counseling
const quotes = [
  "“The first step towards getting somewhere is to decide you’re not going to stay where you are.” — J.P. Morgan",
  "“You are stronger than you think, braver than you feel, and more resilient than you realize.”",
  "“Healing takes courage, and we all have courage, even if we have to dig a little to find it.” — Tori Amos",
  "“Small steps every day will get you to where you want to be.”",
  "“Breathe. Believe. Receive. You are on a journey to better days.”",
];

// Grounding exercise steps
const exercises = [
  {
    id: "5-see",
    title: "5 Things You See",
    instruction: "Look around and name 5 things you can see right now.",
    count: 5,
    placeholder: "Enter something you see...",
  },
  {
    id: "4-touch",
    title: "4 Things You Can Touch",
    instruction: "Focus on textures — name 4 things you can feel.",
    count: 4,
    placeholder: "Enter something you can touch...",
  },
  {
    id: "3-hear",
    title: "3 Things You Hear",
    instruction: "Listen carefully and note 3 distinct sounds.",
    count: 3,
    placeholder: "Enter a sound you hear...",
  },
  {
    id: "2-smell",
    title: "2 Things You Smell",
    instruction: "Notice 2 scents — even faint ones.",
    count: 2,
    placeholder: "Enter what you smell...",
  },
  {
    id: "1-breathe",
    title: "1 Slow Breath",
    instruction: "Take 1 deep, slow breath. Notice how it feels.",
    count: 1,
    placeholder: "Take a breath...",
  },
];

export default function GroundingExerciseGame() {
  const [stepIndex, setStepIndex] = useState(0);
  const [inputs, setInputs] = useState(
    exercises.map((ex) => Array(ex.count).fill(""))
  );
  const [showQuote, setShowQuote] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const inputRefs = useRef([]);
  const savedRef = useRef(false); // ensure single save per summary

  useEffect(() => {
    if (!showQuote) {
      inputRefs.current[0]?.focus();
    }
  }, [stepIndex, showQuote]);

  const currentExercise = exercises[stepIndex];
  const currentInputs = inputs[stepIndex];

  function handleChange(i, val) {
    if (val.length > 50) return;
    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[stepIndex] = [...newInputs[stepIndex]];
      newInputs[stepIndex][i] = val;
      return newInputs;
    });
  }

  const allFilled = currentInputs.every((item) => item.trim() !== "");

  function onContinueStep() {
    setShowQuote(true);
  }

  function onNextStep() {
    setShowQuote(false);
    if (stepIndex === exercises.length - 1) finish();
    else setStepIndex(stepIndex + 1);
  }

  function finish() {
    setShowSummary(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 7000);
  }

  function reset() {
    setInputs(exercises.map((ex) => Array(ex.count).fill("")));
    setStepIndex(0);
    setShowQuote(false);
    setShowSummary(false);
    savedRef.current = false; // allow saving again for new run
  }

  function handleKeyDown(e, i) {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (i + 1 < currentExercise.count) {
        inputRefs.current[i + 1]?.focus();
      }
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (i - 1 >= 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
  }

  const totalItems = exercises.reduce((acc, ex) => acc + ex.count, 0);
  const answeredItems = inputs.reduce(
    (acc, arr) => acc + arr.filter((i) => i.trim() !== "").length,
    0
  );
  const progressPercent = Math.round((answeredItems / totalItems) * 100);

  // Points: 1 point per filled item
  const points = answeredItems;

  // API base (fallback to localhost)
  const API_BASE = '';

  // Attempt to find userId from localStorage (common patterns) or fallback
  const getUserId = () => {
    const uid = localStorage.getItem("userId");
    if (uid) return uid;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        return parsed.id || parsed._id || parsed.userId || parsed.uid || null;
      } catch (err) {
        // not JSON, continue
      }
    }
    return "guest-unknown";
  };

  // Save progress to backend
  const saveProgress = async () => {
    const userId = getUserId();
    const game = "GroundingExercise";
    const pts = points;

    if (!userId || typeof pts !== "number") {
      console.warn("Skipping progress save; missing userId or points invalid", { userId, pts });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log("📥 Saving grounding progress to server:", { userId, game, points: pts });
      const res = await apiFetch(`/api/progress/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, game, points: pts }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("✅ Grounding progress saved:", data);
    } catch (err) {
      console.error("❌ Error saving grounding progress:", err);
    }
  };

  // Trigger save once when summary opens
  useEffect(() => {
    if (showSummary && !savedRef.current) {
      savedRef.current = true;
      saveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSummary]);

  return (
    <>
      <style>{`
        /* Container */
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #a8e8f7ff 0%, #fa9ebbff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #3b3b98;         
          
        }
        /* Card */
        .card {
          background: white;
          max-width: 700px;
          width: 100%;
          border-radius: 1rem;
          padding: 2.5rem 3rem;
          box-shadow: 0 15px 40px rgba(59, 59, 152, 0.15);
          position: relative;
        }
        /* Title */
        .title {
          font-weight: 900;
          font-size: 2.75rem;
          text-align: center;
          margin: 0 0 2rem 0;

          user-select: none;
          letter-spacing: 0.05em;
          color: #4f46e5;
        }
        /* Progress Bar */
        .progress-bar {
          height: 1.25rem;
          background-color: #dbe4ff;
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: inset 0 0 6px rgba(79, 70, 229, 0.3);
          margin-bottom: 3rem;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
          border-radius: 9999px;
          transition: width 1s ease-in-out;
        }
        /* Step content */
        .step-container {
          margin-bottom: 2.5rem;
        }
        .step-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          user-select: none;
        }
        .step-instruction {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          user-select: none;
          color: #6366f1;
        }
        /* Inputs Grid */
        .inputs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
        }
        .input-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #4f46e5;
          user-select: none;
          letter-spacing: 0.02em;
        }
        /* Stylish pill-shaped input */
        .input-pill {
          padding: 1rem 1.5rem;
          border-radius: 9999px;
          border: 2px solid #a5b4fc;
          box-shadow: 0 6px 12px rgba(124, 58, 237, 0.15);
          font-weight: 600;
          font-size: 1.125rem;
          color: #3730a3;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          outline-offset: 2px;
        }
        .input-pill::placeholder {
          color: #c7d2fe;
        }
        .input-pill:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 10px 3px rgba(124, 58, 237, 0.5);
          outline: none;
        }
        /* Buttons */
        .btn-pill {
          width: 100%;
          padding: 1rem 0;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 1.25rem;
          color: white;
          background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.5);
          cursor: pointer;
          transition: filter 0.3s ease;
          border: none;
          user-select: none;
        }
        .btn-pill:disabled,
        .btn-disabled {
          background: #c7d2fe;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-pill:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        /* Quote container */
        .quote-container {
          background-color: #f0f4ff;
          padding: 3rem 2.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 8px 30px rgba(79, 70, 229, 0.2);
          text-align: center;
          user-select: none;
        }
        .quote-text {
          font-style: italic;
          font-size: 1.375rem;
          color: #3730a3;
          margin-bottom: 2.5rem;
          font-family: "Georgia", serif;
          letter-spacing: 0.025em;
        }
        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          z-index: 9999;
        }
        .modal-content {
          background: white;
          border-radius: 2rem;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2.5rem 3rem;
          box-shadow: 0 20px 50px rgba(59, 59, 152, 0.25);
        }
        .summary-title {
          font-weight: 900;
          font-size: 2.25rem;
          margin-bottom: 2rem;
          user-select: none;
          color: #4f46e5;
          letter-spacing: 0.05em;
        }
        .summary-section {
          margin-bottom: 2rem;
        }
        .summary-subtitle {
          font-weight: 700;
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          user-select: none;
          color: #6b21a8;
        }
        .summary-empty {
          font-style: italic;
          color: #a78bfa;
        }
        .summary-list {
          list-style-type: disc;
          padding-left: 1.5rem;
          color: #312e81;
          font-size: 1.125rem;
        }
        .summary-list-item {
          margin-bottom: 0.4rem;
          word-break: break-word;
        }
        /* Summary buttons container */
        .summary-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        /* Buttons in modal */
        .btn-primary,
        .btn-secondary,
        .btn-danger {
          padding: 1rem 2rem;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 1.125rem;
          cursor: pointer;
          border: none;
          user-select: none;
          transition: background-color 0.3s ease;
        }
        .btn-primary {
          background-color: #7c3aed;
          color: white;
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.5);
        }
        .btn-primary:hover {
          background-color: #5b21b6;
        }
        .btn-secondary {
          background-color: #e0e7ff;
          color: #4f46e5;
        }
        .btn-secondary:hover {
          background-color: #c7d2fe;
        }
        .btn-danger {
          background-color: #db2777;
          color: white;
          box-shadow: 0 8px 20px rgba(219, 39, 119, 0.5);
        }
        .btn-danger:hover {
          background-color: #be185d;
        }
      `}</style>
      <div className="container">
        {confetti && <Confetti recycle={false} numberOfPieces={350} />}
        <div className="card">
          <h1 className="title">Grounding Exercise</h1>

          <div
            className="progress-bar"
            aria-label={`Progress: ${progressPercent}% completed`}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!showQuote ? (
              <motion.div
                key={"step-" + currentExercise.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="step-container"
              >
                <h2 className="step-title">{currentExercise.title}</h2>
                <p className="step-instruction">{currentExercise.instruction}</p>

                <div className="inputs-grid">
                  {currentInputs.map((val, i) => (
                    <div key={i} className="input-group">
                      <label htmlFor={`input-${i}`} className="input-label">
                        {currentExercise.count > 1 ? `Item ${i + 1}` : "Response"}
                      </label>
                      <input
                        id={`input-${i}`}
                        type="text"
                        maxLength={50}
                        ref={(el) => (inputRefs.current[i] = el)}
                        value={val}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        placeholder={currentExercise.placeholder}
                        className="input-pill"
                        aria-required="true"
                        spellCheck="false"
                        autoComplete="off"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={onContinueStep}
                  disabled={!allFilled}
                  className={`btn-pill ${allFilled ? "" : "btn-disabled"}`}
                  aria-disabled={!allFilled}
                >
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={"quote-" + currentExercise.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="quote-container"
              >
                <p className="quote-text">{quotes[stepIndex]}</p>
                <button onClick={onNextStep} className="btn-pill btn-gradient">
                  {stepIndex === exercises.length - 1 ? "Finish" : "Next Step"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showSummary && (
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-content"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.4 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="summaryTitle"
              >
                <h3 id="summaryTitle" className="summary-title">
                  Session Summary
                </h3>

                {/* Points display added */}
                <div style={{ marginBottom: "1rem", fontWeight: 800, color: "#6b21a8", fontSize: "1.125rem" }}>
                  Points Earned: {points}
                </div>

                {exercises.map((ex, i) => (
                  <section key={ex.id} className="summary-section">
                    <h4 className="summary-subtitle">{ex.title}</h4>
                    {inputs[i].every((i) => i.trim() === "") ? (
                      <p className="summary-empty">No items recorded.</p>
                    ) : (
                      <ul className="summary-list">
                        {inputs[i].map(
                          (item, idx) =>
                            item.trim() === "" ? null : (
                              <li key={idx} className="summary-list-item">
                                {item}
                              </li>
                            )
                        )}
                      </ul>
                    )}
                  </section>
                ))}

                <div className="summary-buttons">
                  <button
                    onClick={() => setShowSummary(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const textSummary = exercises
                        .map(
                          (ex, i) =>
                            `${ex.title}:\n${inputs[i]
                              .filter((item) => item.trim() !== "")
                              .join("\n") || "(none)"}`
                        )
                        .join("\n\n");
                      navigator.clipboard.writeText(textSummary);
                      alert("Summary copied to clipboard!");
                    }}
                    className="btn-primary"
                  >
                    Copy Summary
                  </button>
                  <button onClick={reset} className="btn-danger">
                    Restart
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
