import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  getRoom,
  deleteRoom,
  setRoomTimer,
  clearRoomTimer,
  sendCurrentState,
  touchRoom,
  attachTv,
  detachTv,
  restoreRoom,
} from './roomManager';
import { loadRoom } from './persistence';
import { resolveSession, saveSession } from './redis';
import {
  TIMER,
  INTRO_MS,
  RESULT_HOLD_MS,
  SCOREBOARD_HOLD_MS,
  MARKING_MS,
  writeMs,
  answerMs,
  answersPerPlayer,
} from './machine';
import type { GameContext, JoinAck } from '@ksero-se/types';
import { secretsMatch } from './codes';
import { parseAnswer, parseGuess, parseJoin, parseQuestions, parseVotes } from './validate';
import { rateLimit } from './rateLimit';
import { RATE, TEXT_LIMITS } from './settings';
import { socketIp } from './origins';

function on(socket: Socket, event: string, handler: (...args: unknown[]) => void | Promise<void>): void {
  socket.on(event, (...args: unknown[]) => {
    const roomCode = socket.data?.roomCode as string | undefined;
    if (roomCode) touchRoom(roomCode);
    Promise.resolve()
      .then(() => handler(...args))
      .catch((err) => {
        console.error(`[socket] ${event} failed`, roomCode ?? '', err instanceof Error ? err.message : err);
        const ack = [...args].reverse().find((item) => typeof item === 'function') as
          | ((res: { ok: boolean; error?: string }) => void)
          | undefined;
        try {
          ack?.({ ok: false, error: 'Something went wrong. Please try again.' });
        } catch {
          /* the client has gone */
        }
      });
  });
}

/** Pre change behaviour: only people still connected have to guess. */
function connectedGuessersOutstanding(ctx: GameContext): boolean {
  const turn = ctx.playerTurns[ctx.currentTurnIndex];
  if (!turn) return false;
  return ctx.players.some((player) => {
    if (player.id === turn.subjectPlayerId || !player.isConnected) return false;
    return !turn.guesses.some((guess) => guess.guesserPlayerId === player.id);
  });
}

function isTvHost(socket: Socket): boolean {
  return socket.data?.role === 'tv' && socket.data?.hostAuthed === true;
}

function canHost(socket: Socket, hostId: string): boolean {
  if (isTvHost(socket)) return true;
  return !!socket.data?.playerId && socket.data.playerId === hostId;
}

