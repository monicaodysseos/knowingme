import type { Server, Socket } from 'socket.io';
import type { JoinAck, JoinPayload, PhoneState, TVState } from '@ksero-se/types';
import { copy } from '@ksero-se/types';
import { allocateCode, codeInUse, newHostSecret, secretsMatch, totalRoomCount, watchCodes, watchRoomCount } from './codes';
import { FakesGame, type FakesSettings, type FakesSnapshot } from './fakes/engine';
import { saveSession } from './redis';
import { ROOM_CAPS, TEXT_LIMITS } from './settings';

interface FakesEntry {
  game: FakesGame;
  hostSecret: string;
  createdAt: number;
  lastActivityAt: number;
  tvSockets: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
  io: Server;
}

export interface SavedFakesRoom {
  v: 2;
  rules: 'fakes';
  roomCode: string;
  hostSecret: string;
  createdAt: number;
  lastActivityAt: number;
  introSeen: string[];
  snapshot: FakesSnapshot;
}

const rooms = new Map<string, FakesEntry>();
const seenHow = new Set<string>();

let onChanged: (code: string) => void = () => {};
let onDeleted: (code: string) => void = () => {};

watchCodes((code) => rooms.has(code));
watchRoomCount(() => rooms.size);

export function setFakesHooks(hooks: {
  onChanged?: (code: string) => void;
  onDeleted?: (code: string) => void;
}): void {
  if (hooks.onChanged) onChanged = hooks.onChanged;
  if (hooks.onDeleted) onDeleted = hooks.onDeleted;
}

export function isFakesRoom(code: string | undefined): boolean {
  return !!code && rooms.has(code);
}

export function fakesRoomCount(): number {
  return rooms.size;
}

export function resetFakesRooms(): void {
  for (const entry of rooms.values()) {
    if (entry.timer) clearTimeout(entry.timer);
  }
  rooms.clear();
}

export function resetSeenHow(): void {
  seenHow.clear();
}

export function rememberHow(token: string): void {
  if (token) seenHow.add(token);
}

function scaleMs(ms: number): number {
  if (!process.env.VITEST) return ms;
  const scale = Number(process.env.KSEROSE_FAKES_TIMER_SCALE ?? '1');
  if (!Number.isFinite(scale) || scale <= 0 || scale >= 1) return ms;
  return Math.max(20, Math.round(ms * scale));
}

function hooksFor() {
  return {
    seen: (token: string) => seenHow.has(token),
    markSeen: (token: string) => {
      if (token) seenHow.add(token);
    },
  };
}

export function createFakesRoom(io: Server, settings: FakesSettings): { roomCode: string; hostSecret: string } | null {
  if (totalRoomCount() >= ROOM_CAPS.maxRooms) return null;
  const roomCode = allocateCode((code) => codeInUse(code));
  if (!roomCode) return null;
  const now = Date.now();
  const entry: FakesEntry = {
    game: new FakesGame(roomCode, settings, hooksFor()),
    hostSecret: newHostSecret(),
    createdAt: now,
    lastActivityAt: now,
    tvSockets: new Set(),
    timer: null,
    io,
  };
  rooms.set(roomCode, entry);
  try { onChanged(roomCode); } catch (err) {
    console.error(`[fakes ${roomCode}] persist failed:`, err instanceof Error ? err.message : err);
  }
  return { roomCode, hostSecret: entry.hostSecret };
}

export function exportFakesState(roomCode: string): SavedFakesRoom | null {
  const entry = rooms.get(roomCode);
  if (!entry) return null;
  return {
    v: 2,
    rules: 'fakes',
    roomCode,
    hostSecret: entry.hostSecret,
    createdAt: entry.createdAt,
    lastActivityAt: entry.lastActivityAt,
    introSeen: [...seenHow],
    snapshot: entry.game.toSnapshot(),
  };
}

