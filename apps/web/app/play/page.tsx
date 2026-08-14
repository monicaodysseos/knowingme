'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { usePhoneSocket } from '../../lib/hooks/useGameSocket';
import type { PlayerCharacter, GameSettings, TVState } from '@ksero-se/types';
import TVGameSetup from '../../components/tv/TVGameSetup';
import Y2KAvatar from '../../components/tv/Y2KAvatar';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

import PhoneJoin from '../../components/phone/PhoneJoin';
import PhoneWaiting from '../../components/phone/PhoneWaiting';
import PhoneQuestionSubmit from '../../components/phone/PhoneQuestionSubmit';
import PhoneAnswer from '../../components/phone/PhoneAnswer';
import PhoneGuess from '../../components/phone/PhoneGuess';
import PhoneVoteGuesses from '../../components/phone/PhoneVoteGuesses';
import PhoneResults from '../../components/phone/PhoneResults';
import PhoneReveal from '../../components/phone/PhoneReveal';
import PhoneScoreboard from '../../components/phone/PhoneScoreboard';
import PhoneBroadcastStatus from '../../components/phone/PhoneBroadcastStatus';
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

// ── Player chip: avatar in a colored ring + name (host gets a ★) ───────────────
function PlayerChip({ name, color, avatar, isHost, isConnected }: { name: string; color: { hex: string }; avatar: PlayerCharacter; isHost: boolean; isConnected: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 68, opacity: isConnected ? 1 : 0.4 }}>
      <div style={{ position: 'relative', width: 54, height: 54, borderRadius: '50%', background: '#fff', border: `3px solid ${color.hex}`, boxShadow: `0 3px 0 ${Y2K.dark}`, display: 'grid', placeItems: 'center' }}>
        <Y2KAvatar avatar={avatar} size={42} />
        {isHost && (
          <span style={{ position: 'absolute', top: -9, right: -7, fontSize: 17, filter: 'drop-shadow(0 1px 0 #0b0429)' }}>★</span>
        )}
      </div>
      <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, color: Y2K.dark, maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  );
}

// ── Lobby screen on the phone (host sees Start; others wait) ───────────────────
// In phones-only mode this is also where the room code + QR live, so others can join,
// and the host can see everyone who's joined so far (avatar + name).
function PhoneLobby({ isHost, canStart, playerCount, roomCode, phonesOnly, players, onStart }: { isHost: boolean; canStart: boolean; playerCount: number; roomCode: string; phonesOnly: boolean; players: TVState['players']; onStart: () => void }) {
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const joinUrl = `${origin}/play?room=${roomCode}`;

  return (
    <div className="flex-1 flex flex-col items-center gap-4 px-5 py-5 text-center overflow-y-auto" style={{ justifyContent: 'flex-start' }}>
      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark }}>
        {isHost ? "you're the host ★" : "you're in!"}
      </div>

      {phonesOnly && (
        <div className="flex flex-col items-center gap-2">
          {origin && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 10, border: `3px solid ${Y2K.dark}`, boxShadow: `0 4px 0 ${Y2K.dark}` }}>
              <QRCodeSVG value={joinUrl} size={108} bgColor="#ffffff" fgColor={Y2K.dark} level="M" />
            </div>
          )}
          <div style={{ background: Y2K.hotPink, borderRadius: 12, padding: '6px 18px', border: `3px solid ${Y2K.dark}`, boxShadow: `0 4px 0 ${Y2K.dark}` }}>
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.15em' }}>ROOM</div>
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: 3, WebkitTextStroke: `1px ${Y2K.dark}` }}>{roomCode}</div>
          </div>
          <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: '#9CA3AF' }}>others scan or enter this code at kserose.com</p>
        </div>
      )}

      {/* Who's joined */}
      {players.length > 0 ? (
        <div className="w-full" style={{ maxWidth: 360 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 13, color: Y2K.deepPink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            squad · {players.length}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {players.map((p) => (
              <PlayerChip key={p.id} name={p.name} color={p.color} avatar={p.avatar} isHost={p.isHost} isConnected={p.isConnected} />
            ))}
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
          {playerCount} player{playerCount === 1 ? '' : 's'} in the lobby
        </p>
      )}

      {isHost ? (
        <div className="w-full" style={{ maxWidth: 320, marginTop: 4 }}>
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

// ── Round instructions (host can skip) ─────────────────────────────────────────
const INTRO_COPY: Record<string, { round: number; title: string; blurb: string }> = {
  QUESTION_SUBMISSION: { round: 1, title: 'write questions ✍️', blurb: "write questions for others to answer about themselves. weirder = better!" },
  ANSWER_PHASE: { round: 2, title: 'answer time ✿', blurb: 'answer the questions you got — honestly! others will try to guess what you said.' },
  GUESS_PHASE: { round: 3, title: 'time to guess 🔮', blurb: 'guess what each person answered. 100 pts split between everyone who gets it right.' },
};

function PhoneIntroWait({ isHost, secondsLeft, phase, phonesOnly, onSkip }: { isHost: boolean; secondsLeft: number; phase: string; phonesOnly: boolean; onSkip: () => void }) {
  const copy = INTRO_COPY[phase];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      {phonesOnly && copy ? (
        <>
          <div style={{ fontFamily: Y2K.body, fontWeight: 800, fontSize: 13, color: Y2K.deepPink, letterSpacing: '0.15em' }}>ROUND {copy.round}</div>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: Y2K.dark, lineHeight: 1.1 }}>{copy.title}</div>
          <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 15, color: '#3a1555', maxWidth: 320, lineHeight: 1.4 }}>{copy.blurb}</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 54 }}>📺</div>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark }}>
            read the instructions<br />on the TV
          </div>
        </>
      )}
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

