import { setup, assign } from 'xstate';
import { v4 as uuidv4 } from 'uuid';
import type {
  GameContext,
  GameEvent,
  GameMode,
  GameSettings,
  Player,
  PlayerColor,
  PlayerCharacter,
  Question,
  QuestionAssignment,
  PlayerTurn,
  AwardResult,
  DuoMatrix,
} from '@ksero-se/types';
import { PLAYER_COLORS, PLAYER_CHARACTERS, DEFAULT_SETTINGS } from '@ksero-se/types';
import { buildSeededPool } from './questions';

// ── Constants ──────────────────────────────────────────────────────────────

export const TIMER = {
  QUESTION_SUBMISSION: 180_000, // 3 min
  ANSWER_PHASE: 300_000,        // 5 min for the entire answer phase
  GUESS: 60_000,                // 60 s per guess turn
};

const POINTS_CORRECT_GUESS = 200;
const POINTS_KNOWABLE = 100;

// ── Helpers ────────────────────────────────────────────────────────────────

function pickColor(players: Player[]): PlayerColor {
  const used = new Set(players.map((p) => p.color.name));
  const available = PLAYER_COLORS.filter((c) => !used.has(c.name));
  return available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : PLAYER_COLORS[players.length % PLAYER_COLORS.length];
}

function pickAvatar(players: Player[], requested?: PlayerCharacter): PlayerCharacter {
  if (requested) return requested;
  const used = new Set(players.map((p) => p.avatar));
  const available = PLAYER_CHARACTERS.filter((c) => !used.has(c));
  return available.length > 0 ? available[0] : PLAYER_CHARACTERS[players.length % PLAYER_CHARACTERS.length];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignQuestions(
  players: Player[],
  pool: Question[],
  _mode: GameMode,
  questionsToAnswer: number,
): QuestionAssignment[] {
  // Only use player-submitted questions.
  // Each player gets their own independent shuffle so question order differs per player.
  const submitted = pool.filter((q) => q.submittedByPlayerId !== undefined);
  if (submitted.length === 0) return [];

  const assignments: QuestionAssignment[] = [];
  players.forEach((player) => {
    // Fresh shuffle for every player — guarantees different order and no duplicates within their set
    const playerPool = shuffle(submitted);
    const count = Math.min(questionsToAnswer, playerPool.length);
    for (let j = 0; j < count; j++) {
      assignments.push({
        id: uuidv4(),
        questionId: playerPool[j].id,
        questionText: playerPool[j].text,
        assignedToPlayerId: player.id,
      });
    }
  });

  return assignments;
}

function buildPlayerTurns(
  players: Player[],
  assignments: QuestionAssignment[],
): PlayerTurn[] {
  // Group answered assignments by player (preserving assignment order = question slot order)
  const byPlayer: Record<string, QuestionAssignment[]> = {};
  for (const a of assignments) {
    if (a.answer === undefined || a.skipped) continue;
    if (!byPlayer[a.assignedToPlayerId]) byPlayer[a.assignedToPlayerId] = [];
    byPlayer[a.assignedToPlayerId].push(a);
  }

  // Shuffle player order once — same order used across all question rounds
  const activePlayers = shuffle(
    players.filter((p) => (byPlayer[p.id]?.length ?? 0) > 0),
  );

  const maxSlots = Math.max(0, ...activePlayers.map((p) => byPlayer[p.id].length));

  // Interleave: slot 0 for all players, then slot 1 for all players, etc.
  const turns: PlayerTurn[] = [];
  for (let slot = 0; slot < maxSlots; slot++) {
    for (const player of activePlayers) {
      const a = byPlayer[player.id][slot];
      if (!a) continue;
      turns.push({
        subjectPlayerId: player.id,
        assignmentId: a.id,
        questionText: a.questionText,
        answer: a.answer!,
        guesses: [],
      });
    }
  }

  return turns;
}

function computeAwards(
  players: Player[],
  turns: PlayerTurn[],
  duoMatrix: DuoMatrix,
): AwardResult[] {
  const awards: AwardResult[] = [];

  // 🧠 Emotionally Intelligent — most correct guesses about others
  const correctByGuesser: Record<string, number> = {};
  for (const turn of turns) {
    for (const g of turn.guesses) {
      if (g.isCorrect) {
        correctByGuesser[g.guesserPlayerId] =
          (correctByGuesser[g.guesserPlayerId] ?? 0) + 1;
      }
    }
  }
  const topGuesser = Object.entries(correctByGuesser).sort((a, b) => b[1] - a[1])[0];
  if (topGuesser) {
    const winner = players.find((p) => p.id === topGuesser[0]);
    awards.push({
      type: 'emotionally-intelligent',
      emoji: '🧠',
      title: 'The Emotionally Intelligent',
      description: 'Most correct guesses about others',
      winners: winner ? [winner.name] : [],
      stat: `${topGuesser[1]} correct guess${topGuesser[1] !== 1 ? 'es' : ''}`,
    });
  }

  // 👑 Narcissist — whose answers were correctly guessed by the most people
  const correctAboutSubject: Record<string, number> = {};
  for (const turn of turns) {
    const count = turn.guesses.filter((g) => g.isCorrect).length;
    correctAboutSubject[turn.subjectPlayerId] =
      (correctAboutSubject[turn.subjectPlayerId] ?? 0) + count;
  }
  const topSubject = Object.entries(correctAboutSubject).sort((a, b) => b[1] - a[1])[0];
  if (topSubject) {
    const winner = players.find((p) => p.id === topSubject[0]);
    awards.push({
      type: 'narcissist',
      emoji: '👑',
      title: 'The Narcissist',
      description: 'Whose answers everyone knew',
      winners: winner ? [winner.name] : [],
      stat: `Guessed correctly by ${topSubject[1]} player${topSubject[1] !== 1 ? 's' : ''}`,
    });
  }

  // 💞 Best Duo — highest bidirectional correct-guess count
  let bestDuoScore = -1;
  let bestDuoPair: [string, string] = ['', ''];
  const playerIds = players.map((p) => p.id);

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const a = playerIds[i];
      const b = playerIds[j];
      const score = (duoMatrix[a]?.[b] ?? 0) + (duoMatrix[b]?.[a] ?? 0);
      if (score > bestDuoScore) {
        bestDuoScore = score;
        bestDuoPair = [a, b];
      }
    }
  }

  if (bestDuoScore > 0) {
    const winnerNames = bestDuoPair
      .map((id) => players.find((p) => p.id === id)?.name ?? '?')
      .filter(Boolean);
    awards.push({
      type: 'best-duo',
      emoji: '💞',
      title: 'The Best Duo',
      description: 'Highest bidirectional correct-guess connection',
      winners: winnerNames,
      stat: `${bestDuoScore} mutual correct guess${bestDuoScore !== 1 ? 'es' : ''} between each other`,
    });
  }

  return awards;
}

