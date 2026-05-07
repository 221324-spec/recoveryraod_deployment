import React, { useMemo, useState, useEffect, useRef } from "react";
import { apiFetch } from "../../config/env";

export default function TriviaGame({ onComplete }) {
  const stylesRef = useRef(null);
  useEffect(() => {
    if (!stylesRef.current) {
      const s = document.createElement("style");
      s.innerHTML = CSS_TEXT;
      document.head.appendChild(s);
      stylesRef.current = s;
    }
    return () => {
      if (stylesRef.current) {
        stylesRef.current.remove();
        stylesRef.current = null;
      }
    };
  }, []);

  const rawQuestions = useMemo(
    () => [
      {
        id: 1,
        category: "Recovery Skills",
        difficulty: "easy",
        question: "Which of these is a healthy coping strategy for stress during recovery?",
        options: ["Avoid all feelings", "Talk to a trusted friend", "Ignore the problem", "Use substances to relax"],
        answerIndex: 1,
        explanation: "Talking to a trusted friend or counselor helps process emotions and reduces relapse risk."
      },
      {
        id: 2,
        category: "Myth Busting",
        difficulty: "easy",
        question: "True or False: Once addicted, recovery is impossible.",
        options: ["True", "False"],
        answerIndex: 1,
        explanation: "Recovery is absolutely possible with the right support, treatment, and commitment."
      },
      {
        id: 3,
        category: "Healthy Habits",
        difficulty: "easy",
        question: "Which activity can help reduce cravings during recovery?",
        options: ["Regular exercise", "Isolating yourself", "Skipping meals", "Watching triggering movies"],
        answerIndex: 0,
        explanation: "Exercise boosts mood, reduces stress, and supports brain health during recovery."
      },
      {
        id: 4,
        category: "Relapse Prevention",
        difficulty: "medium",
        question: "Which of these is an example of a trigger that can lead to relapse?",
        options: ["Hanging out with old using friends", "Attending a recovery meeting", "Eating healthy meals", "Practicing mindfulness"],
        answerIndex: 0,
        explanation: "Being around old using friends can trigger memories and cravings, increasing relapse risk."
      },
      {
        id: 5,
        category: "Self-Care",
        difficulty: "easy",
        question: "Why is sleep important in recovery?",
        options: ["It helps the body heal", "It increases cravings", "It prevents socializing", "It causes relapse"],
        answerIndex: 0,
        explanation: "Good sleep supports mental clarity, emotional balance, and physical healing."
      },
      {
        id: 6,
        category: "Support Systems",
        difficulty: "medium",
        question: "Which support is most recommended during early recovery?",
        options: ["Keeping it a secret", "Peer support groups", "Avoiding all people", "Only self-reliance"],
        answerIndex: 1,
        explanation: "Peer support groups (like NA/AA or local groups) provide accountability, empathy, and shared strategies."
      },
      {
        id: 7,
        category: "Coping Skills",
        difficulty: "medium",
        question: "What is a grounding technique you can use during a craving?",
        options: ["5-4-3-2-1 senses", "Skip meals", "Call an old using friend", "Watch triggering content"],
        answerIndex: 0,
        explanation: "The 5-4-3-2-1 method helps bring attention to the present and reduce the intensity of cravings."
      },
      {
        id: 8,
        category: "Nutrition",
        difficulty: "easy",
        question: "Which meal habit best supports stable energy and mood?",
        options: ["Skipping breakfast", "Balanced meals and hydration", "Only energy drinks", "Late-night heavy meals"],
        answerIndex: 1,
        explanation: "Balanced meals and regular hydration stabilize blood sugar and mood, reducing vulnerability to cravings."
      },
      {
        id: 9,
        category: "Myth Busting",
        difficulty: "medium",
        question: "True or False: Relapse means failure and you should give up.",
        options: ["True", "False"],
        answerIndex: 1,
        explanation: "Relapse is a setback, not a failure. It can be a learning moment to strengthen the plan."
      },
      {
        id: 10,
        category: "Emotions",
        difficulty: "medium",
        question: "Which response to difficult emotions is most helpful?",
        options: ["Numbing or avoiding feelings", "Mindful breathing and naming the feeling", "Self-criticism", "Blaming others"],
        answerIndex: 1,
        explanation: "Mindful breathing and labeling emotions can reduce their intensity and improve coping."
      },
      {
        id: 11,
        category: "Safety Plan",
        difficulty: "hard",
        question: "What is a key element of a personal relapse prevention plan?",
        options: ["Keeping triggers private", "List of warning signs and actions", "No phone numbers saved", "Rely only on willpower"],
        answerIndex: 1,
        explanation: "A solid plan lists personal warning signs, coping actions, and people to contact for support."
      },
      {
        id: 12,
        category: "Lifestyle",
        difficulty: "medium",
        question: "Which routine best supports long-term recovery?",
        options: ["Irregular sleep and meals", "Daily structure with self-care and support", "Avoid planning anything", "Work nonstop"],
        answerIndex: 1,
        explanation: "A consistent routine that includes self-care, connection, and healthy habits builds resilience."
      }
    ],
    []
  );

  const questions = useMemo(() => {
    return rawQuestions.map((q) => {
      const indices = q.options.map((_, i) => i);
      shuffleInPlace(indices);
      const shuffled = indices.map((i) => q.options[i]);
      const newAnswerIndex = indices.indexOf(q.answerIndex);
      return { ...q, options: shuffled, answerIndex: newAnswerIndex };
    });
  }, [rawQuestions]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const total = questions.length;

  const firstOptionRef = useRef(null);
  useEffect(() => {
    setSelected(null);
    setLocked(false);
    if (firstOptionRef.current) firstOptionRef.current.focus();
  }, [idx]);

  // --- Added saving logic (minimal, non-invasive) ---
  const savedRef = useRef(false);

  const getUserId = () => {
    const uid = localStorage.getItem("userId");
    if (uid) return uid;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        return parsed.id || parsed._id || parsed.userId || parsed.uid || null;
      } catch (err) {
        // not JSON
      }
    }
    return "guest-unknown";
  };

  const saveProgress = async (pts) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const userId = getUserId();
    const game = "TriviaGame";
    const points = typeof pts === "number" ? pts : score;

    if (!userId || typeof points !== "number") {
      console.warn("Skipping trivia save; missing userId or invalid points", { userId, points });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log("📥 Saving trivia progress:", { userId, game, points });
      const res = await apiFetch(`/api/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, game, points }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("✅ Trivia progress saved:", data);
    } catch (err) {
      console.error("❌ Error saving trivia progress:", err);
    }
  };
  // --- end save logic ---

  const handlePick = (optionIndex) => {
    if (locked) return;
    setSelected(optionIndex);
    setLocked(true);

    const q = questions[idx];
    const isCorrect = optionIndex === q.answerIndex;

    setAnswers((prev) => [...prev, { questionId: q.id, picked: optionIndex, correctIndex: q.answerIndex, isCorrect }]);

    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (idx < total - 1) {
      setIdx((i) => i + 1);
    } else {
      // Save progress once, then notify parent
      saveProgress(score);
      onComplete?.({ total, score, answers, finishedAt: new Date().toISOString() });
    }
  };

  const handleRestart = () => {
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setScore(0);
    setAnswers([]);
    savedRef.current = false; // allow saving for the new attempt
  };

  const progress = Math.round(((idx + 1) / total) * 100);
  const q = questions[idx];
  const hasAnswer = selected !== null;

  return (
    <div className="tg-root">
      <div className="tg-card animate-in">
        <header className="tg-header">
          <div className="tg-badges">
            <span className="tg-badge">{q.category}</span>
            <span className={`tg-badge tg-${q.difficulty}`}>{q.difficulty}</span>
          </div>
          <div className="tg-progress">
            <div className="tg-progress-track">
              <div className="tg-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="tg-progress-label">Question {idx + 1} / {total}</span>
          </div>
        </header>

        <h2 className="tg-question" key={q.id}>{q.question}</h2>

        <ul className="tg-options">
          {q.options.map((opt, i) => {
            const isPicked = selected === i;
            const isCorrect = hasAnswer && i === q.answerIndex;
            const isWrongPick = hasAnswer && isPicked && !isCorrect;

            return (
              <li key={i}>
                <button
                  ref={i === 0 ? firstOptionRef : null}
                  className={["tg-option", isPicked ? "is-picked" : "", isCorrect ? "is-correct" : "", isWrongPick ? "is-wrong" : ""].join(" ")}
                  onClick={() => handlePick(i)}
                  disabled={locked && !isPicked && !isCorrect}
                >
                  <span className="tg-option-index">{String.fromCharCode(65 + i)}</span>
                  <span className="tg-option-text">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="tg-footer">
          {hasAnswer ? (
            <div className="tg-explanation">
              {selected === q.answerIndex ? (
                <p className="tg-good">Great choice! You’re building strong recovery skills.</p>
              ) : (
                <p className="tg-bad">Not quite — remember, healthy coping strategies help you stay strong.</p>
              )}
              {q.explanation && <p className="tg-note">{q.explanation}</p>}
            </div>
          ) : (
            <div className="tg-hint">Select the best answer to continue.</div>
          )}

          <div className="tg-actions">
            <button className="tg-btn tg-ghost" onClick={handleRestart} type="button">Restart</button>
            <button className="tg-btn" onClick={handleNext} type="button" disabled={!hasAnswer}>{idx < total - 1 ? "Next" : "Finish"}</button>
          </div>
        </div>
      </div>

      <aside className="tg-scorecard">
        <div className="tg-pill">Score: {score} / {total}</div>
        <div className="tg-pill">{Math.round((score / total) * 100)}%</div>
      </aside>
    </div>
  );
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CSS_TEXT = `
:root {
  --tg-bg: #0b1420;
  --tg-card: #0f1830;
  --tg-card-2: #121c3a;
  --tg-text: #e8eefc;
  --tg-muted: #9fb0d6;
  --tg-good: #22c55e; /* success green */
  --tg-bad: #ef4444;  /* gentle red */
  --tg-accent: #60a5fa; /* calming blue */
  --tg-accent-2: #7c5cff; /* violet */
  --tg-ring: rgba(96, 165, 250, 0.45);
}

* { box-sizing: border-box; }

.tg-root {
  position: relative;
  min-height: 100dvh;
  padding: 24px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(1200px 600px at 20% -20%, #1a2550 0%, transparent 60%),
    radial-gradient(900px 500px at 110% 10%, #1b335f 0%, transparent 60%),
    var(--tg-bg);
  color: var(--tg-text);
}

.tg-card {
  width: min(860px, 92vw);
  background: linear-gradient(180deg, var(--tg-card), var(--tg-card-2));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 20px 22px 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
  animation: fadeUp .35s ease;
}

@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.tg-header { display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.tg-badges { display: flex; gap: 8px; align-items: center; }
.tg-badge {
  font-size: 12px; text-transform: capitalize; letter-spacing: .3px;
  padding: 6px 10px; border-radius: 999px;
  background: rgba(255,255,255,0.06); color: var(--tg-text);
  border: 1px solid rgba(255,255,255,0.08);
}
.tg-badge.tg-easy { background: rgba(34, 197, 94, .12); border-color: rgba(34, 197, 94, .3); }
.tg-badge.tg-medium { background: rgba(96, 165, 250, .12); border-color: rgba(96, 165, 250, .35); }
.tg-badge.tg-hard { background: rgba(239, 68, 68, .12); border-color: rgba(239, 68, 68, .35); }

.tg-progress { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.tg-progress-track {
  width: min(320px, 48vw); height: 10px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
}
.tg-progress-fill { height: 100%; background: linear-gradient(90deg, var(--tg-accent), var(--tg-accent-2)); }
.tg-progress-label { font-size: 12px; color: var(--tg-muted); }

.tg-question { font-size: clamp(20px, 2.4vw, 28px); margin: 18px 2px; line-height: 1.35; }

.tg-options { list-style: none; padding: 0; margin: 14px 0 6px; display: grid; gap: 10px; }
.tg-option {
  width: 100%; text-align: left; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  padding: 14px 16px; border-radius: 14px; cursor: pointer; position: relative;
  display: grid; grid-template-columns: 32px 1fr auto; align-items: center; gap: 12px;
  transition: transform .08s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease;
}
.tg-option:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
.tg-option:disabled { cursor: default; opacity: .95; }

.tg-option-index { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px;
  background: rgba(255,255,255,0.07); font-weight: 700; color: #c8d3ff; }
.tg-option-text { color: var(--tg-text); }

.tg-option.is-picked { border-color: var(--tg-ring); box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.18) inset; }
.tg-option.is-correct { border-color: rgba(34,197,94,.6); background: linear-gradient(180deg, rgba(34,197,94,.12), transparent); }
.tg-option.is-wrong { border-color: rgba(239,68,68,.6); background: linear-gradient(180deg, rgba(239,68,68,.12), transparent); }

.tg-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--tg-good); }
.tg-dot-wrong { background: var(--tg-bad); }

.tg-footer { display: grid; gap: 12px; margin-top: 8px; }
.tg-explanation { font-size: 14px; color: var(--tg-muted); }
.tg-good { color: var(--tg-good); font-weight: 600; }
.tg-bad { color: var(--tg-bad); font-weight: 600; }
.tg-note { margin: 6px 0 0; color: #d6e0ff; }
.tg-hint { color: var(--tg-muted); font-size: 14px; }

.tg-actions { display: flex; gap: 10px; justify-content: flex-end; }
.tg-btn { padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, #2b3c7a, #263a6e);
  color: #eef2ff; font-weight: 600; letter-spacing: .2px; cursor: pointer; transition: transform .08s ease, filter .2s ease; }
.tg-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
.tg-btn:disabled { opacity: .5; cursor: not-allowed; }
.tg-btn.tg-ghost { background: transparent; }

.tg-scorecard { position: fixed; right: 18px; bottom: 18px; display: flex; gap: 8px; }
.tg-pill { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: var(--tg-text);
  padding: 8px 12px; border-radius: 999px; font-size: 12px; }

@media (max-width: 520px) {
  .tg-progress { width: 100%; }
  .tg-progress-track { width: 100%; }
}
`;
