import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../config/env';

export default function AIChatBot() {
  const [messages, setMessages] = useState([
    { id: 1, from: 'ai', text: 'Hello! I\'m your AI recovery assistant. How can I support you today?', ts: Date.now()-1000*60*10 },
    { id: 2, from: 'ai', text: 'I can help with coping strategies, relaxation techniques, or just listen if you need to talk.', ts: Date.now()-1000*60*5 },
  ]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const sendMessageToAI = async (userText) => {
    const token = localStorage.getItem('token');
    const response = await apiFetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        message: userText,
        history: messages.map(m => ({
          role: m.from === "patient" ? "user" : "assistant",
          content: m.text
        }))
      })
    });

    const data = await response.json();
    return data.reply;
  };

  const send = async () => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      from: "patient",
      text: text.trim(),
      ts: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setText("");
    setIsTyping(true);

    try {
      const aiReply = await sendMessageToAI(userMessage.text);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: "ai",
        text: aiReply,
        ts: Date.now()
      }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: "ai",
        text: "I'm having trouble responding right now, but I'm still here with you.",
        ts: Date.now()
      }]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.from === 'patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] ${
              m.from === 'patient' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {m.from === 'ai' && (
                <div className="flex items-center mb-1">
                  <span className="text-sm">🤖 AI Assistant</span>
                </div>
              )}
              <div className="text-sm break-words">{m.text}</div>
              <div className={`text-xs mt-1 ${
                m.from === 'patient' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {new Date(m.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm mr-2">🤖 AI Assistant</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="text-sm">Typing</div>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input 
            value={text} 
            onChange={e => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about recovery..." 
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" 
            disabled={isTyping}
          />
          <button 
            onClick={send} 
            disabled={isTyping || !text.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <span className="mr-1">🤖</span>
          AI Assistant • Available 24/7 • Your conversations are private
        </div>
      </div>
    </div>
  );
}