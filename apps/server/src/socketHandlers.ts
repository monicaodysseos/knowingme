import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  getRoom,
  deleteRoom,
  setRoomTimer,
  clearRoomTimer,
  sendCurrentState,
} from './roomManager';
import { saveSession, resolveSession } from './redis';
import { TIMER } from './machine';
import type { JoinPayload, JoinAck } from '@ksero-se/types';

// ── Room creation endpoint (HTTP) ─ see index.ts ──────────────────────────

// ── Socket handlers ────────────────────────────────────────────────────────

export function registerSocketHandlers(io: Server, socket: Socket): void {
  // ── Join room ────────────────────────────────────────────────────────────
  socket.on('join', async (payload: JoinPayload, ack: (res: JoinAck) => void) => {
    const { roomCode, name, sessionToken, role } = payload;
    const entry = getRoom(roomCode);

    if (!entry) {
      return ack({ ok: false, error: 'Room not found' });
    }

    const snapshot = entry.actor.getSnapshot();
    const ctx = snapshot.context;

    if (role === 'tv') {
      socket.join(`tv:${roomCode}`);
      socket.join(roomCode);
      socket.data = { roomCode, role: 'tv' };
      // Immediately push current state to this TV socket
      sendCurrentState(io, roomCode, socket.id);
      return ack({ ok: true });
    }

    // Player role — try reconnect first (works in any phase including LOBBY)
    if (sessionToken) {
      try {
        const session = await resolveSession(sessionToken);
        if (session && session.roomCode === roomCode) {
          const existing = ctx.players.find((p) => p.sessionToken === sessionToken);
          if (existing) {
            socket.join(roomCode);
            socket.join(`player:${socket.id}`);
            socket.data = { roomCode, playerId: existing.id, role: 'player', sessionToken };
            entry.actor.send({
              type: 'PLAYER_RECONNECT',
              sessionToken,
              socketId: existing.socketId,
              newSocketId: socket.id,
            });
            // Push current state immediately
            sendCurrentState(io, roomCode, socket.id);
            return ack({ ok: true, playerId: existing.id, sessionToken, color: existing.color });
          }
        }
      } catch {}
    }

    // Fresh join — only allowed during LOBBY
    if (snapshot.value !== 'LOBBY') {
      return ack({ ok: false, error: 'Game already in progress' });
    }

    // Check max players
    if (ctx.players.length >= 8) {
      return ack({ ok: false, error: 'Room is full' });
    }

    // Validate name
    const trimmedName = (name ?? '').trim().slice(0, 16);
    if (!trimmedName) return ack({ ok: false, error: 'Name required' });

    const token = sessionToken ?? uuidv4();

    socket.join(roomCode);
    socket.join(`player:${socket.id}`);

    entry.actor.send({
      type: 'PLAYER_JOIN',
      name: trimmedName,
      socketId: socket.id,
      sessionToken: token,
    });

    // After the send, get the new player's id
    const newCtx = entry.actor.getSnapshot().context;
    const newPlayer = newCtx.players.find((p) => p.socketId === socket.id);

    if (!newPlayer) {
      return ack({ ok: false, error: 'Failed to join' });
    }

    await saveSession(token, newPlayer.id, roomCode);

    socket.data = {
      roomCode,
      playerId: newPlayer.id,
      role: 'player',
      sessionToken: token,
    };

    return ack({
      ok: true,
      playerId: newPlayer.id,
      sessionToken: token,
      color: newPlayer.color,
    });
  });

  // ── Host start ───────────────────────────────────────────────────────────
  socket.on('host:start', () => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry) return;

    const ctx = entry.actor.getSnapshot().context;
    if (ctx.hostId !== playerId) return; // not the host
    if (ctx.players.filter((p) => p.isConnected).length < 3) return; // guard

    entry.actor.send({ type: 'HOST_START' });

    // Only set timer if the transition succeeded
    if (entry.actor.getSnapshot().value === 'QUESTION_SUBMISSION') {
      setRoomTimer(io, roomCode, 'question-sub', TIMER.QUESTION_SUBMISSION, () => {
        const e = getRoom(roomCode);
        if (e) e.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
        checkAndAssignQuestions(io, roomCode);
      });
    }
  });

  // ── Submit questions ─────────────────────────────────────────────────────
  socket.on('submit:questions', (questions: string[]) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;

    const qs = questions
      .map((q: string) => q.trim().slice(0, 80))
      .filter((q: string) => q.length > 0)
      .slice(0, 2);

    if (qs.length < 2) return;

    entry.actor.send({ type: 'SUBMIT_QUESTIONS', playerId, questions: qs });

    const ctx = entry.actor.getSnapshot().context;
    const allDone = ctx.players.every((p) => p.submittedQuestionIds.length >= 2);
    if (allDone) {
      clearRoomTimer(roomCode, 'question-sub');
      entry.actor.send({ type: 'ALL_QUESTIONS_SUBMITTED' });
      startAnswerSlot(io, roomCode, 0);
    }
  });

  // ── Submit answer ────────────────────────────────────────────────────────
  socket.on('submit:answer', (data: { assignmentId: string; answer: string; skipped?: boolean }) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;

    entry.actor.send({
      type: 'SUBMIT_ANSWER',
      playerId,
      assignmentId: data.assignmentId,
      answer: (data.answer ?? '').trim(),
      skipped: data.skipped ?? false,
      elapsedMs: 0,
    });

    checkSlotComplete(io, roomCode);
  });

  // ── Submit guess ─────────────────────────────────────────────────────────
  socket.on('submit:guess', (text: string) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;

    entry.actor.send({ type: 'SUBMIT_GUESS', playerId, text: (text ?? '').trim().slice(0, 120) });

    const ctx = entry.actor.getSnapshot().context;
    const turn = ctx.playerTurns[ctx.currentTurnIndex];
    if (!turn) return;
    const eligibleGuessers = ctx.players.filter(
      (p) => p.id !== turn.subjectPlayerId && p.isConnected,
    );
    const allIn = eligibleGuessers.every((p) =>
      ctx.playerTurns[ctx.currentTurnIndex].guesses.some((g) => g.guesserPlayerId === p.id),
    );
    if (allIn) {
      clearRoomTimer(roomCode, 'guess');
      entry.actor.send({ type: 'ALL_GUESSES_IN' });
      startReveal(io, roomCode);
    }
  });

  // ── Mark guess ───────────────────────────────────────────────────────────
  socket.on('mark:guess', (data: { guessId: string; isCorrect: boolean }) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;

    const ctx = entry.actor.getSnapshot().context;
    const turn = ctx.playerTurns[ctx.currentTurnIndex];
    if (!turn || turn.subjectPlayerId !== playerId) return; // only subject can mark
    if (entry.actor.getSnapshot().value !== 'REVEAL_PHASE') return;

    entry.actor.send({ type: 'MARK_GUESS', guessId: data.guessId, isCorrect: data.isCorrect });

    const newCtx = entry.actor.getSnapshot().context;
    const newTurn = newCtx.playerTurns[newCtx.currentTurnIndex];
    const allMarked = newTurn?.guesses.every((g) => g.isCorrect !== undefined) ?? false;
    if (allMarked && entry.actor.getSnapshot().value === 'REVEAL_PHASE') {
      entry.actor.send({ type: 'ALL_GUESSES_MARKED' });
      // Auto-advance to next turn after score display (4s)
      setRoomTimer(io, roomCode, 'score-display', 4000, () => {
        advanceToNextTurn(io, roomCode);
      });
    }
  });

  // ── Play again ───────────────────────────────────────────────────────────
  socket.on('play:again', () => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;
    const ctx = entry.actor.getSnapshot().context;
    if (ctx.hostId !== playerId) return;
    entry.actor.send({ type: 'PLAY_AGAIN' });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;

    entry.actor.send({ type: 'PLAYER_LEAVE', socketId: socket.id });

    // If all players disconnected, clean up room after 60s
    setTimeout(() => {
      const e = getRoom(roomCode);
      if (!e) return;
      const ctx = e.actor.getSnapshot().context;
      const anyConnected = ctx.players.some((p) => p.isConnected);
      if (!anyConnected) deleteRoom(roomCode);
    }, 60_000);
  });
}