function applyScores(
  ctx: GameContext,
  isDouble: boolean,
): Record<string, number> {
  const mul = isDouble ? 2 : 1;
  const turn = ctx.playerTurns[ctx.currentTurnIndex];
  if (!turn) return ctx.scores;

  const updated = { ...ctx.scores };

  for (const g of turn.guesses) {
    if (g.isCorrect) {
      updated[g.guesserPlayerId] = (updated[g.guesserPlayerId] ?? 0) + POINTS_CORRECT_GUESS * mul;
      updated[turn.subjectPlayerId] = (updated[turn.subjectPlayerId] ?? 0) + POINTS_KNOWABLE * mul;
    }
  }

  return updated;
}

function updateDuoMatrix(ctx: GameContext): DuoMatrix {
  const matrix: DuoMatrix = JSON.parse(JSON.stringify(ctx.duoMatrix));
  const turn = ctx.playerTurns[ctx.currentTurnIndex];
  if (!turn) return matrix;

  for (const g of turn.guesses) {
    if (g.isCorrect) {
      if (!matrix[g.guesserPlayerId]) matrix[g.guesserPlayerId] = {};
      matrix[g.guesserPlayerId][turn.subjectPlayerId] =
        (matrix[g.guesserPlayerId][turn.subjectPlayerId] ?? 0) + 1;
    }
  }

  return matrix;
}

// ── Initial context factory ────────────────────────────────────────────────

export function initialContext(roomCode: string, mode: GameMode, settings?: GameSettings): GameContext {
  return {
    roomCode,
    mode,
    settings: settings ?? { ...DEFAULT_SETTINGS },
    players: [],
    hostId: '',
    questionPool: buildSeededPool(),
    questionAssignments: [],
    playerTurns: [],
    currentTurnIndex: 0,
    currentQuestionSlot: 0,
    timerEnd: 0,
    scores: {},
    roundDeltas: {},
    duoMatrix: {},
    revealIndex: -1,
    awards: [],
  };
}

