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
      if (!entry) {
        // Room was lost (server restart) — tell TV so it can create a fresh one
        return ack({ ok: false, error: 'Room not found' });
      }
      socket.join(`tv:${roomCode}`);
      socket.join(roomCode);
      socket.data = { roomCode, role: 'tv' };
      // Immediately push current state to this TV socket
      sendCurrentState(io, roomCode, socket.id);
      return ack({ ok: true });
    }

    // Player role — try reconnect first (works in any phase including LOBBY)
    if (sessionToken) {
      // ── In-memory reconnect (no Redis needed) ──────────────────────────────
      // The sessionToken is stored on each Player in the actor context.
      // Checking here first means reconnect always works within the same
      // server process, even when Redis is unavailable.
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
        console.log('[join] reconnected player=%s name=%s', existing.id, existing.name);
        sendCurrentState(io, roomCode, socket.id);
        return ack({ ok: true, playerId: existing.id, sessionToken, color: existing.color });
      }

      // ── Redis fallback (cross-server / post-restart) ────────────────────────
      // Only relevant if the room was freshly recreated after a server restart
      // and the player's data isn't in the new actor context.
      try {
        const session = await resolveSession(sessionToken);
        if (session && session.roomCode === roomCode) {
          // Room exists but player not in context — can't reconnect to a
          // restarted room (state is gone). Fall through to fresh join.
        }
      } catch { /* Redis down — already handled by in-memory path above */ }
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

    try {
      await saveSession(token, newPlayer.id, roomCode);
    } catch (err) {
      console.error('[join] saveSession failed (non-fatal):', err);
    }

    socket.data = {
      roomCode,
      playerId: newPlayer.id,
      role: 'player',
      sessionToken: token,
    };

    // Safety-net: push current state directly to this socket in case the
    // actor.subscribe broadcast fired before the socket finished joining
    // the player room (timing edge case).
    sendCurrentState(io, roomCode, socket.id);

    return ack({
      ok: true,
      playerId: newPlayer.id,
      sessionToken: token,
      color: newPlayer.color,
    });
  });

  // ── Host start ───────────────────────────────────────────────────────────
  socket.on('host:start', (ack?: (res: { ok: boolean; error?: string }) => void) => {
    const { roomCode, role, playerId } = socket.data ?? {};
    console.log('[host:start] roomCode=%s role=%s playerId=%s', roomCode, role, playerId);

    const entry = getRoom(roomCode);
    if (!entry) {
      console.log('[host:start] room not found');
      ack?.({ ok: false, error: 'Room not found' });
      return;
    }

    const ctx = entry.actor.getSnapshot().context;
    // TV socket has no playerId — it IS the host's screen, so always allow it.
    // Player sockets must be the designated host.
    if (role !== 'tv' && ctx.hostId !== playerId) {
      console.log('[host:start] not authorized');
      ack?.({ ok: false, error: 'Not authorized' });
      return;
    }

    // Guard: require at least 3 players to have joined (regardless of current
    // connection state — a player may be mid-reconnect when host clicks Start).
    if (ctx.players.length < 3) {
      console.log('[host:start] not enough players: %d joined', ctx.players.length);
      ack?.({ ok: false, error: `Need 3 players (have ${ctx.players.length})` });
      return;
    }

    entry.actor.send({ type: 'HOST_START' });
    console.log('[host:start] sent HOST_START, new state:', entry.actor.getSnapshot().value);

    // Only set timer if the transition succeeded
    if (entry.actor.getSnapshot().value === 'QUESTION_SUBMISSION') {
      ack?.({ ok: true });
      setRoomTimer(io, roomCode, 'question-sub', TIMER.QUESTION_SUBMISSION, () => {
        const e = getRoom(roomCode);
        if (e) {
          e.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
          if (e.actor.getSnapshot().value === 'ANSWER_PHASE') {
            startAnswerPhase(io, roomCode);
          }
        }
      });
    } else {
      ack?.({ ok: false, error: 'Transition failed (guard not met?)' });
    }
  });

  // ── Submit questions ─────────────────────────────────────────────────────
  socket.on('submit:questions', (questions: string[], ack?: (res: { ok: boolean; error?: string }) => void) => {
    const { roomCode, playerId } = socket.data ?? {};
    console.log('[submit:questions] socket=%s room=%s player=%s', socket.id.slice(0, 8), roomCode, playerId);

    const entry = getRoom(roomCode);
    if (!entry || !playerId) {
      console.log('[submit:questions] REJECTED: no room or no playerId');
      ack?.({ ok: false, error: `Not joined (playerId=${playerId ?? 'none'})` });
      return;
    }

    const qs = questions
      .map((q: string) => q.trim().slice(0, 80))
      .filter((q: string) => q.length > 0)
      .slice(0, 2);

    if (qs.length < 2) {
      console.log('[submit:questions] REJECTED: only %d valid questions', qs.length);
      ack?.({ ok: false, error: 'Need 2 non-empty questions' });
      return;
    }

    entry.actor.send({ type: 'SUBMIT_QUESTIONS', playerId, questions: qs });
    ack?.({ ok: true });

    const ctx = entry.actor.getSnapshot().context;
    const submitted = ctx.players.filter((p) => p.submittedQuestionIds.length >= 2).length;
    console.log('[submit:questions] recorded for %s — %d/%d done', playerId, submitted, ctx.players.length);

    const allDone = submitted === ctx.players.length;
    if (allDone) {
      clearRoomTimer(roomCode, 'question-sub');
      entry.actor.send({ type: 'ALL_QUESTIONS_SUBMITTED' });
      startAnswerPhase(io, roomCode);
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

    checkAnswerPhaseComplete(io, roomCode);
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

    // Only clean up if ALL players have been gone for 10 minutes AND
    // the room is still in LOBBY (never delete an in-progress game).
    setTimeout(() => {
      const e = getRoom(roomCode);
      if (!e) return;
      const snap = e.actor.getSnapshot();
      // Never auto-delete a room that has progressed past the lobby
      if (snap.value !== 'LOBBY') return;
      const anyConnected = snap.context.players.some((p) => p.isConnected);
      if (!anyConnected) deleteRoom(roomCode);
    }, 10 * 60 * 1000); // 10 minutes
  });
}

