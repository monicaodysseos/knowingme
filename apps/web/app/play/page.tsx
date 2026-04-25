'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhoneSocket } from '../../lib/hooks/useGameSocket';
import type { PlayerCharacter } from '@ksero-se/types';

import PhoneJoin from '../../components/phone/PhoneJoin';
import PhoneWaiting from '../../components/phone/PhoneWaiting';
import PhoneQuestionSubmit from '../../components/phone/PhoneQuestionSubmit';
import PhoneAnswer from '../../components/phone/PhoneAnswer';
import PhoneGuess from '../../components/phone/PhoneGuess';
import PhoneVoteGuesses from '../../components/phone/PhoneVoteGuesses';
import PhoneResults from '../../components/phone/PhoneResults';
import PhoneLayout from '../../components/phone/PhoneLayout';

// ── Pre-join screen ───────────────────────────────────────────────────────────

interface PreJoinProps {
  roomCode: string;
  onReady: (name: string, avatar: PlayerCharacter, sessionToken: string | null) => void;
}

function PreJoin({ roomCode, onReady }: PreJoinProps) {
  const [error] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`ksero-${roomCode}-session`);
      if (stored) {
        onReady('(reconnecting)', 'blob', stored);
      }
    } catch {}
  }, [roomCode, onReady]);

  return (
    <PhoneJoin
      roomCode={roomCode}
      onJoin={(name, avatar) => onReady(name, avatar, null)}
      error={error}
    />
  );
}

// ── In-game phone UI ──────────────────────────────────────────────────────────

interface PhoneGameProps {
  roomCode: string;
  name: string;
  avatar: PlayerCharacter;
  sessionToken: string | null;
}

function PhoneGame({ roomCode, name, avatar, sessionToken }: PhoneGameProps) {
  const {
    state,
    connected,
    joinError,
    playerId,
    submitQuestions,
    submitAnswer,
    submitGuess,
    submitVote,
    playAgain,
  } = usePhoneSocket({
    roomCode,
    name,
    avatar,
    sessionToken: sessionToken ?? undefined,
  });

  const accentColor = '#F97316';

  // During TV intro screens (round announcement 2.5s + instruction slide 8s = 10.5s),
  // show "Look at the TV" instead of the real action so phones are idle while TV plays intros.
  // Uses a Set (like the TV) so each phase only triggers the intro ONCE, even if the server
  // re-enters the same phase string on subsequent turns (e.g. GUESS_PHASE → SCORE_PHASE → GUESS_PHASE).
  const INTRO_PHASES = new Set(['QUESTION_SUBMISSION', 'ANSWER_PHASE', 'GUESS_PHASE']);
  const INTRO_DURATION_MS = 2500 + 8000;
  const [showingIntro, setShowingIntro] = useState(false);
  const shownIntros = useRef(new Set<string>());

  useEffect(() => {
    if (!state) return;
    const phase = state.phase;
    if (INTRO_PHASES.has(phase) && !shownIntros.current.has(phase)) {
      shownIntros.current.add(phase);
      setShowingIntro(true);
      const t = setTimeout(() => setShowingIntro(false), INTRO_DURATION_MS);
      return () => clearTimeout(t);
    }
    // Entering any other phase (or a re-entered intro phase) always clears the intro flag,
    // so a cancelled timer never leaves showingIntro stuck at true.
    setShowingIntro(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase]);

  if (!connected || !state) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center">
          {joinError ? (
            <>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-2xl"
                style={{ background: '#EF4444' }}
              >
                !
              </div>
              <p className="font-bold text-gray-800 text-xl">{joinError}</p>
              <button
                onClick={() => { window.location.reload(); }}
                className="px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg"
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
          key={`${phase}-${showingIntro ? 'intro' : action.type}-${state.turnIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-1 flex flex-col"
        >
          {(showingIntro || action.type === 'WAIT') && (
            <PhoneWaiting message={showingIntro ? 'Look at the TV for instructions you fool!' : (action as { type: 'WAIT'; message: string }).message} />
          )}

          {!showingIntro && action.type === 'SUBMIT_QUESTIONS' && (
            <PhoneQuestionSubmit
              count={action.count}
              onSubmit={(qs, onAck) => submitQuestions(qs, onAck)}
            />
          )}

          {!showingIntro && action.type === 'ANSWER_QUESTION' && (
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

          {!showingIntro && action.type === 'SUBMIT_GUESS' && (
            <PhoneGuess
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              questionText={action.questionText}
              timerEnd={timerEnd}
              onSubmit={submitGuess}
            />
          )}

          {!showingIntro && action.type === 'VOTE_GUESSES' && (
            <PhoneVoteGuesses
              questionText={action.questionText}
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              answer={action.answer}
              guesses={action.guesses}
              onVote={submitVote}
            />
          )}

          {!showingIntro && action.type === 'VIEW_RESULTS' && (
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

  const [ready, setReady] = useState<{
    name: string;
    avatar: PlayerCharacter;
    sessionToken: string | null;
  } | null>(null);

  const handleReady = useCallback(
    (name: string, avatar: PlayerCharacter, sessionToken: string | null) =>
      setReady({ name, avatar, sessionToken }),
    [],
  );

  if (!ready) {
    return <PreJoin roomCode={roomCode} onReady={handleReady} />;
  }

  return (
    <PhoneGame
      roomCode={roomCode}
      name={ready.name}
      avatar={ready.avatar}
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
