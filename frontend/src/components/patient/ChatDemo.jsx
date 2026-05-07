import React, { useState, useRef, useEffect } from 'react';

export default function ChatDemo({ title = 'Chat with Supervisor' }) {
  const [messages, setMessages] = useState([
    { id: 1, from: 'supervisor', text: 'Hi, how are you feeling today?', ts: Date.now()-1000*60*60 },
    { id: 2, from: 'patient', text: 'Feeling okay, a bit anxious.', ts: Date.now()-1000*60*50 },
  ]);
  const [text, setText] = useState('');
  const bottomRef = useRef();

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const send = () => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), from: 'patient', text: text.trim(), ts: Date.now() }]);
    setText('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now()+1, from: 'supervisor', text: 'Thanks for sharing. I am here.', ts: Date.now() }]);
    }, 800);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-xs text-gray-500">Secure • Encrypted</div>
      </div>
      <div className="flex-1 overflow-auto mb-3 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.from==='patient' ? 'justify-end':'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[70%] ${m.from==='patient' ? 'bg-blue-50 text-blue-900':'bg-sky-50 text-sky-900'}`}>
              <div className="text-sm break-words">{m.text}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" className="flex-1 p-2 border rounded-lg" />
        <button onClick={send} className="px-4 py-2 bg-sky-500 text-white rounded-lg">Send</button>
      </div>
    </div>
  );
}
