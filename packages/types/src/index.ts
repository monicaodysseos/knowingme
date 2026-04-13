// ─────────────────────────────────────────────
// KseroSe — Shared TypeScript Types
// ─────────────────────────────────────────────

export type GameMode = 'corporate' | 'social';
export type QuestionTier = 'T1' | 'T2';

export type GamePhase =
  | 'LOBBY'
  | 'QUESTION_SUBMISSION'
  | 'ANSWER_PHASE'
  | 'GUESS_PHASE'
  | 'REVEAL_PHASE'
  | 'SCORE_PHASE'
  | 'FINAL_AWARDS'
  | 'GAME_OVER';

// ── Player colours (palette of 8) ─────────────────────────────────────────

export const PLAYER_COLORS = [
  { name: 'electric-purple', hex: '#8B5CF6' },
  { name: 'hot-coral', hex: '#FF6B6B' },
  { name: 'neon-teal', hex: '#0DD3C5' },
  { name: 'golden-yellow', hex: '#F59E0B' },
  { name: 'sky-blue', hex: '#38BDF8' },
  { name: 'lime-green', hex: '#84CC16' },
  { name: 'flamingo-pink', hex: '#EC4899' },
  { name: 'warm-orange', hex: '#F97316' },
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

// ── Core domain types ──────────────────────────────────────────────────────

export interface Player {
  id: string;           // uuid
  socketId: string;
  name: string;         // max 16 chars
  color: PlayerColor;
  isHost: boolean;
  isConnected: boolean;
  submittedQuestionIds: string[]; // ids of questions they submitted
  hasSkipped: boolean;
  sessionToken: string; // uuid stored in localStorage + cookie
  fastestSubmitMs: number; // for tie-breaking
}

export interface Question {
  id: string;
  text: string;          // max 80 chars
  tier: QuestionTier;
  submittedByPlayerId?: string; // undefined = seeded question
}

export interface QuestionAssignment {
  id: string;
  questionId: string;
  questionText: string;
  assignedToPlayerId: string;
  answer?: string;
  submittedAt?: number; // unix ms
  skipped?: boolean;
}

export interface Guess {
  id: string;
  guesserPlayerId: string;
  guesserName: string;
  guesserColor: PlayerColor;
  text: string;
  isCorrect?: boolean;  // undefined = not yet judged
  submittedAt: number;
}

export interface PlayerTurn {
  subjectPlayerId: string;
  assignmentId: string; // the featured question assignment
  questionText: string;
  answer: string;
  guesses: Guess[];
}

export interface ScoreEntry {
  playerId: string;
  playerName: string;
  color: PlayerColor;
  score: number;
  delta: number; // points gained this round
}

// bidirectional correct-guess count
export type DuoMatrix = Record<string, Record<string, number>>;

export interface AwardResult {
  type: 'emotionally-intelligent' | 'narcissist' | 'best-duo';
  emoji: string;
  title: string;
  description: string;
  winners: string[];   // player names
  stat: string;
}

// ── XState machine context ─────────────────────────────────────────────────

export interface GameContext {
  roomCode: string;
  mode: GameMode;
  players: Player[];
  hostId: string;
  questionPool: Question[];
  questionAssignments: QuestionAssignment[];
  playerTurns: PlayerTurn[];
  currentTurnIndex: number;
  currentQuestionSlot: number; // 0–4 during ANSWER_PHASE
  timerEnd: number;            // unix ms
  scores: Record<string, number>;
  duoMatrix: DuoMatrix;
  revealIndex: number;         // index of guess being revealed
  awards: AwardResult[];
}

// ── XState machine events ──────────────────────────────────────────────────

export type GameEvent =
  | { type: 'PLAYER_JOIN'; name: string; socketId: string; sessionToken: string }
  | { type: 'PLAYER_RECONNECT'; socketId: string; sessionToken: string; newSocketId: string }
  | { type: 'PLAYER_LEAVE'; socketId: string }
  | { type: 'HOST_START' }
  | { type: 'SUBMIT_QUESTIONS'; playerId: string; questions: string[] }
  | { type: 'ALL_QUESTIONS_SUBMITTED' }
  | { type: 'SUBMIT_ANSWER'; playerId: string; assignmentId: string; answer: string; skipped?: boolean; elapsedMs?: number }
  | { type: 'SLOT_TIMER_EXPIRED' }
  | { type: 'ALL_ANSWERS_IN' }
  | { type: 'SUBMIT_GUESS'; playerId: string; text: string }
  | { type: 'GUESS_TIMER_EXPIRED' }
  | { type: 'ALL_GUESSES_IN' }
  | { type: 'MARK_GUESS'; guessId: string; isCorrect: boolean }
  | { type: 'ALL_GUESSES_MARKED' }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'NEXT_TURN' }
  | { type: 'PLAY_AGAIN' };

