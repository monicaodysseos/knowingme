import { CHARACTER_ROSTER } from '@ksero-se/types';
import { cleanDecoyText, normalizeAnswer, tooCloseToAnswer } from './text';
import { shuffle } from './sample';

/** Small built in list used when Gemini is missing, slow, or wrong. */
export const BUILTIN_DECOYS = [
  'a pigeon with a grudge',
  'crying in the big shop',
  'the group chat at 2am',
  'pineapple on everything',
  'my notes app novel',
  'a perfectly normal tuesday',
  'the last biscuit',
  'saying it was fine',
];

export interface DecoyRequest {
  question: string;
  subjectName: string;
  count: number;
  avoid: string[];
}

export type DecoyGenerator = (request: DecoyRequest) => Promise<string[] | null>;

const DEFAULT_MODEL = 'gemini-2.0-flash';
const TIMEOUT_MS = 4_000;

/**
 * Ask Gemini flash for a few plausible answers. Returns null on any
 * failure so the caller can fall back without waiting past the timeout.
 */
export async function geminiDecoys(
  request: DecoyRequest,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<string[] | null> {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key || request.count <= 0) return null;
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const prompt = [
    `Write ${request.count} short answers a friend might give.`,
    `Question: ${request.question}`,
    `The person is called ${request.subjectName}.`,
    'Make each one plausible and different.',
    'Lowercase. No dashes. No numbering.',
    'Reply with a JSON array of strings only.',
  ].join(' ');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n') ?? '';
    const parsed = parseDecoyList(text);
    return parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.error('[decoys] gemini failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export function parseDecoyList(text: string): string[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => cleanDecoyText(item))
          .filter((item) => item.length > 0);
      }
    } catch {
      /* fall through to lines */
    }
  }
  return text
    .split(/\n+/)
    .map((line) => cleanDecoyText(line.replace(/^\s*\d+[\).\s]+/, '')))
    .filter((line) => line.length > 0);
}

export function fallbackDecoys(
  count: number,
  real: string,
  otherAnswers: string[],
  rng: () => number,
): string[] {
  return pickDecoys([], count, real, otherAnswers, rng);
}

/** Prefer the generated lines, then this game's other answers, then the built in list. */
export function pickDecoys(
  generated: string[] | null,
  count: number,
  real: string,
  otherAnswers: string[],
  rng: () => number,
): string[] {
  if (count <= 0) return [];
  const realKey = normalizeAnswer(real);
  const seen = new Set<string>(realKey ? [realKey] : []);
  const out: string[] = [];
  const tiers = [generated ?? [], otherAnswers, BUILTIN_DECOYS];
  for (const tier of tiers) {
    const pool = shuffle(
      tier.map((item) => cleanDecoyText(item)).filter((item) => item.length > 0),
      rng,
    );
    for (const item of pool) {
      const key = normalizeAnswer(item);
      if (!key || seen.has(key) || tooCloseToAnswer(item, real)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= count) return out;
    }
  }
  return out;
}

export function decoyCharacters(usedNames: string[], count: number, rng: () => number): string[] {
  const spare = CHARACTER_ROSTER
    .map((slot) => slot.name)
    .filter((name) => !usedNames.includes(name));
  const pool = shuffle(spare.length >= count ? spare : CHARACTER_ROSTER.map((slot) => slot.name), rng);
  const names: string[] = [];
  for (let i = 0; i < count; i++) names.push(pool[i % pool.length]);
  return names;
}

export function defaultDecoyGenerator(request: DecoyRequest): Promise<string[] | null> {
  return geminiDecoys(request);
}
