import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { apiFetch } from '../../config/env';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ── Bubble Icon SVGs ── */
const ChatIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ── Typing dots animation ── */
const TypingIndicator = () => (
  <div className="flex items-start gap-2 mb-3">
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 11, fontWeight: 700 }}>R</div>
    <div style={{ background: '#f3f4f6', borderRadius: '16px 16px 16px 4px', padding: '10px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 4 }}>Thinking</span>
        <span className="animate-bounce" style={{ width: 6, height: 6, background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animationDelay: '0ms' }} />
        <span className="animate-bounce" style={{ width: 6, height: 6, background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animationDelay: '150ms' }} />
        <span className="animate-bounce" style={{ width: 6, height: 6, background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

/* ── Single message bubble ── */
const MessageBubble = ({ message }) => {
  const isPatient = message.sender === 'patient';
  const time = new Date(message.timestamp || message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isPatient) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ maxWidth: '78%' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', padding: '10px 16px', borderRadius: '16px 16px 4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{message.text}</p>
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 4, marginRight: 4 }}>{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 11, fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>R</div>
      <div style={{ maxWidth: '78%' }}>
        <div style={{ background: '#f3f4f6', color: '#1f2937', padding: '10px 16px', borderRadius: '4px 16px 16px 16px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{message.text}</p>
        </div>
        <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, marginLeft: 4 }}>{time}</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   FloatingChat — Main export
   Renders via React Portal into document.body so it
   escapes any parent overflow:hidden, z-index stacking,
   or CSS containment.  Uses inline styles for the button
   so it never depends on Tailwind class compilation.
   ═══════════════════════════════════════════════════════ */
export default function FloatingChat({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  /* ── Focus input when opened ── */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  /* ── Load history when widget opens ── */
  useEffect(() => {
    if (!isOpen || historyLoaded) return;

    const loadHistory = async () => {
      try {
        const res = await apiFetch(`/api/chat/history`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load history');
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{ _id: 'welcome', sender: 'bot', text: "Hi — I'm your Recovery Support assistant. I'm here to listen and offer short, practical coping steps. If you are in immediate danger, please use the SOS button or contact local emergency services. How are you feeling right now?", timestamp: new Date().toISOString() }]);
        }
      } catch {
        setMessages([{ _id: 'welcome', sender: 'bot', text: "Hi — I'm your Recovery Support assistant. I'm here to listen and offer short, practical coping steps. If you are in immediate danger, please use the SOS button or contact local emergency services. How are you feeling right now?", timestamp: new Date().toISOString() }]);
      }
      setHistoryLoaded(true);
    };

    loadHistory();
  }, [isOpen, historyLoaded]);

  /* ── Send message ── */
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { _id: `u-${Date.now()}`, sender: 'patient', text: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setError('');
    setIsLoading(true);

    try {
      const res = await apiFetch(`/api/chat/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      if (data.botMessage) {
        setMessages(prev => [...prev, data.botMessage]);
      }
      // Show supervisor notification notice for HIGH risk alerts
      if (data.alert) {
        setMessages(prev => [...prev, {
          _id: `alert-notice-${Date.now()}`,
          sender: 'bot',
          text: '🛡️ Your supervisor and care team have been notified so they can reach out to support you. You are not alone.',
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /* ═══════════ Render via Portal ═══════════ */
  const chatWidget = (
    <div id="floating-chat-root">
      {/* ── Floating Bubble Button ── */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          zIndex: 99999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          background: isOpen
            ? '#374151'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)'; }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '172px',
            right: '24px',
            zIndex: 99998,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            height: '500px',
            maxHeight: 'calc(100vh - 200px)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            animation: 'fcSlideUp 0.25s ease-out',
          }}
        >
          {/* CSS animation injected inline */}
          <style>{`@keyframes fcSlideUp { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

          {/* Header */}
          <div style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8)', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18 }}>💬</span>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>Recovery Support</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#bfdbfe' }}>Online</span>
                  <span style={{ fontSize: 10, color: '#93c5fd', marginLeft: 4 }}>AI-powered</span>
                </div>
              </div>
            </div>
            <button
              onClick={onToggle}
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: '#fff', minHeight: 0 }}>
            {messages.map((m, i) => (
              <MessageBubble key={m._id || i} message={m} />
            ))}
            {isLoading && <TypingIndicator />}
            {error && (
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#f87171', background: '#fef2f2', padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>{error}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <div style={{ borderTop: '1px solid #f3f4f6', background: '#f9fafb', padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How can I support you today?"
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '8px 14px',
                  fontSize: 14,
                  background: '#fff',
                  outline: 'none',
                  minHeight: 38,
                  maxHeight: 96,
                  fontFamily: 'inherit',
                  opacity: isLoading ? 0.5 : 1,
                }}
                onFocus={e => { e.target.style.borderColor = '#60a5fa'; e.target.style.boxShadow = '0 0 0 2px rgba(96,165,250,0.3)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                onInput={e => {
                  e.target.style.height = '38px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
              />
              <button
                onClick={send}
                disabled={isLoading || !text.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: (isLoading || !text.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  background: (isLoading || !text.trim())
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'background 0.2s',
                }}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
              Shift+Enter for new line &bull; Confidential support — supervisors alerted only for safety concerns
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Portal: renders into document.body, escaping any parent overflow/z-index issues
  return ReactDOM.createPortal(chatWidget, document.body);
}
