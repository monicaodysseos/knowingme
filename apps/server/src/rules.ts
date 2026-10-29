import type { RulesMode } from '@ksero-se/types';

/**
 * Flip the live game to fakes and vote by setting KSEROSE_RULES=fakes
 * on the game server (Railway). Leave it unset, or set anything else,
 * and the current game stays exactly as it is. The web app reads
 * GET /api/config, so the switch does not need a new web build.
 *
 * Optional: GEMINI_API_KEY for decoys, and GEMINI_MODEL (default
 * gemini-2.5-flash). A missing or slow key never stops a game. A failed
 * call logs the HTTP status and a short body, with the key removed.
 */
export function rulesMode(env: NodeJS.ProcessEnv = process.env): RulesMode {
  return env.KSEROSE_RULES === 'fakes' ? 'fakes' : 'classic';
}
