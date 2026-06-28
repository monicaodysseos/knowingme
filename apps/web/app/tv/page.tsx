'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTVSocket } from '../../lib/hooks/useGameSocket';
import { disconnectSocket } from '../../lib/socket';
import type { GameSettings } from '@ksero-se/types';
import { unlockAudio, playMusic, stopMusic, playRoundStartSting, stopRoundStartSting, type MusicKey } from '../../lib/hooks/useGameSounds';
import FitScreen from '../../components/tv/FitScreen';
import Loader from '../../components/Loader';
import TVGameSetup from '../../components/tv/TVGameSetup';
import TVLobby from '../../components/tv/TVLobby';
import TVQuestionSubmission from '../../components/tv/TVQuestionSubmission';
import TVAnswerPhase from '../../components/tv/TVAnswerPhase';
import TVGuessPhase from '../../components/tv/TVGuessPhase';
import TVRevealPhase from '../../components/tv/TVRevealPhase';
import TVScorePhase from '../../components/tv/TVScorePhase';
import TVFinalAwards from '../../components/tv/TVFinalAwards';
import TVIntroWrite from '../../components/tv/TVIntroWrite';
import TVIntroAnswer from '../../components/tv/TVIntroAnswer';
import TVIntroGuess from '../../components/tv/TVIntroGuess';
import TVRoundAnnouncement from '../../components/tv/TVRoundAnnouncement';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

// The single source of truth for which looping track plays in each phase.
// Phases not listed here are intentionally silent (REVEAL/SCORE), or manage
// their own music internally (FINAL_AWARDS/GAME_OVER → TVFinalAwards).
const MUSIC_BY_PHASE: Record<string, MusicKey> = {
  LOBBY: 'lobby',
  QUESTION_SUBMISSION: 'questions',
  ANSWER_PHASE: 'answer',
  GUESS_PHASE: 'guess',
};

function createRoom(settings: GameSettings): Promise<string> {
  return fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'social', settings }),
  })
    .then((r) => r.json())
    .then((data) => {
      const code: string = data.roomCode;
      try { sessionStorage.setItem('ksero-tv-room', code); } catch {}
      return code;
    });
}

export default function TVPage() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Show setup screen unless we're restoring an existing session
  const [setupDone, setSetupDone] = useState(false);
  // Becomes true after the first user gesture unlocks audio autoplay.
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const handleRoomExpired = useCallback(() => {
    disconnectSocket();
    try { sessionStorage.removeItem('ksero-tv-room'); } catch {}
    setRoomCode(null);
    setSetupDone(false);
  }, []);

  const handleConfirmSetup = useCallback((settings: GameSettings) => {
    setLoading(true);
    setError(null);
    createRoom(settings)
      .then((code) => { setRoomCode(code); setSetupDone(true); setLoading(false); })
      .catch(() => { setError('Could not connect to server.'); setLoading(false); });
  }, []);

  useEffect(() => {
    // If there's an existing session, skip setup and reconnect directly
    const stored = sessionStorage.getItem('ksero-tv-room');
    if (stored) {
      setRoomCode(stored);
      setSetupDone(true);
      return;
    }
  }, []);

  // Unlock audio on first interaction anywhere on the page (including the setup
  // screen). We only prime autoplay here — the actual track is chosen by the
  // single music effect in TVScreen, which waits for `audioUnlocked`.
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      unlockAudio();
      setAudioUnlocked(true);
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Show setup screen first (unless restoring session or loading/error)
  if (!setupDone && !roomCode && !loading && !error) {
    return <FitScreen><TVGameSetup onConfirm={handleConfirmSetup} /></FitScreen>;
  }

  if (loading) {
    return (
      <FitScreen>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
          <Loader dark label="creating your room…" />
        </div>
      </FitScreen>
    );
  }

  if (error || !roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-400 font-bold text-2xl mb-4">{error ?? 'Unknown error'}</p>
          <button
            onClick={() => { setError(null); setSetupDone(false); }}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: '#FF4FB4' }}
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return <TVScreen roomCode={roomCode} onRoomExpired={handleRoomExpired} audioUnlocked={audioUnlocked} />;
}


