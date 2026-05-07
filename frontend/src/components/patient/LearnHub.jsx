// components/LearnHub.js
import React from "react";
import "./LearnHub.css";

const resources = [
  {
    title: "Watch a TED Talk 🎥",
    description: "Inspiring talks from experts in tech, education, design, and more.",
    link: "https://www.ted.com/talks"
  },
  {
    title: "Try a coding challenge 💻",
    description: "Practice problem-solving and programming skills interactively.",
    link: "https://www.codewars.com/"
  },
  {
    title: "Explore fun science facts 🌍",
    description: "Learn surprising science facts and trivia in minutes.",
    link: "https://www.sciencekids.co.nz/sciencefacts.html"
  },
  {
    title: "Take a free course 📘",
    description: "Choose from free online courses in various fields.",
    link: "https://www.khanacademy.org/"
  },
  {
    title: "Play a memory game 🧠",
    description: "Challenge your brain and improve memory.",
    link: "https://www.memozor.com/memory-games/for-adults"
  }
];

const LearnHub = () => {
  return (
    <div className="learnhub-container">
      <h2 className="learnhub-title">🎓 Explore & Learn Something New</h2>
      <p className="learnhub-subtitle">Pick any resource below and dive in!</p>
      <div className="learnhub-grid">
        {resources.map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="learnhub-card"
          >
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LearnHub;
