import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ThoughtJournal.css";

const ThoughtJournal = () => {
  const navigate = useNavigate();

  // Load notes from localStorage, fallback to empty array
  const [notes, setNotes] = useState(() => {
    const stored = localStorage.getItem("thoughtNotes");
    return stored ? JSON.parse(stored) : [];
  });

  const today = new Date().toLocaleDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    // When component loads or selectedDate changes, show that note
    const note = notes.find((n) => n.date === selectedDate);
    setNoteContent(note ? note.content : "");
  }, [selectedDate, notes]);

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    const newNote = { date: selectedDate, content: noteContent };

    // Update note if it exists, otherwise add new
    const updatedNotes = [
      ...notes.filter((n) => n.date !== selectedDate),
      newNote
    ].sort((a, b) => new Date(b.date) - new Date(a.date)); // latest first

    setNotes(updatedNotes);
    localStorage.setItem("thoughtNotes", JSON.stringify(updatedNotes));
  };

  const handleNoteClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="journal-container">
      <aside className="journal-sidebar">
        <h3>🗓 Your Notes</h3>
        <ul>
          {notes
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((note) => (
              <li
                key={note.date}
                className={selectedDate === note.date ? "active" : ""}
                onClick={() => handleNoteClick(note.date)}
              >
                {note.date}
              </li>
            ))}
        </ul>
        <button onClick={() => navigate(-1)} className="back-btn">⬅ Back</button>
      </aside>

      <main className="journal-editor">
        <h2>📝 {selectedDate === today ? "Today’s Thoughts" : `Notes for ${selectedDate}`}</h2>
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Start typing your thoughts..."
        ></textarea>
        <br />
        <button onClick={handleSaveNote} className="save-btn">💾 Save Note</button>
      </main>
    </div>
  );
};

export default ThoughtJournal;
