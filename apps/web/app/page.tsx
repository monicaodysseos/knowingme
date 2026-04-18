'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTVSocket } from '../lib/hooks/useGameSocket';
import { disconnectSocket } from '../lib/socket';
import { Y2K } from '../lib/y2k';
import TVLobby from '../components/tv/TVLobby';
import TVQuestionSubmission from '../components/tv/TVQuestionSubmission';
import TVAnswerPhase from '../components/tv/TVAnswerPhase';
import TVGuessPhase from '../components/tv/TVGuessPhase';
import TVRevealPhase from '../components/tv/TVRevealPhase';
import TVScorePhase from '../components/tv/TVScorePhase';
import TVFinalAwards from '../components/tv/TVFinalAwards';

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

export default function Home() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Called when socket reconnects and finds the room gone (server restarted).
  // Creates a new room in-place — no page reload, no disruption.
  const handleRoomExpired = useCallback(() => {
    disconnectSocket(); // close the old socket so we get a fresh connection
    try { sessionStorage.removeItem('ksero-tv-room'); } catch {}
    setRoomCode(null);
    setLoading(true);
    createRoom()
      .then((code) => { setRoomCode(code); setLoading(false); })
      .catch(() => { setError('Server unreachable. Retrying…'); setLoading(false); });
  }, []);

  // Initial room setup — reuse sessionStorage code if valid,
  // otherwise create a fresh room via the API.
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
          style={{ borderTopColor: '#F97316' }}
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
            style={{ background: '#F97316' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <TVScreen roomCode={roomCode} onRoomExpired={handleRoomExpired} />;
}

function AudioUnlockButton() {
  const [unlocked, setUnlocked] = useState(false);

  const unlock = () => {
    const w = window as typeof window & { __audioCtx?: AudioContext };
    if (!w.__audioCtx) {
      w.__audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    w.__audioCtx.resume().then(() => setUnlocked(true)).catch(() => {});
    setUnlocked(true);
  };

  if (unlocked) return null;

  return (
    <button
      onClick={unlock}
      title="Click to enable sound"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)',
        border: `2px solid rgba(255,255,255,0.3)`,
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        transition: 'all 0.2s',
        color: '#fff',
        fontFamily: Y2K.body,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
    >
      🔇
    </button>
  );
}

function TVScreen({ roomCode, onRoomExpired }: { roomCode: string; onRoomExpired: () => void }) {
  const { state, connected, hostStart, playAgain } = useTVSocket(roomCode, onRoomExpired);

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-transparent"
          style={{ borderTopColor: '#F97316' }}
        />
        <p className="text-gray-400 font-bold">Connecting…</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.phase}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {state.phase === 'LOBBY' && (
          <TVLobby state={state} onStart={hostStart} />
        )}
        {state.phase === 'QUESTION_SUBMISSION' && (
          <TVQuestionSubmission state={state} />
        )}
        {state.phase === 'ANSWER_PHASE' && (
          <TVAnswerPhase state={state} />
        )}
        {state.phase === 'GUESS_PHASE' && (
          <TVGuessPhase state={state} />
        )}
        {state.phase === 'REVEAL_PHASE' && (
          <TVRevealPhase state={state} />
        )}
        {state.phase === 'SCORE_PHASE' && (
          <TVScorePhase state={state} />
        )}
        {(state.phase === 'FINAL_AWARDS' || state.phase === 'GAME_OVER') && (
          <TVFinalAwards state={state} onPlayAgain={playAgain} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