// ── Timer helpers ──────────────────────────────────────────────────────────

/** Called after ALL_QUESTIONS_SUBMITTED or question-sub timer expires. */
function startAnswerPhase(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  if (entry.actor.getSnapshot().value !== 'ANSWER_PHASE') return;

  setRoomTimer(io, roomCode, 'answer', TIMER.ANSWER_PHASE, () => {
    const e = getRoom(roomCode);
    if (!e) return;
    e.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
    if (e.actor.getSnapshot().value === 'GUESS_PHASE') {
      startGuessPhaseTurn(io, roomCode);
    }
  });
}

/** Check whether all players have answered all their questions; if so, advance. */
function checkAnswerPhaseComplete(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  if (entry.actor.getSnapshot().value !== 'ANSWER_PHASE') return;
  const ctx = entry.actor.getSnapshot().context;

  const byPlayer: Record<string, typeof ctx.questionAssignments> = {};
  for (const a of ctx.questionAssignments) {
    if (!byPlayer[a.assignedToPlayerId]) byPlayer[a.assignedToPlayerId] = [];
    byPlayer[a.assignedToPlayerId].push(a);
  }

  const allDone = ctx.players.every((p) => {
    const mine = byPlayer[p.id] ?? [];
    return mine.length > 0 && mine.every((a) => a.answer !== undefined || a.skipped === true);
  });

  if (allDone) {
    clearRoomTimer(roomCode, 'answer');
    entry.actor.send({ type: 'ALL_ANSWERS_IN' });
    if (entry.actor.getSnapshot().value === 'GUESS_PHASE') {
      startGuessPhaseTurn(io, roomCode);
    }
  }
}

function startGuessPhaseTurn(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;

  const ctx = entry.actor.getSnapshot().context;
  // No turns built (everyone skipped / nobody answered) — skip straight to end
  if (!ctx.playerTurns[ctx.currentTurnIndex]) {
    console.log('[startGuessPhaseTurn] no turn at index %d — skipping to reveal', ctx.currentTurnIndex);
    entry.actor.send({ type: 'GUESS_TIMER_EXPIRED' });
    startReveal(io, roomCode);
    return;
  }

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
  if (!turn) {
    // No turn (empty playerTurns) — fast-forward to FINAL_AWARDS
    entry.actor.send({ type: 'ALL_GUESSES_MARKED' });
    setRoomTimer(io, roomCode, 'score-display', 1000, () => {
      advanceToNextTurn(io, roomCode);
    });
    return;
  }

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
