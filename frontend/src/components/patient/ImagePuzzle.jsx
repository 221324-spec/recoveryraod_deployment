// src/components/ImagePuzzle.js
import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import api from "../../api";

export default function ImagePuzzle() {
  const size = 3; // 3x3 puzzle

  // Recovery-related images with titles
  const images = [
    { src: "/healthylungs.avif", title: "🌿 Healthy Lungs – Breathe Freely" },
    { src: "/smokerlungs.jpg", title: "🚭 Smoker’s Lungs – Dangers of Addiction" },
    { src: "/mentalhealth.avif", title: "🧠 Mental Health Awareness" },
    { src: "/sunset.avif", title: "🌅 Hope & New Beginnings" },
    { src: "/meditation.avif", title: "🧘 Meditation for Inner Peace" },
  ];

  const [imageObj, setImageObj] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [isSolved, setIsSolved] = useState(false);

  // Initialize puzzle
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNewGame() {
    const chosen = images[Math.floor(Math.random() * images.length)];
    setImageObj(chosen);

    const arr = Array.from({ length: size * size }, (_, i) => i);
    const shuffled = shuffleArray(arr);
    setTiles(shuffled);
    setIsSolved(false);
  }

  // Shuffle helper
  function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Handle tile click (sliding puzzle logic)
  function handleClick(index) {
    const emptyIndex = tiles.indexOf(size * size - 1);
    const validMoves = [
      emptyIndex - size,
      emptyIndex + size,
      emptyIndex - 1,
      emptyIndex + 1,
    ];

    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [
        newTiles[index],
        newTiles[emptyIndex],
      ];
      setTiles(newTiles);
      checkSolved(newTiles);
    }
  }

  // ✅ Save progress when puzzle is solved
  const saveProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = stored._id || stored.id || 'unknown';
      const game = "ImagePuzzle";
      const points = 1; // award 1 point for solving

      await api.post('/progress/save', {
        userId,
        game,
        points,
      }, { headers: { Authorization: `Bearer ${token}` } });

      console.log("✅ Puzzle progress saved:", { userId, game, points });
    } catch (err) {
      console.error("❌ Error saving puzzle progress:", err.message);
    }
  };

  // Check if solved
  function checkSolved(arr) {
    if (arr.every((val, i) => val === i)) {
      setIsSolved(true);
    }
  }

  // ✅ Trigger save when puzzle is solved
  useEffect(() => {
    if (isSolved) {
      saveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSolved]);

  return (
    <>
      <style>{`
        .puzzle-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: radial-gradient(circle at center, #0f172a, #000000);
          padding: 20px;
          color: white;
        }

        .title {
          font-size: 36px;
          font-weight: 800;
          text-align: center;
          background: linear-gradient(to right, #3b82f6, #9333ea);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
          letter-spacing: 1px;
          animation: fadeIn 1s ease;
        }

        .subtitle {
          font-size: 20px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 30px;
          text-align: center;
          font-style: italic;
          opacity: 0.9;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Neon border wrapper */
        .neon-border {
          padding: 20px;
          border: 3px solid #9333ea;
          border-radius: 18px;
          box-shadow: 0 0 15px #9333ea, 0 0 30px #7e22ce, 0 0 45px #6d28d9;
          display: flex;
          flex-wrap: wrap;
          gap: 40px;
          align-items: flex-start;
          justify-content: center;
        }

        .puzzle-grid {
          display: grid;
          gap: 3px;
          background: #1e293b;
          padding: 8px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }

        .puzzle-tile {
          width: 150px;
          height: 150px;
          background-repeat: no-repeat;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .puzzle-tile:hover {
          transform: scale(1.08);
          box-shadow: 0 0 15px rgba(59,130,246,0.6);
        }

        .empty-tile {
          width: 150px;
          height: 150px;
          background-color: #475569;
          border-radius: 10px;
        }

        .reference-image {
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          max-width: 480px;
          width: 450px;
          height: 450px;
        }

        .reference-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 14px;
        }

        .success-msg {
          font-size: 20px;
          font-weight: 600;
          color: #22c55e;
          margin-top: 25px;
          text-align: center;
          text-shadow: 0 0 10px rgba(34,197,94,0.6);
        }

        .restart-btn {
          margin-top: 25px;
          background: linear-gradient(to right, #3b82f6, #9333ea);
          color: white;
          font-weight: 700;
          font-size: 16px;
          padding: 12px 28px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .restart-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        }
      `}</style>

      <div className="puzzle-container">
        {isSolved && <Confetti />}
        <h2 className="title">🧩 Recovery Puzzle</h2>
        {imageObj && <p className="subtitle">{imageObj.title}</p>}

        {/* Neon border wrapper */}
        <div className="neon-border">
          {/* Puzzle grid */}
          <div
            className="puzzle-grid"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {tiles.map((tile, index) => {
              if (tile === size * size - 1) {
                return <div key={index} className="empty-tile"></div>;
              }
              return (
                <div
                  key={index}
                  className="puzzle-tile"
                  onClick={() => handleClick(index)}
                  style={{
                    backgroundImage: `url(${imageObj?.src})`,
                    backgroundSize: `${size * 100}% ${size * 100}%`,
                    backgroundPosition: `${(tile % size) * (100 / (size - 1))}% ${
                      Math.floor(tile / size) * (100 / (size - 1))
                    }%`,
                  }}
                ></div>
              );
            })}
          </div>

          {/* Reference image */}
          {imageObj && (
            <div className="reference-image">
              <img src={imageObj.src} alt="Reference" />
            </div>
          )}
        </div>

        {isSolved && (
          <p className="success-msg">
            🎉 You solved the puzzle! Every piece of progress matters in recovery 💚
          </p>
        )}

        <button className="restart-btn" onClick={startNewGame}>
          🔄 Restart Puzzle
        </button>
      </div>
    </>
  );
}
