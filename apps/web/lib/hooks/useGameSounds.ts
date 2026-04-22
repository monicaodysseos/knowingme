'use client';

import { useCallback } from 'react';

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

// Module-level singleton for the TV guess-phase track.
// Created once, reused across renders. Must be pre-warmed by a user gesture
// (the TV's unlock button) before autoplay policy allows it to play.
let _tvTrack: HTMLAudioElement | null = null;

function getTVTrack(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_tvTrack) {
    _tvTrack = new Audio('/guessingsong.wav');
    _tvTrack.loop = true;
    _tvTrack.volume = 0.55;
  }
  return _tvTrack;
}

// Module-level singleton for the lobby track.
let _lobbyTrack: HTMLAudioElement | null = null;
let _lobbyPauseGuard: (() => void) | null = null;

function getLobbyTrack(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_lobbyTrack) {
    _lobbyTrack = new Audio('/ksero-se.wav');
    _lobbyTrack.loop = true;
    _lobbyTrack.volume = 0.6;
  }
  return _lobbyTrack;
}

// Module-level singleton for the final awards track.
let _finalTrack: HTMLAudioElement | null = null;
let _finalPauseGuard: (() => void) | null = null;

function getFinalTrack(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_finalTrack) {
    _finalTrack = new Audio('/finalsong.wav');
    _finalTrack.loop = true;
    _finalTrack.volume = 0.6;
  }
  return _finalTrack;
}

// Module-level singleton for the question submission track.
let _questionsTrack: HTMLAudioElement | null = null;
let _questionsPauseGuard: (() => void) | null = null;

function getQuestionsTrack(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_questionsTrack) {
    _questionsTrack = new Audio('/questionssong.wav');
    _questionsTrack.loop = true;
    _questionsTrack.volume = 0.6;
  }
  return _questionsTrack;
}

// Module-level singleton for the answer phase track.
let _answerPhaseTrack: HTMLAudioElement | null = null;
let _answerPauseGuard: (() => void) | null = null;

function getAnswerPhaseTrack(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_answerPhaseTrack) {
    _answerPhaseTrack = new Audio('/answeringquestionssong.wav');
    _answerPhaseTrack.loop = true;
    _answerPhaseTrack.volume = 0.6;
  }
  return _answerPhaseTrack;
}

