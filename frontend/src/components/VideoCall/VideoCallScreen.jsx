import React, { useEffect, useRef } from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { useOutgoingCallRingtone } from '../../hooks/useCallRingtone';
import './VideoCall.css';

export default function VideoCallScreen() {
  const { callState, callPartner, localStream, remoteStream, endCall, error, permissionError } = useVideoCall();

  useOutgoingCallRingtone(callState === 'calling');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const visible = callState === 'calling' || callState === 'in-call' || !!error || !!permissionError;
  if (!visible) return null;

  return (
    <div className="vc-overlay" role="dialog" aria-modal="true">
      <div className="vc-header">
        <div className="vc-title">
          {callState === 'calling' ? 'Calling' : 'In call'}{callPartner?.name ? ` — ${callPartner.name}` : ''}
        </div>
        <button className="vc-btn vc-btn-danger" onClick={endCall}>
          End
        </button>
      </div>

      {(error || permissionError) && (
        <div className="vc-banner">
          {permissionError || error}
        </div>
      )}

      <div className="vc-body">
        <div className="vc-remote">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="vc-video" />
          ) : (
            <div className="vc-wait">
              Waiting for remote video…
            </div>
          )}
        </div>

        <div className="vc-local">
          {localStream ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="vc-video" />
          ) : (
            <div className="vc-wait">Starting camera…</div>
          )}
        </div>
      </div>
    </div>
  );
}
