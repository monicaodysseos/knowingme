const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export interface PublicConfig {
  rules: 'classic' | 'fakes';
  questionsToWriteMax: number;
  longGame: boolean;
}

const CLASSIC: PublicConfig = { rules: 'classic', questionsToWriteMax: 5, longGame: false };

/** The server decides the rules. A failed read stays on the current game. */
export async function fetchPublicConfig(): Promise<PublicConfig> {
  try {
    const response = await fetch(`${SERVER_URL}/api/config`);
    if (!response.ok) return CLASSIC;
    const data = await response.json() as Partial<PublicConfig>;
    if (data.rules !== 'fakes') return CLASSIC;
    return { rules: 'fakes', questionsToWriteMax: 3, longGame: true };
  } catch {
    return CLASSIC;
  }
}