export function restoreFakesRoom(io: Server, saved: SavedFakesRoom): boolean {
  if (rooms.has(saved.roomCode)) return true;
  if (!saved.hostSecret || !saved.snapshot) return false;
  if (totalRoomCount() >= ROOM_CAPS.maxRooms) return false;
  for (const token of saved.introSeen ?? []) seenHow.add(token);
  let game: FakesGame;
  try {
    game = FakesGame.fromSnapshot(saved.roomCode, saved.snapshot, hooksFor());
  } catch (err) {
    console.error(`[fakes restore] ${saved.roomCode}:`, err instanceof Error ? err.message : err);
    return false;
  }
  const now = Date.now();
  for (const player of game.players) {
    player.isConnected = false;
    player.disconnectedAt = player.disconnectedAt ?? now;
  }
  const entry: FakesEntry = {
    game,
    hostSecret: saved.hostSecret,
    createdAt: saved.createdAt || now,
    lastActivityAt: saved.lastActivityAt || now,
    tvSockets: new Set(),
    timer: null,
    io,
  };
  rooms.set(saved.roomCode, entry);
  arm(entry);
  return true;
}

export function sweepFakesRooms(now = Date.now()): string[] {
  const removed: string[] = [];
  for (const [code, entry] of rooms) {
    const players = entry.game.players;
    const anyone = players.some((player) => player.isConnected) || entry.tvSockets.size > 0;
    const idle = now - entry.lastActivityAt;
    const age = now - entry.createdAt;
    let drop = false;
    if (idle >= ROOM_CAPS.staleMs) drop = true;
    else if (!anyone && players.length === 0 && age >= ROOM_CAPS.emptyLobbyMs) drop = true;
    else if (!anyone && entry.game.phase === 'LOBBY' && idle >= ROOM_CAPS.idleLobbyMs) drop = true;
    else if (!anyone && entry.game.phase !== 'LOBBY' && idle >= ROOM_CAPS.abandonedGameMs) drop = true;
    if (drop) {
      deleteFakesRoom(code);
      removed.push(code);
    }
  }
  return removed;
}

export function deleteFakesRoom(roomCode: string): void {
  const entry = rooms.get(roomCode);
  if (!entry) return;
  if (entry.timer) clearTimeout(entry.timer);
  rooms.delete(roomCode);
  try { onDeleted(roomCode); } catch (err) {
    console.error(`[fakes ${roomCode}] delete hook failed:`, err instanceof Error ? err.message : err);
  }
}

export function touchFakesRoom(roomCode: string): void {
  const entry = rooms.get(roomCode);
  if (entry) entry.lastActivityAt = Date.now();
}

function arm(entry: FakesEntry): void {
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = null;
  const at = entry.game.nextDeadline();
  if (at == null) return;
  const wait = Math.max(0, at - Date.now());
  entry.timer = setTimeout(() => {
    entry.timer = null;
    try {
      entry.game.expire(Date.now());
      changed(entry);
    } catch (err) {
      console.error(`[fakes ${entry.game.roomCode}] timer failed:`, err instanceof Error ? err.message : err);
    }
  }, scaleMs(wait));
}

function changed(entry: FakesEntry): void {
  entry.lastActivityAt = Date.now();
  try { broadcast(entry); } catch (err) {
    console.error(`[fakes ${entry.game.roomCode}] broadcast failed:`, err instanceof Error ? err.message : err);
  }
  arm(entry);
  try { onChanged(entry.game.roomCode); } catch (err) {
    console.error(`[fakes ${entry.game.roomCode}] persist failed:`, err instanceof Error ? err.message : err);
  }
}

function broadcast(entry: FakesEntry): void {
  const code = entry.game.roomCode;
  entry.io.to(`tv:${code}`).emit('tv:update', tvPayload(entry));
  for (const player of entry.game.players) {
    if (!player.socketId) continue;
    entry.io.to(`player:${player.socketId}`).emit('phone:update', phonePayload(entry, player.id));
  }
}

function sendOne(entry: FakesEntry, socket: Socket): void {
  const role = socket.data?.role;
  const playerId = socket.data?.playerId as string | undefined;
  if (role === 'tv' || entry.game.settings.phonesOnly) {
    socket.emit('tv:update', tvPayload(entry));
  }
  if (playerId) socket.emit('phone:update', phonePayload(entry, playerId));
}

