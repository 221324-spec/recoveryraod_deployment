import React, { useState, useRef } from 'react';
import { apiFetch } from '../../config/env';

export default function CrisisButton({ isOpen, onToggle, userId }) {
  const [position, setPosition] = useState({ x: window.innerWidth - 180, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleSOS = async () => {
    if (sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/patients/${userId}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'Patient pressed the SOS button. Immediate help needed.' })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'SOS failed');
      }

      showToast('SOS sent successfully. Your supervisor and support team have been notified. Crisis Hotline: 988. You are not alone.', 'success');
      onToggle();
    } catch (error) {
      console.error('SOS error:', error);
      showToast('Failed to send SOS: ' + error.message + '. Please call 988 directly.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-8 py-4 rounded-xl shadow-2xl text-white font-semibold max-w-lg text-center transition-all duration-300 ${
          toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
        className="fixed z-50"
      >
        <button
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            if (!isDragging) onToggle();
          }}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full font-bold shadow-lg transition-colors flex items-center justify-center text-xs"
          title="SOS - Drag to move"
        >
          <span className="pointer-events-none">{isOpen ? '\u00d7' : 'SOS'}</span>
        </button>

        {isOpen && (
          <div
            style={{
              left: `${Math.max(0, position.x - 200)}px`,
              top: `${Math.max(20, position.y - 200)}px`
            }}
            className="bg-white p-5 rounded-xl shadow-2xl border-2 border-red-500 max-w-xs fixed"
          >
            <h3 className="text-lg font-bold text-red-600 mb-3">&#x26A0;&#xFE0F; Crisis Support</h3>
            <p className="text-sm mb-3 text-gray-700">
              Do you need immediate help? This will alert your supervisor and support team instantly.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              If you are in immediate danger, call <strong>988</strong> (Suicide & Crisis Lifeline).
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleSOS}
                disabled={sending}
                className={`px-6 py-3 rounded-lg font-bold text-sm text-white transition-colors ${
                  sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {sending ? 'Sending...' : 'Get Help Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
