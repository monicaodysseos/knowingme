import type { GameMode, GameSettings } from '@ksero-se/types';
import { DEFAULT_SETTINGS } from '@ksero-se/types';

export const SETTINGS_LIMITS = {
  maxPlayers: { min: 2, max: 12, default: DEFAULT_SETTINGS.maxPlayers },
  questionsToWrite: { min: 1, max: 5, default: DEFAULT_SETTINGS.questionsToWrite },
  questionsToAnswer: { min: 2, max: 10, default: DEFAULT_SETTINGS.questionsToAnswer },
} as const;

export const TEXT_LIMITS = {
  name: 16,
  question: 80,
  answer: 120,
  guess: 120,
  maxQuestions: 8,
  maxVotes: 24,
  id: 80,
} as const;

export const ROOM_CAPS = {
  maxRooms: 400,
  /** Created, never opened, and nobody is attached. */
  emptyLobbyMs: 15 * 60 * 1000,
  /** Lobby with nobody connected. */
  idleLobbyMs: 10 * 60 * 1000,
  /** A game in progress with nobody connected. */
  abandonedGameMs: 20 * 60 * 1000,
  /** No socket activity at all, even if a tab still looks connected. */
  staleMs: 3 * 60 * 60 * 1000,
} as const;

export const RATE = {
  create: { limit: 8, windowMs: 10 * 60 * 1000 },
  lookup: { limit: 30, windowMs: 60 * 1000 },
  join: { limit: 30, windowMs: 60 * 1000 },
} as const;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Force host settings into the fixed limits. Unknown shapes fall back to defaults. */
export function sanitizeSettings(input: unknown): GameSettings {
  const src = input && typeof input === 'object' ? (input as Partial<GameSettings>) : {};
  const settings: GameSettings = {
    maxPlayers: clampInt(src.maxPlayers, SETTINGS_LIMITS.maxPlayers.min, SETTINGS_LIMITS.maxPlayers.max, SETTINGS_LIMITS.maxPlayers.default),
    questionsToWrite: clampInt(src.questionsToWrite, SETTINGS_LIMITS.questionsToWrite.min, SETTINGS_LIMITS.questionsToWrite.max, SETTINGS_LIMITS.questionsToWrite.default),
    questionsToAnswer: clampInt(src.questionsToAnswer, SETTINGS_LIMITS.questionsToAnswer.min, SETTINGS_LIMITS.questionsToAnswer.max, SETTINGS_LIMITS.questionsToAnswer.default),
  };
  if (src.phonesOnly === true) settings.phonesOnly = true;
  return settings;
}

export interface FakesSettingsInput {
  maxPlayers: number;
  questionsToWrite: number;
  phonesOnly: boolean;
  longGame: boolean;
}

/** Fakes rules do not use questionsToAnswer. Questions each player writes are 1 to 3. */
export function sanitizeFakesSettings(input: unknown): FakesSettingsInput {
  const src = input && typeof input === 'object' ? (input as Partial<GameSettings>) : {};
  return {
    maxPlayers: clampInt(src.maxPlayers, SETTINGS_LIMITS.maxPlayers.min, SETTINGS_LIMITS.maxPlayers.max, SETTINGS_LIMITS.maxPlayers.default),
    questionsToWrite: clampInt(src.questionsToWrite, 1, 3, 2),
    phonesOnly: src.phonesOnly === true,
    longGame: src.longGame === true,
  };
}

export function sanitizeMode(mode: unknown): GameMode {
  return mode === 'corporate' || mode === 'social' ? mode : 'social';
}
