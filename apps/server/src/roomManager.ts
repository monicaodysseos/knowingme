import { createActor, type Actor } from 'xstate';
import type { Server } from 'socket.io';
import { gameMachine } from './machine';
import type { GameContext, GameMode, GameSettings, Player, TVState, PhoneState, ScoreEntry } from '@ksero-se/types';
import { EXAMPLE_PROMPTS } from '@ksero-se/types';
import { allocateCode, newHostSecret } from './codes';
import { ROOM_CAPS, sanitizeSettings } from './settings';

type MachineActor = Actor<typeof gameMachine>;

interface RoomEntry {
  actor: MachineActor;
  timers: Map<string, ReturnType<typeof setTimeout>>;
  hostSecret: string;
  createdAt: number;
  lastActivityAt: number;
  tvSockets: Set<string>;
}

export interface SavedRoom {
  v: 1;
  roomCode: string;
  hostSecret: string;
  createdAt: number;
  lastActivityAt: number;
  snapshot: unknown;
}

const rooms = new Map<string, RoomEntry>();

let onRoomChanged: (code: string) => void = () => {};
let onRoomDeleted: (code: string) => void = () => {};

export function setRoomHooks(hooks: {
  onChanged?: (code: string) => void;
  onDeleted?: (code: string) => void;
}): void {
  if (hooks.onChanged) onRoomChanged = hooks.onChanged;
  if (hooks.onDeleted) onRoomDeleted = hooks.onDeleted;
}

// ── Room lifecycle ─────────────────────────────────────────────────────────

export interface CreatedRoom {
  roomCode: string;
  hostSecret: string;
}

export function createRoom(io: Server, mode: GameMode = 'social', settings?: GameSettings): CreatedRoom | null {
  sweepRooms();
  if (rooms.size >= ROOM_CAPS.maxRooms) return null;
  const roomCode = allocateCode((code) => rooms.has(code));
  if (!roomCode) return null;

  const safeSettings = sanitizeSettings(settings);
  const actor = createActor(gameMachine, {
    input: { roomCode, mode, settings: safeSettings },
  });

  const now = Date.now();
  const entry: RoomEntry = {
    actor,
    timers: new Map(),
    hostSecret: newHostSecret(),
    createdAt: now,
    lastActivityAt: now,
    tvSockets: new Set(),
  };
  rooms.set(roomCode, entry);
  watchRoom(io, roomCode, entry);
  actor.start();
  return { roomCode, hostSecret: entry.hostSecret };
}

function watchRoom(io: Server, roomCode: string, entry: RoomEntry): void {
  entry.actor.subscribe((snapshot) => {
    entry.lastActivityAt = Date.now();
    try {
      broadcastState(io, roomCode, snapshot.context, snapshot.value as string);
    } catch (err) {
      console.error(`[room ${roomCode}] broadcast failed:`, err instanceof Error ? err.message : err);
    }
    try {
      onRoomChanged(roomCode);
    } catch (err) {
      console.error(`[room ${roomCode}] persist failed:`, err instanceof Error ? err.message : err);
    }
  });
}

export function getRoom(roomCode: string): RoomEntry | undefined {
  return rooms.get(roomCode);
}

/** Send the current game state to one socket, not the rest of the room. */
export function sendCurrentState(io: Server, roomCode: string, socketId: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  const snap = entry.actor.getSnapshot();
  broadcastState(io, roomCode, snap.context, snap.value as string, socketId);
}

export function touchRoom(roomCode: string): void {
  const entry = rooms.get(roomCode);
  if (entry) entry.lastActivityAt = Date.now();
}

export function attachTv(roomCode: string, socketId: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  entry.tvSockets.add(socketId);
  entry.lastActivityAt = Date.now();
}

export function detachTv(roomCode: string, socketId: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  entry.tvSockets.delete(socketId);
  entry.lastActivityAt = Date.now();
}

export function roomCount(): number {
  return rooms.size;
}

export function exportRoomState(roomCode: string): SavedRoom | null {
  const entry = rooms.get(roomCode);
  if (!entry) return null;
  const persisted = entry.actor.getPersistedSnapshot();
  if (!persisted) return null;
  return {
    v: 1,
    roomCode,
    hostSecret: entry.hostSecret,
    createdAt: entry.createdAt,
    lastActivityAt: entry.lastActivityAt,
    snapshot: JSON.parse(JSON.stringify(persisted)),
  };
}

