'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTVSocket } from '../../lib/hooks/useGameSocket';
import { disconnectSocket } from '../../lib/socket';
import { unlockTVAudio, playLobbyMusic } from '../../lib/hooks/useGameSounds';
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

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

function createRoom(): Promise<string> {
  return fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'social' }),
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRoomExpired = useCallback(() => {
    disconnectSocket();
    try { sessionStorage.removeItem('ksero-tv-room'); } catch {}
    setRoomCode(null);
    setLoading(true);
    createRoom()
      .then((code) => { setRoomCode(code); setLoading(false); })
      .catch(() => { setError('Server unreachable. Retrying…'); setLoading(false); });
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('ksero-tv-room');
    if (stored) {
      setRoomCode(stored);
      setLoading(false);
      return;
    }
    createRoom()
      .then((code) => { setRoomCode(code); setLoading(false); })
      .catch(() => { setError('Could not connect to server.'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-transparent"
          style={{ borderTopColor: '#FF4FB4' }}
        />
      </div>
    );
  }

  if (error || !roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-400 font-bold text-2xl mb-4">{error ?? 'Unknown error'}</p>
          <button
            onClick={() => { setError(null); setLoading(true); createRoom().then(c => { setRoomCode(c); setLoading(false); }).catch(() => setError('Still unreachable.')); }}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: '#FF4FB4' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <TVScreen roomCode={roomCode} onRoomExpired={handleRoomExpired} />;
}

const INTRO_PHASES = ['QUESTION_SUBMISSION', 'ANSWER_PHASE', 'GUESS_PHASE'] as const;

function TVScreen({ roomCode, onRoomExpired }: { roomCode: string; onRoomExpired: () => void }) {
  const { state, connected, hostStart, playAgain } = useTVSocket(roomCode, onRoomExpired);

  // Show round intro for 5 seconds when each phase first starts (once per phase per session)
  const [introPhase, setIntroPhase] = useState<string | null>(null);
  const shownIntros = useRef(new Set<string>());

  useEffect(() => {
    if (!state) return;
    const phase = state.phase;
    if ((INTRO_PHASES as readonly string[]).includes(phase) && !shownIntros.current.has(phase)) {
      shownIntros.current.add(phase);
      setIntroPhase(phase);
      const t = setTimeout(() => setIntroPhase(null), 5000);
      return () => clearTimeout(t);
    }
  }, [state?.phase]);

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

  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      const w = window as typeof window & { __audioCtx?: AudioContext };
      if (!w.__audioCtx) {
        w.__audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      w.__audioCtx.resume().catch(() => {});
      unlockTVAudio();
      playLobbyMusic();
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

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-transparent"
          style={{ borderTopColor: '#FF4FB4' }}
        />
        <p className="text-gray-400 font-bold">Connecting…</p>
      </div>
    );
  }

  const displayKey = introPhase ? `intro-${introPhase}` : state.phase;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayKey}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {/* Round intro screens — shown for 5 seconds before each phase */}
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
  );
}
