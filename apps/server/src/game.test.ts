import { createServer } from 'http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import type { Server as IoServer } from 'socket.io';
import type { JoinAck } from '@ksero-se/types';
import { allocateCode, generateRoomCode, secretsMatch } from './codes';
import { guessersOutstanding, RECONNECT_GRACE_MS } from './machine';
import { persistRoom, loadRoom } from './persistence';
import { rateLimit, resetRateLimits } from './rateLimit';
import { clearMemoryStore } from './redis';
import {
  createRoom,
  evictLocalRoom,
  getRoom,
  resetAllRooms,
  restoreRoom,
  sendCurrentState,
  sweepRooms,
} from './roomManager';
import { registerSocketHandlers } from './socketHandlers';
import { sanitizeSettings } from './settings';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@ksero-se/types';
import type { GameContext } from '@ksero-se/types';

function testIo(): IoServer {
  return {
    to: () => ({ emit() {} }),
    sockets: { sockets: new Map() },
  } as unknown as IoServer;
}

beforeEach(() => {
  resetAllRooms();
  resetRateLimits();
  clearMemoryStore();
});

afterEach(() => {
  resetAllRooms();
  clearMemoryStore();
});

describe('room codes', () => {
  it('uses the unambiguous alphabet and a fixed length', () => {
    for (let i = 0; i < 40; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      for (const ch of code) expect(ROOM_CODE_ALPHABET.includes(ch)).toBe(true);
    }
  });

  it('stops when every code it tries is taken', () => {
    expect(allocateCode(() => true, 8)).toBeNull();
  });

  it('compares host secrets without treating a different length as a match', () => {
    expect(secretsMatch('same-secret-value', 'same-secret-value')).toBe(true);
    expect(secretsMatch('short', 'same-secret-value')).toBe(false);
    expect(secretsMatch('', 'same-secret-value')).toBe(false);
  });
});

describe('settings', () => {
  it('clamps anything outside the fixed limits', () => {
    expect(sanitizeSettings({
      maxPlayers: 500,
      questionsToWrite: 0,
      questionsToAnswer: 99,
      phonesOnly: true,
    })).toEqual({
      maxPlayers: 12,
      questionsToWrite: 1,
      questionsToAnswer: 10,
      phonesOnly: true,
    });
    expect(sanitizeSettings('nope')).toEqual({
      maxPlayers: 8,
      questionsToWrite: 2,
      questionsToAnswer: 5,
    });
  });

  it('stores the clamped settings on a new room', () => {
    const created = createRoom(testIo(), 'social', {
      maxPlayers: 1,
      questionsToWrite: 40,
      questionsToAnswer: 1,
    });
    expect(created).not.toBeNull();
    const settings = getRoom(created!.roomCode)!.actor.getSnapshot().context.settings;
    expect(settings.maxPlayers).toBe(2);
    expect(settings.questionsToWrite).toBe(5);
    expect(settings.questionsToAnswer).toBe(2);
  });
});