function tvPayload(entry: FakesEntry): TVState {
  const view = entry.game.viewTv();
  return {
    phase: 'LOBBY',
    roomCode: view.roomCode,
    settings: {
      maxPlayers: entry.game.settings.maxPlayers,
      questionsToWrite: entry.game.settings.questionsToWrite,
      questionsToAnswer: entry.game.settings.questionsToWrite,
      phonesOnly: entry.game.settings.phonesOnly || undefined,
      longGame: entry.game.settings.longGame,
    },
    players: view.players.map((player) => ({
      id: player.playerId,
      name: player.name,
      color: player.color as TVState['players'][number]['color'],
      avatar: player.avatar,
      isConnected: player.connected,
      isHost: player.isHost,
    })),
    scores: view.players.map((player) => ({
      playerId: player.playerId,
      playerName: player.name,
      color: player.color as TVState['scores'][number]['color'],
      score: player.score,
      delta: 0,
    })),
    timerEnd: view.timerEnd,
    timerTotalMs: view.timerTotalMs,
    mode: 'social',
    rules: 'fakes',
    fakes: view,
  };
}

function phonePayload(entry: FakesEntry, playerId: string): PhoneState {
  const view = entry.game.viewPhone(playerId);
  const player = entry.game.players.find((item) => item.id === playerId);
  return {
    phase: 'LOBBY',
    playerId,
    timerEnd: view.timerEnd,
    timerTotalMs: view.timerTotalMs,
    action: { type: 'WAIT', message: copy.eyes },
    turnIndex: view.turnNumber ?? 0,
    isHost: !!player?.isHost,
    playerCount: entry.game.players.length,
    canStart: entry.game.players.length >= 2,
    introEndsAt: 0,
    phonesOnly: entry.game.settings.phonesOnly,
    finalRevealAt: 0,
    canContinue: false,
    rules: 'fakes',
    fakes: view,
  };
}

function ackFrom(args: unknown[]): ((res: { ok: boolean; error?: string }) => void) | undefined {
  const found = [...args].reverse().find((item) => typeof item === 'function');
  return found as ((res: { ok: boolean; error?: string }) => void) | undefined;
}

function canHost(socket: Socket, entry: FakesEntry): boolean {
  if (socket.data?.role === 'tv' && socket.data?.hostAuthed === true) return true;
  return !!socket.data?.playerId && socket.data.playerId === entry.game.hostId;
}

export function joinFakes(io: Server, socket: Socket, payload: JoinPayload, reply: (res: JoinAck) => void): void {
  const entry = rooms.get(payload.roomCode);
  if (!entry) {
    reply({ ok: false, error: 'That room does not exist. Check the code and try again.' });
    return;
  }
  entry.io = io;
  if (payload.role === 'tv') {
    if (!payload.hostSecret || !secretsMatch(payload.hostSecret, entry.hostSecret)) {
      reply({ ok: false, error: 'Not allowed to host this room.' });
      return;
    }
    socket.join(`tv:${payload.roomCode}`);
    socket.join(payload.roomCode);
    socket.data = { roomCode: payload.roomCode, role: 'tv', hostAuthed: true };
    entry.tvSockets.add(socket.id);
    entry.lastActivityAt = Date.now();
    sendOne(entry, socket);
    reply({ ok: true });
    return;
  }

  const joined = entry.game.join({
    name: payload.name,
    socketId: socket.id,
    sessionToken: payload.sessionToken,
    avatar: payload.avatar,
  });
  if (!joined.ok) {
    reply({ ok: false, error: joined.error });
    return;
  }
  socket.join(payload.roomCode);
  socket.join(`player:${socket.id}`);
  if (entry.game.settings.phonesOnly) socket.join(`tv:${payload.roomCode}`);
  socket.data = {
    roomCode: payload.roomCode,
    playerId: joined.playerId,
    role: 'player',
    sessionToken: joined.sessionToken,
  };
  entry.lastActivityAt = Date.now();
  broadcast(entry);
  sendOne(entry, socket);
  reply({ ok: true, playerId: joined.playerId, sessionToken: joined.sessionToken, color: joined.color });
  saveSession(joined.sessionToken, joined.playerId, payload.roomCode).catch((err) => {
    console.error('[fakes join] saveSession failed:', err instanceof Error ? err.message : err);
  });
}

