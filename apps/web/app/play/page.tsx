'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
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
import Loader from '../../components/Loader';
import { Y2K } from '../../lib/y2k';

// ── Big chunky Y2K action button (host controls) ──────────────────────────────
function HostButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="y2k-hover-lift"
      style={{
        width: '100%',
        padding: '18px',
        borderRadius: 99,
        fontFamily: Y2K.display,
        fontWeight: 900,
        fontSize: 20,
        color: '#fff',
        background: disabled ? '#d1d5db' : Y2K.hotPink,
        border: `3px solid ${Y2K.dark}`,
        boxShadow: disabled ? 'none' : `0 5px 0 ${Y2K.dark}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </button>
  );
}

// ── Lobby screen on the phone (host sees Start; others wait) ───────────────────
function PhoneLobby({ isHost, canStart, playerCount, onStart }: { isHost: boolean; canStart: boolean; playerCount: number; onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 26, color: Y2K.dark }}>
        {isHost ? "you're the host ★" : "you're in!"}
      </div>
      <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
        {playerCount} player{playerCount === 1 ? '' : 's'} in the lobby
      </p>
      {isHost ? (
        <div className="w-full" style={{ maxWidth: 320 }}>
          <HostButton
            label={canStart ? 'start the game ▶' : 'need 2+ players…'}
            onClick={onStart}
            disabled={!canStart}
          />
        </div>
      ) : (
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#9CA3AF' }}>
          waiting for the host to start…
        </p>
      )}
    </div>
  );
}

// ── Round-instructions wait (host can skip) ────────────────────────────────────
function PhoneIntroWait({ isHost, secondsLeft, onSkip }: { isHost: boolean; secondsLeft: number; onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div style={{ fontSize: 54 }}>📺</div>
      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark }}>
        read the instructions<br />on the TV
      </div>
      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 40, color: Y2K.hotPink }}>
        {secondsLeft}s
      </div>
      {isHost && (
        <div className="w-full" style={{ maxWidth: 320 }}>
          <HostButton label="skip intro ⏭" onClick={onSkip} />
        </div>
      )}
    </div>
  );
}

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
    hostStart,
    skipIntro,
  } = usePhoneSocket({
    roomCode,
    name,
    avatar,
    sessionToken: sessionToken ?? undefined,
  });

  const accentColor = '#F97316';

  // The round instructions are synced by the server (state.introEndsAt). While
  // they're showing, phones wait (host can skip). Tick once a second so the
  // countdown updates and the screen flips to the real task when time's up.
  const [, setTick] = useState(0);
  const introEndsAt = state?.introEndsAt ?? 0;
  useEffect(() => {
    if (introEndsAt <= Date.now()) return;
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      if (introEndsAt <= Date.now()) clearInterval(iv);
    }, 500);
    return () => clearInterval(iv);
  }, [introEndsAt]);

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
            <Loader dark label={`connecting to ${roomCode}…`} />
          )}
        </div>
      </PhoneLayout>
    );
  }

  const { action, timerEnd, phase } = state;
  const introActive = introEndsAt > Date.now();
  const introSecondsLeft = Math.max(0, Math.ceil((introEndsAt - Date.now()) / 1000));

  // What screen are we showing? (lobby and intro take priority over the action)
  const screen = phase === 'LOBBY' ? 'lobby' : introActive ? 'intro' : action.type;

  return (
    <PhoneLayout accent={accentColor}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${screen}-${state.turnIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-1 flex flex-col"
        >
          {screen === 'lobby' && (
            <PhoneLobby
              isHost={state.isHost}
              canStart={state.canStart}
              playerCount={state.playerCount}
              onStart={hostStart}
            />
          )}

          {screen === 'intro' && (
            <PhoneIntroWait isHost={state.isHost} secondsLeft={introSecondsLeft} onSkip={skipIntro} />
          )}

          {screen === 'WAIT' && (
            <PhoneWaiting message={(action as { type: 'WAIT'; message: string }).message} />
          )}

          {screen === 'SUBMIT_QUESTIONS' && action.type === 'SUBMIT_QUESTIONS' && (
            <PhoneQuestionSubmit
              roomCode={roomCode}
              count={action.count}
              onSubmit={(qs, onAck) => submitQuestions(qs, onAck)}
            />
          )}

          {screen === 'ANSWER_QUESTION' && action.type === 'ANSWER_QUESTION' && (
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

          {screen === 'SUBMIT_GUESS' && action.type === 'SUBMIT_GUESS' && (
            <PhoneGuess
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              questionText={action.questionText}
              timerEnd={timerEnd}
              onSubmit={submitGuess}
            />
          )}

          {screen === 'VOTE_GUESSES' && action.type === 'VOTE_GUESSES' && (
            <PhoneVoteGuesses
              questionText={action.questionText}
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              answer={action.answer}
              guesses={action.guesses}
              onVote={submitVote}
            />
          )}

          {screen === 'VIEW_RESULTS' && action.type === 'VIEW_RESULTS' && (
            <PhoneResults
              scores={action.scores}
              awards={action.awards}
              onPlayAgain={state.isHost ? playAgain : undefined}
              isHost={state.isHost}
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
          <Loader label="loading…" />
        </div>
      }
    >
      <PhoneApp />
    </Suspense>
  );
}