export function restoreRoom(io: Server, saved: SavedRoom): boolean {
  if (rooms.has(saved.roomCode)) return true;
  if (!saved.hostSecret || !saved.snapshot || typeof saved.snapshot !== 'object') return false;
  if (rooms.size >= ROOM_CAPS.maxRooms) return false;

  let snapshot: { context?: { players?: Player[] } };
  try {
    snapshot = JSON.parse(JSON.stringify(saved.snapshot));
  } catch {
    return false;
  }
  const now = Date.now();
  if (Array.isArray(snapshot.context?.players)) {
    snapshot.context.players = snapshot.context.players.map((player) => ({
      ...player,
      isConnected: false,
      disconnectedAt: typeof player.disconnectedAt === 'number' ? player.disconnectedAt : now,
    }));
  }

  let actor: MachineActor;
  try {
    const savedContext = snapshot.context as { mode?: GameMode; settings?: GameSettings } | undefined;
    actor = createActor(gameMachine, {
      input: {
        roomCode: saved.roomCode,
        mode: savedContext?.mode === 'corporate' ? 'corporate' : 'social',
        settings: savedContext?.settings,
      },
      snapshot: snapshot as never,
    });
  } catch (err) {
    console.error(`[restore] ${saved.roomCode} rejected snapshot:`, err instanceof Error ? err.message : err);
    return false;
  }

  const entry: RoomEntry = {
    actor,
    timers: new Map(),
    hostSecret: saved.hostSecret,
    createdAt: saved.createdAt || now,
    lastActivityAt: saved.lastActivityAt || now,
    tvSockets: new Set(),
  };
  rooms.set(saved.roomCode, entry);
  watchRoom(io, saved.roomCode, entry);
  try {
    actor.start();
  } catch (err) {
    console.error(`[restore] ${saved.roomCode} failed to start:`, err instanceof Error ? err.message : err);
    rooms.delete(saved.roomCode);
    return false;
  }
  return true;
}

/** Drop the in memory actor without deleting the saved copy. Used after a restart test. */
export function evictLocalRoom(roomCode: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  try { entry.actor.stop(); } catch { /* already stopped */ }
  for (const timer of entry.timers.values()) clearTimeout(timer);
  rooms.delete(roomCode);
}

export function resetAllRooms(): void {
  for (const code of [...rooms.keys()]) evictLocalRoom(code);
}

/**
 * Remove rooms nobody is using. A connected TV or player keeps the room,
 * unless nothing has happened for the stale window.
 */
export function sweepRooms(now = Date.now()): string[] {
  const removed: string[] = [];
  for (const [code, entry] of rooms) {
    const snap = entry.actor.getSnapshot();
    const phase = String(snap.value);
    const players = snap.context.players;
    const anyone = players.some((player) => player.isConnected) || entry.tvSockets.size > 0;
    const idle = now - entry.lastActivityAt;
    const age = now - entry.createdAt;
    let drop = false;
    if (idle >= ROOM_CAPS.staleMs) drop = true;
    else if (!anyone && players.length === 0 && age >= ROOM_CAPS.emptyLobbyMs) drop = true;
    else if (!anyone && phase === 'LOBBY' && idle >= ROOM_CAPS.idleLobbyMs) drop = true;
    else if (!anyone && phase !== 'LOBBY' && idle >= ROOM_CAPS.abandonedGameMs) drop = true;
    if (drop) {
      deleteRoom(code);
      removed.push(code);
    }
  }
  return removed;
}

export function deleteRoom(roomCode: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  try { entry.actor.stop(); } catch { /* already stopped */ }
  for (const timer of entry.timers.values()) clearTimeout(timer);
  rooms.delete(roomCode);
  try { onRoomDeleted(roomCode); } catch (err) {
    console.error(`[room ${roomCode}] delete hook failed:`, err instanceof Error ? err.message : err);
  }
}

