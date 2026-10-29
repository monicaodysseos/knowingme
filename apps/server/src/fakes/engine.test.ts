import { describe, expect, it } from 'vitest';
import { PLAYER_CHARACTERS, type PlayerCharacter } from '@ksero-se/types';
import { FakesGame } from './engine';
import { normalizeAnswer } from './text';
import { decoyCount, timersFor } from './timers';

function gameWith(players: number, hooks: ConstructorParameters<typeof FakesGame>[2] = {}) {
  const seen = new Set<string>();
  const game = new FakesGame('ROOM', {
    maxPlayers: 12,
    questionsToWrite: 1,
    phonesOnly: false,
    longGame: false,
  }, {
    rng: () => 0.25,
    decoys: async () => null,
    seen: (token) => seen.has(token),
    markSeen: (token) => { seen.add(token); },
    ...hooks,
  });
  const ids: string[] = [];
  for (let i = 0; i < players; i++) {
    const joined = game.join({
      name: `P${i}`,
      socketId: `s${i}`,
      avatar: PLAYER_CHARACTERS[i % PLAYER_CHARACTERS.length] as PlayerCharacter,
    });
    if (!joined.ok) throw new Error(joined.error);
    ids.push(joined.playerId);
  }
  return { game, ids, seen };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('fakes engine', () => {
  it('plays a short game down to the awards', () => {
    const { game, ids } = gameWith(3);
    const start = 10_000;
    expect(game.start(start)).toBe(true);
    expect(game.phase).toBe('HOW_IT_WORKS');
    expect(game.viewTv().timerTotalMs).toBe(timersFor(false).howMs);
    expect(game.gotIt(start)).toBe(false);
    game.tick(start + timersFor(false).howMs);
    expect(game.phase).toBe('WRITE');

    for (const id of ids) game.submitQuestions(id, ['what do you fear'], start + 21_000);
    expect(game.phase).toBe('ANSWER');
    for (const id of ids) {
      const prompts = game.viewPhone(id).prompts ?? [];
      expect(prompts.length).toBeGreaterThan(0);
      game.submitAnswers(id, prompts.map((prompt) => ({ assignmentId: prompt.id, text: `answer ${id.slice(0, 4)}` })), start + 30_000);
    }
    expect(['DOUBLE', 'FAKE']).toContain(game.phase);

    let guard = 0;
    while (game.phase !== 'AWARDS' && guard < 40) {
      guard += 1;
      const phase = game.phase;
      if (phase === 'FAKE') {
        const turn = game.viewTv();
        for (const id of ids) {
          if (game.viewPhone(id).isSubject) continue;
          game.submitFake(id, `fake from ${id.slice(0, 4)} about ${turn.subjectName}`, 50_000 + guard);
        }
      } else if (phase === 'VOTE') {
        for (const id of ids) {
          const phone = game.viewPhone(id);
          const choice = (phone.options ?? []).find((option) => !option.disabled);
          if (phone.isSubject) game.submitLiterally(id, choice?.id ?? null, 60_000 + guard);
          else if (choice) game.submitVote(id, choice.id, 60_000 + guard);
        }
      } else {
        game.expire(70_000 + guard * 1000);
      }
    }
    expect(game.phase).toBe('AWARDS');
    expect(game.viewTv().turnTotal).toBe(3);
    expect(game.viewTv().awards?.map((award) => award.title)).toEqual([
      'mind reader',
      'open book',
      'master of disguise',
      'who knows who',
    ]);
    const scores = game.viewTv().players.map((player) => player.score);
    expect(scores.every((score) => score >= 0)).toBe(true);
  });

  it('merges a fake that matches the real answer and flags the writer', () => {
    const { game, ids } = gameWith(2);
    const start = 5_000;
    game.start(start);
    game.tick(start + timersFor(false).howMs);
    game.submitQuestions(ids[0], ['favourite snack'], start);
    game.submitQuestions(ids[1], ['favourite song'], start);
    for (const id of ids) {
      const prompts = game.viewPhone(id).prompts ?? [];
      game.submitAnswers(id, prompts.map((prompt) => ({ assignmentId: prompt.id, text: 'Pizza!' })), start);
    }
    if (game.phase === 'DOUBLE') game.expire(start + 100_000);
    expect(game.phase).toBe('FAKE');
    const subject = ids.find((id) => game.viewPhone(id).isSubject)!;
    const other = ids.find((id) => id !== subject)!;
    game.submitFake(other, 'pizza', start);
    const inspect = game.inspect()!;
    expect(inspect.options.some((option) => option.kind === 'fake')).toBe(false);
    const real = inspect.options.find((option) => option.kind === 'real')!;
    expect(real.mergedAuthors).toEqual([other]);
    expect(normalizeAnswer(real.text)).toBe('pizza');
    expect(inspect.options.filter((option) => option.kind === 'decoy')).toHaveLength(decoyCount(2));
    expect(game.viewPhone(other).options?.find((option) => option.yours)).toBeUndefined();
    game.submitVote(other, real.id, start);
    game.submitLiterally(subject, null, start);
    const lines = game.inspect()!.cards.flat();
    expect(lines.some((line) => line.startsWith('literally '))).toBe(true);
  });

  it('falls back when decoys are not ready and uses them when they are', async () => {
    const hanging = gameWith(2, { decoys: () => new Promise(() => {}) });
    const start = 1_000;
    hanging.game.start(start);
    hanging.game.tick(start + timersFor(false).howMs);
    for (const id of hanging.ids) hanging.game.submitQuestions(id, ['q'], start);
    for (const id of hanging.ids) {
      const prompts = hanging.game.viewPhone(id).prompts ?? [];
      hanging.game.submitAnswers(id, prompts.map((prompt) => ({ assignmentId: prompt.id, text: 'real one' })), start);
    }
    if (hanging.game.phase === 'DOUBLE') hanging.game.expire(start);
    expect(hanging.game.phase).toBe('FAKE');
    const began = Date.now();
    const other = hanging.ids.find((id) => !hanging.game.viewPhone(id).isSubject)!;
    hanging.game.submitFake(other, 'not the real one', start);
    expect(Date.now() - began).toBeLessThan(500);
    expect(hanging.game.inspect()?.decoySource).toBe('fallback');

    let resolveDecoys: (value: string[] | null) => void = () => {};
    const ready = gameWith(2, {
      decoys: () => new Promise((resolve) => { resolveDecoys = resolve; }),
    });
    ready.game.start(start);
    ready.game.tick(start + timersFor(false).howMs);
    for (const id of ready.ids) ready.game.submitQuestions(id, ['q'], start);
    for (const id of ready.ids) {
      const prompts = ready.game.viewPhone(id).prompts ?? [];
      ready.game.submitAnswers(id, prompts.map((prompt) => ({ assignmentId: prompt.id, text: 'real one' })), start);
    }
    if (ready.game.phase === 'DOUBLE') ready.game.expire(start);
    resolveDecoys(['a custom decoy', 'another custom decoy']);
    await flush();
    const writer = ready.ids.find((id) => !ready.game.viewPhone(id).isSubject)!;
    ready.game.submitFake(writer, 'something else', start);
    const texts = ready.game.inspect()?.options.map((option) => option.text) ?? [];
    expect(texts).toContain('a custom decoy');
    expect(ready.game.inspect()?.decoySource).toBe('ai');
  });

  it('skips a disconnected player after 10 seconds and keeps a partial question list', () => {
    const { game, ids } = gameWith(2);
    const start = 50_000;
    game.start(start);
    game.tick(start + timersFor(false).howMs);
    game.submitQuestions(ids[0], ['only one of them'], start);
    game.submitQuestions(ids[1], ['and another'], start);
    expect(game.phase).toBe('ANSWER');
    const kept = game.viewPhone(ids[0]).prompts ?? [];
    expect(kept.length).toBe(1);
    game.submitAnswers(ids[0], kept.map((prompt) => ({ assignmentId: prompt.id, text: 'still here' })), start + 22_000);
    game.disconnect(ids[1], start + 22_000);
    game.tick(start + 22_000 + timersFor(false).disconnectSkipMs);
    expect(game.phase === 'ANSWER').toBe(false);
    expect(game.viewTv().turnTotal).toBe(1);
  });

  it('lets a returning group skip how it works', () => {
    const seen = new Set<string>(['known-a', 'known-b']);
    const game = new FakesGame('ROOM', {
      maxPlayers: 8,
      questionsToWrite: 1,
      phonesOnly: false,
      longGame: true,
    }, {
      seen: (token) => seen.has(token),
      markSeen: (token) => { seen.add(token); },
    });
    const a = game.join({ name: 'Ada', socketId: 'a', sessionToken: 'known-a' });
    const b = game.join({ name: 'Bea', socketId: 'b', sessionToken: 'known-b' });
    if (!a.ok || !b.ok) throw new Error('join');
    game.start(1_000);
    expect(game.viewTv().canSkipHow).toBe(true);
    expect(game.viewTv().longGame).toBe(true);
    expect(game.viewTv().timerTotalMs).toBe(timersFor(true).howMs);
    expect(game.gotIt(1_000)).toBe(true);
    expect(game.phase).toBe('WRITE');
  });

  it('rejects an empty answer and ignores a vote for your own fake', () => {
    const { game, ids } = gameWith(2);
    const start = 8_000;
    game.start(start);
    game.tick(start + timersFor(false).howMs);
    for (const id of ids) game.submitQuestions(id, ['q'], start);
    for (const id of ids) {
      const prompts = game.viewPhone(id).prompts ?? [];
      expect(game.submitAnswers(id, prompts.map((prompt) => ({ assignmentId: prompt.id, text: '   ' })), start)).toBeTruthy();
      game.submitAnswers(id, prompts.map((prompt) => ({ assignmentId: prompt.id, text: 'kept' })), start);
    }
    if (game.phase === 'DOUBLE') game.expire(start);
    const subject = ids.find((id) => game.viewPhone(id).isSubject)!;
    const other = ids.find((id) => id !== subject)!;
    game.submitFake(other, 'mine', start);
    const own = game.viewPhone(other).options?.find((option) => option.yours);
    expect(own?.disabled).toBe(true);
    expect(game.submitVote(other, own!.id, start)).toBeTruthy();
    expect(game.phase).toBe('VOTE');
    const real = (game.viewPhone(other).options ?? []).find((option) => !option.disabled)!;
    game.submitVote(other, real.id, start);
    game.submitLiterally(subject, null, start);
    expect(game.phase).toBe('REVEAL');
  });
});
