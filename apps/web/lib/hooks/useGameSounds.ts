'use client';

import { useRef, useCallback } from 'react';

// Lazy singleton AudioContext — created on first user interaction
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & { __audioCtx?: AudioContext };
  if (!w.__audioCtx) {
    try {
      w.__audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return w.__audioCtx;
}

function ensureRunning(ctx: AudioContext): void {
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function useGameSounds() {
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Background music (looping audio file during GUESS_PHASE) ────────────
  const playTick = useCallback(() => {
    if (typeof window === 'undefined') return;
    // Stop any previous instance
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    const audio = new Audio('/thumb-tap-tango.wav');
    audio.loop = true;
    audio.volume = 0.55;
    bgAudioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  const stopTick = useCallback(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current = null;
    }
  }, []);

  // ── Drumroll (white noise, gated rapidly, building gain) ─────────────────
  const playDrumroll = useCallback((durationMs: number): (() => void) => {
    const ctx = getAudioCtx();
    if (!ctx) return () => {};
    ensureRunning(ctx);

    const sampleRate = ctx.sampleRate;
    const bufLen = sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufLen, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gateGain = ctx.createGain();
    const envGain = ctx.createGain();
    source.connect(gateGain);
    gateGain.connect(envGain);
    envGain.connect(ctx.destination);

    const now = ctx.currentTime;
    const dur = durationMs / 1000;

    // Gated noise — slot on/off times tighten as progress increases
    const step = 0.05;
    for (let t = 0; t < dur; t += step) {
      const progress = t / dur;
      const onFraction = 0.5 - progress * 0.2;
      gateGain.gain.setValueAtTime(1, now + t);
      gateGain.gain.setValueAtTime(0, now + t + step * Math.max(onFraction, 0.08));
    }

    // Envelope: ramp from quiet to loud
    envGain.gain.setValueAtTime(0.0, now);
    envGain.gain.linearRampToValueAtTime(0.18, now + dur);

    source.start(now);
    return () => { try { source.stop(); } catch {} };
  }, []);

  // ── Blink (single guess card appearing) ─────────────────────────────────
  const playBlink = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    ensureRunning(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.16);
  }, []);

  // ── Reveal arpeggio (C5 → E5 → G5 → C6, sine) ───────────────────────────
  const playReveal = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    ensureRunning(ctx);

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.28);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.32);
    });
  }, []);

  // ── Award fanfare (ascending arp then chord, ~1.2 s) ────────────────────
  const playAwardFanfare = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    ensureRunning(ctx);

    const now = ctx.currentTime;
    const arp = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5

    // Rising arpeggio
    arp.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.15, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.22);
    });

    // Final chord
    const chordT = now + 0.42;
    arp.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordT);
      gain.gain.setValueAtTime(0.12, chordT);
      gain.gain.exponentialRampToValueAtTime(0.001, chordT + 0.85);
      osc.start(chordT);
      osc.stop(chordT + 0.9);
    });
  }, []);

  // ── Game-over chord (C major simultaneous, 2 s fade) ────────────────────
  const playGameOver = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    ensureRunning(ctx);

    const now = ctx.currentTime;
    [261.63, 329.63, 392.0, 523.25].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.0, now + 2.0);
      osc.start(now);
      osc.stop(now + 2.1);
    });
  }, []);

  return { playTick, stopTick, playBlink, playDrumroll, playReveal, playAwardFanfare, playGameOver };
}
