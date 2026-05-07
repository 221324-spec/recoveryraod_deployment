import React from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { useIncomingCallRingtone } from '../../hooks/useCallRingtone';
import './VideoCall.css';

export default function IncomingCallModal() {
  const { callState, incomingCall, acceptCall, rejectCall } = useVideoCall();

  const incomingRingActive = callState === 'ringing' && !!incomingCall;
  useIncomingCallRingtone(incomingRingActive);

  if (callState !== 'ringing' || !incomingCall) return null;

  const canAccept = !!incomingCall.signal;

  return (
    <div className="vc-modal-backdrop" role="dialog" aria-modal="true">
      <div className="vc-modal">
        <div className="vc-modal-title">Incoming video call</div>
        <div className="vc-modal-subtitle">
          {incomingCall.callerName || 'Unknown'} is calling you.
        </div>

        {!canAccept && (
          <div className="vc-modal-subtitle" style={{ marginTop: 8 }}>
            Preparing call…
          </div>
        )}

        <div className="vc-modal-actions">
          <button className="vc-btn vc-btn-secondary" onClick={rejectCall}>
            Reject
          </button>
          <button className="vc-btn vc-btn-primary" onClick={acceptCall} disabled={!canAccept} aria-disabled={!canAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
