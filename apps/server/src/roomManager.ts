import { createActor, type Actor } from 'xstate';
import type { Server, Socket } from 'socket.io';
import { gameMachine, TIMER, initialContext } from './machine';
import type { GameContext, GameMode, TVState, PhoneState, ScoreEntry } from '@ksero-se/types';
import { EXAMPLE_PROMPTS } from '@ksero-se/types';

type MachineActor = Actor<typeof gameMachine>;

interface RoomEntry {
  actor: MachineActor;
  timers: Map<string, ReturnType<typeof setTimeout>>;
}

const rooms = new Map<string, RoomEntry>();

// ── Room code generation ───────────────────────────────────────────────────

const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O/0/I/1/l

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)];
  }
  return code;
}

function freshCode(): string {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  return code;
}

// ── Room lifecycle ─────────────────────────────────────────────────────────

export function createRoom(io: Server, mode: GameMode = 'social'): string {
  const roomCode = freshCode();

  const actor = createActor(gameMachine, {
    input: { roomCode, mode },
  });

  const entry: RoomEntry = { actor, timers: new Map() };
  rooms.set(roomCode, entry);

  actor.subscribe((snapshot) => {
    broadcastState(io, roomCode, snapshot.context, snapshot.value as string);
  });

  actor.start();
  return roomCode;
}

export function getRoom(roomCode: string): RoomEntry | undefined {
  return rooms.get(roomCode);
}

/** Send the current game state to a single socket (e.g. TV on connect). */
export function sendCurrentState(io: Server, roomCode: string, socketId: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  const snap = entry.actor.getSnapshot();
  const ctx = snap.context;
  const phase = snap.value as string;
  // Temporarily store io reference to re-use broadcastState with a targeted emit
  // We just re-broadcast — the socket is in tv:${roomCode} room already
  broadcastState(io, roomCode, ctx, phase);
}

export function deleteRoom(roomCode: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  entry.actor.stop();
  for (const t of entry.timers.values()) clearTimeout(t);
  rooms.delete(roomCode);
}

// ── Timer management ───────────────────────────────────────────────────────

export function clearRoomTimer(roomCode: string, key: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  const t = entry.timers.get(key);
  if (t) { clearTimeout(t); entry.timers.delete(key); }
  // Also clear any associated interval
  const iv = entry.timers.get(key + '_tick');
  if (iv) { clearInterval(iv); entry.timers.delete(key + '_tick'); }
}

export function setRoomTimer(
  io: Server,
  roomCode: string,
  key: string,
  durationMs: number,
  onExpire: () => void,
): void {
  clearRoomTimer(roomCode, key);
  const entry = rooms.get(roomCode);
  if (!entry) return;

  const t = setTimeout(() => {
    entry.timers.delete(key);
    onExpire();
  }, durationMs);

  entry.timers.set(key, t);
}

// ── State broadcasting ─────────────────────────────────────────────────────