// ── Machine definition ─────────────────────────────────────────────────────

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
    input: {} as { roomCode: string; mode: GameMode; settings?: GameSettings },
  },

  guards: {
    hasMinPlayers: ({ context }) => context.players.length >= 3,

    allQuestionsSubmitted: ({ context }) =>
      context.players.every((p) => p.submittedQuestionIds.length >= context.settings.questionsToWrite),

    allSlotAnswersIn: ({ context }) => {
      const slot = context.currentQuestionSlot;
      const relevant = context.questionAssignments.filter((_, i) => {
        // each player's slot-th assignment
        const byPlayer: Record<string, QuestionAssignment[]> = {};
        for (const a of context.questionAssignments) {
          if (!byPlayer[a.assignedToPlayerId]) byPlayer[a.assignedToPlayerId] = [];
          byPlayer[a.assignedToPlayerId].push(a);
        }
        return false; // computed below
      });
      // Build per-player slot lists once
      const byPlayer: Record<string, QuestionAssignment[]> = {};
      for (const a of context.questionAssignments) {
        if (!byPlayer[a.assignedToPlayerId]) byPlayer[a.assignedToPlayerId] = [];
        byPlayer[a.assignedToPlayerId].push(a);
      }
      return context.players.every((p) => {
        const slots = byPlayer[p.id] ?? [];
        const slotAssignment = slots[slot];
        return slotAssignment ? (slotAssignment.answer !== undefined || slotAssignment.skipped === true) : true;
      });
    },

    allGuessesIn: ({ context }) => {
      const turn = context.playerTurns[context.currentTurnIndex];
      if (!turn) return false;
      const eligibleGuessers = context.players.filter(
        (p) => p.id !== turn.subjectPlayerId && p.isConnected,
      );
      return eligibleGuessers.every((p) =>
        turn.guesses.some((g) => g.guesserPlayerId === p.id),
      );
    },

    allGuessesMark: ({ context }) => {
      const turn = context.playerTurns[context.currentTurnIndex];
      if (!turn) return false;
      return turn.guesses.every((g) => g.isCorrect !== undefined);
    },

    hasMoreTurns: ({ context }) =>
      context.currentTurnIndex + 1 < context.playerTurns.length,

    isLastTurn: ({ context }) =>
      context.currentTurnIndex === context.playerTurns.length - 1,

    hasMoreReveal: ({ context }) => {
      const turn = context.playerTurns[context.currentTurnIndex];
      return context.revealIndex + 1 < (turn?.guesses.length ?? 0);
    },
  },

  actions: {
    addPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== 'PLAYER_JOIN') return context.players;
        const color = pickColor(context.players);
        const avatar = pickAvatar(context.players, event.avatar);
        const newPlayer: Player = {
          id: uuidv4(),
          socketId: event.socketId,
          name: event.name.slice(0, 16),
          color,
          avatar,
          isHost: context.players.length === 0,
          isConnected: true,
          submittedQuestionIds: [],
          hasSkipped: false,
          sessionToken: event.sessionToken,
          fastestSubmitMs: Infinity,
        };
        return [...context.players, newPlayer];
      },
      hostId: ({ context, event }) => {
        if (event.type !== 'PLAYER_JOIN') return context.hostId;
        if (context.players.length === 0) {
          // Will be the first player id — compute it
          return ''; // Set after player added; handled by promoteHost
        }
        return context.hostId;
      },
      scores: ({ context, event }) => {
        if (event.type !== 'PLAYER_JOIN') return context.scores;
        // score entry added when we know the id
        return context.scores;
      },
    }),

    setHost: assign({
      hostId: ({ context }) => {
        const first = context.players[0];
        return first ? first.id : '';
      },
      players: ({ context }) => {
        if (context.hostId) return context.players;
        return context.players.map((p, i) => ({ ...p, isHost: i === 0 }));
      },
    }),

    markPlayerDisconnected: assign({
      players: ({ context, event }) => {
        if (event.type !== 'PLAYER_LEAVE') return context.players;
        return context.players.map((p) =>
          p.socketId === event.socketId ? { ...p, isConnected: false } : p,
        );
      },
    }),

    reconnectPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== 'PLAYER_RECONNECT') return context.players;
        return context.players.map((p) =>
          p.sessionToken === event.sessionToken
            ? { ...p, socketId: event.newSocketId, isConnected: true }
            : p,
        );
      },
    }),

    promoteNextHost: assign({
      players: ({ context }) => {
        const connected = context.players.find(
          (p) => p.isConnected && p.id !== context.hostId,
        );
        if (!connected) return context.players;
        return context.players.map((p) => ({
          ...p,
          isHost: p.id === connected.id,
        }));
      },
      hostId: ({ context }) => {
        const connected = context.players.find(
          (p) => p.isConnected && p.id !== context.hostId,
        );
        return connected ? connected.id : context.hostId;
      },
    }),

    // Single-function assign ensures the same IDs are used in both players and questionPool
    recordQuestions: assign(({ context, event }) => {
      if (event.type !== 'SUBMIT_QUESTIONS') return {};
      const newQIds = event.questions.map(() => uuidv4());
      const updatedPlayers = context.players.map((p) =>
        p.id === event.playerId ? { ...p, submittedQuestionIds: newQIds } : p,
      );
      const newQuestions = event.questions.map((text, i) => ({
        id: newQIds[i],
        text,
        tier: 'T2' as const,
        submittedByPlayerId: event.playerId,
      }));
      return {
        players: updatedPlayers,
        questionPool: [...context.questionPool, ...newQuestions],
      };
    }),

    assignQuestionsToPlayers: assign({
      questionAssignments: ({ context }) =>
        assignQuestions(context.players, context.questionPool, context.mode, context.settings.questionsToAnswer),
    }),

    recordAnswer: assign({
      questionAssignments: ({ context, event }) => {
        if (event.type !== 'SUBMIT_ANSWER') return context.questionAssignments;
        const now = Date.now();
        return context.questionAssignments.map((a) =>
          a.id === event.assignmentId && a.assignedToPlayerId === event.playerId
            ? {
                ...a,
                answer: event.skipped ? undefined : event.answer,
                skipped: event.skipped ?? false,
                submittedAt: now,
              }
            : a,
        );
      },
      players: ({ context, event }) => {
        if (event.type !== 'SUBMIT_ANSWER') return context.players;
        if (event.skipped) {
          return context.players.map((p) =>
            p.id === event.playerId ? { ...p, hasSkipped: true } : p,
          );
        }
        return context.players;
      },
    }),

    advanceSlot: assign({
      currentQuestionSlot: ({ context }) => context.currentQuestionSlot + 1,
    }),

    buildTurns: assign({
      playerTurns: ({ context }) =>
        buildPlayerTurns(context.players, context.questionAssignments),
    }),

    setTimer: assign({
      timerEnd: (_, params: { duration: number }) => Date.now() + params.duration,
    }),

    recordGuess: assign({
      playerTurns: ({ context, event }) => {
        if (event.type !== 'SUBMIT_GUESS') return context.playerTurns;
        const turn = context.playerTurns[context.currentTurnIndex];
        if (!turn) return context.playerTurns;
        // Don't allow subject to guess their own
        if (event.playerId === turn.subjectPlayerId) return context.playerTurns;
        // Only one guess per player
        if (turn.guesses.some((g) => g.guesserPlayerId === event.playerId)) {
          return context.playerTurns;
        }
        const player = context.players.find((p) => p.id === event.playerId);
        if (!player) return context.playerTurns;
        const guess = {
          id: uuidv4(),
          guesserPlayerId: event.playerId,
          guesserName: player.name,
          guesserColor: player.color,
          text: event.text,
          submittedAt: Date.now(),
        };
        return context.playerTurns.map((t, i) =>
          i === context.currentTurnIndex
            ? { ...t, guesses: [...t.guesses, guess] }
            : t,
        );
      },
    }),

    markGuess: assign({
      playerTurns: ({ context, event }) => {
        if (event.type !== 'MARK_GUESS') return context.playerTurns;
        return context.playerTurns.map((t, i) =>
          i === context.currentTurnIndex
            ? {
                ...t,
                guesses: t.guesses.map((g) =>
                  g.id === event.guessId ? { ...g, isCorrect: event.isCorrect } : g,
                ),
              }
            : t,
        );
      },
    }),

    advanceReveal: assign({
      revealIndex: ({ context }) => context.revealIndex + 1,
    }),

    applyRoundScores: assign(({ context }) => {
      const newScores = applyScores(context, context.currentTurnIndex === context.playerTurns.length - 1);
      const deltas: Record<string, number> = {};
      for (const [id, score] of Object.entries(newScores)) {
        deltas[id] = score - (context.scores[id] ?? 0);
      }
      return {
        scores: newScores,
        roundDeltas: deltas,
        duoMatrix: updateDuoMatrix(context),
      };
    }),

    nextTurn: assign({
      currentTurnIndex: ({ context }) => context.currentTurnIndex + 1,
      revealIndex: () => -1,
    }),

    resetTurnIndex: assign({
      currentTurnIndex: () => 0,
    }),

    computeAwards: assign({
      awards: ({ context }) =>
        computeAwards(context.players, context.playerTurns, context.duoMatrix),
    }),

    resetForNewGame: assign(({ context }) => ({
      ...initialContext(context.roomCode, context.mode, context.settings),
      players: context.players.map((p) => ({
        ...p,
        submittedQuestionIds: [],
        hasSkipped: false,
        fastestSubmitMs: Infinity,
        // preserve avatar + color across play-again
      })),
      hostId: context.hostId,
      questionPool: buildSeededPool(),
    })),
  },
}).createMachine({
  id: 'kseroSe',
  initial: 'LOBBY',

  context: ({ input }) => initialContext(input.roomCode, input.mode, input.settings),

  states: {
    LOBBY: {
      on: {
        PLAYER_JOIN: { actions: ['addPlayer', 'setHost'] },
        PLAYER_LEAVE: {
          actions: [
            'markPlayerDisconnected',
            { type: 'promoteNextHost' },
          ],
        },
        PLAYER_RECONNECT: { actions: 'reconnectPlayer' },
        HOST_START: {
          guard: 'hasMinPlayers',
          target: 'QUESTION_SUBMISSION',
        },
      },
    },

    QUESTION_SUBMISSION: {
      entry: {
        type: 'setTimer',
        params: { duration: TIMER.QUESTION_SUBMISSION },
      },
      on: {
        PLAYER_LEAVE: { actions: 'markPlayerDisconnected' },
        PLAYER_RECONNECT: { actions: 'reconnectPlayer' },
        SUBMIT_QUESTIONS: {
          actions: 'recordQuestions',
        },
        ALL_QUESTIONS_SUBMITTED: {
          actions: 'assignQuestionsToPlayers',
          target: 'ANSWER_PHASE',
        },
        SLOT_TIMER_EXPIRED: {
          // Force advance even if not all submitted
          actions: 'assignQuestionsToPlayers',
          target: 'ANSWER_PHASE',
        },
      },
    },

    ANSWER_PHASE: {
      entry: {
        type: 'setTimer',
        params: { duration: TIMER.ANSWER_PHASE },
      },
      on: {
        PLAYER_LEAVE: { actions: 'markPlayerDisconnected' },
        PLAYER_RECONNECT: { actions: 'reconnectPlayer' },
        SUBMIT_ANSWER: {
          actions: 'recordAnswer',
        },
        ALL_ANSWERS_IN: {
          actions: 'buildTurns',
          target: 'GUESS_PHASE',
        },
        SLOT_TIMER_EXPIRED: {
          actions: 'buildTurns',
          target: 'GUESS_PHASE',
        },
      },
    },

    GUESS_PHASE: {
      entry: {
        type: 'setTimer',
        params: { duration: TIMER.GUESS },
      },
      on: {
        PLAYER_LEAVE: { actions: 'markPlayerDisconnected' },
        PLAYER_RECONNECT: { actions: 'reconnectPlayer' },
        SUBMIT_GUESS: {
          actions: 'recordGuess',
        },
        ALL_GUESSES_IN: { target: 'REVEAL_PHASE' },
        GUESS_TIMER_EXPIRED: { target: 'REVEAL_PHASE' },
      },
    },

    REVEAL_PHASE: {
      entry: assign({ revealIndex: () => -1 }),
      on: {
        PLAYER_LEAVE: { actions: 'markPlayerDisconnected' },
        PLAYER_RECONNECT: { actions: 'reconnectPlayer' },
        ADVANCE_REVEAL: [
          {
            guard: 'hasMoreReveal',
            actions: 'advanceReveal',
          },
          // No more reveals — wait for marking
        ],
        MARK_GUESS: { actions: 'markGuess' },
        ALL_GUESSES_MARKED: {
          actions: ['applyRoundScores'],
          target: 'SCORE_PHASE',
        },
      },
    },

    SCORE_PHASE: {
      entry: {
        type: 'setTimer',
        params: { duration: 4_000 },
      },
      on: {
        PLAYER_LEAVE: { actions: 'markPlayerDisconnected' },
        PLAYER_RECONNECT: { actions: 'reconnectPlayer' },
        NEXT_TURN: [
          {
            guard: 'hasMoreTurns',
            actions: 'nextTurn',
            target: 'GUESS_PHASE',  // next question's guess phase
          },
          {
            actions: ['nextTurn', 'computeAwards'],
            target: 'FINAL_AWARDS',
          },
        ],
      },
    },

    FINAL_AWARDS: {
      on: {
        PLAY_AGAIN: {
          actions: 'resetForNewGame',
          target: 'LOBBY',
        },
      },
    },

    GAME_OVER: {
      type: 'final',
    },
  },
});