function TVScreen({ roomCode, onRoomExpired, audioUnlocked }: { roomCode: string; onRoomExpired: () => void; audioUnlocked: boolean }) {
  const { state, connected, hostStart, playAgain } = useTVSocket(roomCode, onRoomExpired);

  const ROUND_MAP: Record<string, 1 | 2 | 3> = {
    QUESTION_SUBMISSION: 1,
    ANSWER_PHASE: 2,
    GUESS_PHASE: 3,
  };
  const INTRO_TOTAL_MS = 60_000; // must match the server's INTRO_MS

  // The round instructions are synced by the server (state.introEndsAt). Tick
  // so the slide shows for the right duration and flips to the game when it
  // ends or the host skips. The first ~2.5s shows a punchy round announcement.
  const [nowMs, setNowMs] = useState(() => Date.now());
  const introEndsAt = state?.introEndsAt ?? 0;
  useEffect(() => {
    setNowMs(Date.now());
    if (introEndsAt <= Date.now()) return;
    const iv = setInterval(() => {
      const t = Date.now();
      setNowMs(t);
      if (introEndsAt <= t) clearInterval(iv);
    }, 300);
    return () => clearInterval(iv);
  }, [introEndsAt]);

  const introActive = introEndsAt > nowMs;
  const showAnnounce = introActive && introEndsAt - nowMs > INTRO_TOTAL_MS - 2500;

  // Play the round-start sting once when each phase's instructions begin.
  const stung = useRef(new Set<string>());
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'LOBBY') stung.current.clear();
    if (introActive && !stung.current.has(state.phase)) {
      stung.current.add(state.phase);
      playRoundStartSting();
    }
    if (!introActive) stopRoundStartSting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, introActive]);

  // ── Single owner of looping background music ────────────────────────────
  // While the instructions show we stay silent (the round sting covers it);
  // otherwise the current phase decides the track. `playMusic` is idempotent,
  // so frequent state updates within a phase never restart or double the song.
  const desiredMusic: MusicKey | null = introActive
    ? null
    : (state ? MUSIC_BY_PHASE[state.phase] ?? null : null);

  useEffect(() => {
    if (!audioUnlocked) return;
    if (desiredMusic) playMusic(desiredMusic);
    else stopMusic();
  }, [desiredMusic, audioUnlocked]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () => {
      (navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } })
        .wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
    };
    acquire();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') acquire(); });
    return () => { lock?.release().catch(() => {}); };
  }, []);

  if (!state) {
    return (
      <FitScreen>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader dark label="connecting…" />
        </div>
      </FitScreen>
    );
  }

  const introRound = ROUND_MAP[state.phase];
  const displayKey = introActive ? `intro-${showAnnounce ? 'a-' : ''}${state.phase}` : state.phase;
  const introSecondsLeft = Math.max(0, Math.ceil((introEndsAt - nowMs) / 1000));

  return (
    <FitScreen>
    <AnimatePresence mode="wait">
      <motion.div
        key={displayKey}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ position: 'relative' }}
      >
        {/* Round instructions (server-synced, 1 min, host-skippable): a brief
            announcement then the detailed slide. */}
        {introActive && showAnnounce && introRound && <TVRoundAnnouncement round={introRound} />}
        {introActive && !showAnnounce && state.phase === 'QUESTION_SUBMISSION' && <TVIntroWrite state={state} />}
        {introActive && !showAnnounce && state.phase === 'ANSWER_PHASE' && <TVIntroAnswer state={state} />}
        {introActive && !showAnnounce && state.phase === 'GUESS_PHASE' && <TVIntroGuess state={state} />}

        {introActive && !showAnnounce && (
          <div style={{ position: 'absolute', bottom: '3vh', left: 0, right: 0, textAlign: 'center', zIndex: 50, pointerEvents: 'none' }}>
            <span style={{
              fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700,
              fontSize: 'clamp(12px, 1.6vw, 20px)', color: '#0b0429',
              background: 'rgba(255,255,255,0.82)', padding: '7px 18px', borderRadius: 999,
              border: '2px solid #0b0429', boxShadow: '0 3px 0 rgba(11,4,41,0.35)',
            }}>
              starts in {introSecondsLeft}s · host can skip on their phone
            </span>
          </div>
        )}

        {/* Normal game phases */}
        {!introActive && state.phase === 'LOBBY' && (
          <TVLobby state={state} onStart={hostStart} />
        )}
        {!introActive && state.phase === 'QUESTION_SUBMISSION' && (
          <TVQuestionSubmission state={state} />
        )}
        {!introActive && state.phase === 'ANSWER_PHASE' && (
          <TVAnswerPhase state={state} />
        )}
        {!introActive && state.phase === 'GUESS_PHASE' && (
          <TVGuessPhase state={state} />
        )}
        {!introActive && state.phase === 'REVEAL_PHASE' && (
          <TVRevealPhase state={state} />
        )}
        {!introActive && state.phase === 'SCORE_PHASE' && (
          <TVScorePhase state={state} />
        )}
        {!introActive && (state.phase === 'FINAL_AWARDS' || state.phase === 'GAME_OVER') && (
          <TVFinalAwards state={state} onPlayAgain={playAgain} />
        )}
      </motion.div>
    </AnimatePresence>
    </FitScreen>
  );
}
