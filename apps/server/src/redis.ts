import Redis from 'ioredis';

let client: Redis | null = null;
const NO_REDIS = !process.env.REDIS_URL;

// Always written, so a process without Redis (and tests) still round trip.
// A restart only keeps rooms when REDIS_URL is set and the write reached Redis.
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, ttlSec: number, value: string): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

function memDel(key: string): void {
  memoryStore.delete(key);
}

function memList(prefix: string): string[] {
  const now = Date.now();
  const keys: string[] = [];
  for (const [key, entry] of memoryStore) {
    if (now > entry.expiresAt) {
      memoryStore.delete(key);
      continue;
    }
    if (key.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

export function getRedis(): Redis | null {
  if (NO_REDIS) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });
    client.on('error', (err) => {
      console.error('[Redis] connection error:', err.message);
    });
  }
  return client;
}

export async function kvSet(key: string, ttlSec: number, value: string): Promise<void> {
  memSet(key, ttlSec, value);
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSec);
  } catch (err) {
    console.error('[Redis] set failed:', err instanceof Error ? err.message : err);
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) {
    try {
      const value = await redis.get(key);
      if (value !== null) return value;
    } catch (err) {
      console.error('[Redis] get failed:', err instanceof Error ? err.message : err);
    }
  }
  return memGet(key);
}

export async function kvDel(key: string): Promise<void> {
  memDel(key);
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[Redis] del failed:', err instanceof Error ? err.message : err);
  }
}

export async function kvList(prefix: string): Promise<string[]> {
  const redis = getRedis();
  if (redis) {
    try {
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [next, batch] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
        cursor = next;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length > 0) return keys;
    } catch (err) {
      console.error('[Redis] scan failed:', err instanceof Error ? err.message : err);
    }
  }
  return memList(prefix);
}

export function clearMemoryStore(): void {
  memoryStore.clear();
}

// ── Session token helpers ──────────────────────────────────────────────────

const SESSION_TTL_SEC = 4 * 60 * 60;

export async function saveSession(
  token: string,
  playerId: string,
  roomCode: string,
): Promise<void> {
  await kvSet(`session:${token}`, SESSION_TTL_SEC, JSON.stringify({ playerId, roomCode }));
}

export async function resolveSession(
  token: string,
): Promise<{ playerId: string; roomCode: string } | null> {
  const raw = await kvGet(`session:${token}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { playerId?: string; roomCode?: string };
    if (!parsed.playerId || !parsed.roomCode) return null;
    return { playerId: parsed.playerId, roomCode: parsed.roomCode };
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  await kvDel(`session:${token}`);
}