export function registerSocketHandlers(io: Server, socket: Socket): void {
  on(socket, 'join', async (...args) => {
    const ack = args[1] as ((res: JoinAck) => void) | undefined;
    const reply = (res: JoinAck) => {
      try { ack?.(res); } catch { /* client gone */ }
    };
    if (!rateLimit(`join:${socketIp(socket)}`, RATE.join.limit, RATE.join.windowMs)) {
      reply({ ok: false, error: 'Too many attempts. Wait a moment and try again.' });
      return;
    }

    const parsed = parseJoin(args[0]);
    if (!parsed.ok) {
      reply({ ok: false, error: parsed.error });
      return;
    }
    const { roomCode, name, sessionToken, role, avatar, hostSecret } = parsed.value;

    let entry = getRoom(roomCode);
    let restored = false;
    if (!entry) {
      const saved = await loadRoom(roomCode);
      if (saved && restoreRoom(io, saved)) {
        entry = getRoom(roomCode);
        restored = !!entry;
      }
    }
    if (!entry) {
      reply({ ok: false, error: 'That room does not exist. Check the code and try again.' });
      return;
    }
    if (restored) armRestoredTimers(io, roomCode);

    const snapshot = entry.actor.getSnapshot();
    const ctx = snapshot.context;

    if (role === 'tv') {
      if (!hostSecret || !secretsMatch(hostSecret, entry.hostSecret)) {
        reply({ ok: false, error: 'Not allowed to host this room.' });
        return;
      }
      socket.join(`tv:${roomCode}`);
      socket.join(roomCode);
      socket.data = { roomCode, role: 'tv', hostAuthed: true };
      attachTv(roomCode, socket.id);
      sendCurrentState(io, roomCode, socket.id);
      reply({ ok: true });
      return;
    }

    if (sessionToken) {
      const existing = ctx.players.find((player) => player.sessionToken === sessionToken);
      if (existing) {
        socket.join(roomCode);
        socket.join(`player:${socket.id}`);
        if (ctx.settings.phonesOnly) socket.join(`tv:${roomCode}`);
        socket.data = { roomCode, playerId: existing.id, role: 'player', sessionToken };
        entry.actor.send({
          type: 'PLAYER_RECONNECT',
          sessionToken,
          socketId: existing.socketId,
          newSocketId: socket.id,
        });
        sendCurrentState(io, roomCode, socket.id);
        saveSession(sessionToken, existing.id, roomCode).catch((err) => {
          console.error('[join] saveSession failed:', err instanceof Error ? err.message : err);
        });
        reply({ ok: true, playerId: existing.id, sessionToken, color: existing.color });
        return;
      }

      if (snapshot.value !== 'LOBBY') {
        const session = await resolveSession(sessionToken);
        if (session && session.roomCode === roomCode) {
          reply({ ok: false, error: 'Could not rejoin this game. Ask the host to start a new one.' });
          return;
        }
      }
    }

    if (snapshot.value !== 'LOBBY') {
      reply({ ok: false, error: 'This game has already started.' });
      return;
    }
    if (ctx.players.length >= ctx.settings.maxPlayers) {
      reply({ ok: false, error: 'This room is full.' });
      return;
    }

    const trimmedName = (name ?? '').trim().slice(0, TEXT_LIMITS.name);
    if (!trimmedName) {
      reply({ ok: false, error: 'Please enter a name.' });
      return;
    }

    const token = sessionToken ?? uuidv4();
    socket.join(roomCode);
    socket.join(`player:${socket.id}`);
    if (ctx.settings.phonesOnly) socket.join(`tv:${roomCode}`);

    entry.actor.send({
      type: 'PLAYER_JOIN',
      name: trimmedName,
      socketId: socket.id,
      sessionToken: token,
      avatar: avatar ?? 'blob',
    });

    const newPlayer = entry.actor.getSnapshot().context.players.find((player) => player.socketId === socket.id);
    if (!newPlayer) {
      reply({ ok: false, error: 'Could not join. Please try again.' });
      return;
    }

    socket.data = { roomCode, playerId: newPlayer.id, role: 'player', sessionToken: token };
    sendCurrentState(io, roomCode, socket.id);
    reply({ ok: true, playerId: newPlayer.id, sessionToken: token, color: newPlayer.color });

    saveSession(token, newPlayer.id, roomCode).catch((err) => {
      console.error('[join] saveSession failed:', err instanceof Error ? err.message : err);
    });
  });

  on(socket, 'host:start', (...args) => {
    const ack = args[0] as ((res: { ok: boolean; error?: string }) => void) | undefined;
    const { roomCode } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry) {
      ack?.({ ok: false, error: 'That room does not exist. Check the code and try again.' });
      return;
    }
    const ctx = entry.actor.getSnapshot().context;
    if (!canHost(socket, ctx.hostId)) {
      ack?.({ ok: false, error: 'Not allowed to do that.' });
      return;
    }
    const minToStart = Math.min(2, ctx.settings.maxPlayers);
    if (ctx.players.length < minToStart) {
      ack?.({ ok: false, error: `Need ${minToStart} players before you can start.` });
      return;
    }

    entry.actor.send({ type: 'HOST_START' });
    if (entry.actor.getSnapshot().value === 'QUESTION_SUBMISSION') {
      ack?.({ ok: true });
      const writeWindow = INTRO_MS + writeMs(ctx.settings.questionsToWrite);
      setRoomTimer(io, roomCode, 'question-sub', writeWindow, () => {
        const current = getRoom(roomCode);
        if (!current) return;
        current.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
        if (current.actor.getSnapshot().value === 'ANSWER_PHASE') startAnswerPhase(io, roomCode);
      });
    } else {
      ack?.({ ok: false, error: 'The game could not start yet.' });
    }
  });

  on(socket, 'submit:questions', (...args) => {
    const ack = args[1] as ((res: { ok: boolean; error?: string }) => void) | undefined;
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) {
      ack?.({ ok: false, error: 'Could not join. Please try again.' });
      return;
    }
    if (entry.actor.getSnapshot().context.introEndsAt > Date.now()) {
      ack?.({ ok: false, error: 'Read the instructions first.' });
      return;
    }
    const parsed = parseQuestions(args[0]);
    if (!parsed) {
      ack?.({ ok: false, error: 'Those questions could not be read.' });
      return;
    }
    const required = entry.actor.getSnapshot().context.settings.questionsToWrite;
    const questions = parsed
      .map((question) => question.trim().slice(0, TEXT_LIMITS.question))
      .filter((question) => question.length > 0)
      .slice(0, required);
    if (questions.length < required) {
      ack?.({ ok: false, error: `Need ${required} questions with some text.` });
      return;
    }
    entry.actor.send({ type: 'SUBMIT_QUESTIONS', playerId, questions });
    ack?.({ ok: true });

    const ctx = entry.actor.getSnapshot().context;
    const submitted = ctx.players.filter((player) => player.submittedQuestionIds.length >= ctx.settings.questionsToWrite).length;
    if (submitted === ctx.players.length) {
      clearRoomTimer(roomCode, 'question-sub');
      entry.actor.send({ type: 'ALL_QUESTIONS_SUBMITTED' });
      startAnswerPhase(io, roomCode);
    }
  });

  on(socket, 'submit:answer', (...args) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;
    if (entry.actor.getSnapshot().context.introEndsAt > Date.now()) return;
    const parsed = parseAnswer(args[0]);
    if (!parsed) return;
    entry.actor.send({
      type: 'SUBMIT_ANSWER',
      playerId,
      assignmentId: parsed.assignmentId,
      answer: parsed.answer,
      skipped: parsed.skipped,
      elapsedMs: 0,
    });
    checkAnswerPhaseComplete(io, roomCode);
  });

  on(socket, 'submit:guess', (...args) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;
    if (entry.actor.getSnapshot().context.introEndsAt > Date.now()) return;
    const text = parseGuess(args[0]);
    if (text === null) return;
    entry.actor.send({ type: 'SUBMIT_GUESS', playerId, text });
    maybeCompleteGuesses(io, roomCode);
  });

  on(socket, 'submit:vote', (...args) => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;
    if (entry.actor.getSnapshot().value !== 'REVEAL_PHASE') return;
    const votes = parseVotes(args[0]);
    if (!votes) return;

    const ctx = entry.actor.getSnapshot().context;
    const turn = ctx.playerTurns[ctx.currentTurnIndex];
    if (!turn || playerId !== turn.subjectPlayerId) return;

    for (const vote of votes) {
      entry.actor.send({ type: 'MARK_GUESS', guessId: vote.guessId, isCorrect: vote.isCorrect });
    }
    entry.actor.send({ type: 'ALL_GUESSES_MARKED' });
    clearRoomTimer(roomCode, 'marking');
    setRoomTimer(io, roomCode, 'reveal-hold', RESULT_HOLD_MS, () => {
      goToScore(io, roomCode);
    });
  });

  on(socket, 'play:again', () => {
    const { roomCode } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry) return;
    const ctx = entry.actor.getSnapshot().context;
    if (!canHost(socket, ctx.hostId)) return;
    entry.actor.send({ type: 'PLAY_AGAIN' });
  });

  on(socket, 'skip:intro', () => {
    const { roomCode } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry) return;
    const ctx = entry.actor.getSnapshot().context;
    if (!canHost(socket, ctx.hostId)) return;
    if (!(ctx.introEndsAt > Date.now())) return;

    entry.actor.send({ type: 'SKIP_INTRO' });
    const phase = entry.actor.getSnapshot().value;
    const next = entry.actor.getSnapshot().context;
    if (phase === 'GUESS_PHASE') {
      setRoomTimer(io, roomCode, 'guess', TIMER.GUESS, () => {
        const current = getRoom(roomCode);
        if (!current) return;
        current.actor.send({ type: 'GUESS_TIMER_EXPIRED' });
        startReveal(io, roomCode);
      });
    } else if (phase === 'QUESTION_SUBMISSION') {
      setRoomTimer(io, roomCode, 'question-sub', writeMs(next.settings.questionsToWrite), () => {
        const current = getRoom(roomCode);
        if (!current) return;
        current.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
        if (current.actor.getSnapshot().value === 'ANSWER_PHASE') startAnswerPhase(io, roomCode);
      });
    } else if (phase === 'ANSWER_PHASE') {
      const per = answersPerPlayer(next.questionAssignments.length, next.players.length);
      setRoomTimer(io, roomCode, 'answer', answerMs(per), () => {
        const current = getRoom(roomCode);
        if (!current) return;
        current.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
        if (current.actor.getSnapshot().value === 'GUESS_PHASE') startGuessPhaseTurn(io, roomCode);
      });
    }
  });

  on(socket, 'host:continue', () => {
    const { roomCode, playerId } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry) return;
    const ctx = entry.actor.getSnapshot().context;
    const phase = entry.actor.getSnapshot().value;
    if (phase === 'REVEAL_PHASE') {
      const turn = ctx.playerTurns[ctx.currentTurnIndex];
      const isMarker = !!turn && playerId === turn.subjectPlayerId;
      if (!canHost(socket, ctx.hostId) && !isMarker) return;
      const marked = !turn || turn.guesses.length === 0 || turn.guesses.every((guess) => guess.isCorrect !== undefined);
      if (!marked) return;
      goToScore(io, roomCode);
    } else if (phase === 'SCORE_PHASE') {
      if (!canHost(socket, ctx.hostId)) return;
      clearRoomTimer(roomCode, 'score-hold');
      advanceToNextTurn(io, roomCode);
    }
  });

  on(socket, 'host:restart', () => {
    const { roomCode } = socket.data ?? {};
    const entry = getRoom(roomCode);
    if (!entry) return;
    const ctx = entry.actor.getSnapshot().context;
    if (!canHost(socket, ctx.hostId)) return;
    for (const key of ['question-sub', 'answer', 'guess', 'marking', 'reveal-hold', 'score-hold']) {
      clearRoomTimer(roomCode, key);
    }
    io.to(roomCode).emit('room:closed');
    deleteRoom(roomCode);
  });

  on(socket, 'disconnect', () => {
    const { roomCode, playerId, role } = socket.data ?? {};
    if (!roomCode) return;
    if (role === 'tv') {
      detachTv(roomCode, socket.id);
      return;
    }
    const entry = getRoom(roomCode);
    if (!entry || !playerId) return;
    entry.actor.send({ type: 'PLAYER_LEAVE', socketId: socket.id });
    if (entry.actor.getSnapshot().value === 'GUESS_PHASE') {
      maybeCompleteGuesses(io, roomCode);
    }
  });
}

