// components/MemoryGame.js
import React, { useState, useEffect, useCallback } from 'react';
import './MemoryGame.css';
import Card from './Card';
import api from '../../api';

const emojiSet = ['🍎', '🐶', '🚗', '🌙', '🎈', '🎮', '🍕', '🐱', '⚽', '🌸', '🍩', '🎵'];

const idealTimes = {
  6: 20,   // Easy
  16: 90,  // Medium
  24: 180  // Hard
};

const generateCards = (count) => {
  const selected = emojiSet.slice(0, count);
  const cards = [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));
  return cards;
};

const MemoryGame = () => {
  const [gridSize, setGridSize] = useState(6);
  const [cards, setCards] = useState(generateCards(gridSize / 2));
  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const idealTime = idealTimes[gridSize];

  // Timer
  useEffect(() => {
    let timer;
    if (isRunning && !gameWon) {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, gameWon]);

  // Check for win
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      setGameWon(true);
      setIsRunning(false);
      setPointsEarned(gridSize); // Each level gives points equal to number of cards
    }
  }, [cards, gridSize]);

  // ✅ Save progress to MongoDB when game is won
  useEffect(() => {
    if (gameWon && pointsEarned > 0) {
      const saveScore = async () => {
        try {
          const token = localStorage.getItem('token');
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = stored._id || stored.id || 'unknown';
          await api.post('/progress/save', {
            userId,
            game: "MemoryGame",
            points: pointsEarned
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          console.error("Error saving MemoryGame score:", err);
        }
      };
      saveScore();
    }
  }, [gameWon, pointsEarned]);

  const checkMatch = useCallback((flipped, currentCards) => {
    const [first, second] = flipped;
    const newCards = [...currentCards];

    if (first.emoji === second.emoji) {
      newCards[first.id].isMatched = true;
      newCards[second.id].isMatched = true;
    } else {
      newCards[first.id].isFlipped = false;
      newCards[second.id].isFlipped = false;
    }

    setCards(newCards);
    setFlippedCards([]);
    setMoves(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setTimeout(() => {
        checkMatch(flippedCards, cards);
      }, 800);
    }
  }, [flippedCards, checkMatch, cards]);

  const handleFlip = (index) => {
    if (cards[index].isFlipped || flippedCards.length === 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedCards(prev => [...prev, newCards[index]]);
  };

  const handleRestart = () => {
    setCards(generateCards(gridSize / 2));
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    setIsRunning(true);
    setGameWon(false);
    setPointsEarned(0);
  };

  const handleLevelChange = (e) => {
    const size = parseInt(e.target.value);
    setGridSize(size);
    setCards(generateCards(size / 2));
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    setIsRunning(true);
    setGameWon(false);
    setPointsEarned(0);
  };

  return (
    <div className="memory-container">
      <h2>🧠 Mind Match</h2>

      <div className="control-panel">
        <label htmlFor="level">Level:</label>
        <select id="level" onChange={handleLevelChange} value={gridSize}>
          <option value={6}>Easy (3x2)</option>
          <option value={16}>Medium (4x4)</option>
          <option value={24}>Hard (6x4)</option>
        </select>
        <button onClick={handleRestart}>Restart</button>
      </div>

      <div className="game-stats">
        <div>🕒 Time: {time}s</div>
        <div>🎯 Target: {idealTime}s</div>
        <div>🎮 Moves: {moves}</div>
      </div>

      {gameWon && (
        <div className="win-screen">
          🎉 You Win!<br />
          Moves: {moves} | Time: {time}s <br />
          {time <= idealTime
            ? '✅ Great job! You beat the ideal time!'
            : `⏱ Try to beat the ${idealTime}s goal next time.`}
          <div className="earned-points">🏅 Points Earned: {pointsEarned}</div>
        </div>
      )}

      <div
        className="card-grid"
        style={{ gridTemplateColumns: `repeat(${Math.sqrt(gridSize)}, 1fr)` }}
      >
        {cards.map((card, index) => (
          <Card
            key={card.id}
            emoji={card.emoji}
            isFlipped={card.isFlipped || card.isMatched}
            onClick={() => handleFlip(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;
