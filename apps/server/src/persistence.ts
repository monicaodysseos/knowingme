import type { Server } from 'socket.io';
import { kvDel, kvGet, kvList, kvSet } from './redis';
import { exportRoomState, getRoom, restoreRoom, type SavedRoom } from './roomManager';

const ROOM_TTL_SEC = 4 * 60 * 60;
const ROOM_PREFIX = 'room:';

const tails = new Map<string, Promise<void>>();

function roomKey(code: string): string {
  return `${ROOM_PREFIX}${code}`;
}

export async function persistRoom(code: string): Promise<void> {
  const data = exportRoomState(code);
  if (!data) return;
  await kvSet(roomKey(code), ROOM_TTL_SEC, JSON.stringify(data));
}

/** Queue a save so a later state cannot be overwritten by an earlier write. */
export function schedulePersist(code: string): void {
  const prev = tails.get(code) ?? Promise.resolve();
  const next = prev
    .then(() => persistRoom(code))
    .catch((err) => {
      console.error('[persist]', code, err instanceof Error ? err.message : err);
    });
  tails.set(code, next);
}

export function forgetPersistedRoom(code: string): void {
  const prev = tails.get(code) ?? Promise.resolve();
  const next = prev
    .then(() => kvDel(roomKey(code)))
    .catch((err) => {
      console.error('[persist] delete', code, err instanceof Error ? err.message : err);
    });
  tails.set(code, next);
}

export async function loadRoom(code: string): Promise<SavedRoom | null> {
  const raw = await kvGet(roomKey(code));
  if (!raw) return null;
  return parseSaved(raw);
}

export async function loadAllRooms(): Promise<SavedRoom[]> {
  const keys = await kvList(ROOM_PREFIX);
  const rooms: SavedRoom[] = [];
  for (const key of keys) {
    const raw = await kvGet(key);
    if (!raw) continue;
    const saved = parseSaved(raw);
    if (saved) rooms.push(saved);
  }
  return rooms;
}

export async function restoreAllRooms(io: Server): Promise<string[]> {
  const saved = await loadAllRooms();
  const restored: string[] = [];
  for (const room of saved) {
    if (getRoom(room.roomCode)) {
      restored.push(room.roomCode);
      continue;
    }
    try {
      if (restoreRoom(io, room)) restored.push(room.roomCode);
    } catch (err) {
      console.error('[restore]', room.roomCode, err instanceof Error ? err.message : err);
    }
  }
  return restored;
}

function parseSaved(raw: string): SavedRoom | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedRoom>;
    if (!parsed || parsed.v !== 1) return null;
    if (typeof parsed.roomCode !== 'string' || typeof parsed.hostSecret !== 'string') return null;
    if (!parsed.snapshot || typeof parsed.snapshot !== 'object') return null;
    return {
      v: 1,
      roomCode: parsed.roomCode,
      hostSecret: parsed.hostSecret,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      lastActivityAt: typeof parsed.lastActivityAt === 'number' ? parsed.lastActivityAt : Date.now(),
      snapshot: parsed.snapshot,
    };
  } catch {
    return null;
  }
}