export function armRestoredTimers(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  const phase = String(entry.actor.getSnapshot().value);
  const ctx = entry.actor.getSnapshot().context;
  const soon = (timerEnd: number) => (timerEnd > Date.now() ? timerEnd - Date.now() : 1000);

  if (phase === 'QUESTION_SUBMISSION') {
    setRoomTimer(io, roomCode, 'question-sub', soon(ctx.timerEnd), () => {
      const current = getRoom(roomCode);
      if (!current) return;
      current.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
      if (current.actor.getSnapshot().value === 'ANSWER_PHASE') startAnswerPhase(io, roomCode);
    });
  } else if (phase === 'ANSWER_PHASE') {
    setRoomTimer(io, roomCode, 'answer', soon(ctx.timerEnd), () => {
      const current = getRoom(roomCode);
      if (!current) return;
      current.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
      if (current.actor.getSnapshot().value === 'GUESS_PHASE') startGuessPhaseTurn(io, roomCode);
    });
  } else if (phase === 'GUESS_PHASE') {
    setRoomTimer(io, roomCode, 'guess', soon(ctx.timerEnd), () => {
      const current = getRoom(roomCode);
      if (!current) return;
      current.actor.send({ type: 'GUESS_TIMER_EXPIRED' });
      startReveal(io, roomCode);
    });
  } else if (phase === 'REVEAL_PHASE') {
    const turn = ctx.playerTurns[ctx.currentTurnIndex];
    const unmarked = !!turn && turn.guesses.some((guess) => guess.isCorrect === undefined);
    if (unmarked) {
      setRoomTimer(io, roomCode, 'marking', MARKING_MS, () => finishUnmarked(io, roomCode));
    } else {
      setRoomTimer(io, roomCode, 'reveal-hold', soon(ctx.timerEnd), () => goToScore(io, roomCode));
    }
  } else if (phase === 'SCORE_PHASE') {
    setRoomTimer(io, roomCode, 'score-hold', soon(ctx.timerEnd), () => advanceToNextTurn(io, roomCode));
  }
}

