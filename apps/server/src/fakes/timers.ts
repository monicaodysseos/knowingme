/**
 * Short game (the default) is built to land near 10 minutes when eight
 * players each write two questions and every clock runs out:
 * how it works 20s, write 25s + 20s a question, answer 25s + 15s a question,
 * six turns of fake 25s + vote 20s + reveal 3s a card (capped at 15s),
 * a scoreboard every three turns and after the last at 12s, an 8s
 * final pass announcement, and an 8s crown. That full clock is 9 minutes.
 * Phases still end early once everyone has sent.
 *
 * Long game uses the spec: turn cap 10, how 25s, write 30s + 40s a
 * question, answer 30s + 30s a question, fake 45s, vote 30s, reveal 3s
 * a card capped at 20s, crown 10s. The scoreboard (15s) and the final
 * pass announcement (10s) are not given a time in the spec.
 */

export interface TimerSet {
  turnCap: number;
  howMs: number;
  writeBaseMs: number;
  writePerQuestionMs: number;
  answerBaseMs: number;
  answerPerQuestionMs: number;
  fakeMs: number;
  voteMs: number;
  revealPerCardMs: number;
  revealCapMs: number;
  scoreboardMs: number;
  crownMs: number;
  doubleMs: number;
  disconnectSkipMs: number;
}

const SHORT: TimerSet = {
  turnCap: 6,
  howMs: 20_000,
  writeBaseMs: 25_000,
  writePerQuestionMs: 20_000,
  answerBaseMs: 25_000,
  answerPerQuestionMs: 15_000,
  fakeMs: 25_000,
  voteMs: 20_000,
  revealPerCardMs: 3_000,
  revealCapMs: 15_000,
  scoreboardMs: 12_000,
  crownMs: 8_000,
  doubleMs: 8_000,
  disconnectSkipMs: 10_000,
};

const LONG: TimerSet = {
  turnCap: 10,
  howMs: 25_000,
  writeBaseMs: 30_000,
  writePerQuestionMs: 40_000,
  answerBaseMs: 30_000,
  answerPerQuestionMs: 30_000,
  fakeMs: 45_000,
  voteMs: 30_000,
  revealPerCardMs: 3_000,
  revealCapMs: 20_000,
  scoreboardMs: 15_000,
  crownMs: 10_000,
  doubleMs: 10_000,
  disconnectSkipMs: 10_000,
};

export function timersFor(longGame: boolean): TimerSet {
  return longGame ? LONG : SHORT;
}

export function writeWindow(timers: TimerSet, questions: number): number {
  return timers.writeBaseMs + timers.writePerQuestionMs * Math.max(0, questions);
}

export function answerWindow(timers: TimerSet, questions: number): number {
  return timers.answerBaseMs + timers.answerPerQuestionMs * Math.max(0, questions);
}

/** How long one reveal card stays up. Many cards share the cap. */
export function revealSlice(timers: TimerSet, cards: number): number {
  if (cards <= 0) return 0;
  const total = Math.min(timers.revealCapMs, cards * timers.revealPerCardMs);
  return Math.max(1, Math.round(total / cards));
}

export function decoyCount(playerCount: number): number {
  if (playerCount <= 2) return 2;
  if (playerCount === 3) return 1;
  return 0;
}
