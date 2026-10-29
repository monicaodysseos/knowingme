import { v4 as uuidv4 } from 'uuid';
import {
  PLAYER_COLORS,
  characterName,
  copy,
  crownLine,
  everyoneElse,
  fakeBy,
  fooledLine,
  literallyFlag,
  nameList,
  realSaid,
  saysLiterally,
  theyKnow,
  wasAsked,
  whichReal,
  writeTv,
  type FakesAwardView,
  type FakesPhase,
  type FakesView,
  type PlayerCharacter,
  type PlayerColor,
} from '@ksero-se/types';
import { TEXT_LIMITS } from '../settings';
import { computeAwards, rankScores, type AwardRecord } from './awards';
import {
  decoyCharacters,
  pickDecoys,
  type DecoyGenerator,
  defaultDecoyGenerator,
} from './decoys';
import { assignQuestions, sampleSubjects, shuffle, type WrittenQuestion } from './sample';
import { scoreTurn, type ScoreOption } from './scoring';
import { normalizeAnswer } from './text';
import { answerWindow, decoyCount, revealSlice, timersFor, writeWindow, type TimerSet } from './timers';

export interface FakesSettings {
  maxPlayers: number;
  questionsToWrite: number;
  phonesOnly: boolean;
  longGame: boolean;
}

interface Person {
  id: string;
  socketId: string;
  name: string;
  color: PlayerColor;
  avatar: PlayerCharacter;
  isHost: boolean;
  isConnected: boolean;
  sessionToken: string;
  disconnectedAt?: number;
  score: number;
  realsFound: number;
}

interface Assignment {
  id: string;
  questionId: string;
  text: string;
  subjectId: string;
  answer?: string;
}

interface VoteOption {
  id: string;
  text: string;
  kind: 'real' | 'fake' | 'decoy';
  authorIds: string[];
  mergedAuthors: string[];
  character?: string;
}

interface Turn {
  subjectId: string;
  questionText: string;
  answer: string;
  doubled: boolean;
  fakes: Array<{ playerId: string; text: string }>;
  decoys: Array<{ text: string; character: string }>;
  decoySource: 'pending' | 'ai' | 'fallback';
  options: VoteOption[];
  votes: Array<{ playerId: string; optionId: string }>;
  literallyOptionId: string | null;
  cards: string[][];
  cardIndex: number;
  scored: boolean;
}

interface Deadline {
  at: number;
  kind: 'phase' | 'skip' | 'card';
}

export interface TurnInspect {
  options: VoteOption[];
  literallyOptionId: string | null;
  decoySource: Turn['decoySource'];
  cards: string[][];
}

export interface FakesSnapshot {
  settings: FakesSettings;
  players: Person[];
  hostId: string;
  phase: FakesPhase;
  questions: WrittenQuestion[];
  assignments: Assignment[];
  turns: Turn[];
  turnIndex: number;
  announcedDouble: boolean;
  submitted: string[];
  skipped: string[];
  records: AwardRecord[];
  deadline: Deadline | null;
  phaseEndsAt: number;
  timerTotalMs: number;
  seq: number;
}

export interface FakesHooks {
  rng?: () => number;
  decoys?: DecoyGenerator;
  seen?: (token: string) => boolean;
  markSeen?: (token: string) => void;
  now?: () => number;
}

const AWARD_TITLE: Record<FakesAwardView['id'], string> = {
  'mind-reader': copy.mindReader,
  'open-book': copy.openBook,
  'master-of-disguise': copy.masterOfDisguise,
  'who-knows-who': copy.whoKnowsWho,
};

export class FakesGame {
  readonly roomCode: string;
  settings: FakesSettings;
  players: Person[] = [];
  hostId = '';
  phase: FakesPhase = 'LOBBY';
  private questions: WrittenQuestion[] = [];
  private assignments: Assignment[] = [];
  private turns: Turn[] = [];
  private turnIndex = 0;
  private announcedDouble = false;
  private submitted = new Set<string>();
  private skipped = new Set<string>();
  private records: AwardRecord[] = [];
  private deadline: Deadline | null = null;
  private phaseEndsAt = 0;
  private timerTotalMs = 0;
  private seq = 0;
  private readonly timers: TimerSet;
  private readonly rng: () => number;
  private readonly decoys: DecoyGenerator;
  private readonly seen: (token: string) => boolean;
  private readonly markSeen: (token: string) => void;
  private readonly clock: () => number;

