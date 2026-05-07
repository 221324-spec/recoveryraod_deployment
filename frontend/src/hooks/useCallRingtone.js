import { useEffect, useRef } from 'react';

function closeAudio(state) {
  if (state.intervalId != null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  if (state.ctx && state.ctx.state !== 'closed') {
    try {
      state.ctx.close();
    } catch {
      // ignore
    }
    state.ctx = null;
  }
}

/**
 * Incoming (callee) ring: repeating double-beep — heard by supervisor or patient when someone calls them.
 */
export function useIncomingCallRingtone(active) {
  const stateRef = useRef({ ctx: null, intervalId: null });

  useEffect(() => {
    if (!active) {
      closeAudio(stateRef.current);
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const state = stateRef.current;
    if (!state.ctx) {
      try {
        state.ctx = new AudioCtx();
      } catch {
        return;
      }
    }

    const ctx = state.ctx;

    const playDoubleRing = () => {
      try {
        for (let pulse = 0; pulse < 2; pulse += 1) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 480;
          osc.connect(gain);
          gain.connect(ctx.destination);
          const t0 = ctx.currentTime + pulse * 0.24;
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
          osc.start(t0);
          osc.stop(t0 + 0.22);
        }
      } catch {
        // ignore
      }
    };

    const tick = async () => {
      try {
        if (ctx.state === 'suspended') await ctx.resume();
      } catch {
        // ignore — autoplay policies
      }
      playDoubleRing();
    };

    tick();
    state.intervalId = window.setInterval(tick, 1600);

    return () => closeAudio(state);
  }, [active]);
}

/**
 * Outgoing (caller) ringback: softer single pulse while waiting for the other party — supervisor or patient who placed the call.
 */
export function useOutgoingCallRingtone(active) {
  const stateRef = useRef({ ctx: null, intervalId: null });

  useEffect(() => {
    if (!active) {
      closeAudio(stateRef.current);
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const state = stateRef.current;
    if (!state.ctx) {
      try {
        state.ctx = new AudioCtx();
      } catch {
        return;
      }
    }

    const ctx = state.ctx;

    const playRingback = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 400;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.48);
      } catch {
        // ignore
      }
    };

    const tick = async () => {
      try {
        if (ctx.state === 'suspended') await ctx.resume();
      } catch {
        // ignore
      }
      playRingback();
    };

    tick();
    state.intervalId = window.setInterval(tick, 2000);

    return () => closeAudio(state);
  }, [active]);
}
