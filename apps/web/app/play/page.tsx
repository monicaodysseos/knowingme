'use client';

import { useState, useEffect, Suspense } from 'react';
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

function PhoneApp() {
  const searchParams = useSearchParams();
  const roomCode = (searchParams.get('room') ?? '').toUpperCase().slice(0, 4);

  const [joinName, setJoinName] = useState<string | null>(null);
  // Read localStorage only after mount to avoid server/client hydration mismatch
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ksero-session');
      const storedRoom = localStorage.getItem('ksero-room');
      if (stored && storedRoom === roomCode) setSessionToken(stored);
    } catch {}
  }, [roomCode]);

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
    name: joinName ?? '',
    sessionToken: sessionToken ?? undefined,
  });

  // Auto-join with session token if available
  useEffect(() => {
    if (sessionToken && !joinName) {
      setJoinName('(reconnecting)');
    }
  }, [sessionToken, joinName]);

  const accentColor = state && 'playerId' in state
    ? '#8B5CF6'
    : '#8B5CF6';

  // ── Join screen ─────────────────────────────────────────────────────────
  if (!joinName && !sessionToken) {
    return (
      <PhoneJoin
        roomCode={roomCode}
        onJoin={(name) => setJoinName(name)}
        error={joinError}
      />
    );
  }

  // ── Connecting ────────────────────────────────────────────────────────────
  if (!connected || !state) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-transparent"
            style={{ borderTopColor: '#8B5CF6' }}
          />
          <p className="text-gray-400 font-bold">Connecting to room {roomCode}…</p>
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
          {/* ── Wait ──────────────────────────────────────────────────────── */}
          {action.type === 'WAIT' && (
            <PhoneWaiting message={action.message} />
          )}

          {/* ── Submit Questions ──────────────────────────────────────────── */}
          {action.type === 'SUBMIT_QUESTIONS' && (
            <PhoneQuestionSubmit
              onSubmit={(qs) => submitQuestions(qs)}
            />
          )}

          {/* ── Answer Question ───────────────────────────────────────────── */}
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

          {/* ── Submit Guess ──────────────────────────────────────────────── */}
          {action.type === 'SUBMIT_GUESS' && (
            <PhoneGuess
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              questionText={action.questionText}
              timerEnd={timerEnd}
              onSubmit={submitGuess}
            />
          )}

          {/* ── Mark Guesses ─────────────────────────────────────────────── */}
          {action.type === 'MARK_GUESSES' && (
            <PhoneMarkGuesses
              guesses={action.guesses}
              onMark={markGuess}
            />
          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
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