  constructor(roomCode: string, settings: FakesSettings, hooks: FakesHooks = {}) {
    this.roomCode = roomCode;
    this.settings = settings;
    this.timers = timersFor(settings.longGame);
    this.rng = hooks.rng ?? Math.random;
    this.decoys = hooks.decoys ?? defaultDecoyGenerator;
    this.seen = hooks.seen ?? (() => false);
    this.markSeen = hooks.markSeen ?? (() => {});
    this.clock = hooks.now ?? Date.now;
  }

  private now(): number {
    return this.clock();
  }

  private nextId(): string {
    this.seq += 1;
    return `f${this.seq}`;
  }

  nextDeadline(): number | null {
    return this.deadline?.at ?? null;
  }

  join(input: {
    name: string;
    socketId: string;
    sessionToken?: string;
    avatar?: PlayerCharacter;
  }): { ok: true; playerId: string; sessionToken: string; color: PlayerColor } | { ok: false; error: string } {
    const token = input.sessionToken?.trim() || uuidv4();
    const existing = this.players.find((player) => player.sessionToken === token);
    if (existing) {
      existing.socketId = input.socketId;
      existing.isConnected = true;
      existing.disconnectedAt = undefined;
      this.refreshSkip(this.now());
      return { ok: true, playerId: existing.id, sessionToken: token, color: existing.color };
    }
    if (this.phase !== 'LOBBY') return { ok: false, error: 'This game has already started.' };
    if (this.players.length >= this.settings.maxPlayers) return { ok: false, error: 'This room is full.' };
    const name = input.name.trim().slice(0, TEXT_LIMITS.name);
    if (!name) return { ok: false, error: 'Please enter a name.' };
    const player: Person = {
      id: uuidv4(),
      socketId: input.socketId,
      name,
      color: this.pickColor(),
      avatar: input.avatar ?? 'blob',
      isHost: this.players.length === 0,
      isConnected: true,
      sessionToken: token,
      score: 0,
      realsFound: 0,
    };
    this.players.push(player);
    if (player.isHost) this.hostId = player.id;
    return { ok: true, playerId: player.id, sessionToken: token, color: player.color };
  }

  disconnect(playerId: string, now = this.now()): void {
    const player = this.players.find((item) => item.id === playerId);
    if (!player || !player.isConnected) return;
    player.isConnected = false;
    player.disconnectedAt = now;
    if (player.id === this.hostId) this.promoteHost();
    this.refreshSkip(now);
    this.maybeFinishEarly(now);
  }

  start(now = this.now()): boolean {
    if (this.phase !== 'LOBBY') return false;
    if (this.players.length < 2) return false;
    this.announcedDouble = false;
    this.records = [];
    this.questions = [];
    this.assignments = [];
    this.turns = [];
    this.turnIndex = 0;
    for (const player of this.players) {
      player.score = 0;
      player.realsFound = 0;
    }
    this.enter('HOW_IT_WORKS', this.timers.howMs, now);
    return true;
  }

  /** Phone "got it". Ends the how screen only when nobody here is new. */
  gotIt(now = this.now()): boolean {
    if (this.phase !== 'HOW_IT_WORKS') return false;
    if (!this.canSkipHow()) return false;
    this.finishHow(now);
    return true;
  }

