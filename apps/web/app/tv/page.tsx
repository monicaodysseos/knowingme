'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
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
// Heavy, later-game screens — code-split so they don't weigh down the initial
// lobby load. They're only needed once their phase arrives.
const TVRevealPhase = dynamic(() => import('../../components/tv/TVRevealPhase'), { ssr: false });
const TVScorePhase = dynamic(() => import('../../components/tv/TVScorePhase'), { ssr: false });
const TVFinalAwards = dynamic(() => import('../../components/tv/TVFinalAwards'), { ssr: false });
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

  // For each phase, show: round announcement (2.5s) → instruction slide (8s) → game UI
  const [introPhase, setIntroPhase] = useState<string | null>(null);
  const shownIntros = useRef(new Set<string>());

  const ROUND_MAP: Record<string, 1 | 2 | 3> = {
    QUESTION_SUBMISSION: 1,
    ANSWER_PHASE: 2,
    GUESS_PHASE: 3,
  };

  useEffect(() => {
    if (!state) return;
    const phase = state.phase;
    const round = ROUND_MAP[phase];
    if (!round || shownIntros.current.has(phase)) return;

    shownIntros.current.add(phase);
    setIntroPhase(`round-${round}`);

    const t1 = setTimeout(() => {
      setIntroPhase(phase);
      playRoundStartSting();
    }, 2500);

    const t2 = setTimeout(() => {
      setIntroPhase(null);
      stopRoundStartSting();
    }, 2500 + 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopRoundStartSting();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase]);

  // ── Single owner of looping background music ────────────────────────────
  // While an intro slide is showing we stay silent (the round sting covers it);
  // otherwise the current phase decides the track. `playMusic` is idempotent,
  // so frequent state updates within a phase never restart or double the song.
  const desiredMusic: MusicKey | null = introPhase
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

  const displayKey = introPhase ? `intro-${introPhase}` : state.phase;

  return (
    <FitScreen>
    <AnimatePresence mode="wait">
      <motion.div
        key={displayKey}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {/* Round announcements (2.5s) then instruction slides (8s) before each phase */}
        {introPhase === 'round-1' && <TVRoundAnnouncement round={1} />}
        {introPhase === 'round-2' && <TVRoundAnnouncement round={2} />}
        {introPhase === 'round-3' && <TVRoundAnnouncement round={3} />}
        {introPhase === 'QUESTION_SUBMISSION' && <TVIntroWrite state={state} />}
        {introPhase === 'ANSWER_PHASE' && <TVIntroAnswer state={state} />}
        {introPhase === 'GUESS_PHASE' && <TVIntroGuess state={state} />}

        {/* Normal game phases */}
        {!introPhase && state.phase === 'LOBBY' && (
          <TVLobby state={state} onStart={hostStart} />
        )}
        {!introPhase && state.phase === 'QUESTION_SUBMISSION' && (
          <TVQuestionSubmission state={state} />
        )}
        {!introPhase && state.phase === 'ANSWER_PHASE' && (
          <TVAnswerPhase state={state} />
        )}
        {!introPhase && state.phase === 'GUESS_PHASE' && (
          <TVGuessPhase state={state} />
        )}
        {!introPhase && state.phase === 'REVEAL_PHASE' && (
          <TVRevealPhase state={state} />
        )}
        {!introPhase && state.phase === 'SCORE_PHASE' && (
          <TVScorePhase state={state} />
        )}
        {!introPhase && (state.phase === 'FINAL_AWARDS' || state.phase === 'GAME_OVER') && (
          <TVFinalAwards state={state} onPlayAgain={playAgain} />
        )}
      </motion.div>
    </AnimatePresence>
    </FitScreen>
  );
}