function maybeCompleteGuesses(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry || entry.actor.getSnapshot().value !== 'GUESS_PHASE') return;
  const ctx = entry.actor.getSnapshot().context;
  if (connectedGuessersOutstanding(ctx)) return;
  clearRoomTimer(roomCode, 'guess');
  entry.actor.send({ type: 'ALL_GUESSES_IN' });
  if (entry.actor.getSnapshot().value === 'REVEAL_PHASE') startReveal(io, roomCode);
}

function startAnswerPhase(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry || entry.actor.getSnapshot().value !== 'ANSWER_PHASE') return;
  const actx = entry.actor.getSnapshot().context;
  const perPlayer = answersPerPlayer(actx.questionAssignments.length, actx.players.length);
  setRoomTimer(io, roomCode, 'answer', INTRO_MS + answerMs(perPlayer), () => {
    const current = getRoom(roomCode);
    if (!current) return;
    current.actor.send({ type: 'SLOT_TIMER_EXPIRED' });
    if (current.actor.getSnapshot().value === 'GUESS_PHASE') startGuessPhaseTurn(io, roomCode);
  });
}

function checkAnswerPhaseComplete(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry || entry.actor.getSnapshot().value !== 'ANSWER_PHASE') return;
  const ctx = entry.actor.getSnapshot().context;
  const byPlayer: Record<string, typeof ctx.questionAssignments> = {};
  for (const assignment of ctx.questionAssignments) {
    if (!byPlayer[assignment.assignedToPlayerId]) byPlayer[assignment.assignedToPlayerId] = [];
    byPlayer[assignment.assignedToPlayerId].push(assignment);
  }
  const allDone = ctx.players.every((player) => {
    const mine = byPlayer[player.id] ?? [];
    return mine.length > 0 && mine.every((assignment) => assignment.answer !== undefined || assignment.skipped === true);
  });
  if (!allDone) return;
  clearRoomTimer(roomCode, 'answer');
  entry.actor.send({ type: 'ALL_ANSWERS_IN' });
  if (entry.actor.getSnapshot().value === 'GUESS_PHASE') startGuessPhaseTurn(io, roomCode);
}