  submitQuestions(playerId: string, raw: string[], now = this.now()): string | null {
    if (this.phase !== 'WRITE') return 'Not taking questions right now.';
    if (this.submitted.has(playerId)) return null;
    const questions = raw
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim().slice(0, TEXT_LIMITS.question))
      .filter((item) => item.length > 0)
      .slice(0, this.settings.questionsToWrite);
    for (const text of questions) {
      this.questions.push({ id: this.nextId(), authorId: playerId, text });
    }
    this.submitted.add(playerId);
    this.maybeFinishEarly(now);
    return null;
  }

  submitAnswers(
    playerId: string,
    raw: Array<{ assignmentId: string; text: string }>,
    now = this.now(),
  ): string | null {
    if (this.phase !== 'ANSWER') return 'Not taking answers right now.';
    if (this.submitted.has(playerId)) return null;
    const mine = this.assignments.filter((item) => item.subjectId === playerId);
    if (mine.length === 0) return null;
    let stored = 0;
    for (const item of raw) {
      const text = typeof item.text === 'string' ? item.text.trim().slice(0, TEXT_LIMITS.answer) : '';
      if (!text) continue;
      const assignment = mine.find((row) => row.id === item.assignmentId);
      if (!assignment || assignment.answer) continue;
      assignment.answer = text;
      stored += 1;
    }
    if (stored === 0) return 'Write an answer first.';
    this.submitted.add(playerId);
    this.maybeFinishEarly(now);
    return null;
  }

  submitFake(playerId: string, raw: string, now = this.now()): string | null {
    if (this.phase !== 'FAKE') return 'Not taking fakes right now.';
    const turn = this.currentTurn();
    if (!turn || playerId === turn.subjectId) return null;
    if (this.submitted.has(playerId)) return null;
    const text = raw.trim().slice(0, TEXT_LIMITS.answer);
    if (!text) return 'Write something first.';
    turn.fakes.push({ playerId, text });
    this.submitted.add(playerId);
    this.maybeFinishEarly(now);
    return null;
  }

  submitVote(playerId: string, optionId: string, now = this.now()): string | null {
    if (this.phase !== 'VOTE') return 'Not taking votes right now.';
    const turn = this.currentTurn();
    if (!turn || playerId === turn.subjectId) return null;
    if (this.submitted.has(playerId)) return null;
    const option = turn.options.find((item) => item.id === optionId);
    if (!option) return 'Pick one of the answers.';
    if (option.authorIds.includes(playerId)) return 'That one is yours.';
    turn.votes.push({ playerId, optionId });
    this.submitted.add(playerId);
    this.maybeFinishEarly(now);
    return null;
  }

  submitLiterally(playerId: string, optionId: string | null, now = this.now()): string | null {
    if (this.phase !== 'VOTE') return 'Not taking votes right now.';
    const turn = this.currentTurn();
    if (!turn || playerId !== turn.subjectId) return null;
    if (this.submitted.has(playerId)) return null;
    if (optionId) {
      const option = turn.options.find((item) => item.id === optionId);
      if (!option || option.kind !== 'fake') return 'Pick a fake, or lock in with none.';
      turn.literallyOptionId = option.id;
    }
    this.submitted.add(playerId);
    this.maybeFinishEarly(now);
    return null;
  }

  toSnapshot(): FakesSnapshot {
    return {
      settings: this.settings,
      players: this.players.map((player) => ({ ...player })),
      hostId: this.hostId,
      phase: this.phase,
      questions: this.questions,
      assignments: this.assignments,
      turns: this.turns,
      turnIndex: this.turnIndex,
      announcedDouble: this.announcedDouble,
      submitted: [...this.submitted],
      skipped: [...this.skipped],
      records: this.records,
      deadline: this.deadline,
      phaseEndsAt: this.phaseEndsAt,
      timerTotalMs: this.timerTotalMs,
      seq: this.seq,
    };
  }

  static fromSnapshot(roomCode: string, raw: FakesSnapshot, hooks: FakesHooks = {}): FakesGame {
    const game = new FakesGame(roomCode, raw.settings, hooks);
    game.players = raw.players.map((player) => ({ ...player }));
    game.hostId = raw.hostId;
    game.phase = raw.phase;
    game.questions = raw.questions;
    game.assignments = raw.assignments;
    game.turns = raw.turns;
    game.turnIndex = raw.turnIndex;
    game.announcedDouble = raw.announcedDouble;
    game.submitted = new Set(raw.submitted);
    game.skipped = new Set(raw.skipped);
    game.records = raw.records;
    game.deadline = raw.deadline;
    game.phaseEndsAt = raw.phaseEndsAt;
    game.timerTotalMs = raw.timerTotalMs;
    game.seq = raw.seq;
    return game;
  }

  playAgain(now = this.now()): void {
    if (this.phase !== 'AWARDS' && this.phase !== 'CROWN') return;
    this.phase = 'LOBBY';
    this.deadline = null;
    this.questions = [];
    this.assignments = [];
    this.turns = [];
    this.records = [];
    this.submitted.clear();
    this.skipped.clear();
    this.timerTotalMs = 0;
    this.phaseEndsAt = now;
  }

  /** Apply deadlines that are due at `now`. */
  tick(now: number): void {
    let guard = 0;
    while (this.deadline && this.deadline.at <= now && guard < 80) {
      guard += 1;
      this.applyNext(now);
    }
  }

  /** End the current deadline even if the clock has not reached it. */
  expire(now = this.now()): void {
    if (!this.deadline) return;
    this.applyNext(now);
  }

  inspect(): TurnInspect | null {
    const turn = this.currentTurn();
    if (!turn) return null;
    return {
      options: turn.options,
      literallyOptionId: turn.literallyOptionId,
      decoySource: turn.decoySource,
      cards: turn.cards,
    };
  }

  viewTv(): FakesView {
    return this.view(null);
  }

  viewPhone(playerId: string): FakesView {
    return this.view(playerId);
  }

  private view(playerId: string | null): FakesView {
    const ranks = rankScores(this.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      realsFound: player.realsFound,
    })));
    const rows = [...this.players]
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        score: player.score,
        rank: ranks.get(player.id) ?? this.players.length,
        avatar: player.avatar,
        color: player.color,
        connected: player.isConnected,
        isHost: player.isHost,
      }))
      .sort((a, b) => a.rank - b.rank || b.score - a.score || a.name.localeCompare(b.name));

    const turn = this.currentTurn();
    const subject = turn ? this.players.find((player) => player.id === turn.subjectId) : undefined;
    const viewer = playerId ? this.players.find((player) => player.id === playerId) : undefined;
    const progress = this.progress(playerId);
    const prompts = playerId && this.phase === 'ANSWER'
      ? this.assignments
        .filter((item) => item.subjectId === playerId)
        .map((item) => ({ id: item.id, text: item.text }))
      : undefined;

    const options = turn && this.phase === 'VOTE'
      ? turn.options.map((option) => {
        const yours = !!playerId && option.authorIds.includes(playerId);
        const subjectView = playerId === turn.subjectId;
        const disabled = subjectView ? option.kind !== 'fake' : yours;
        return { id: option.id, text: option.text, yours, disabled };
      })
      : undefined;

    const reveal = turn && this.phase === 'REVEAL' && turn.cards[turn.cardIndex]
      ? {
        lines: turn.cards[turn.cardIndex],
        text: turn.cards[turn.cardIndex].length > 1 && turn.cardIndex === turn.cards.length - 1
          ? turn.answer
          : '',
        step: turn.cardIndex + 1,
        total: turn.cards.length,
      }
      : undefined;

    const awards = this.phase === 'AWARDS' ? this.awardViews() : undefined;
    const crownNames = this.crownNames();
    const draw = crownNames.length !== 1;
    const youWin = !!viewer && !draw && crownNames[0] === viewer.name;

    const base: FakesView = {
      phase: this.phase,
      longGame: this.settings.longGame,
      phonesOnly: this.settings.phonesOnly,
      roomCode: this.roomCode,
      questionsToWrite: this.settings.questionsToWrite,
      timerEnd: this.deadline?.at ?? 0,
      timerTotalMs: this.timerTotalMs,
      players: rows,
      done: progress.done,
      total: progress.total,
      canSkipHow: this.canSkipHow(),
      subjectName: subject?.name,
      questionText: turn?.questionText,
      prompts,
      options,
      isSubject: !!turn && playerId === turn.subjectId,
      submitted: !!playerId && this.submitted.has(playerId),
      reveal,
      awards,
      crownNames: this.phase === 'CROWN' || this.phase === 'AWARDS' ? crownNames : undefined,
      draw: this.phase === 'CROWN' || this.phase === 'AWARDS' ? draw : undefined,
      youWin: this.phase === 'CROWN' || this.phase === 'AWARDS' ? youWin : undefined,
      turnNumber: this.turns.length ? this.turnIndex + 1 : undefined,
      turnTotal: this.turns.length || undefined,
      doubled: turn?.doubled,
      yourName: viewer?.name,
    };
    return base;
  }

  // The lines below are kept so the TV can show the spec sentences from
  // the strings module. They are referenced by the view builder through
  // the cards, which are built with the same helpers.
  tvLines(playerId: string | null): string[] {
    const view = this.view(playerId);
    const name = view.subjectName ?? '';
    if (view.phase === 'HOW_IT_WORKS') return [copy.howTitle, ...copy.howSteps, copy.howPoints];
    if (view.phase === 'WRITE') return [writeTv(view.questionsToWrite), copy.weirder];
    if (view.phase === 'ANSWER') return [copy.answerTv];
    if (view.phase === 'FAKE' && name) return [wasAsked(name), view.questionText ?? '', everyoneElse(name)];
    if (view.phase === 'VOTE' && name) return [whichReal(name)];
    if (view.phase === 'DOUBLE') return [copy.finalPass, copy.pointsDoubled];
    if (view.phase === 'CROWN') {
      if (view.draw) return [copy.draw];
      return [crownLine(view.crownNames?.[0] ?? '')];
    }
    return [];
  }

  private awardViews(): FakesAwardView[] {
    return computeAwards(this.records, this.players).map((award) => ({
      id: award.id,
      title: AWARD_TITLE[award.id],
      winners: award.names,
    }));
  }

  private crownNames(): string[] {
    if (this.players.length === 0) return [];
    const best = Math.max(...this.players.map((player) => player.score));
    return this.players.filter((player) => player.score === best).map((player) => player.name);
  }

  private progress(playerId: string | null): { done: number; total: number } {
    const required = this.requiredIds();
    const total = required.length;
    const done = required.filter((id) => this.submitted.has(id) || this.skipped.has(id)).length;
    if (playerId && this.phase === 'WRITE') {
      return { done: this.submitted.size, total: this.players.length };
    }
    return { done, total };
  }

  private canSkipHow(): boolean {
    if (this.players.length === 0) return false;
    return this.players.every((player) => this.seen(player.sessionToken));
  }

  private pickColor(): PlayerColor {
    const used = new Set(this.players.map((player) => player.color.name));
    const free = PLAYER_COLORS.filter((color) => !used.has(color.name));
    const pool = free.length > 0 ? free : PLAYER_COLORS;
    return pool[Math.floor(this.rng() * pool.length)];
  }

  private promoteHost(): void {
    const next = this.players.find((player) => player.isConnected && player.id !== this.hostId);
    if (!next) return;
    this.hostId = next.id;
    for (const player of this.players) player.isHost = player.id === next.id;
  }

  private currentTurn(): Turn | null {
    return this.turns[this.turnIndex] ?? null;
  }

  private enter(phase: FakesPhase, durationMs: number, now: number, kind: Deadline['kind'] = 'phase'): void {
    this.phase = phase;
    this.submitted.clear();
    this.skipped.clear();
    this.timerTotalMs = durationMs;
    this.phaseEndsAt = now + durationMs;
    this.deadline = { at: this.phaseEndsAt, kind };
    this.refreshSkip(now);
  }

  private refreshSkip(now: number): void {
    if (!this.interactive()) return;
    if (!this.deadline) return;
    let at = this.phaseEndsAt;
    let kind: Deadline['kind'] = this.phase === 'REVEAL' ? 'card' : 'phase';
    for (const player of this.players) {
      if (!this.requiredIds().includes(player.id)) continue;
      if (this.submitted.has(player.id) || this.skipped.has(player.id)) continue;
      if (player.isConnected || player.disconnectedAt == null) continue;
      const skipAt = player.disconnectedAt + this.timers.disconnectSkipMs;
      if (skipAt < at) {
        at = skipAt;
        kind = 'skip';
      }
    }
    this.deadline = { at, kind };
    if (at <= now) this.applySkip(now);
  }

  private interactive(): boolean {
    return this.phase === 'WRITE' || this.phase === 'ANSWER' || this.phase === 'FAKE' || this.phase === 'VOTE';
  }

  private requiredIds(): string[] {
    if (this.phase === 'WRITE') return this.players.map((player) => player.id);
    if (this.phase === 'ANSWER') {
      const ids = new Set(this.assignments.map((item) => item.subjectId));
      return this.players.filter((player) => ids.has(player.id)).map((player) => player.id);
    }
    const turn = this.currentTurn();
    if (!turn) return [];
    if (this.phase === 'FAKE') return this.players.filter((player) => player.id !== turn.subjectId).map((player) => player.id);
    if (this.phase === 'VOTE') return this.players.map((player) => player.id);
    return [];
  }

  private maybeFinishEarly(now: number): void {
    if (!this.interactive()) return;
    const required = this.requiredIds().filter((id) => !this.skipped.has(id));
    if (required.length === 0 || required.every((id) => this.submitted.has(id))) {
      this.finishPhase(now);
    }
  }

  private applyNext(now: number): void {
    const deadline = this.deadline;
    this.deadline = null;
    if (!deadline) return;
    if (deadline.kind === 'skip') this.applySkip(now);
    else if (deadline.kind === 'card') this.advanceCard(now);
    else this.finishPhase(now);
  }

  private applySkip(now: number): void {
    for (const player of this.players) {
      if (!this.requiredIds().includes(player.id)) continue;
      if (this.submitted.has(player.id) || player.isConnected || player.disconnectedAt == null) continue;
      if (now >= player.disconnectedAt + this.timers.disconnectSkipMs) this.skipped.add(player.id);
    }
    const pending = this.players.some((player) => (
      this.requiredIds().includes(player.id)
      && !this.submitted.has(player.id)
      && !this.skipped.has(player.id)
      && !player.isConnected
      && player.disconnectedAt != null
      && now >= player.disconnectedAt + this.timers.disconnectSkipMs
    ));
    if (pending) {
      /* already marked */
    }
    this.deadline = { at: this.phaseEndsAt, kind: 'phase' };
    this.maybeFinishEarly(now);
    if (this.deadline && this.interactive()) this.refreshSkip(now);
  }

  private finishPhase(now: number): void {
    if (this.phase === 'HOW_IT_WORKS') this.finishHow(now);
    else if (this.phase === 'WRITE') this.finishWrite(now);
    else if (this.phase === 'ANSWER') this.finishAnswer(now);
    else if (this.phase === 'DOUBLE') this.enterFake(now);
    else if (this.phase === 'FAKE') this.finishFake(now);
    else if (this.phase === 'VOTE') this.finishVote(now);
    else if (this.phase === 'SCOREBOARD') this.afterScore(now);
    else if (this.phase === 'CROWN') this.enter('AWARDS', 0, now);
    else if (this.phase === 'AWARDS') this.deadline = null;
  }

  private finishHow(now: number): void {
    for (const player of this.players) this.markSeen(player.sessionToken);
    this.enter('WRITE', writeWindow(this.timers, this.settings.questionsToWrite), now);
  }

  private finishWrite(now: number): void {
    this.assignments = assignQuestions(this.questions, this.players.map((player) => player.id), this.rng, () => this.nextId());
    if (this.assignments.length === 0) {
      this.enterCrown(now);
      return;
    }
    const per = Math.max(...this.players.map((player) => (
      this.assignments.filter((item) => item.subjectId === player.id).length
    )));
    this.enter('ANSWER', answerWindow(this.timers, per), now);
  }

  private finishAnswer(now: number): void {
    const answered = this.assignments
      .filter((item) => item.answer && item.answer.trim())
      .map((item) => ({
        subjectId: item.subjectId,
        questionText: item.text,
        answer: item.answer!.trim(),
      }));
    const sampled = sampleSubjects(answered, this.timers.turnCap, this.rng);
    this.turns = sampled.map((item, index) => ({
      subjectId: item.subjectId,
      questionText: item.questionText,
      answer: item.answer,
      doubled: index === sampled.length - 1,
      fakes: [],
      decoys: [],
      decoySource: 'pending',
      options: [],
      votes: [],
      literallyOptionId: null,
      cards: [],
      cardIndex: 0,
      scored: false,
    }));
    this.turnIndex = 0;
    this.announcedDouble = false;
    if (this.turns.length === 0) {
      this.enterCrown(now);
      return;
    }
    this.beginTurn(now);
  }

  private beginTurn(now: number): void {
    const turn = this.currentTurn();
    if (!turn) {
      this.enterCrown(now);
      return;
    }
    if (turn.doubled && !this.announcedDouble) {
      this.announcedDouble = true;
      this.enter('DOUBLE', this.timers.doubleMs, now);
      return;
    }
    this.enterFake(now);
  }

  private enterFake(now: number): void {
    const turn = this.currentTurn();
    if (!turn) {
      this.enterCrown(now);
      return;
    }
    this.prepareDecoys(turn);
    this.enter('FAKE', this.timers.fakeMs, now);
  }

  private prepareDecoys(turn: Turn): void {
    const count = decoyCount(this.players.length);
    if (count <= 0) {
      turn.decoySource = 'fallback';
      turn.decoys = [];
      return;
    }
    const subject = this.players.find((player) => player.id === turn.subjectId);
    const others = this.assignments
      .map((item) => item.answer ?? '')
      .filter((text) => text && normalizeAnswer(text) !== normalizeAnswer(turn.answer));
    const request = {
      question: turn.questionText,
      subjectName: subject?.name ?? '',
      count,
      avoid: [turn.answer, ...others],
    };
    void this.decoys(request).then((generated) => {
      if (turn.decoySource !== 'pending') return;
      const texts = pickDecoys(generated, count, turn.answer, others, this.rng);
      this.storeDecoys(turn, texts, generated && generated.length > 0 ? 'ai' : 'fallback');
    }).catch(() => {
      if (turn.decoySource !== 'pending') return;
      const texts = pickDecoys(null, count, turn.answer, others, this.rng);
      this.storeDecoys(turn, texts, 'fallback');
    });
  }

  private storeDecoys(turn: Turn, texts: string[], source: 'ai' | 'fallback'): void {
    const used = this.players.map((player) => characterName(player.avatar));
    const characters = decoyCharacters(used, texts.length, this.rng);
    turn.decoys = texts.map((text, index) => ({ text, character: characters[index] ?? 'ghost' }));
    turn.decoySource = source;
  }

  private ensureDecoys(turn: Turn): void {
    if (turn.decoySource !== 'pending') return;
    const count = decoyCount(this.players.length);
    const others = this.assignments
      .map((item) => item.answer ?? '')
      .filter((text) => text && normalizeAnswer(text) !== normalizeAnswer(turn.answer));
    const texts = pickDecoys(null, count, turn.answer, others, this.rng);
    this.storeDecoys(turn, texts, 'fallback');
  }

  private finishFake(now: number): void {
    const turn = this.currentTurn();
    if (!turn) {
      this.enterCrown(now);
      return;
    }
    this.ensureDecoys(turn);
    turn.options = this.buildOptions(turn);
    this.enter('VOTE', this.timers.voteMs, now);
  }

  private buildOptions(turn: Turn): VoteOption[] {
    const realKey = normalizeAnswer(turn.answer);
    const real: VoteOption = {
      id: this.nextId(),
      text: turn.answer,
      kind: 'real',
      authorIds: [],
      mergedAuthors: [],
    };
    const fakes: VoteOption[] = [];
    for (const fake of turn.fakes) {
      const key = normalizeAnswer(fake.text);
      if (!key) continue;
      if (key === realKey) {
        if (!real.mergedAuthors.includes(fake.playerId)) real.mergedAuthors.push(fake.playerId);
        continue;
      }
      const existing = fakes.find((option) => normalizeAnswer(option.text) === key);
      if (existing) {
        if (!existing.authorIds.includes(fake.playerId)) existing.authorIds.push(fake.playerId);
        continue;
      }
      fakes.push({
        id: this.nextId(),
        text: fake.text,
        kind: 'fake',
        authorIds: [fake.playerId],
        mergedAuthors: [],
      });
    }
    const decoys: VoteOption[] = [];
    for (const decoy of turn.decoys) {
      const key = normalizeAnswer(decoy.text);
      if (!key || key === realKey) continue;
      if (fakes.some((option) => normalizeAnswer(option.text) === key)) continue;
      if (decoys.some((option) => normalizeAnswer(option.text) === key)) continue;
      decoys.push({
        id: this.nextId(),
        text: decoy.text,
        kind: 'decoy',
        authorIds: [],
        mergedAuthors: [],
        character: decoy.character,
      });
    }
    return shuffle([real, ...fakes, ...decoys], this.rng);
  }

  private finishVote(now: number): void {
    const turn = this.currentTurn();
    if (!turn) {
      this.enterCrown(now);
      return;
    }
    this.scoreCurrent();
    turn.cards = this.buildCards(turn);
    turn.cardIndex = 0;
    if (turn.cards.length === 0) {
      this.afterReveal(now);
      return;
    }
    this.showCard(now);
  }

  private scoreCurrent(): void {
    const turn = this.currentTurn();
    if (!turn || turn.scored) return;
    const result = scoreTurn({
      subjectId: turn.subjectId,
      options: turn.options as ScoreOption[],
      votes: turn.votes,
      literallyOptionId: turn.literallyOptionId,
      doubled: turn.doubled,
    });
    for (const [id, delta] of Object.entries(result.deltas)) {
      const player = this.players.find((item) => item.id === id);
      if (player) player.score += delta;
    }
    for (const finder of result.finders) {
      const player = this.players.find((item) => item.id === finder);
      if (player) player.realsFound += 1;
    }
    this.records.push({
      subjectId: turn.subjectId,
      finders: result.finders,
      fooled: result.fooled,
    });
    turn.scored = true;
  }

  private buildCards(turn: Turn): string[][] {
    const subject = this.players.find((player) => player.id === turn.subjectId);
    const subjectName = subject?.name ?? '';
    const nameById = new Map(this.players.map((player) => [player.id, player.name]));
    const voters = (optionId: string) => turn.votes
      .filter((vote) => vote.optionId === optionId)
      .map((vote) => nameById.get(vote.playerId) ?? '')
      .filter((name) => name.length > 0);

    const cards: string[][] = [];
    for (const option of turn.options) {
      if (option.kind === 'real' || option.kind === 'decoy') continue;
      const writers = nameList(option.authorIds.map((id) => nameById.get(id) ?? '').filter(Boolean));
      const fooled = voters(option.id);
      const fooledText = fooled.length ? fooledLine(nameList(fooled)) : copy.fooledNobody;
      if (turn.literallyOptionId === option.id) {
        cards.push([saysLiterally(subjectName), fakeBy(writers), fooledText]);
      } else {
        cards.push([fakeBy(writers), fooledText]);
      }
    }
    for (const option of turn.options) {
      if (option.kind !== 'decoy') continue;
      const fooled = voters(option.id);
      const fooledText = fooled.length ? fooledLine(nameList(fooled)) : copy.fooledNobody;
      cards.push([fakeBy(option.character ?? 'ghost'), fooledText]);
    }
    const real = turn.options.find((option) => option.kind === 'real');
    const know = real ? voters(real.id) : [];
    const realLines = [
      realSaid(subjectName),
      turn.answer,
      know.length ? theyKnow(nameList(know)) : copy.nobodyKnows,
    ];
    if (real && real.mergedAuthors.length > 0) {
      realLines.push(literallyFlag(subjectName));
      const writers = nameList(real.mergedAuthors.map((id) => nameById.get(id) ?? '').filter(Boolean));
      if (writers) realLines.push(fakeBy(writers));
    }
    cards.push(realLines);
    return cards;
  }

  private showCard(now: number): void {
    const turn = this.currentTurn();
    const slice = revealSlice(this.timers, turn?.cards.length ?? 1);
    this.phase = 'REVEAL';
    this.submitted.clear();
    this.skipped.clear();
    this.timerTotalMs = slice;
    this.phaseEndsAt = now + slice;
    this.deadline = { at: this.phaseEndsAt, kind: 'card' };
  }

  private advanceCard(now: number): void {
    const turn = this.currentTurn();
    if (!turn) {
      this.afterReveal(now);
      return;
    }
    if (turn.cardIndex < turn.cards.length - 1) {
      turn.cardIndex += 1;
      this.showCard(now);
      return;
    }
    this.afterReveal(now);
  }

  private afterReveal(now: number): void {
    const number = this.turnIndex + 1;
    const last = this.turnIndex >= this.turns.length - 1;
    if (last || number % 3 === 0) this.enter('SCOREBOARD', this.timers.scoreboardMs, now);
    else this.advanceTurn(now);
  }

  private afterScore(now: number): void {
    const last = this.turnIndex >= this.turns.length - 1;
    if (last) this.enterCrown(now);
    else this.advanceTurn(now);
  }

  private advanceTurn(now: number): void {
    this.turnIndex += 1;
    this.beginTurn(now);
  }

  private enterCrown(now: number): void {
    this.enter('CROWN', this.timers.crownMs, now);
  }

}