// ── Timer helpers ──────────────────────────────────────────────────────────

function checkAndAssignQuestions(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  const snapshot = entry.actor.getSnapshot();
  if (snapshot.value !== 'ANSWER_PHASE') return; // already moved
  startAnswerSlot(io, roomCode, 0);
}

function startAnswerSlot(io: Server, roomCode: string, slot: number): void {
  const entry = getRoom(roomCode);
  if (!entry) return;

  setRoomTimer(io, roomCode, 'answer-slot', TIMER.ANSWER_SLOT, () => {
    entry.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
    const ctx = entry.actor.getSnapshot().context;
    if (entry.actor.getSnapshot().value === 'ANSWER_PHASE') {
      startAnswerSlot(io, roomCode, ctx.currentQuestionSlot);
    } else if (entry.actor.getSnapshot().value === 'GUESS_PHASE') {
      startGuessPhaseTurn(io, roomCode);
    }
  });
}

function checkSlotComplete(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  const ctx = entry.actor.getSnapshot().context;

  const byPlayer: Record<string, typeof ctx.questionAssignments> = {};
  for (const a of ctx.questionAssignments) {
    if (!byPlayer[a.assignedToPlayerId]) byPlayer[a.assignedToPlayerId] = [];
    byPlayer[a.assignedToPlayerId].push(a);
  }

  const slot = ctx.currentQuestionSlot;
  const allIn = ctx.players.every((p) => {
    const slots = byPlayer[p.id] ?? [];
    const slotA = slots[slot];
    return slotA ? slotA.answer !== undefined || slotA.skipped === true : true;
  });

  if (allIn) {
    clearRoomTimer(roomCode, 'answer-slot');
    entry.actor.send({ type: 'ALL_SLOT_ANSWERS_IN' });
    const newVal = entry.actor.getSnapshot().value;
    if (newVal === 'ANSWER_PHASE') {
      startAnswerSlot(io, roomCode, entry.actor.getSnapshot().context.currentQuestionSlot);
    } else if (newVal === 'GUESS_PHASE') {
      startGuessPhaseTurn(io, roomCode);
    }
  }
}

