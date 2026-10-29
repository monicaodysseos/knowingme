import { PLAYER_CHARACTERS, type JoinPayload, type PlayerCharacter } from '@ksero-se/types';
import { isRoomCode } from './codes';
import { TEXT_LIMITS } from './settings';

const CHARACTERS = new Set<string>(PLAYER_CHARACTERS);

export function parseJoin(raw: unknown): { ok: true; value: JoinPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Could not join. Please try again.' };
  }
  const body = raw as Record<string, unknown>;
  const roomCode = typeof body.roomCode === 'string' ? body.roomCode.trim().toUpperCase() : '';
  if (!isRoomCode(roomCode)) {
    return { ok: false, error: 'That room code does not look right.' };
  }
  if (body.role !== 'tv' && body.role !== 'player') {
    return { ok: false, error: 'Could not join. Please try again.' };
  }
  const name = typeof body.name === 'string' ? body.name : '';
  const sessionToken = boundedString(body.sessionToken, 80);
  const hostSecret = boundedString(body.hostSecret, 128);
  const avatar = typeof body.avatar === 'string' && CHARACTERS.has(body.avatar)
    ? (body.avatar as PlayerCharacter)
    : undefined;
  return {
    ok: true,
    value: {
      roomCode,
      name,
      role: body.role,
      sessionToken,
      hostSecret,
      avatar,
    },
  };
}

export function parseQuestions(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length > TEXT_LIMITS.maxQuestions) return null;
  const questions: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') return null;
    questions.push(item);
  }
  return questions;
}

export function parseAnswer(raw: unknown): { assignmentId: string; answer: string; skipped: boolean } | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;
  if (typeof body.assignmentId !== 'string') return null;
  if (body.assignmentId.length < 1 || body.assignmentId.length > TEXT_LIMITS.id) return null;
  const answer = typeof body.answer === 'string' ? body.answer.trim().slice(0, TEXT_LIMITS.answer) : '';
  return { assignmentId: body.assignmentId, answer, skipped: body.skipped === true };
}

export function parseGuess(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return raw.trim().slice(0, TEXT_LIMITS.guess);
}

export function parseVotes(raw: unknown): Array<{ guessId: string; isCorrect: boolean }> | null {
  if (!Array.isArray(raw) || raw.length > TEXT_LIMITS.maxVotes) return null;
  const votes: Array<{ guessId: string; isCorrect: boolean }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const body = item as Record<string, unknown>;
    if (typeof body.guessId !== 'string' || body.guessId.length < 1 || body.guessId.length > TEXT_LIMITS.id) {
      return null;
    }
    if (typeof body.isCorrect !== 'boolean') return null;
    votes.push({ guessId: body.guessId, isCorrect: body.isCorrect });
  }
  return votes;
}

function boundedString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return undefined;
  return trimmed;
}