function buildScores(ctx: GameContext): ScoreEntry[] {
  return ctx.players
    .map((p) => ({
      playerId: p.id,
      playerName: p.name,
      color: p.color,
      score: ctx.scores[p.id] ?? 0,
      delta: ctx.roundDeltas?.[p.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
}

function broadcastState(io: Server, roomCode: string, ctx: GameContext, phase: string): void {
  const scores = buildScores(ctx);

  // ── TV payload ─────────────────────────────────────────────────────────
  const currentTurn = ctx.playerTurns[ctx.currentTurnIndex];
  let tvCurrentTurn: TVState['currentTurn'] | undefined;

  if (currentTurn && ['GUESS_PHASE', 'REVEAL_PHASE', 'SCORE_PHASE'].includes(phase)) {
    const subjectPlayer = ctx.players.find((p) => p.id === currentTurn.subjectPlayerId);
    const guessesRevealed = phase === 'REVEAL_PHASE' || phase === 'SCORE_PHASE'
      ? currentTurn.guesses.slice(0, ctx.revealIndex + 1).map((g) => ({
          id: g.id,
          guesserName: g.guesserName,
          guesserColor: g.guesserColor,
          guesserAvatar: ctx.players.find((p) => p.id === g.guesserPlayerId)?.avatar ?? 'blob',
          text: g.text,
          isCorrect: g.isCorrect,
        }))
      : [];

    // Compute which question number this is for the subject (0-based)
    let questionIndex = 0;
    for (let i = 0; i < ctx.currentTurnIndex; i++) {
      if (ctx.playerTurns[i].subjectPlayerId === currentTurn.subjectPlayerId) questionIndex++;
    }
    const totalForSubject = ctx.playerTurns.filter(
      (t) => t.subjectPlayerId === currentTurn.subjectPlayerId,
    ).length;

    tvCurrentTurn = {
      subjectPlayer: {
        id: currentTurn.subjectPlayerId,
        name: subjectPlayer?.name ?? '?',
        color: subjectPlayer?.color ?? ctx.players[0]?.color,
        avatar: subjectPlayer?.avatar ?? 'blob',
      },
      questionText: currentTurn.questionText,
      questionIndex,
      totalForSubject,
      guessCount: currentTurn.guesses.length,
      guessesRevealed,
      answer: ['REVEAL_PHASE', 'SCORE_PHASE'].includes(phase)
        ? currentTurn.answer
        : undefined,
      revealIndex: ctx.revealIndex,
    };
  }

  const submissionProgress = phase === 'QUESTION_SUBMISSION'
    ? {
        total: ctx.players.length,
        submitted: ctx.players.filter((p) => p.submittedQuestionIds.length >= 2).length,
      }
    : undefined;

  // Compute round-end flags for SCORE_PHASE
  let isRoundEnd: boolean | undefined;
  let isLastRound: boolean | undefined;
  if (phase === 'SCORE_PHASE' && currentTurn) {
    const nextTurn = ctx.playerTurns[ctx.currentTurnIndex + 1];
    isLastRound = !nextTurn;
    isRoundEnd = !nextTurn || nextTurn.subjectPlayerId !== currentTurn.subjectPlayerId;
  }

  const tvState: TVState = {
    phase: phase as TVState['phase'],
    roomCode,
    players: ctx.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isConnected: p.isConnected,
      isHost: p.isHost,
      hasSubmittedQuestions: p.submittedQuestionIds.length >= 2,
    })),
    scores,
    timerEnd: ctx.timerEnd,
    mode: ctx.mode,
    currentTurn: tvCurrentTurn,
    awards: ctx.awards.length ? ctx.awards : undefined,
    submissionProgress,
    isRoundEnd,
    isLastRound,
  };

  io.to(`tv:${roomCode}`).emit('tv:update', tvState);

  // ── Per-player phone payloads ───────────────────────────────────────────
  for (const player of ctx.players) {
    if (!player.isConnected) continue;

    let action: PhoneState['action'];
    const isSubject = currentTurn?.subjectPlayerId === player.id;

    switch (phase) {
      case 'LOBBY':
        action = { type: 'WAIT', message: 'Waiting for host to start the game…' };
        break;

      case 'QUESTION_SUBMISSION':
        if (player.submittedQuestionIds.length >= 2) {
          action = { type: 'WAIT', message: 'Questions submitted! Waiting for everyone…' };
        } else {
          action = { type: 'SUBMIT_QUESTIONS', examples: EXAMPLE_PROMPTS };
        }
        break;

      case 'ANSWER_PHASE': {
        const byPlayer: Record<string, typeof ctx.questionAssignments> = {};
        for (const a of ctx.questionAssignments) {
          if (!byPlayer[a.assignedToPlayerId]) byPlayer[a.assignedToPlayerId] = [];
          byPlayer[a.assignedToPlayerId].push(a);
        }
        const myAssignments = byPlayer[player.id] ?? [];
        // Find the first unanswered, non-skipped assignment for this player
        const nextAssignment = myAssignments.find(
          (a) => a.answer === undefined && !a.skipped,
        );
        const answeredCount = myAssignments.filter(
          (a) => a.answer !== undefined || a.skipped,
        ).length;
        if (!nextAssignment) {
          action = { type: 'WAIT', message: 'All done! Waiting for others…' };
        } else {
          action = {
            type: 'ANSWER_QUESTION',
            assignmentId: nextAssignment.id,
            questionText: nextAssignment.questionText,
            slotIndex: answeredCount,
            totalSlots: myAssignments.length,
            canSkip: !player.hasSkipped,
          };
        }
        break;
      }

      case 'GUESS_PHASE':
        if (!currentTurn) {
          // No turns built (nobody submitted answers) — show wait, server will skip ahead
          action = { type: 'WAIT', message: 'Almost there…' };
        } else if (isSubject) {
          action = { type: 'WAIT', message: 'Others are guessing your answer… 👀' };
        } else {
          const alreadyGuessed = currentTurn.guesses.some(
            (g) => g.guesserPlayerId === player.id,
          );
          if (alreadyGuessed) {
            action = { type: 'WAIT', message: 'Guess submitted! Waiting for others…' };
          } else {
            const subjectPlayer = ctx.players.find(
              (p) => p.id === currentTurn.subjectPlayerId,
            );
            action = {
              type: 'SUBMIT_GUESS',
              subjectName: subjectPlayer?.name ?? '?',
              subjectColor: subjectPlayer?.color ?? ctx.players[0].color,
              questionText: currentTurn.questionText,
            };
          }
        }
        break;

      case 'REVEAL_PHASE': {
        // All guesses are revealed when revealIndex reaches the last guess
        const totalGuesses = currentTurn?.guesses.length ?? 0;
        const allRevealed = totalGuesses > 0 && ctx.revealIndex >= totalGuesses - 1;
        if (allRevealed && currentTurn?.answer) {
          const subjectPlayerObj = ctx.players.find((p) => p.id === currentTurn.subjectPlayerId);
          const subjectName = subjectPlayerObj?.name ?? '?';
          if (player.id === currentTurn.subjectPlayerId) {
            // Only the subject marks correct / wrong
            action = {
              type: 'VOTE_GUESSES',
              questionText: currentTurn.questionText,
              subjectName,
              subjectColor: subjectPlayerObj?.color ?? ctx.players[0].color,
              answer: currentTurn.answer,
              guesses: currentTurn.guesses.map((g) => ({
                id: g.id,
                guesserName: g.guesserName,
                guesserColor: g.guesserColor,
                guesserAvatar: ctx.players.find((p) => p.id === g.guesserPlayerId)?.avatar ?? 'blob',
                text: g.text,
              })),
            };
          } else {
            action = { type: 'WAIT', message: `${subjectName} is marking the answers…` };
          }
        } else {
          action = { type: 'WAIT', message: 'Watch the TV for the reveal…' };
        }
        break;
      }

      case 'SCORE_PHASE':
        action = { type: 'WAIT', message: 'Check the scoreboard! 🏆' };
        break;

      case 'FINAL_AWARDS':
      case 'GAME_OVER':
        action = { type: 'VIEW_RESULTS', scores, awards: ctx.awards };
        break;

      default:
        action = { type: 'WAIT', message: 'Stand by…' };
    }

    const phoneState: PhoneState = {
      phase: phase as PhoneState['phase'],
      playerId: player.id,
      timerEnd: ctx.timerEnd,
      action,
      turnIndex: ctx.currentTurnIndex,
    };

    io.to(`player:${player.socketId}`).emit('phone:update', phoneState);
  }
}