// ── Host's restart control: discreet ⟲, then an "are you sure?" curtain ──────
function RestartControl({ onRestart }: { onRestart: () => void }) {
  const [asking, setAsking] = useState(false);

  if (asking) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: Y2K.dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⟲</div>
        <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1.2 }}>
          restart the game?
        </div>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.75)', maxWidth: 300 }}>
          this ends the game for everyone — all players go back to the home screen.
        </p>
        <div className="w-full flex flex-col gap-3" style={{ maxWidth: 320 }}>
          <HostButton label="yes, restart" onClick={onRestart} />
          <button
            type="button"
            onClick={() => setAsking(false)}
            style={{
              width: '100%', padding: '14px', borderRadius: 99,
              fontFamily: Y2K.display, fontWeight: 800, fontSize: 16, color: '#fff',
              background: 'transparent', border: '3px solid rgba(255,255,255,0.5)', cursor: 'pointer',
            }}
          >
            cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAsking(true)}
      aria-label="Restart game"
      style={{
        position: 'fixed', top: 14, right: 12, zIndex: 30,
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)', border: `2.5px solid ${Y2K.dark}`,
        boxShadow: `0 2px 0 ${Y2K.dark}`, cursor: 'pointer',
        fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: Y2K.dark,
        display: 'grid', placeItems: 'center', lineHeight: 1,
      }}
    >
      ⟲
    </button>
  );
}