export function playFinalMusic(): void {
  const audio = getFinalTrack();
  if (!audio) return;
  if (_finalPauseGuard) audio.removeEventListener('pause', _finalPauseGuard);
  _finalPauseGuard = () => { audio.play().catch(() => {}); };
  audio.addEventListener('pause', _finalPauseGuard);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopFinalMusic(): void {
  const audio = getFinalTrack();
  if (!audio) return;
  if (_finalPauseGuard) { audio.removeEventListener('pause', _finalPauseGuard); _finalPauseGuard = null; }
  audio.pause();
  audio.currentTime = 0;
}

/** Call this once inside a user-gesture handler so the browser allows
 *  HTMLAudio autoplay for the rest of the session. Only the TV track needs
 *  pre-warming here — all music tracks self-guard against pause races. */
export function unlockTVAudio(): void {
  const tv = getTVTrack();
  if (tv) tv.play().then(() => { tv.pause(); tv.currentTime = 0; }).catch(() => {});
}

export function playLobbyMusic(): void {
  const audio = getLobbyTrack();
  if (!audio) return;
  // Remove any existing guard before re-attaching
  if (_lobbyPauseGuard) audio.removeEventListener('pause', _lobbyPauseGuard);
  // Guard against accidental pauses from TV remote spacebar / media keys
  _lobbyPauseGuard = () => { audio.play().catch(() => {}); };
  audio.addEventListener('pause', _lobbyPauseGuard);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopLobbyMusic(): void {
  const audio = getLobbyTrack();
  if (!audio) return;
  // Remove guard first so our intentional pause isn't immediately reversed
  if (_lobbyPauseGuard) {
    audio.removeEventListener('pause', _lobbyPauseGuard);
    _lobbyPauseGuard = null;
  }
  audio.pause();
  audio.currentTime = 0;
}

export function playQuestionsMusic(): void {
  const audio = getQuestionsTrack();
  if (!audio) return;
  if (_questionsPauseGuard) audio.removeEventListener('pause', _questionsPauseGuard);
  _questionsPauseGuard = () => { audio.play().catch(() => {}); };
  audio.addEventListener('pause', _questionsPauseGuard);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopQuestionsMusic(): void {
  const audio = getQuestionsTrack();
  if (!audio) return;
  if (_questionsPauseGuard) { audio.removeEventListener('pause', _questionsPauseGuard); _questionsPauseGuard = null; }
  audio.pause();
  audio.currentTime = 0;
}

// Module-level singleton for the round intro track.
let _roundStartTrack: HTMLAudioElement | null = null;
let _roundStartPauseGuard: (() => void) | null = null;

function getRoundStartTrack(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_roundStartTrack) {
    _roundStartTrack = new Audio('/RoundStartSounds.wav');
    _roundStartTrack.loop = false;
    _roundStartTrack.volume = 0.7;
  }
  return _roundStartTrack;
}

export function playRoundStartMusic(): void {
  const audio = getRoundStartTrack();
  if (!audio) return;
  if (_roundStartPauseGuard) audio.removeEventListener('pause', _roundStartPauseGuard);
  _roundStartPauseGuard = () => { audio.play().catch(() => {}); };
  audio.addEventListener('pause', _roundStartPauseGuard);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopRoundStartMusic(): void {
  const audio = getRoundStartTrack();
  if (!audio) return;
  if (_roundStartPauseGuard) { audio.removeEventListener('pause', _roundStartPauseGuard); _roundStartPauseGuard = null; }
  audio.pause();
  audio.currentTime = 0;
}

export function playAnswerPhaseMusic(): void {
  const audio = getAnswerPhaseTrack();
  if (!audio) return;
  if (_answerPauseGuard) audio.removeEventListener('pause', _answerPauseGuard);
  _answerPauseGuard = () => { audio.play().catch(() => {}); };
  audio.addEventListener('pause', _answerPauseGuard);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopAnswerPhaseMusic(): void {
  const audio = getAnswerPhaseTrack();
  if (!audio) return;
  if (_answerPauseGuard) { audio.removeEventListener('pause', _answerPauseGuard); _answerPauseGuard = null; }
  audio.pause();
  audio.currentTime = 0;
}

export function useGameSounds() {
  // ── Countdown beep (last 5 seconds) ─────────────────────────────────────
  const playBeep = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    ensureRunning(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  }, []);
  // ── Background music (looping audio file during GUESS_PHASE) ────────────
  const playTick = useCallback(() => {
    const audio = getTVTrack();
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const stopTick = useCallback(() => {
    const audio = getTVTrack();
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
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

  // ── Crowd applause (rhythmic gated bandpass noise, ~3 s) ─────────────────
  const playApplause = useCallback((durationMs = 3000): (() => void) => {
    const ctx = getAudioCtx();
    if (!ctx) return () => {};
    ensureRunning(ctx);

    const now = ctx.currentTime;
    const dur = durationMs / 1000;
    const sampleRate = ctx.sampleRate;

    const bufLen = Math.ceil(sampleRate * (dur + 1));
    const buffer = ctx.createBuffer(1, bufLen, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass shapes the noise into crowd-clap texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(0.8, now);

    const masterGain = ctx.createGain();
    source.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Rhythmic clap bursts with overall swell-then-fade envelope
    const clapInterval = 0.13;
    let t = 0;
    while (t < dur) {
      const progress = t / dur;
      const vol = progress < 0.25
        ? 0.28 * (progress / 0.25)           // ramp up
        : 0.28 * Math.max(0, 1 - (progress - 0.25) / 0.75); // decay
      masterGain.gain.setValueAtTime(0, now + t);
      masterGain.gain.linearRampToValueAtTime(vol, now + t + 0.03);
      masterGain.gain.setValueAtTime(0, now + t + clapInterval * 0.55);
      t += clapInterval;
    }

    source.start(now);
    source.stop(now + dur);
    return () => { try { source.stop(); } catch {} };
  }, []);

  return { playTick, stopTick, playBlink, playBeep, playDrumroll, playReveal, playAwardFanfare, playGameOver, playApplause };
}
