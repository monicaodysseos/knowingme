import { randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@ksero-se/types';

/** Cryptographic room code. Ambiguous glyphs (0, O, 1, I) are left out. */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Pick a code that is not already taken. Gives up after a fixed number of
 * tries so a full code space can never spin forever.
 */
const codeHolders: Array<(code: string) => boolean> = [];
const roomCounters: Array<() => number> = [];

/** Both rule sets register here so a code cannot be issued twice. */
export function watchCodes(isTaken: (code: string) => boolean): void {
  codeHolders.push(isTaken);
}

export function codeInUse(code: string): boolean {
  return codeHolders.some((isTaken) => isTaken(code));
}

export function watchRoomCount(count: () => number): void {
  roomCounters.push(count);
}

export function totalRoomCount(): number {
  return roomCounters.reduce((sum, count) => sum + count(), 0);
}

export function allocateCode(isTaken: (code: string) => boolean, attempts = 24): string | null {
  for (let i = 0; i < attempts; i++) {
    const code = generateRoomCode();
    if (!isTaken(code)) return code;
  }
  return null;
}

export function isRoomCode(value: string): boolean {
  if (value.length !== ROOM_CODE_LENGTH) return false;
  for (const ch of value) {
    if (!ROOM_CODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}

/** Secret given once, to the browser that created the room. */
export function newHostSecret(): string {
  return randomBytes(24).toString('base64url');
}

export function secretsMatch(given: string, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}
