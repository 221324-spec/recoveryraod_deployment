import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: 1,
    question: "Pick an emoji that matches your vibe right now 🎭",
    options: ["😊", "😔", "😡", "🤩", "😴"],
  },
  {
    id: 2,
    question: "What energy do you want to bring today? ⚡",
    options: ["🎶", "📚", "🌊", "🔥", "🍀"],
  },
  {
    id: 3,
    question: "Choose something to guide your journey 🚀",
    options: ["🌟", "🧘", "🎨", "🏋️", "🍫"],
  },
];

export default function EmojiJourney() {
  const [currentStep, setCurrentStep] = useState(0);
  const [choices, setChoices] = useState([]);

  const handleSelect = (emoji) => {
    const updated = [...choices];
    updated[currentStep] = emoji;
    setChoices(updated);

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 500);
    } else {
      setTimeout(() => setCurrentStep("summary"), 500);
    }
  };

  const getStory = () => {
    return `Today you felt ${choices.join(" + ")} → a unique mood journey 🌈✨`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white">
      <div className="w-full max-w-md p-6">
        <AnimatePresence mode="wait">
          {currentStep !== "summary" ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="bg-white text-gray-800 rounded-2xl shadow-xl p-6 text-center"
            >
              <h2 className="text-xl font-bold mb-4">{steps[currentStep].question}</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {steps[currentStep].options.map((emoji, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSelect(emoji)}
                    className="text-4xl bg-gray-100 rounded-full p-4 shadow-lg hover:bg-gray-200 transition"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              <div className="mt-6 flex justify-center gap-2">
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className={`w-3 h-3 rounded-full ${
                      i === currentStep ? "bg-pink-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white text-gray-800 rounded-2xl shadow-xl p-6 text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Your Emoji Journey 🌟</h2>
              <p className="text-lg">{getStory()}</p>
              <button
                onClick={() => {
                  setChoices([]);
                  setCurrentStep(0);
                }}
                className="mt-6 px-6 py-2 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600 transition"
              >
                Restart 🔄
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