// ── End-of-game curtain: keep eyes on the TV (or build suspense) until the
//    leaderboard + awards have played, then the results appear on the phone. ──
function PhoneFinalWait({ phonesOnly }: { phonesOnly: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: 64 }}>
        {phonesOnly ? '🥁' : '📺'}
      </motion.div>
      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 26, color: Y2K.dark, lineHeight: 1.15 }}>
        {phonesOnly ? (<>final scores<br />incoming…</>) : (<>look up!<br />final scores on the TV</>)}
      </div>
      <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#6B7280', maxWidth: 300 }}>
        {phonesOnly ? 'drumroll please… 🥁' : 'watch the big screen — your results pop up here in a moment'}
      </p>
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
    tvState,
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
    hostContinue,
    hostRestart,
  } = usePhoneSocket({
    roomCode,
    name,
    avatar,
    sessionToken: sessionToken ?? undefined,
  });

  const accentColor = '#F97316';

  // Tick while the round instructions OR the final-results curtain are counting
  // down, so the screen flips at the right moment.
  const [, setTick] = useState(0);
  const introEndsAt = state?.introEndsAt ?? 0;
  const finalRevealAt = state?.finalRevealAt ?? 0;
  useEffect(() => {
    const deadline = Math.max(introEndsAt, finalRevealAt);
    if (deadline <= Date.now()) return;
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      if (deadline <= Date.now()) clearInterval(iv);
    }, 500);
    return () => clearInterval(iv);
  }, [introEndsAt, finalRevealAt]);

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
  const timerTotalSeconds = Math.max(1, Math.round(state.timerTotalMs / 1000));
  const introActive = introEndsAt > Date.now();
  const introSecondsLeft = Math.max(0, Math.ceil((introEndsAt - Date.now()) / 1000));
  // At the end of the game, hold the phones on a "look at the TV" curtain while
  // the TV plays its leaderboard + awards ceremony, then reveal the results.
  const finalHolding = action.type === 'VIEW_RESULTS' && finalRevealAt > Date.now();

  // What screen are we showing? (lobby/intro/final-curtain take priority)
  const screen = phase === 'LOBBY' ? 'lobby'
    : introActive ? 'intro'
    : finalHolding ? 'final-wait'
    : action.type;

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
              roomCode={roomCode}
              phonesOnly={state.phonesOnly}
              players={tvState?.players ?? []}
              onStart={hostStart}
            />
          )}

          {screen === 'intro' && (
            <PhoneIntroWait isHost={state.isHost} secondsLeft={introSecondsLeft} phase={phase} phonesOnly={state.phonesOnly} onSkip={skipIntro} />
          )}

          {screen === 'final-wait' && (
            <PhoneFinalWait phonesOnly={state.phonesOnly} />
          )}

          {screen === 'WAIT' && (
            state.phonesOnly && tvState ? (
              phase === 'REVEAL_PHASE' ? <PhoneReveal state={tvState} />
              : phase === 'SCORE_PHASE' ? <PhoneScoreboard state={tvState} />
              : (phase === 'QUESTION_SUBMISSION' || phase === 'ANSWER_PHASE' || phase === 'GUESS_PHASE') ? <PhoneBroadcastStatus state={tvState} />
              : <PhoneWaiting message={(action as { type: 'WAIT'; message: string }).message} />
            ) : (
              <PhoneWaiting message={(action as { type: 'WAIT'; message: string }).message} />
            )
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
              timerTotalSeconds={timerTotalSeconds}
              onSubmit={(id, ans, skipped) => submitAnswer(id, ans, skipped)}
            />
          )}

          {screen === 'SUBMIT_GUESS' && action.type === 'SUBMIT_GUESS' && (
            <PhoneGuess
              subjectName={action.subjectName}
              subjectColor={action.subjectColor}
              questionText={action.questionText}
              timerEnd={timerEnd}
              timerTotalSeconds={timerTotalSeconds}
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

      {/* Advance control: the player who marked owns "Next round" on the
          results; the scoreboard stays host-paced. */}
      {state.canContinue && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 22px', background: `linear-gradient(180deg, transparent 0%, ${Y2K.cream} 35%)`, zIndex: 20 }}>
          <HostButton label={phase === 'REVEAL_PHASE' ? 'next round ▶' : 'continue ▶'} onClick={hostContinue} />
        </div>
      )}

      {/* Host can bail out of the game at any point once it's underway. */}
      {state.isHost && phase !== 'LOBBY' && <RestartControl onRestart={hostRestart} />}
    </PhoneLayout>
  );
}

// ── Phones-only host setup → creates the room, then joins as first player ──────
function PhonesOnlyCreate({ onCreated }: { onCreated: (code: string) => void }) {
  const [creating, setCreating] = useState(false);
  const handleConfirm = async (settings: GameSettings) => {
    setCreating(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'social', settings: { ...settings, phonesOnly: true } }),
      });
      const data = await res.json();
      if (data?.roomCode) { onCreated(data.roomCode); return; }
    } catch {}
    setCreating(false);
  };

  if (creating) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader dark label="creating your room…" />
        </div>
      </PhoneLayout>
    );
  }
  return <TVGameSetup onConfirm={handleConfirm} />;
}

// ── Root page component ───────────────────────────────────────────────────────

function PhoneApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = (searchParams.get('room') ?? '').toUpperCase().slice(0, 4);
  const wantHost = searchParams.get('host') === '1';

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

  // No room yet + asked to host a phones-only game → pick settings, create, then join.
  if (!roomCode && wantHost) {
    return <PhonesOnlyCreate onCreated={(code) => router.replace(`/play?room=${code}`)} />;
  }

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
