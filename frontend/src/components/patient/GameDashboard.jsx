import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTrophy,
  FaGamepad,
  FaSearch,
  FaArrowLeft,
} from "react-icons/fa";
import "./GameDashboard.css";
import { getCurrentUserId } from '../../services/chatService';

// Import game components
import BreathingGame from "./BreathingGame";
import NavigatorStyleGame from "./NavigatorStyleGame";
import MusicTherapy from "./MusicTherapy";
import ImagePuzzle from "./ImagePuzzle";
import GroundingExercise from "./GroundingExercise";
import MemoryGame from "./MemoryGame";
import RecoveryWheelGame from "./RecoveryWheelGame";
import MoodLoggingScreen from "./MoodLoggingScreen";
import SoundSootherSelection from "./SoundSootherSelection";
import Flashcards from "./Flashcards";
import TriviaGame from "./TriviaGame";
import MotivationBuilder from "./MotivationBuilder";
import MoodPop from "./MoodPop";
import Leaderboard from "./Leaderboard";

const games = [
  {
    id: "breathing",
    title: "Breathing Game",
    description: "Relax and calm your mind with guided breathing.",
    category: "Mindfulness",
    image: "/waves-min.jpg",
  },
  {
    id: "navigatorstylegame",
    title: "Navigators",
    description: "Calming game with recovery affirmations.",
    category: "Mindfulness",
    image: "/navigators-min.jpeg",
  },
  {
    id: "musictherapy",
    title: "Music Therapy",
    description: "Relax with a calming music session.",
    category: "Relaxation",
    image: "/rhythm-min.jpg",
  },
  {
    id: "soundsoother",
    title: "Sound Soother",
    description: "Relax with calming nature scenes.",
    category: "Cognitive",
    image: "/landscape-min.jpg",
  },
  {
    id: "imagepuzzle",
    title: "Image Puzzle",
    description: "Solve an inspiring image puzzle.",
    category: "Cognitive",
    image: "/puzzlee-min.jpeg",
  },
  {
    id: "groundingexercise",
    title: "Grounding Exercise",
    description: "Try the 5-4-3-2-1 grounding technique.",
    category: "Mindfulness",
    image: "/nature-min.jpg",
  },
  {
    id: "emotioncheckin",
    title: "Emotion Check-In",
    description: "Daily mood check-in with suggested self-care activities.",
    category: "Emotional Wellness",
    image: "/moodtracker-min.jpeg",
  },
  {
    id: "mindmatch",
    title: "Mind Match",
    description: "Match cards to improve memory and focus.",
    category: "Cognitive",
    image: "/memorypuzzle-min.jpg",
  },
  {
    id: "recoverywheelgame",
    title: "Recovery Wheel",
    description: "Spin the wheel for recovery prompts.",
    category: "Emotional Wellness",
    image: "/wheel-min.jpeg",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Learn and memorize recovery facts.",
    category: "Cognitive",
    image: "/memorypuzzle-min.jpg", // placeholder
  },
  {
    id: "triviagame",
    title: "Trivia",
    description: "Test your knowledge with recovery trivia.",
    category: "Cognitive",
    image: "/memorypuzzle-min.jpg", // placeholder
  },
  {
    id: "motivationbuilder",
    title: "Motivation Builder",
    description: "Build motivation with reflective prompts.",
    category: "Emotional Wellness",
    image: "/moodtracker-min.jpeg",
  },
  {
    id: "moodpop",
    title: "Mood Pop",
    description: "Pop balloons to improve focus.",
    category: "Cognitive",
    image: "/memorypuzzle-min.jpg",
  },
];

const categories = [
  {
    id: "Mindfulness",
    icon: "🧘",
    title: "Mindfulness",
    desc: "Games to help you relax, breathe, and stay grounded.",
  },
  {
    id: "Cognitive",
    icon: "🧠",
    title: "Cognitive",
    desc: "Challenge your memory, focus, and mental flexibility.",
  },
  {
    id: "Relaxation",
    icon: "🎶",
    title: "Relaxation",
    desc: "Unwind with music therapy and calming exercises.",
  },
  {
    id: "Emotional Wellness",
    icon: "🌳",
    title: "Emotional Wellness",
    desc: "Track your feelings and build emotional resilience.",
  },
];

function GameDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGame, setSelectedGame] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const categoriesRowRef = useRef(null);
  const gamesSectionRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ✅ Track drag to prevent accidental clicks
  const dragStartX = useRef(0);
  const dragMoved = useRef(false);

  useEffect(() => {
    const row = categoriesRowRef.current;
    if (!row) return;

    const update = () => {
      setCanScrollLeft(row.scrollLeft > 5);
      setCanScrollRight(
        row.scrollWidth > row.clientWidth &&
          row.scrollLeft + row.clientWidth < row.scrollWidth - 5
      );
    };

    update();
    row.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleCardClick = (gameId) => {
    setSelectedGame(gameId);
  };

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const suggestions = searchTerm
    ? games.filter((game) =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSuggestionClick = (gameId) => {
    setShowSuggestions(false);
    handleCardClick(gameId);
  };

  const renderGame = () => {
    const backToDashboard = () => setSelectedGame(null);

    switch (selectedGame) {
      case 'breathing':
        return <BreathingGame />;
      case 'navigatorstylegame':
        return <NavigatorStyleGame />;
      case 'musictherapy':
        return <MusicTherapy />;
      case 'soundsoother':
        return <SoundSootherSelection />;
      case 'imagepuzzle':
        return <ImagePuzzle />;
      case 'groundingexercise':
        return <GroundingExercise />;
      case 'emotioncheckin':
        return <MoodLoggingScreen onBack={backToDashboard} userId={getCurrentUserId()} />;
      case 'mindmatch':
        return <MemoryGame />;
      case 'recoverywheelgame':
        return <RecoveryWheelGame onSelectGame={setSelectedGame} />;
      case 'flashcards':
        return <Flashcards />;
      case 'triviagame':
        return <TriviaGame />;
      case 'motivationbuilder':
        return <MotivationBuilder />;
      case 'moodpop':
        return <MoodPop />;
      default:
        return null;
    }
  };

  const scrollAmount = () => {
    const el = categoriesRowRef.current;
    return el ? Math.round(el.clientWidth * 0.7) : 300;
  };
  const scrollLeft = () => {
    categoriesRowRef.current?.scrollBy({
      left: -scrollAmount(),
      behavior: "smooth",
    });
  };
  const scrollRight = () => {
    categoriesRowRef.current?.scrollBy({
      left: scrollAmount(),
      behavior: "smooth",
    });
  };

  const handleCategoryClick = (category) => {
    if (dragMoved.current) return; // ✅ Ignore clicks if user dragged
    setSelectedCategory(category);

    // ✅ Scroll directly to games section instead of top
    if (gamesSectionRef.current) {
      gamesSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="dashboard-layout">
      {selectedGame ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#fcfdfe',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button
            onClick={() => setSelectedGame(null)}
            className="back-button"
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              padding: '10px 15px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
          <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px 20px 20px',
            boxSizing: 'border-box'
          }}>
            {renderGame()}
          </div>
        </div>
      ) : showLeaderboard ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#fcfdfe',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button
            onClick={() => setShowLeaderboard(false)}
            className="back-button"
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              padding: '10px 15px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
          <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 20px 20px 20px',
            boxSizing: 'border-box',
            overflow: 'auto'
          }}>
            <Leaderboard />
          </div>
        </div>
      ) : (
        <>
          {/* Main */}
          <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="brand-logo">
            <img
              src="/logoo.png"
              alt="Recovery Road Logo"
              className="brand-image"
              loading="lazy"
            />
          </div>

          <div className="search-section center-search">
            <div className="search-box">
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => setShowSuggestions(true)}
              />
              <button className="search-btn">
                <FaSearch />
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((game) => (
                    <li
                      key={game.id}
                      onClick={() => handleSuggestionClick(game.id)}
                    >
                      {game.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ✅ Sidebar links moved into header */}
          <nav className="header-links">
            <ul>
              <li onClick={() => navigate("/")}>
                <FaHome /> Home
              </li>
              <li
                onClick={() => {
                  const gamesSection = document.getElementById("games-section");
                  if (gamesSection) {
                    gamesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <FaGamepad /> Games
              </li>
              <li onClick={() => setShowLeaderboard(true)}>
                <FaTrophy /> Leaderboard
              </li>
            </ul>
          </nav>
        </header>

        {/* Page Heading */}
        <div className="dashboard-heading">
          <h1 className="page-title"> Games Dashboard</h1>
          <p className="page-subtitle">
            These therapeutic games are designed to support individuals in{" "}
            <strong>drug addiction recovery and counseling</strong>, helping
            improve focus, emotional well-being, and mindfulness in a fun,
            engaging way.
          </p>
        </div>

        {/* Categories Section */}
        <section className="categories-section">
          <h2 className="page-title">Game Categories</h2>
          <p className="page-subtitle">
            Explore different types of recovery-focused games crafted to support
            your journey.
          </p>

          {canScrollLeft && (
            <button className="scroll-btn left" onClick={scrollLeft}>
              {"<"}
            </button>
          )}

          <div
            className="categories-row"
            ref={categoriesRowRef}
            onMouseDown={(e) => {
              dragStartX.current = e.clientX;
              dragMoved.current = false;
            }}
            onMouseMove={(e) => {
              if (Math.abs(e.clientX - dragStartX.current) > 5) {
                dragMoved.current = true;
              }
            }}
            onMouseUp={() => {
              setTimeout(() => {
                dragMoved.current = false;
              }, 50);
            }}
          >
            <div
              className={`category-card ${
                selectedCategory === "All" ? "active" : ""
              }`}
              onClick={() => handleCategoryClick("All")}
            >
              <span className="category-icon">📂</span>
              <h3>All</h3>
              <p>View all available recovery games.</p>
            </div>

            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-card ${
                  selectedCategory === cat.id ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button className="scroll-btn right" onClick={scrollRight}>
              {">"}
            </button>
          )}
        </section>

        {/* Games Grid */}
        <div id="games-section" ref={gamesSectionRef} className="game-grid">
          {filteredGames.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-image">
                <img src={game.image} alt={game.title} loading="lazy" />
              </div>
              <h2 className="game-title">{game.title}</h2>
              <p className="game-desc">{game.description}</p>

              {/* ✅ Play Now Button */}
              <button
                className="play-now-btn"
                onClick={() => handleCardClick(game.id)}
              >
                ▶ Play Now
              </button>
            </div>
          ))}
        </div>

        {/* Leaderboard Section */}
        <section className="dashboard-section">
          <h2 className="section-title">Leaderboard</h2>

          <div className="section-content">
            <div
              className="dashboard-leaderboard-card"
              onClick={() => setShowLeaderboard(true)}
            >
              <img
                src="/leaderboard.jpeg"
                alt="Leaderboard"
                className="dashboard-leaderboard-icon"
              />
              <h3 className="dashboard-leaderboard-heading">
                View Leaderboard
              </h3>
              <p className="dashboard-leaderboard-desc">
                Check out the top players and see who's leading across all
                recovery games.
              </p>
            </div>
          </div>
        </section>

        {/* About the Games Section */}
        <section className="about-games-section">
          <h2 className="page-title">About the Games</h2>
          <p className="page-subtitle">
            These therapeutic games are carefully designed to support
            individuals on their journey toward recovery from substance use.
            Each game incorporates evidence-based techniques that promote
            mindfulness, cognitive training, emotional awareness, and stress
            reduction.
          </p>
          <p className="page-subtitle">
            By engaging with these interactive exercises, users can improve
            focus, enhance emotional well-being, and develop healthy coping
            mechanisms in a supportive and engaging digital environment. The
            games are structured to encourage reflection, skill-building, and
            gradual progress toward personal recovery goals.
          </p>
        </section>
      </main>
    </>
  )}
    </div>
  );
}

export default GameDashboard;
