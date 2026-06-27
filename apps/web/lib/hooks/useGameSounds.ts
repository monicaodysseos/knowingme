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

// ============================================================================
//  MUSIC MANAGER
//  ---------------------------------------------------------------------------
//  Single owner of looping background music. Only ONE looping track plays at a
//  time. `playMusic(key)` is idempotent: asking for the track that is already
//  playing does nothing, so re-renders / repeated phase events can never start
//  a second copy of the same song (the "plays twice" echo bug).
//
//  Driven from one place — the TV screen's phase effect (app/tv/page.tsx).
//  Individual phase components must NOT start/stop music themselves.
// ============================================================================

export type MusicKey = 'lobby' | 'questions' | 'answer' | 'guess' | 'final';

const TRACK_SRC: Record<MusicKey, string> = {
  lobby: '/ksero-se.mp3',
  questions: '/questionssong.mp3',
  answer: '/answeringquestionssong.mp3',
  guess: '/guessingsong.mp3',
  final: '/finalsong.mp3',
};

const TRACK_VOLUME: Record<MusicKey, number> = {
  lobby: 0.6,
  questions: 0.6,
  answer: 0.6,
  guess: 0.55,
  final: 0.6,
};

const _elements: Partial<Record<MusicKey, HTMLAudioElement>> = {};
let _currentKey: MusicKey | null = null;

// A single resume-guard, attached only to the track that is currently meant to
// be playing. Re-resumes playback if something external (a TV remote spacebar /
// media key) pauses it. Because it is removed on every intentional stop and
// re-attached to the new element on every switch, it can never accumulate or
// fire for a stale track — which is what the old per-track guards did.
let _resumeGuard: (() => void) | null = null;
let _guardedEl: HTMLAudioElement | null = null;

function getEl(key: MusicKey): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  let el = _elements[key];
  if (!el) {
    el = new Audio(TRACK_SRC[key]);
    el.loop = true;
    el.volume = TRACK_VOLUME[key];
    el.preload = 'auto';
    _elements[key] = el;
  }
  return el;
}

function detachGuard(): void {
  if (_guardedEl && _resumeGuard) _guardedEl.removeEventListener('pause', _resumeGuard);
  _resumeGuard = null;
  _guardedEl = null;
}

function attachGuard(key: MusicKey, el: HTMLAudioElement): void {
  detachGuard();
  _resumeGuard = () => {
    // Only resume if this is still the intended track.
    if (_currentKey === key) el.play().catch(() => {});
  };
  _guardedEl = el;
  el.addEventListener('pause', _resumeGuard);
}

/** Start (or keep playing) the given looping background track. Idempotent. */
export function playMusic(key: MusicKey): void {
  const el = getEl(key);
  if (!el) return;

  // Already playing this exact track → leave it alone.
  if (_currentKey === key && !el.paused && !el.ended) return;

  // Switching tracks → stop whatever is currently playing first.
  if (_currentKey && _currentKey !== key) {
    const cur = _elements[_currentKey];
    if (cur) { cur.pause(); cur.currentTime = 0; }
  }

  _currentKey = key;
  attachGuard(key, el);
  el.currentTime = 0;
  el.play().catch(() => {});
}

/** Stop whatever looping background track is playing. */
export function stopMusic(): void {
  detachGuard();
  if (_currentKey) {
    const cur = _elements[_currentKey];
    if (cur) { cur.pause(); cur.currentTime = 0; }
    _currentKey = null;
  }
}

// ── Round-intro sting (short, non-looping; independent of background music) ──
let _roundStartEl: HTMLAudioElement | null = null;

function getRoundStart(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_roundStartEl) {
    _roundStartEl = new Audio('/RoundStartSounds.mp3');
    _roundStartEl.loop = false;
    _roundStartEl.volume = 0.7;
    _roundStartEl.preload = 'auto';
  }
  return _roundStartEl;
}

export function playRoundStartSting(): void {
  const el = getRoundStart();
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}

export function stopRoundStartSting(): void {
  const el = getRoundStart();
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}

/** Call once inside a user-gesture handler. Resumes the AudioContext, performs
 *  a silent play→pause to satisfy the browser autoplay policy for the rest of
 *  the session, and warms the track buffers so playback starts instantly. */
let _unlocked = false;
export function unlockAudio(): void {
  const ctx = getAudioCtx();
  if (ctx) ensureRunning(ctx);

  if (!_unlocked) {
    _unlocked = true;
    // Prime with the guess track (not the first track heard on the lobby
    // screen), muted, so the unlock is inaudible and never collides with the
    // first real track the phase effect plays.
    const primer = getEl('guess');
    if (primer) {
      const vol = primer.volume;
      primer.volume = 0;
      primer.play()
        .then(() => { primer.pause(); primer.currentTime = 0; primer.volume = vol; })
        .catch(() => { primer.volume = vol; });
    }
  }

  // Warm buffers for instant start later.
  (Object.keys(TRACK_SRC) as MusicKey[]).forEach((k) => getEl(k)?.load());
  getRoundStart()?.load();
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

  return { playBlink, playBeep, playDrumroll, playReveal, playAwardFanfare, playGameOver, playApplause };
}
