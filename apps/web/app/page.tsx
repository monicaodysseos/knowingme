'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTVSocket } from '../lib/hooks/useGameSocket';
import TVLobby from '../components/tv/TVLobby';
import TVQuestionSubmission from '../components/tv/TVQuestionSubmission';
import TVAnswerPhase from '../components/tv/TVAnswerPhase';
import TVGuessPhase from '../components/tv/TVGuessPhase';
import TVRevealPhase from '../components/tv/TVRevealPhase';
import TVScorePhase from '../components/tv/TVScorePhase';
import TVFinalAwards from '../components/tv/TVFinalAwards';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

// ── Home page — TV screen ──────────────────────────────────────────────────
// The host opens this on a shared screen. A room is created on load.

export default function Home() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a room on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('ksero-tv-room');
    if (stored) {
      setRoomCode(stored);
      setLoading(false);
      return;
    }

    fetch(`${SERVER_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'social' }),
    })
      .then((r) => r.json())
      .then((data) => {
        const code: string = data.roomCode;
        sessionStorage.setItem('ksero-tv-room', code);
        setRoomCode(code);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to server. Is the server running?');
        setLoading(false);
      });
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
            onClick={() => { sessionStorage.clear(); window.location.reload(); }}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: '#F97316' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <TVScreen roomCode={roomCode} />;
}

function TVScreen({ roomCode }: { roomCode: string }) {
  const { state, connected, hostStart, playAgain } = useTVSocket(roomCode);

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