function startGuessPhaseTurn(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;

  setRoomTimer(io, roomCode, 'guess', TIMER.GUESS, () => {
    entry.actor.send({ type: 'GUESS_TIMER_EXPIRED' });
    startReveal(io, roomCode);
  });
}

function startReveal(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;

  const ctx = entry.actor.getSnapshot().context;
  const turn = ctx.playerTurns[ctx.currentTurnIndex];
  if (!turn) return;

  const total = turn.guesses.length;

  // Edge case: no guesses at all — skip straight to scoring
  if (total === 0) {
    entry.actor.send({ type: 'ALL_GUESSES_MARKED' });
    setRoomTimer(io, roomCode, 'score-display', 4000, () => {
      advanceToNextTurn(io, roomCode);
    });
    return;
  }

  // Reveal guesses one by one every 1.5 seconds
  let idx = 0;

  function revealNext(): void {
    const e = getRoom(roomCode);
    if (!e) return;
    if (idx < total) {
      e.actor.send({ type: 'ADVANCE_REVEAL' });
      idx++;
      setTimeout(revealNext, 1500);
    }
    // After all revealed, subject marks on phone — wait for ALL_GUESSES_MARKED
  }

  setTimeout(revealNext, 800);
}

function advanceToNextTurn(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;

  entry.actor.send({ type: 'NEXT_TURN' });

  const newVal = entry.actor.getSnapshot().value;
  if (newVal === 'GUESS_PHASE') {
    startGuessPhaseTurn(io, roomCode);
  }
}
