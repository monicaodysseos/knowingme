import type { GameSettings } from '@ksero-se/types';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export interface CreatedRoom {
  roomCode: string;
  hostSecret: string;
}

/** Ask the game server for a room. Throws a short message the screen can show. */
export async function requestRoom(settings: GameSettings): Promise<CreatedRoom> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'social', settings }),
    });
  } catch {
    throw new Error('Could not reach the game server.');
  }

  const data = await response.json().catch(() => ({} as { roomCode?: string; hostSecret?: string; error?: string }));
  if (!response.ok || typeof data.roomCode !== 'string' || !data.roomCode || typeof data.hostSecret !== 'string' || !data.hostSecret) {
    throw new Error(typeof data.error === 'string' && data.error ? data.error : 'The game server did not create a room.');
  }
  return { roomCode: data.roomCode, hostSecret: data.hostSecret };
}
