import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaMobileAlt, FaGlobe } from "react-icons/fa";
import { apiFetch } from "../../config/env";
import questionPool from "./questionpool"; // <-- import the external question pool

// sound effects
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");

// ----------------------- CONFIG -----------------------
const QUESTIONS_PER_RUN = 5; // how many questions to serve each playthrough (per category)

const translations = {
  en: {
    title: "NAVIGATORS",
    welcomeText: "Welcome to Navigators – a journey of discovery, reflection, and play. Ready to start your adventure?",
    startBtn: "Start",
    pickCategory: "PICK A CATEGORY",
    quitBtn: "QUIT",
    beginBtn: "Begin",
    question: "Question",
    scoreLabel: "Score",
    resultsTitle: "Your Results",
    resultsText: (score, total) => `You earned ${score} out of ${total} points!`,
    totalPoints: "Total Points Earned:",
    backToCategories: "Back to Categories",
    thankYou: "Thank You",
    quote: '"Recovery is a journey, not a destination. It\'s about progress, not perfection."',
    goHome: "Go Home",
  },
  ur: {
    title: "نیویگیٹرز",
    welcomeText: "نیویگیٹرز میں خوش آمدید - دریافت، غور و فکر اور کھیل کا ایک سفر۔ کیا آپ اپنا ایڈونچر شروع کرنے کے لیے تیار ہیں؟",
    startBtn: "شروع کریں",
    pickCategory: "ایک زمرہ منتخب کریں",
    quitBtn: "بند کریں",
    beginBtn: "آغاز کریں",
    question: "سوال",
    scoreLabel: "اسکور",
    resultsTitle: "آپ کا نتیجہ",
    resultsText: (score, total) => `آپ نے ${total} میں سے ${score} پوائنٹس حاصل کیے!`,
    totalPoints: "کل حاصل کردہ پوائنٹس:",
    backToCategories: "زمرہ جات پر واپس جائیں",
    thankYou: "شکریہ",
    quote: '"صحتیابی ایک سفر ہے، منزل نہیں۔ یہ کمال کے بارے میں نہیں، بلکہ بہتری کے بارے میں ہے۔"',
    goHome: "ہوم پر جائیں",
  }
};
// ------------------------------------------------------

// Utility: Fisher-Yates shuffle (non-mutating)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Utility: pick n random items from array (shuffled)
function pickRandomSubset(arr, n) {
  if (!arr || arr.length === 0) return [];
  const copy = shuffleArray(arr);
  return copy.slice(0, Math.min(n, copy.length));
}

// Utility: shuffle options and recompute correct index reliably using correct answer text
function shuffleOptionsAndFixCorrect(question) {
  const originalOptions = [...question.options];
  const correctAnswerText = originalOptions[question.correct];
  const shuffledOpts = shuffleArray(originalOptions);
  
  // Also shuffle Urdu options in the exact same order if they exist
  let shuffledOptsUr = [];
  if (question.options_ur) {
    shuffledOptsUr = shuffledOpts.map(opt => {
      const originalIdx = originalOptions.indexOf(opt);
      return question.options_ur[originalIdx];
    });
  }

  const newCorrectIndex = shuffledOpts.findIndex(opt => opt === correctAnswerText);
  return {
    ...question,
    options: shuffledOpts,
    options_ur: shuffledOptsUr,
    correct: newCorrectIndex,
  };
}