// ── Socket payload types ───────────────────────────────────────────────────

// What the TV receives
export interface TVState {
  phase: GamePhase;
  roomCode: string;
  players: Array<{
    id: string;
    name: string;
    color: PlayerColor;
    isConnected: boolean;
    isHost: boolean;
    hasSubmittedQuestions?: boolean;
  }>;
  scores: ScoreEntry[];
  timerEnd: number;
  mode: GameMode;
  currentTurn?: {
    subjectPlayer: { id: string; name: string; color: PlayerColor };
    questionText: string;
    questionIndex: number;    // 0-based index within this subject's turns
    totalForSubject: number;  // total turns for this subject
    guessCount: number; // how many guesses received (no text until reveal)
    guessesRevealed: Array<{
      id: string;
      guesserName: string;
      guesserColor: PlayerColor;
      text: string;
      isCorrect?: boolean;
    }>;
    answer?: string;   // only populated during REVEAL_PHASE
    revealIndex: number;
  };
  awards?: AwardResult[];
  submissionProgress?: {
    total: number;
    submitted: number;
  };
}

// What a phone client receives
export interface PhoneState {
  phase: GamePhase;
  playerId: string;
  timerEnd: number;
  action: PhoneAction;
}

export type PhoneAction =
  | { type: 'WAIT'; message: string }
  | { type: 'SUBMIT_QUESTIONS'; examples: string[] }
  | { type: 'ANSWER_QUESTION'; assignmentId: string; questionText: string; slotIndex: number; totalSlots: number; canSkip: boolean }
  | { type: 'SUBMIT_GUESS'; subjectName: string; subjectColor: PlayerColor; questionText: string }
  | { type: 'MARK_GUESSES'; guesses: Array<{ id: string; guesserName: string; guesserColor: PlayerColor; text: string }> }
  | { type: 'VIEW_RESULTS'; scores: ScoreEntry[]; awards?: AwardResult[] };

// ── Socket event name constants ────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // client → server
  JOIN: 'join',
  HOST_START: 'host:start',
  SUBMIT_QUESTIONS: 'submit:questions',
  SUBMIT_ANSWER: 'submit:answer',
  SUBMIT_GUESS: 'submit:guess',
  MARK_GUESS: 'mark:guess',
  RECONNECT_TOKEN: 'reconnect:token',
  PLAY_AGAIN: 'play:again',

  // server → client
  TV_UPDATE: 'tv:update',
  PHONE_UPDATE: 'phone:update',
  ERROR: 'error',
  KICKED: 'kicked',
} as const;

// ── Join / Room API types ──────────────────────────────────────────────────

export interface JoinPayload {
  roomCode: string;
  name: string;
  sessionToken?: string; // set if reconnecting
  role: 'tv' | 'player';
}

export interface JoinAck {
  ok: boolean;
  playerId?: string;
  sessionToken?: string;
  color?: PlayerColor;
  error?: string;
}

// ── Example question prompts shown on phone ────────────────────────────────

export const EXAMPLE_PROMPTS: string[] = [
  'What is your favourite time of day?',
  'Which is your favourite movie?',
  'Who is your best friend?',
  'What is your biggest irrational fear?',
  'What would your last meal be?',
  'What is your go-to comfort food?',
  'Which song is always in your head?',
  'What superpower would you choose?',
  'What hobby do you wish you had more time for?',
  'Which decade would you travel back to?',
  'What is your most unpopular opinion?',
  'Who would play you in a movie?',
];