export function handleFakesEvent(io: Server, socket: Socket, event: string, args: unknown[]): void {
  const roomCode = socket.data?.roomCode as string | undefined;
  const entry = roomCode ? rooms.get(roomCode) : undefined;
  const ack = ackFrom(args);
  if (!entry) {
    ack?.({ ok: false, error: 'That room does not exist. Check the code and try again.' });
    return;
  }
  entry.io = io;
  const playerId = socket.data?.playerId as string | undefined;
  const now = Date.now();

  if (event === 'host:start') {
    if (!canHost(socket, entry)) {
      ack?.({ ok: false, error: 'Not allowed to do that.' });
      return;
    }
    if (entry.game.players.length < 2) {
      ack?.({ ok: false, error: 'Need 2 players before you can start.' });
      return;
    }
    const started = entry.game.start(now);
    ack?.(started ? { ok: true } : { ok: false, error: 'The game could not start yet.' });
    if (started) changed(entry);
    return;
  }

  if (event === 'submit:questions') {
    if (!playerId) {
      ack?.({ ok: false, error: 'Could not join. Please try again.' });
      return;
    }
    const raw = args[0];
    const list = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
    if (!Array.isArray(raw) || raw.length > TEXT_LIMITS.maxQuestions) {
      ack?.({ ok: false, error: 'Those questions could not be read.' });
      return;
    }
    const error = entry.game.submitQuestions(playerId, list, now);
    ack?.(error ? { ok: false, error } : { ok: true });
    changed(entry);
    return;
  }

  if (event === 'submit:answer') {
    if (!playerId) return;
    const body = args[0] as { answers?: Array<{ assignmentId?: string; text?: string }> } | undefined;
    const answers = Array.isArray(body?.answers)
      ? body!.answers
        .filter((item) => item && typeof item.assignmentId === 'string')
        .map((item) => ({ assignmentId: item.assignmentId as string, text: typeof item.text === 'string' ? item.text : '' }))
      : [];
    const error = entry.game.submitAnswers(playerId, answers, now);
    ack?.(error ? { ok: false, error } : { ok: true });
    changed(entry);
    return;
  }

  if (event === 'submit:fake') {
    if (!playerId) return;
    const body = args[0] as { text?: string } | string | undefined;
    const text = typeof body === 'string' ? body : typeof body?.text === 'string' ? body.text : '';
    const error = entry.game.submitFake(playerId, text, now);
    ack?.(error ? { ok: false, error } : { ok: true });
    changed(entry);
    return;
  }

  if (event === 'submit:vote') {
    if (!playerId) return;
    const body = args[0] as { optionId?: string } | undefined;
    if (!body || typeof body.optionId !== 'string') return;
    const error = entry.game.submitVote(playerId, body.optionId, now);
    ack?.(error ? { ok: false, error } : { ok: true });
    changed(entry);
    return;
  }

  if (event === 'submit:literally') {
    if (!playerId) return;
    const body = args[0] as { optionId?: string | null } | undefined;
    const optionId = body && (typeof body.optionId === 'string' || body.optionId === null) ? body.optionId : null;
    const error = entry.game.submitLiterally(playerId, optionId, now);
    ack?.(error ? { ok: false, error } : { ok: true });
    changed(entry);
    return;
  }

  if (event === 'skip:intro') {
    if (!canHost(socket, entry) && socket.data?.role !== 'player') return;
    if (entry.game.gotIt(now)) changed(entry);
    return;
  }

  if (event === 'play:again') {
    if (!canHost(socket, entry)) return;
    entry.game.playAgain(now);
    changed(entry);
    return;
  }

  if (event === 'host:restart') {
    if (!canHost(socket, entry)) return;
    entry.io.to(entry.game.roomCode).emit('room:closed');
    deleteFakesRoom(entry.game.roomCode);
    return;
  }

  if (event === 'disconnect') {
    if (socket.data?.role === 'tv') {
      entry.tvSockets.delete(socket.id);
      entry.lastActivityAt = Date.now();
      return;
    }
    if (playerId) {
      entry.game.disconnect(playerId, now);
      changed(entry);
    }
  }
}
