import type { PlayerCharacter } from './characters';

export type RulesMode = 'classic' | 'fakes';

export type FakesPhase =
  | 'LOBBY'
  | 'HOW_IT_WORKS'
  | 'WRITE'
  | 'ANSWER'
  | 'DOUBLE'
  | 'FAKE'
  | 'VOTE'
  | 'REVEAL'
  | 'SCOREBOARD'
  | 'CROWN'
  | 'AWARDS';

export interface FakesScoreRow {
  playerId: string;
  name: string;
  score: number;
  rank: number;
  avatar: PlayerCharacter;
  color: { name: string; hex: string };
  connected: boolean;
  isHost: boolean;
}

export interface FakesPrompt {
  id: string;
  text: string;
}

export interface FakesOption {
  id: string;
  text: string;
  yours: boolean;
  disabled: boolean;
}

export interface FakesReveal {
  lines: string[];
  text: string;
  step: number;
  total: number;
}

export interface FakesAwardView {
  id: string;
  title: string;
  winners: string[];
}

/** What the TV and the phones render while the fakes rules are on. */
export interface FakesView {
  phase: FakesPhase;
  longGame: boolean;
  phonesOnly: boolean;
  roomCode: string;
  questionsToWrite: number;
  timerEnd: number;
  timerTotalMs: number;
  players: FakesScoreRow[];
  done: number;
  total: number;
  canSkipHow: boolean;
  subjectName?: string;
  questionText?: string;
  prompts?: FakesPrompt[];
  options?: FakesOption[];
  isSubject?: boolean;
  submitted?: boolean;
  reveal?: FakesReveal;
  awards?: FakesAwardView[];
  crownNames?: string[];
  draw?: boolean;
  youWin?: boolean;
  turnNumber?: number;
  turnTotal?: number;
  doubled?: boolean;
  yourName?: string;
}