function startGuessPhaseTurn(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  const ctx = entry.actor.getSnapshot().context;
  if (!ctx.playerTurns[ctx.currentTurnIndex]) {
    entry.actor.send({ type: 'GUESS_TIMER_EXPIRED' });
    startReveal(io, roomCode);
    return;
  }
  const introOffset = ctx.currentTurnIndex === 0 ? INTRO_MS : 0;
  setRoomTimer(io, roomCode, 'guess', introOffset + TIMER.GUESS, () => {
    const current = getRoom(roomCode);
    if (!current) return;
    current.actor.send({ type: 'GUESS_TIMER_EXPIRED' });
    startReveal(io, roomCode);
  });
}

function startReveal(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  const ctx = entry.actor.getSnapshot().context;
  const turn = ctx.playerTurns[ctx.currentTurnIndex];
  if (!turn || turn.guesses.length === 0) {
    entry.actor.send({ type: 'ALL_GUESSES_MARKED' });
    goToScore(io, roomCode);
    return;
  }
  for (let i = 0; i < turn.guesses.length; i++) {
    entry.actor.send({ type: 'ADVANCE_REVEAL' });
  }
  setRoomTimer(io, roomCode, 'marking', MARKING_MS, () => finishUnmarked(io, roomCode));
}

function finishUnmarked(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry || entry.actor.getSnapshot().value !== 'REVEAL_PHASE') return;
  const ctx = entry.actor.getSnapshot().context;
  const turn = ctx.playerTurns[ctx.currentTurnIndex];
  if (!turn) return;
  if (turn.guesses.every((guess) => guess.isCorrect !== undefined)) return;
  for (const guess of turn.guesses) {
    if (guess.isCorrect === undefined) {
      entry.actor.send({ type: 'MARK_GUESS', guessId: guess.id, isCorrect: false });
    }
  }
  entry.actor.send({ type: 'ALL_GUESSES_MARKED' });
  setRoomTimer(io, roomCode, 'reveal-hold', RESULT_HOLD_MS, () => goToScore(io, roomCode));
}

function goToScore(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  clearRoomTimer(roomCode, 'reveal-hold');
  if (entry.actor.getSnapshot().value === 'REVEAL_PHASE') {
    entry.actor.send({ type: 'GO_TO_SCORE' });
  }
  if (entry.actor.getSnapshot().value === 'SCORE_PHASE') {
    setRoomTimer(io, roomCode, 'score-hold', SCOREBOARD_HOLD_MS, () => {
      advanceToNextTurn(io, roomCode);
    });
  }
}

function advanceToNextTurn(io: Server, roomCode: string): void {
  const entry = getRoom(roomCode);
  if (!entry) return;
  clearRoomTimer(roomCode, 'score-hold');
  entry.actor.send({ type: 'NEXT_TURN' });
  if (entry.actor.getSnapshot().value === 'GUESS_PHASE') startGuessPhaseTurn(io, roomCode);
}