export default function WelcomePage({ onSelectCategory, onQuit }) {
  const [step, setStep] = useState("welcome");
  const [activeCategory, setActiveCategory] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lang, setLang] = useState("en");

  const t = translations[lang];

  // new state: prepared questions for current run (from pool)
  const [preparedQuestions, setPreparedQuestions] = useState([]);

  // ensure we only save progress once per results display
  const savedRef = useRef(false);

  // Decorative scattered pins for background
  const pins = [
    { top: "15%", left: "12%", color: "#ff6b6b" },
    { top: "65%", left: "18%", color: "#4dabf7" },
    { top: "45%", left: "75%", color: "#ffd43b" },
    { top: "80%", left: "55%", color: "#69db7c" },
    { top: "25%", left: "85%", color: "#845ef7" },
  ];

  const categories = questionPool;
  const currentData = activeCategory ? categories[activeCategory] : null;
  const currentQ = preparedQuestions[qIndex];
  const score = answers.filter(a => a.correct).length;

  const getUserId = () => {
    const uid = localStorage.getItem("userId");
    if (uid) return uid;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        return parsed.id || parsed._id || parsed.userId || parsed.uid || null;
      } catch (err) {}
    }
    return "guest-unknown";
  };

  const saveProgress = useCallback(async () => {
    const userId = getUserId();
    const game = "Navigators";
    const points = score;

    if (!userId || typeof points !== "number") return;

    try {
      const token = localStorage.getItem('token');
      await apiFetch(`/api/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, game, points }),
      });
    } catch (err) {}
  }, [score]);

  useEffect(() => {
    if (step === "results" && !savedRef.current) {
      savedRef.current = true;
      saveProgress();
    }
  }, [step, saveProgress]);

  const prepareQuestionsForRun = (categoryKey) => {
    const pool = questionPool[categoryKey]?.questions || [];
    const subset = pickRandomSubset(pool, QUESTIONS_PER_RUN);
    const prepared = subset.map(q => shuffleOptionsAndFixCorrect(q));
    setPreparedQuestions(prepared);
    setQIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    savedRef.current = false;
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    prepareQuestionsForRun(cat);
    setStep("intro");
  };

  const handleAnswer = (idx) => {
    if (!currentQ) return;
    const correct = idx === currentQ.correct;

    try {
      if (correct) correctSound.play();
      else wrongSound.play();
    } catch (err) {}

    setSelectedAnswer(idx);

    setTimeout(() => {
      setAnswers(prev => [
        ...prev,
        { 
          prompt: lang === 'ur' ? (currentQ.prompt_ur || currentQ.prompt) : currentQ.prompt, 
          chosen: lang === 'ur' ? (currentQ.options_ur[idx] || currentQ.options[idx]) : currentQ.options[idx], 
          correct 
        },
      ]);
      setSelectedAnswer(null);
      if (qIndex + 1 < preparedQuestions.length) setQIndex(qIndex + 1);
      else setStep("results");
    }, 700);
  };

  return (
    <div className={`welcome-container ${lang === 'ur' ? 'rtl-mode' : ''}`}>
      <div className="dots-pattern"></div>

      {/* Language Switcher */}
      <div className="lang-switcher">
        <button onClick={() => setLang(lang === "en" ? "ur" : "en")}>
          <FaGlobe style={{ marginRight: lang === 'en' ? '8px' : '0', marginLeft: lang === 'ur' ? '8px' : '0' }} />
          {lang === "en" ? "اردو" : "English"}
        </button>
      </div>

      {pins.map((pin, idx) => (
        <FaMapMarkerAlt key={idx} className="decor-pin" style={{ top: pin.top, left: pin.left, color: pin.color }} />
      ))}

      {step === "quiz" && (
        <div style={{ position: "absolute", top: 15, right: 20, fontSize: "1.2rem", fontWeight: "600", zIndex: 10 }}>
          {t.scoreLabel}: {score} / {answers.length}
        </div>
      )}

      {step === "welcome" && (
        <>
          <motion.div className="title-box" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <FaMapMarkerAlt className="map-pin left" />
            <h1 className="title-text">{t.title}</h1>
            <FaMapMarkerAlt className="map-pin right" />
          </motion.div>
          <motion.p className="intro-text" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
            {t.welcomeText}
          </motion.p>
          <motion.button className="start-btn" onClick={() => setStep("categories")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            {t.startBtn}
          </motion.button>
        </>
      )}

      {step === "categories" && (
        <>
          <motion.div className="title-box" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <FaMobileAlt className="map-pin left" />
            <h2 className="title-text">{t.pickCategory}</h2>
            <FaMobileAlt className="map-pin right" />
          </motion.div>

          <div className="category-list">
            {Object.keys(categories).map((cat, i) => (
              <motion.button
                key={i}
                className="category-btn"
                onClick={() => handleCategorySelect(cat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {lang === 'ur' && categories[cat].category_ur ? categories[cat].category_ur : cat}
                <div className="dots-row">•••••</div>
              </motion.button>
            ))}
          </div>

          <motion.button className="quit-btn" onClick={() => setStep("quit")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t.quitBtn}
          </motion.button>
        </>
      )}

      {step === "intro" && currentData && (
        <>
          <motion.div className="title-box">
            <h2 className="title-text">{lang === 'ur' && currentData.category_ur ? currentData.category_ur : activeCategory}</h2>
          </motion.div>
          <motion.p className="intro-text">
            {lang === 'ur' ? (currentData.description_ur || currentData.description) : currentData.description}
          </motion.p>
          <motion.button className="start-btn" onClick={() => setStep("quiz")} whileHover={{ scale: 1.05 }}>
            {t.beginBtn}
          </motion.button>
        </>
      )}

      {step === "quiz" && currentQ && (
        <>
          <motion.div className="title-box">
            <h2 className="title-text">{t.question} {qIndex + 1}</h2>
          </motion.div>
          <motion.p className="intro-text">
            {lang === 'ur' ? (currentQ.prompt_ur || currentQ.prompt) : currentQ.prompt}
          </motion.p>
          <div className="category-list">
            {(lang === 'ur' && currentQ.options_ur ? currentQ.options_ur : currentQ.options).map((opt, idx) => (
              <motion.button
                key={idx}
                className="category-btn"
                onClick={() => handleAnswer(idx)}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: selectedAnswer === idx ? (idx === currentQ.correct ? "#69db7c" : "#ff6b6b") : "#fff",
                  color: selectedAnswer === idx ? "#fff" : "#222",
                }}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </>
      )}

      {step === "results" && (
        <>
          <motion.div className="title-box" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <h2 className="title-text">{t.resultsTitle}</h2>
          </motion.div>

          <motion.p className="intro-text" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
            {t.resultsText(score, answers.length)}
          </motion.p>

          <ul className="category-list">
            {answers.map((a, i) => (
              <li key={i} className="category-btn" style={{ background: a.correct ? "#69db7c" : "#ff6b6b", color: "#fff", cursor: "default" }}>
                {a.prompt} → <b>{a.chosen}</b> {a.correct ? "✔" : "✖"}
              </li>
            ))}
          </ul>

          <motion.p style={{ marginTop: "20px", fontSize: "1.3rem", fontWeight: "700" }}>
            {t.totalPoints} {score}
          </motion.p>

          <motion.div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            <motion.button className="start-btn" onClick={() => setStep("categories")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {t.backToCategories}
            </motion.button>
          </motion.div>
        </>
      )}

      {step === "quit" && (
        <>
          <motion.div className="title-box" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <h2 className="title-text">{t.thankYou}</h2>
          </motion.div>
          <motion.p className="intro-text" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
            {t.quote}
          </motion.p>
          <motion.button className="start-btn" onClick={() => setStep("welcome")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t.goHome}
          </motion.button>
        </>
      )}

      <style>{`
        .welcome-container {
          position: relative;
          height: 100vh;
          width: 100%;
          background: #f5f9ff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow-y: auto;
          text-align: center;
          font-family: "Poppins", sans-serif;
        }
        .rtl-mode { direction: rtl; }
        .lang-switcher { position: absolute; top: 20px; left: 20px; z-index: 100; }
        .lang-switcher button {
          background: #222; color: #fff; border: none; padding: 8px 15px;
          border-radius: 20px; cursor: pointer; font-weight: 600;
          display: flex; align-items: center;
        }
        .dots-pattern {
          position: absolute; width: 100%; height: 100%;
          background-image: radial-gradient(#ccc 1px, transparent 1px);
          background-size: 25px 25px; z-index: 0;
        }
        .decor-pin { position: absolute; font-size: 2rem; opacity: 0.75; z-index: 0; }
        .title-box {
          display: flex; align-items: center; border: 4px solid #222;
          padding: 10px 30px; background: #fff; z-index: 1;
        }
        .title-text { font-size: 2.2rem; font-weight: 800; margin: 0 20px; color: #222; letter-spacing: 2px; }
        .map-pin { font-size: 1.8rem; color: #ff4757; }
        .map-pin.left { margin-right: 10px; }
        .map-pin.right { margin-left: 10px; }
        .intro-text { font-size: 1.2rem; color: #444; max-width: 600px; margin: 20px auto; z-index: 1; }
        .start-btn {
          margin-top: 30px; padding: 12px 30px; font-size: 1.2rem; border: none;
          background: #ff4757; color: #fff; font-weight: 600; border-radius: 8px;
          cursor: pointer; z-index: 1; box-shadow: 0 5px 10px rgba(0,0,0,0.15);
          transition: background 0.3s;
        }
        .start-btn:hover { background: #e84118; }
        .category-list { display: flex; flex-direction: column; gap: 20px; margin-top: 30px; z-index: 1; }
        .category-btn {
          background: #fff; border: none; border-radius: 10px; padding: 15px 30px;
          font-size: 1.1rem; font-weight: 600; color: #222; cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15); transition: transform 0.2s;
          display: flex; flex-direction: column; align-items: center;
        }
        .dots-row { font-size: 1rem; color: #f39c12; margin-top: 6px; }
        .quit-btn {
          margin-top: 40px; background: #222; color: #fff; border: none;
          border-radius: 6px; padding: 10px 20px; font-size: 1rem; font-weight: 600; cursor: pointer; z-index: 1;
        }
      `}</style>
    </div>
  );
}