describe('game machine', () => {
  it('plays a full turn with exactly two players and ignores a guess from the subject', () => {
    const created = createRoom(testIo(), 'social', {
      maxPlayers: 2,
      questionsToWrite: 1,
      questionsToAnswer: 2,
    })!;
    const actor = getRoom(created.roomCode)!.actor;
    actor.send({ type: 'PLAYER_JOIN', name: 'Ada', socketId: 's1', sessionToken: 't1', avatar: 'blob' });
    actor.send({ type: 'PLAYER_JOIN', name: 'Bea', socketId: 's2', sessionToken: 't2', avatar: 'star' });
    actor.send({ type: 'HOST_START' });
    expect(actor.getSnapshot().value).toBe('QUESTION_SUBMISSION');

    for (const player of actor.getSnapshot().context.players) {
      actor.send({ type: 'SUBMIT_QUESTIONS', playerId: player.id, questions: [`Prompt from ${player.name}`] });
    }
    actor.send({ type: 'ALL_QUESTIONS_SUBMITTED' });

    const assignments = actor.getSnapshot().context.questionAssignments;
    expect(assignments.length).toBeGreaterThan(0);
    for (const assignment of assignments) {
      const authorId = actor.getSnapshot().context.questionPool.find((q) => q.id === assignment.questionId)?.submittedByPlayerId;
      expect(assignment.assignedToPlayerId).not.toBe(authorId);
      actor.send({
        type: 'SUBMIT_ANSWER',
        playerId: assignment.assignedToPlayerId,
        assignmentId: assignment.id,
        answer: 'toast',
      });
    }
    actor.send({ type: 'ALL_ANSWERS_IN' });
    expect(actor.getSnapshot().value).toBe('GUESS_PHASE');

    const turn = actor.getSnapshot().context.playerTurns[0];
    actor.send({ type: 'SUBMIT_GUESS', playerId: turn.subjectPlayerId, text: 'my own answer' });
    expect(actor.getSnapshot().context.playerTurns[0].guesses).toHaveLength(0);

    const guesser = actor.getSnapshot().context.players.find((player) => player.id !== turn.subjectPlayerId)!;
    actor.send({ type: 'SUBMIT_GUESS', playerId: guesser.id, text: 'toast' });
    expect(actor.getSnapshot().context.playerTurns[0].guesses).toHaveLength(1);
    expect(actor.getSnapshot().context.playerTurns[0].guesses[0].guesserPlayerId).toBe(guesser.id);

    actor.send({ type: 'ALL_GUESSES_IN' });
    expect(actor.getSnapshot().value).toBe('REVEAL_PHASE');
    actor.send({ type: 'MARK_GUESS', guessId: actor.getSnapshot().context.playerTurns[0].guesses[0].id, isCorrect: true });
    expect(actor.getSnapshot().context.playerTurns[0].guesses[0].isCorrect).toBe(true);
  });

  it('does not start with a single player', () => {
    const created = createRoom(testIo(), 'social')!;
    const actor = getRoom(created.roomCode)!.actor;
    actor.send({ type: 'PLAYER_JOIN', name: 'Ada', socketId: 's1', sessionToken: 't1', avatar: 'blob' });
    actor.send({ type: 'HOST_START' });
    expect(actor.getSnapshot().value).toBe('LOBBY');
  });

  it('waits out a reconnect grace period before the guess step can end', () => {
    const created = createRoom(testIo(), 'social', {
      maxPlayers: 4,
      questionsToWrite: 1,
      questionsToAnswer: 2,
    })!;
    const actor = getRoom(created.roomCode)!.actor;
    actor.send({ type: 'PLAYER_JOIN', name: 'Ada', socketId: 's1', sessionToken: 't1', avatar: 'blob' });
    actor.send({ type: 'PLAYER_JOIN', name: 'Bea', socketId: 's2', sessionToken: 't2', avatar: 'star' });
    actor.send({ type: 'HOST_START' });
    expect(actor.getSnapshot().value).toBe('QUESTION_SUBMISSION');

    for (const player of actor.getSnapshot().context.players) {
      actor.send({ type: 'SUBMIT_QUESTIONS', playerId: player.id, questions: [`Prompt from ${player.name}`] });
    }
    actor.send({ type: 'ALL_QUESTIONS_SUBMITTED' });
    expect(actor.getSnapshot().value).toBe('ANSWER_PHASE');

    for (const assignment of actor.getSnapshot().context.questionAssignments) {
      actor.send({
        type: 'SUBMIT_ANSWER',
        playerId: assignment.assignedToPlayerId,
        assignmentId: assignment.id,
        answer: 'toast',
      });
    }
    actor.send({ type: 'ALL_ANSWERS_IN' });
    expect(actor.getSnapshot().value).toBe('GUESS_PHASE');

    const turn = actor.getSnapshot().context.playerTurns[0];
    const guesser = actor.getSnapshot().context.players.find((player) => player.id !== turn.subjectPlayerId)!;
    actor.send({ type: 'PLAYER_LEAVE', socketId: guesser.socketId });
    actor.send({ type: 'ALL_GUESSES_IN' });
    expect(actor.getSnapshot().value).toBe('GUESS_PHASE');
    expect(guessersOutstanding(actor.getSnapshot().context)).toBe(true);

    const later = actor.getSnapshot().context.players.map((player) => (
      player.id === guesser.id
        ? { ...player, disconnectedAt: Date.now() - RECONNECT_GRACE_MS - 1000 }
        : player
    ));
    const aged = { ...actor.getSnapshot().context, players: later } as GameContext;
    expect(guessersOutstanding(aged)).toBe(false);
  });
});