export function hostSecretFor(roomCode: string): string | undefined {
  return rooms.get(roomCode)?.hostSecret;
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
    try {
      onExpire();
    } catch (err) {
      console.error(`[room ${roomCode}] timer ${key} failed:`, err instanceof Error ? err.message : err);
    }
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

function broadcastState(
  io: Server,
  roomCode: string,
  ctx: GameContext,
  phase: string,
  onlySocketId?: string,
): void {
  const scores = buildScores(ctx);

  // ── TV payload ─────────────────────────────────────────────────────────
  const currentTurn = ctx.playerTurns[ctx.currentTurnIndex];
  let tvCurrentTurn: TVState['currentTurn'] | undefined;

  if (currentTurn && ['GUESS_PHASE', 'REVEAL_PHASE', 'SCORE_PHASE'].includes(phase)) {
    const subjectPlayer = ctx.players.find((p) => p.id === currentTurn.subjectPlayerId);
    const guessesRevealed = phase === 'REVEAL_PHASE' || phase === 'SCORE_PHASE'
      ? currentTurn.guesses.slice(0, ctx.revealIndex + 1).map((g) => ({
          id: g.id,
          guesserPlayerId: g.guesserPlayerId,
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
      // Guesser identities stay hidden through voting; revealed once scored.
      namesRevealed: phase === 'SCORE_PHASE',
    };
  }

  const submissionProgress = phase === 'QUESTION_SUBMISSION'
    ? {
        total: ctx.players.length,
        submitted: ctx.players.filter((p) => p.submittedQuestionIds.length >= ctx.settings.questionsToWrite).length,
      }
    : undefined;

  // Compute round-end flags for SCORE_PHASE.
  // A "round" = one question-slot across all players (slot 0 = all players' Q1, etc.).
  // isRoundEnd is true only when the slot index is about to increase (or there are no more turns).
  let isRoundEnd: boolean | undefined;
  let isLastRound: boolean | undefined;
  if (phase === 'SCORE_PHASE' && currentTurn) {
    const idx = ctx.currentTurnIndex;
    const nextTurn = ctx.playerTurns[idx + 1];
    isLastRound = !nextTurn;
    if (!nextTurn) {
      isRoundEnd = true;
    } else {
      // Slot = how many times the same subject appeared before this index
      const currentSlot = ctx.playerTurns.slice(0, idx).filter(
        (t) => t.subjectPlayerId === currentTurn.subjectPlayerId,
      ).length;
      const nextSlot = ctx.playerTurns.slice(0, idx + 1).filter(
        (t) => t.subjectPlayerId === nextTurn.subjectPlayerId,
      ).length;
      isRoundEnd = nextSlot !== currentSlot;
    }
  }

  const tvState: TVState = {
    phase: phase as TVState['phase'],
    roomCode,
    settings: ctx.settings,
    players: ctx.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isConnected: p.isConnected,
      isHost: p.isHost,
      hasSubmittedQuestions: p.submittedQuestionIds.length >= ctx.settings.questionsToWrite,
    })),
    scores,
    timerEnd: ctx.timerEnd,
    timerTotalMs: ctx.timerTotalMs,
    mode: ctx.mode,
    currentTurn: tvCurrentTurn,
    awards: ctx.awards.length ? ctx.awards : undefined,
    submissionProgress,
    isRoundEnd,
    isLastRound,
    introEndsAt: ctx.introEndsAt || undefined,
  };

  const onlySocket = onlySocketId ? io.sockets.sockets.get(onlySocketId) : undefined;
  if (!onlySocketId) {
    io.to(`tv:${roomCode}`).emit('tv:update', tvState);
  } else if (onlySocket?.rooms.has(`tv:${roomCode}`)) {
    onlySocket.emit('tv:update', tvState);
  }

  // Advancing the round: the player who did the marking owns "Next round"
  // (host can also advance if they go AFK); the scoreboard stays host-paced.
  const revealMarked = !currentTurn
    || currentTurn.guesses.length === 0
    || currentTurn.guesses.every((g) => g.isCorrect !== undefined);
  const revealDone = phase === 'REVEAL_PHASE' && revealMarked;

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
        if (player.submittedQuestionIds.length >= ctx.settings.questionsToWrite) {
          action = { type: 'WAIT', message: 'Look at the TV for instructions you fool!' };
        } else {
          action = { type: 'SUBMIT_QUESTIONS', examples: EXAMPLE_PROMPTS, count: ctx.settings.questionsToWrite };
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
          action = { type: 'WAIT', message: 'Look at the TV for instructions you fool!' };
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
            action = { type: 'WAIT', message: 'Look at the TV for instructions you fool!' };
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
          const markingDone = currentTurn.guesses.length > 0 && currentTurn.guesses.every((g) => g.isCorrect !== undefined);
          const watchMsg = ctx.settings.phonesOnly ? 'here come the results…' : 'watch the TV for the results…';
          if (player.id === currentTurn.subjectPlayerId && !markingDone) {
            // Only the subject marks correct / wrong — and only until done.
            action = {
              type: 'VOTE_GUESSES',
              questionText: currentTurn.questionText,
              subjectName,
              subjectColor: subjectPlayerObj?.color ?? ctx.players[0].color,
              answer: currentTurn.answer,
              // Anonymous: the subject votes on the guess text without seeing
              // who wrote each one (names are revealed afterwards).
              guesses: currentTurn.guesses.map((g) => ({
                id: g.id,
                text: g.text,
              })),
            };
          } else if (player.id === currentTurn.subjectPlayerId) {
            // Subject has finished marking → watch the results like everyone else.
            action = { type: 'WAIT', message: watchMsg };
          } else {
            action = { type: 'WAIT', message: markingDone ? watchMsg : `${subjectName} is marking the answers…` };
          }
        } else {
          action = { type: 'WAIT', message: ctx.settings.phonesOnly ? 'watch the reveal…' : 'Watch the TV for the reveal…' };
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
      timerTotalMs: ctx.timerTotalMs,
      action,
      turnIndex: ctx.currentTurnIndex,
      isHost: player.isHost,
      playerCount: ctx.players.length,
      canStart: ctx.players.length >= Math.min(2, ctx.settings.maxPlayers),
      introEndsAt: ctx.introEndsAt || 0,
      phonesOnly: ctx.settings.phonesOnly ?? false,
      finalRevealAt: ctx.finalRevealAt || 0,
      canContinue: revealDone
        ? (player.id === currentTurn?.subjectPlayerId || player.isHost)
        : (phase === 'SCORE_PHASE' && player.isHost),
    };

    if (onlySocketId) {
      if (player.socketId === onlySocketId) onlySocket?.emit('phone:update', phoneState);
    } else {
      io.to(`player:${player.socketId}`).emit('phone:update', phoneState);
    }
  }
}
