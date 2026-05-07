import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Peer from 'simple-peer';
import socketService from '../services/socketService';
import { apiService } from '../services/chatService';
import { useAuth } from './AuthContext';

const VideoCallContext = createContext(null);

const ICE_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || value.userId || null;
}

export function VideoCallProvider({ children }) {
  const { user } = useAuth();

  const currentUserId = useMemo(() => {
    const fromContext = normalizeId(user?.id || user?._id || user?.userId);
    if (fromContext) return fromContext;
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return normalizeId(parsed.id || parsed._id || parsed.userId);
    } catch {
      return null;
    }
  }, [user]);

  const currentUserName = useMemo(() => user?.name || (() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return '';
      const parsed = JSON.parse(stored);
      return parsed.name || '';
    } catch {
      return '';
    }
  })(), [user]);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const hasSignaledRef = useRef(false);
  const hasRungRef = useRef(false);
  const isCallerRef = useRef(false);
  const callAcceptedRef = useRef(false);
  const callStartedAtRef = useRef(null);
  const callLogSentRef = useRef(false);

  const [socket, setSocket] = useState(null);

  const [callState, setCallState] = useState('idle');
  // idle | calling | ringing | in-call

  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const [callPartner, setCallPartner] = useState(null); // { _id, name, avatar? }
  const [incomingCall, setIncomingCall] = useState(null); // { from, callerName, callerAvatar, signal }

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [error, setError] = useState('');
  const [permissionError, setPermissionError] = useState('');

  const cleanupCall = useCallback((reason = 'cleanup', options = {}) => {
    try {
      const preserveErrors = !!options.preserveErrors;
      const preservePartner = !!options.preservePartner;
      const preserveState = !!options.preserveState;
      if (!preserveErrors) {
        setError('');
        setPermissionError('');
      }

      if (!preserveState) {
        setCallState('idle');
        setIncomingCall(null);
        if (!preservePartner) setCallPartner(null);
      }

      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {
          // ignore
        }
        peerRef.current = null;
      }

      hasSignaledRef.current = false;
      hasRungRef.current = false;
      isCallerRef.current = false;
      callAcceptedRef.current = false;
      callStartedAtRef.current = null;
      callLogSentRef.current = false;

      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        localStreamRef.current = null;
      }

      remoteStreamRef.current = null;

      setLocalStream(null);
      setRemoteStream(null);
    } catch (e) {
      console.warn('[VideoCall] cleanupCall error:', e);
    }
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const requestMedia = async (constraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    };

    const bindStream = (stream) => {
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    };

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionError('Your browser does not support camera/microphone access. Please use a modern browser (Chrome/Edge) and try again.');
        throw new Error('getUserMedia not supported');
      }

      // If the page is not a secure context (HTTPS or localhost), browsers will refuse
      // to prompt for camera/microphone and will throw immediately.
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        const origin = window.location?.origin || '';
        setPermissionError(
          `Camera/microphone access requires HTTPS or localhost. Open the app on http://localhost (not your IP/domain) or enable HTTPS. Current origin: ${origin}`
        );
        const err = new Error('Insecure context');
        err.name = 'SecurityError';
        throw err;
      }

      // Prefer audio+video
      const stream = await requestMedia({ video: true, audio: true });
      return bindStream(stream);
    } catch (e) {
      const name = e?.name || '';

      // If video can't start (device busy/unavailable), try audio-only so the call can proceed.
      if (name === 'NotReadableError') {
        try {
          const audioOnly = await requestMedia({ video: false, audio: true });
          setError('Camera could not start (in use/unavailable). Joining with audio only. Close other apps/tabs using the camera to enable video.');
          return bindStream(audioOnly);
        } catch {
          // fall through to message below
        }
      }

      if (name === 'NotAllowedError') {
        // Often means: user previously blocked permissions OR browser refused to prompt.
        // Try to detect a hard-deny via Permissions API for better guidance.
        let hint = '';
        try {
          if (navigator?.permissions?.query) {
            const [cam, mic] = await Promise.allSettled([
              navigator.permissions.query({ name: 'camera' }),
              navigator.permissions.query({ name: 'microphone' })
            ]);
            const camState = cam.status === 'fulfilled' ? cam.value?.state : null;
            const micState = mic.status === 'fulfilled' ? mic.value?.state : null;
            if (camState === 'denied' || micState === 'denied') {
              hint = ' Camera/mic are blocked for this site. Click the lock icon → Site settings → Allow, then reload.';
            }
          }
        } catch {
          // ignore
        }

        setPermissionError(`Permission denied. Please allow camera/microphone access in your browser.${hint}`);
      } else if (name === 'SecurityError') {
        const origin = typeof window !== 'undefined' ? (window.location?.origin || '') : '';
        setPermissionError(
          `Camera/microphone access requires HTTPS or localhost. Open the app on http://localhost or enable HTTPS. Current origin: ${origin}`
        );
      } else if (name === 'NotFoundError') {
        // If the device has no camera, try audio-only.
        try {
          const audioOnly = await requestMedia({ video: false, audio: true });
          setError('No camera found. Joining with audio only.');
          return bindStream(audioOnly);
        } catch {
          setPermissionError('No camera/microphone found. Please connect a device and retry.');
        }
      } else if (name === 'NotReadableError') {
        setPermissionError(
          'Could not start camera (device busy/unavailable). Close other apps/tabs using the camera (Zoom/Meet/Teams), then retry. If you are testing supervisor and patient on the same computer with one webcam, only one side can use that camera at a time — test on two devices or different cameras.'
        );
      } else {
        setPermissionError('Camera/microphone permission denied or unavailable');
      }
      throw e;
    }
  }, []);

  const createPeer = useCallback(({ initiator, stream, onSignal }) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
      config: ICE_CONFIG
    });

    peer.on('signal', (data) => onSignal?.(data));

    peer.on('stream', (stream) => {
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    });

    peer.on('error', (err) => {
      console.error('[VideoCall] peer error:', err);
      setError(err?.message || 'WebRTC error');
    });

    peer.on('close', () => {
      cleanupCall('peer-close');
    });

    // Debug hook (optional):
    // peer.on('connect', () => console.log('[VideoCall] Peer connected'));
    // if (peer._pc) peer._pc.oniceconnectionstatechange = () => console.log('[VideoCall] ICE:', peer._pc.iceConnectionState);

    return peer;
  }, [cleanupCall]);

  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '';
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    const paddedSecs = secs.toString().padStart(2, '0');
    return mins > 0 ? `${mins}:${paddedSecs}` : `0:${paddedSecs}`;
  };

  const logCallMessage = useCallback(async ({ status, durationSec }) => {
    try {
      if (!isCallerRef.current) return;
      if (callLogSentRef.current) return;
      if (!callPartner?._id || !currentUserId) return;

      callLogSentRef.current = true;

      const duration = formatDuration(durationSec);
      const parts = ['Video call', status];
      if (duration) parts.push(duration);
      const content = parts.join(' • ');

      await apiService.sendMessage(currentUserId, callPartner._id, content, 'call');
    } catch (e) {
      console.warn('[VideoCall] Failed to log call message:', e);
    }
  }, [callPartner?._id, currentUserId]);

  const startCall = useCallback(async (recipientUser) => {
    try {
      setError('');
      setPermissionError('');

      const toUserId = normalizeId(recipientUser?._id || recipientUser?.id || recipientUser?.userId);
      if (!socket) {
        setError('Socket not connected');
        return;
      }
      if (!currentUserId) {
        setError('Not logged in');
        return;
      }
      if (!toUserId) {
        setError('Missing recipient');
        return;
      }

      setCallPartner({
        _id: toUserId,
        name: recipientUser?.name || 'User',
        avatar: recipientUser?.avatar || recipientUser?.profilePicture || null
      });

      isCallerRef.current = true;
      callLogSentRef.current = false;

      setCallState('calling');

      // Ring first so the receiver gets an incoming-call UI immediately.
      try {
        socket.emit('call-ring', {
          userToCall: toUserId,
          from: currentUserId,
          callerName: currentUserName || 'Unknown',
          callerAvatar: null
        });
        hasRungRef.current = true;
      } catch {
        // ignore ring failures; offer will still attempt
      }

      const stream = await ensureLocalMedia();

      // Guard against unexpected stream shapes
      if (!stream || typeof stream.getTracks !== 'function') {
        throw new Error('Invalid media stream');
      }

      const peer = createPeer({
        initiator: true,
        stream,
        onSignal: (signalData) => {
          hasSignaledRef.current = true;
          socket.emit('call-user', {
            userToCall: toUserId,
            from: currentUserId,
            callerName: currentUserName || 'Unknown',
            callerAvatar: null,
            signalData
          });
        }
      });

      peerRef.current = peer;
    } catch (e) {
      console.error('[VideoCall] startCall error:', e);

      // If we already rang the other side but cannot proceed (permissions denied, etc), cancel the ring.
      try {
        const toUserId = normalizeId(recipientUser?._id || recipientUser?.id || recipientUser?.userId);
        if (socket && toUserId && hasRungRef.current && !hasSignaledRef.current) {
          socket.emit('end-call', { to: toUserId, reason: 'cancelled' });
        }
      } catch {
        // ignore
      }

      if (!permissionError) {
        setError('Failed to start call');
      }
      // Return to idle so user can retry; overlay stays visible because it renders on error.
      const shouldLog = callPartner?._id && isCallerRef.current;
      if (shouldLog) {
        await logCallMessage({ status: 'failed', durationSec: 0 });
      }
      cleanupCall('start-failed', { preserveErrors: true, preservePartner: true });
    }
  }, [cleanupCall, createPeer, currentUserId, currentUserName, ensureLocalMedia, logCallMessage, permissionError, socket]);

  const acceptCall = useCallback(async () => {
    try {
      setError('');
      setPermissionError('');

      if (!socket) {
        setError('Socket not connected');
        return;
      }

      if (!incomingCall?.from || !incomingCall?.signal) {
        setError('Invalid incoming call');
        cleanupCall('bad-incoming');
        return;
      }

      setCallPartner({
        _id: incomingCall.from,
        name: incomingCall.callerName || 'User',
        avatar: incomingCall.callerAvatar || null
      });

      isCallerRef.current = false;
      callLogSentRef.current = false;

      setCallState('in-call');

      callAcceptedRef.current = true;
      callStartedAtRef.current = Date.now();

      const stream = await ensureLocalMedia();

      const peer = createPeer({
        initiator: false,
        stream,
        onSignal: (signal) => {
          socket.emit('accept-call', { to: incomingCall.from, signal });
        }
      });

      peerRef.current = peer;
      peer.signal(incomingCall.signal);

      setIncomingCall(null);
    } catch (e) {
      console.error('[VideoCall] acceptCall error:', e);
      setError('Failed to accept call');
      cleanupCall('accept-failed');
    }
  }, [cleanupCall, createPeer, ensureLocalMedia, incomingCall, socket]);

  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall?.from) {
      setIncomingCall(null);
      setCallState('idle');
      return;
    }

    socket.emit('reject-call', { to: incomingCall.from });
    // If we're the caller, log; if we're callee, caller will log.
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall, socket]);

  const endCall = useCallback(() => {
    if (socket && callPartner?._id && (callState === 'in-call' || hasSignaledRef.current || hasRungRef.current)) {
      socket.emit('end-call', { to: callPartner._id, reason: 'ended' });
    }
    if (isCallerRef.current) {
      const durationSec = callStartedAtRef.current ? (Date.now() - callStartedAtRef.current) / 1000 : 0;
      const status = callAcceptedRef.current ? 'ended' : 'cancelled';
      logCallMessage({ status, durationSec });
    }
    cleanupCall('end');
  }, [callPartner?._id, callState, cleanupCall, logCallMessage, socket]);

  // Connect socket (reuse singleton) and register listeners once user is known
  useEffect(() => {
    if (!currentUserId) return;

    const sock = socketService.connect(currentUserId);
    sock.emit('join', { userId: currentUserId });
    setSocket(sock);

    const onIncoming = (data) => {
      // Ignore if already in a call (server should also block)
      const state = callStateRef.current;
      if (state === 'in-call' || state === 'calling' || state === 'ringing') return;

      const fromId = normalizeId(data?.from);
      setIncomingCall({
        from: fromId,
        callerName: data?.callerName,
        callerAvatar: data?.callerAvatar,
        signal: data?.signal || null
      });
      setCallState('ringing');
      isCallerRef.current = false;
      callLogSentRef.current = false;
    };

    // If a ring arrived first, a second incoming-call may arrive later with the offer.
    const onIncomingOfferUpdate = (data) => {
      if (!data?.signal) return;
      const fromId = normalizeId(data?.from);
      setIncomingCall((prev) => {
        if (!prev) return prev;
        if (String(normalizeId(prev.from) || '') !== String(fromId || '')) return prev;
        if (prev.signal) return prev;
        return { ...prev, signal: data.signal };
      });
    };

    const onIncomingCombined = (data) => {
      const state = callStateRef.current;
      if (state === 'ringing') {
        onIncomingOfferUpdate(data);
        return;
      }
      onIncoming(data);
    };

    const onAccepted = (data) => {
      try {
        if (!peerRef.current) return;
        setCallState('in-call');
        callAcceptedRef.current = true;
        callStartedAtRef.current = Date.now();
        peerRef.current.signal(data?.signal);
      } catch (e) {
        console.error('[VideoCall] call-accepted handling error:', e);
      }
    };

    const onRejected = (data) => {
      setError(data?.message || 'Call rejected');
      logCallMessage({ status: 'rejected', durationSec: 0 });
      cleanupCall('rejected');
    };

    const onEnded = (data) => {
      const durationSec = callStartedAtRef.current ? (Date.now() - callStartedAtRef.current) / 1000 : 0;
      const reason = data?.reason || 'ended';
      const status = callAcceptedRef.current ? 'ended' : (reason === 'cancelled' ? 'cancelled' : 'missed');
      logCallMessage({ status, durationSec });
      cleanupCall(data?.reason || 'ended');
    };

    const onFailed = (data) => {
      setError(data?.message || 'Call failed');
      logCallMessage({ status: data?.reason || 'failed', durationSec: 0 });
      cleanupCall(data?.reason || 'failed');
    };

    const onBusy = (data) => {
      setError(data?.message || 'User is busy');
      logCallMessage({ status: 'busy', durationSec: 0 });
      cleanupCall('busy');
    };

    sock.off('incoming-call');
    sock.off('call-accepted');
    sock.off('call-rejected');
    sock.off('call-ended');
    sock.off('call-failed');
    sock.off('user-busy');

    sock.on('incoming-call', onIncomingCombined);
    sock.on('call-accepted', onAccepted);
    sock.on('call-rejected', onRejected);
    sock.on('call-ended', onEnded);
    sock.on('call-failed', onFailed);
    sock.on('user-busy', onBusy);

    return () => {
      try {
        sock.off('incoming-call', onIncomingCombined);
        sock.off('call-accepted', onAccepted);
        sock.off('call-rejected', onRejected);
        sock.off('call-ended', onEnded);
        sock.off('call-failed', onFailed);
        sock.off('user-busy', onBusy);
      } catch {
        // ignore
      }
    };
  }, [cleanupCall, currentUserId]);

  const value = useMemo(() => ({
    callState,
    callPartner,
    incomingCall,
    localStream,
    remoteStream,
    error,
    permissionError,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  }), [acceptCall, callPartner, callState, endCall, error, incomingCall, localStream, permissionError, rejectCall, remoteStream, startCall]);

  return <VideoCallContext.Provider value={value}>{children}</VideoCallContext.Provider>;
}

export function useVideoCall() {
  const ctx = useContext(VideoCallContext);
  if (!ctx) throw new Error('useVideoCall must be used within a VideoCallProvider');
  return ctx;
}
