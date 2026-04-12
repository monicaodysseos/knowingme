import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    client = new Redis(url, {
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
  const redis = getRedis();
  await redis.setex(`session:${token}`, SESSION_TTL_SEC, JSON.stringify({ playerId, roomCode }));
}

export async function resolveSession(
  token: string,
): Promise<{ playerId: string; roomCode: string } | null> {
  const redis = getRedis();
  const raw = await redis.get(`session:${token}`);
  if (!raw) return null;
  return JSON.parse(raw) as { playerId: string; roomCode: string };
}

export async function deleteSession(token: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`session:${token}`);
}
