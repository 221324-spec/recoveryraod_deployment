import React from 'react';
import { useVideoCall } from '../../context/VideoCallContext';

export default function VideoCallButton({ recipientUser, className = '', title = 'Video Call' }) {
  const { callState, startCall } = useVideoCall();

  const disabled = callState === 'calling' || callState === 'in-call' || callState === 'ringing';

  return (
    <button
      type="button"
      className={className}
      title={title}
      onClick={() => startCall(recipientUser)}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}
