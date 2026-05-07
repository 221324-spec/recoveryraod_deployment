import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "../../config/env";

const tracks = [
  {
    id: 1,
    title: "Calm Waves",
    artist: "Nature Sounds",
    src: "/gentlewaves.mp3",
  },
  {
    id: 2,
    title: "Soft Piano",
    artist: "Relaxing Tunes",
    src: "/softpiano.mp3",
  },
  {
    id: 3,
    title: "Gentle Rain",
    artist: "Nature Sounds",
    src: "/gentlerain.mp3",
  },
];

// Floating music notes component
function FloatingNotes() {
  const notes = ["🎵", "🎶", "🎼", "♬", "♩", "♫"];
  const noteElements = Array.from({ length: 20 }).map((_, i) => {
    const delay = Math.random() * 20;
    const duration = 10 + Math.random() * 20;
    const style = {
      position: "fixed",
      fontSize: `${12 + Math.random() * 24}px`,
      color: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`,
      left: `${Math.random() * 100}vw`,
      bottom: "-5vh", // start slightly below viewport
      transform: `translateY(0)`,
      userSelect: "none",
      pointerEvents: "none",
      zIndex: -1,
      animation: `floatUp ${duration}s linear ${delay}s infinite`,
    };
    const note = notes[Math.floor(Math.random() * notes.length)];
    return (
      <div key={i} style={style} aria-hidden="true">
        {note}
      </div>
    );
  });

  return <>{noteElements}</>;
}

export default function MusicTherapyGame() {
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [mood, setMood] = useState("");
  const [journal, setJournal] = useState("");
  const [sessions, setSessions] = useState(
    () => JSON.parse(localStorage.getItem("sessions")) || 0
  );

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [animationId, setAnimationId] = useState(null);

  const drawVisualizer = useCallback((analyserNode, context) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const barWidth = WIDTH / bufferLength;

    const draw = () => {
      analyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        const x = i * barWidth;
        const y = HEIGHT - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, HEIGHT);
        gradient.addColorStop(0, "#6af");
        gradient.addColorStop(1, "#004");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * 0.7, barHeight);
      }

      const animId = requestAnimationFrame(draw);
      setAnimationId(animId);
    };

    draw();
  }, []);

  const startVisualizer = useCallback(() => {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const source = context.createMediaElementSource(audioRef.current);
      const analyserNode = context.createAnalyser();
      source.connect(analyserNode);
      analyserNode.connect(context.destination);
      analyserNode.fftSize = 64;
      setAudioContext(context);
      setAnalyser(analyserNode);
      drawVisualizer(analyserNode, context);
    } else {
      drawVisualizer(analyser, audioContext);
    }
  }, [audioContext, analyser, drawVisualizer]);

  const stopVisualizer = useCallback(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [animationId]);

  useEffect(() => {
    if (playing) {
      audioRef.current.play();
      startVisualizer();
    } else {
      audioRef.current.pause();
      stopVisualizer();
    }
  }, [playing, currentTrack, startVisualizer, stopVisualizer]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const handlePlayPause = () => {
    if (!playing) {
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
    }
    setPlaying(!playing);
  };

  const handleNext = () => {
    let idx = tracks.findIndex((t) => t.id === currentTrack.id);
    idx = (idx + 1) % tracks.length;
    setCurrentTrack(tracks[idx]);
    setPlaying(true);
  };

  const handlePrev = () => {
    let idx = tracks.findIndex((t) => t.id === currentTrack.id);
    idx = (idx - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[idx]);
    setPlaying(true);
  };

  const [message, setMessage] = useState("");

  // === Save progress setup (minimal & non-intrusive) ===
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

  const saveProgress = async (pts = 1) => {
    const userId = getUserId();
    const game = "MusicTherapy";
    const points = pts;

    if (!userId || typeof points !== "number") {
      console.warn("Skipping music progress save; missing userId or invalid points", { userId, points });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch(`/api/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, game, points }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded ${res.status}: ${text}`);
      }
      const data = await res.json();
      console.log("✅ Music progress saved:", data);
    } catch (err) {
      console.error("❌ Error saving music progress:", err);
    }
  };
  // =====================================================

  const handleMoodSubmit = (e) => {
    e.preventDefault();
    if (mood.trim()) {
      setMessage(`Thanks for sharing your mood: "${mood}"!`);
      setMood("");
      // increment sessions and persist
      setSessions((prev) => {
        const next = prev + 1;
        localStorage.setItem("sessions", JSON.stringify(next));
        return next;
      });
      setJournal("");
      setPlaying(false);

      // Save progress: award 1 point per completed session
      saveProgress(1);

      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <>
      <div style={styles.page}>
        <FloatingNotes />
        <div style={styles.container}>
          {/* rest of your UI here */}
        </div>
      </div>
      <FloatingNotes />
      <div style={styles.container}>
        <h1 style={styles.header}>🎵 Music Therapy for Recovery</h1>
        <div style={styles.player}>
          <audio ref={audioRef} src={currentTrack.src} onEnded={handleNext} />
          <div style={styles.trackInfo}>
            <h2 style={{ margin: 0 }}>{currentTrack.title}</h2>
            <p style={{ margin: 0, color: "#aaa" }}>{currentTrack.artist}</p>
          </div>

          {message && <div style={styles.messageBox}>{message}</div>}

          <canvas
            ref={canvasRef}
            width="300"
            height="100"
            style={{ borderRadius: 10, backgroundColor: "#1e1e1e", margin: "10px 0" }}
          ></canvas>

          <div style={styles.controls}>
            <button onClick={handlePrev} style={styles.btn}>
              ◀ Prev
            </button>
            <button onClick={handlePlayPause} style={styles.playBtn}>
              {playing ? "❚❚ Pause" : "▶ Play"}
            </button>
            <button onClick={handleNext} style={styles.btn}>
              Next ▶
            </button>
          </div>

          <div style={styles.volumeControl}>
            <label style={{ color: "#ccc" }}>
              Volume:{" "}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                disabled={muted}
              />
            </label>
            <button
              style={styles.btn}
              onClick={() => setMuted((prev) => !prev)}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        <div style={styles.moodSection}>
          <h3>How do you feel right now?</h3>
          <form onSubmit={handleMoodSubmit}>
            <input
              type="text"
              placeholder="Describe your mood or thoughts..."
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Optional: Write about your feelings, struggles, or progress..."
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              style={styles.textarea}
            />
            <button type="submit" style={styles.submitBtn}>
              Submit & End Session
            </button>
          </form>
          <p style={{ color: "#ccc", marginTop: 10 }}>
            Total Sessions Completed: <strong>{sessions}</strong>
          </p>
        </div>

        <footer style={styles.footer}>
          <p>Stay strong, keep healing. 🎗️</p>
        </footer>

        <style>
          {`
            @keyframes floatUp {
              0% {
                transform: translateY(0);
                opacity: 1;
              }
              100% {
                transform: translateY(-120vh);
                opacity: 0;
              }
            }
          `}
        </style>
      </div>
    </>
  );
}


const styles = {
  body: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #01050eff, #a13b51ff)", // Blue gradient
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "20px",
  },

  container: {
    position: "relative",
    maxWidth: 450,
    margin: "30px auto",
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#121212",
    color: "#eee",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxShadow: "0 0 20px rgba(0,0,0,0.6)",
    zIndex: 1,
  },
  messageBox: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "12px 20px",
    borderRadius: 10,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "600",
    boxShadow: "0 0 10px #4caf50",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: 15,
    position: "relative",
    zIndex: 1,
  },
  player: {
    backgroundColor: "#222",
    borderRadius: 15,
    padding: 15,
    boxShadow: "inset 0 0 10px #000",
    position: "relative",
    zIndex: 1,
  },
  trackInfo: {
    textAlign: "center",
    marginBottom: 10,
  },
  controls: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 5,
  },
  btn: {
    backgroundColor: "#333",
    border: "none",
    padding: "8px 15px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#eee",
    fontWeight: "600",
    userSelect: "none",
    transition: "background-color 0.3s",
  },
  playBtn: {
    backgroundColor: "#4caf50",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    cursor: "pointer",
    color: "#fff",
    fontWeight: "700",
    userSelect: "none",
    boxShadow: "0 0 10px #4caf50",
  },
  volumeControl: {
    marginTop: 15,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  moodSection: {
    marginTop: 25,
    backgroundColor: "#222",
    borderRadius: 15,
    padding: 15,
    position: "relative",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: 8,
    borderRadius: 8,
    border: "none",
    marginBottom: 10,
    fontSize: 16,
  },
  textarea: {
    width: "100%",
    padding: 8,
    borderRadius: 8,
    border: "none",
    resize: "vertical",
    minHeight: 60,
    fontSize: 14,
    color: "#222",
  },
  submitBtn: {
    width: "100%",
    padding: 12,
    backgroundColor: "#2196f3",
    color: "white",
    fontWeight: "700",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    marginTop: 10,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    color: "#555",
    fontSize: 14,
    position: "relative",
    zIndex: 1,
  },
};
