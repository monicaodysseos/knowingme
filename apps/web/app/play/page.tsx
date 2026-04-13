'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhoneSocket } from '../../lib/hooks/useGameSocket';

import PhoneJoin from '../../components/phone/PhoneJoin';
import PhoneWaiting from '../../components/phone/PhoneWaiting';
import PhoneQuestionSubmit from '../../components/phone/PhoneQuestionSubmit';
import PhoneAnswer from '../../components/phone/PhoneAnswer';
import PhoneGuess from '../../components/phone/PhoneGuess';
import PhoneMarkGuesses from '../../components/phone/PhoneMarkGuesses';
import PhoneResults from '../../components/phone/PhoneResults';
import PhoneLayout from '../../components/phone/PhoneLayout';

// ── Pre-join screen ───────────────────────────────────────────────────────────
// Shown before we have a name or session token. No socket is created here.

interface PreJoinProps {
  roomCode: string;
  onReady: (name: string, sessionToken: string | null) => void;
}

function PreJoin({ roomCode, onReady }: PreJoinProps) {
  const [error, setError] = useState<string | null>(null);

  // On mount, check localStorage for a stored session for this room.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ksero-session');
      const storedRoom = sessionStorage.getItem('ksero-room');
      if (stored && storedRoom === roomCode) {
        // Reconnect silently with the stored token.
        onReady('(reconnecting)', stored);
      }
    } catch {}
  }, [roomCode, onReady]);

  return (
    <PhoneJoin
      roomCode={roomCode}
      onJoin={(name) => onReady(name, null)}
      error={error}
    />
  );
}

// ── In-game phone UI ──────────────────────────────────────────────────────────
// Only rendered once we have a name (or session token). The socket is created
// here — not before — so there is never a spurious join with an empty name.

interface PhoneGameProps {
  roomCode: string;
  name: string;
  sessionToken: string | null;
}

function PhoneGame({ roomCode, name, sessionToken }: PhoneGameProps) {
  const {
    state,
    connected,
    joinError,
    playerId,
    submitQuestions,
    submitAnswer,
    submitGuess,
    markGuess,
    playAgain,
  } = usePhoneSocket({
    roomCode,
    name,
    sessionToken: sessionToken ?? undefined,
  });

  const accentColor = '#8B5CF6';

  // ── Connecting / join error ─────────────────────────────────────────────
  if (!connected || !state) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center">
          {joinError ? (
            <>
              <div className="text-5xl">😕</div>
              <p className="font-bold text-gray-800 text-xl">{joinError}</p>
              <button
                onClick={() => { window.location.reload(); }}
                className="px-8 py-4 rounded-2xl font-bold text-white text-lg shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-4 border-transparent"
                style={{ borderTopColor: '#F97316' }}
              />
              <p className="font-bold text-gray-600">Connecting to room {roomCode}…</p>
            </>
          )}
        </div>
      </PhoneLayout>
    );
  }

  const { action, timerEnd, phase } = state;

  return (
    <PhoneLayout accent={accentColor}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${action.type}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-1 flex flex-col"
        >
          {action.type === 'WAIT' && (
            <PhoneWaiting message={action.message} />
          )}

          {action.type === 'SUBMIT_QUESTIONS' && (
            <PhoneQuestionSubmit
              onSubmit={(qs) => submitQuestions(qs)}
            />
          )}

          {action.type === 'ANSWER_QUESTION' && (
            <PhoneAnswer
              assignmentId={action.assignmentId}
              questionText={action.questionText}
              slotIndex={action.slotIndex}
              totalSlots={action.totalSlots}
              canSkip={action.canSkip}
              timerEnd={timerEnd}
              onSubmit={(id, ans, skipped) => submitAnswer(id, ans, skipped)}
            />
          )}

          {action.type === 'SUBMIT_GUESS' && (
            <PhoneGuess
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              questionText={action.questionText}
              timerEnd={timerEnd}
              onSubmit={submitGuess}
            />
          )}

          {action.type === 'MARK_GUESSES' && (
            <PhoneMarkGuesses
              guesses={action.guesses}
              onMark={markGuess}
            />
          )}

          {action.type === 'VIEW_RESULTS' && (
            <PhoneResults
              scores={action.scores}
              awards={action.awards}
              onPlayAgain={playAgain}
              playerId={playerId ?? undefined}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </PhoneLayout>
  );
}

// ── Root page component ───────────────────────────────────────────────────────

function PhoneApp() {
  const searchParams = useSearchParams();
  const roomCode = (searchParams.get('room') ?? '').toUpperCase().slice(0, 4);

  // null  → not yet ready (show join screen)
  // {name, sessionToken} → ready to connect
  const [ready, setReady] = useState<{ name: string; sessionToken: string | null } | null>(null);

  const handleReady = useCallback(
    (name: string, sessionToken: string | null) => setReady({ name, sessionToken }),
    [],
  );

  if (!ready) {
    return <PreJoin roomCode={roomCode} onReady={handleReady} />;
  }

  return (
    <PhoneGame
      roomCode={roomCode}
      name={ready.name}
      sessionToken={ready.sessionToken}
    />
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-gray-400 font-bold">Loading…</div>
        </div>
      }
    >
      <PhoneApp />
    </Suspense>
  );
}
