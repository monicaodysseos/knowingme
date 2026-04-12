import Redis from 'ioredis';

let client: Redis | null = null;
const NO_REDIS = !process.env.REDIS_URL;

// In-process fallback when Redis is not configured (no reconnection persistence)
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memoryStore.delete(key); return null; }
  return entry.value;
}

function memSet(key: string, ttlSec: number, value: string): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

function memDel(key: string): void {
  memoryStore.delete(key);
}

export function getRedis(): Redis | null {
  if (NO_REDIS) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      console.error('[Redis] connection error:', err.message);
    });
  }
  return client;
}

// ── Session token helpers ──────────────────────────────────────────────────

const SESSION_TTL_SEC = 30 * 60; // 30 minutes

export async function saveSession(
  token: string,
  playerId: string,
  roomCode: string,
): Promise<void> {
  const value = JSON.stringify({ playerId, roomCode });
  const redis = getRedis();
  if (redis) {
    await redis.setex(`session:${token}`, SESSION_TTL_SEC, value);
  } else {
    memSet(`session:${token}`, SESSION_TTL_SEC, value);
  }
}

export async function resolveSession(
  token: string,
): Promise<{ playerId: string; roomCode: string } | null> {
  const redis = getRedis();
  const raw = redis
    ? await redis.get(`session:${token}`)
    : memGet(`session:${token}`);
  if (!raw) return null;
  return JSON.parse(raw) as { playerId: string; roomCode: string };
}

export async function deleteSession(token: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`session:${token}`);
  } else {
    memDel(`session:${token}`);
  }
}