describe('room lifetime', () => {
  it('expires an empty lobby and keeps a fresh one', () => {
    const created = createRoom(testIo(), 'social')!;
    const code = created.roomCode;
    expect(sweepRooms(Date.now())).toEqual([]);
    expect(getRoom(code)).toBeTruthy();
    expect(sweepRooms(Date.now() + 16 * 60 * 1000)).toEqual([code]);
    expect(getRoom(code)).toBeUndefined();
  });

  it('round trips a room through the saved snapshot', async () => {
    const io = testIo();
    const created = createRoom(io, 'social')!;
    const actor = getRoom(created.roomCode)!.actor;
    actor.send({ type: 'PLAYER_JOIN', name: 'Ada', socketId: 's1', sessionToken: 't1', avatar: 'blob' });
    await persistRoom(created.roomCode);
    evictLocalRoom(created.roomCode);
    expect(getRoom(created.roomCode)).toBeUndefined();

    const saved = await loadRoom(created.roomCode);
    expect(saved?.hostSecret).toBe(created.hostSecret);
    expect(restoreRoom(io, saved!)).toBe(true);
    const restored = getRoom(created.roomCode)!;
    expect(restored.actor.getSnapshot().value).toBe('LOBBY');
    expect(restored.actor.getSnapshot().context.players).toHaveLength(1);
    expect(restored.actor.getSnapshot().context.players[0].isConnected).toBe(false);
    expect(restored.actor.getSnapshot().context.players[0].name).toBe('Ada');
  });
});

describe('rate limit', () => {
  it('blocks once the window is full', () => {
    for (let i = 0; i < 3; i++) expect(rateLimit('lookup:test', 3, 60_000, 1_000)).toBe(true);
    expect(rateLimit('lookup:test', 3, 60_000, 1_000)).toBe(false);
    expect(rateLimit('lookup:test', 3, 60_000, 70_000)).toBe(true);
  });
});

describe('socket host control', () => {
  it('refuses a TV that does not have the host secret and does not fan state out', async () => {
    const httpServer = createServer();
    const io = new Server(httpServer, { transports: ['websocket'] });
    io.on('connection', (socket) => registerSocketHandlers(io, socket));
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const port = (httpServer.address() as { port: number }).port;
    const clients: ClientSocket[] = [];
    const connect = () => {
      const client = ioClient(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
      clients.push(client);
      return client;
    };
    const created = createRoom(io, 'social', { maxPlayers: 4, questionsToWrite: 1, questionsToAnswer: 2 })!;

    try {
      const intruder = connect();
      const denied = await new Promise<JoinAck>((resolve) => {
        intruder.emit('join', { roomCode: created.roomCode, name: '', role: 'tv' }, resolve);
      });
      expect(denied.ok).toBe(false);

      const tv = connect();
      let tvUpdates = 0;
      tv.on('tv:update', () => { tvUpdates += 1; });
      const allowed = await new Promise<JoinAck>((resolve) => {
        tv.emit('join', { roomCode: created.roomCode, name: '', role: 'tv', hostSecret: created.hostSecret }, resolve);
      });
      expect(allowed.ok).toBe(true);

      const phone = connect();
      const phoneUpdates: unknown[] = [];
      phone.on('phone:update', (state) => phoneUpdates.push(state));
      const joined = await new Promise<JoinAck>((resolve) => {
        phone.emit('join', { roomCode: created.roomCode, name: 'Ada', role: 'player', avatar: 'blob' }, resolve);
      });
      expect(joined.ok).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 40));
      const before = tvUpdates;
      sendCurrentState(io, created.roomCode, phone.id!);
      await new Promise((resolve) => setTimeout(resolve, 40));
      expect(tvUpdates).toBe(before);
      expect(phoneUpdates.length).toBeGreaterThan(0);

      const stranger = connect();
      const strangerJoin = await new Promise<JoinAck>((resolve) => {
        stranger.emit('join', { roomCode: created.roomCode, name: 'Bea', role: 'player', avatar: 'star' }, resolve);
      });
      expect(strangerJoin.ok).toBe(true);
      const started = await new Promise<{ ok: boolean }>((resolve) => {
        stranger.emit('host:start', resolve);
      });
      expect(started.ok).toBe(false);
      expect(getRoom(created.roomCode)!.actor.getSnapshot().value).toBe('LOBBY');
    } finally {
      for (const client of clients) client.close();
      io.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });
});
