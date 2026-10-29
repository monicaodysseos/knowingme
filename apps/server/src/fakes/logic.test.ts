import { describe, expect, it } from 'vitest';
import { computeAwards, rankScores } from './awards';
import { fallbackDecoys, geminiDecoys, parseDecoyList, pickDecoys } from './decoys';
import { scoreTurn } from './scoring';
import { assignQuestions, sampleSubjects } from './sample';
import { normalizeAnswer, tooCloseToAnswer } from './text';
import { answerWindow, decoyCount, revealSlice, timersFor, writeWindow } from './timers';
import { sanitizeFakesSettings, sanitizeSettings } from '../settings';

const seq = (() => {
  let n = 0;
  return () => {
    n += 1;
    return `id${n}`;
  };
});

describe('timers', () => {
  it('uses the short game numbers by default and the spec numbers for a long game', () => {
    const short = timersFor(false);
    const long = timersFor(true);
    expect(short.turnCap).toBe(6);
    expect(long.turnCap).toBe(10);
    expect(short.howMs).toBe(20_000);
    expect(long.howMs).toBe(25_000);
    expect(writeWindow(short, 2)).toBe(25_000 + 40_000);
    expect(writeWindow(long, 2)).toBe(30_000 + 80_000);
    expect(answerWindow(short, 2)).toBe(25_000 + 30_000);
    expect(answerWindow(long, 2)).toBe(30_000 + 60_000);
    expect(short.fakeMs).toBe(25_000);
    expect(long.fakeMs).toBe(45_000);
    expect(short.voteMs).toBe(20_000);
    expect(long.voteMs).toBe(30_000);
    expect(short.crownMs).toBe(8_000);
    expect(long.crownMs).toBe(10_000);
    expect(short.disconnectSkipMs).toBe(10_000);
    expect(long.disconnectSkipMs).toBe(10_000);
    expect(revealSlice(long, 8)).toBe(Math.round(20_000 / 8));
    expect(revealSlice(short, 2)).toBe(3_000);
  });
});

describe('sampling', () => {
  it('keeps subject counts within one when everyone answered enough', () => {
    const items = [];
    for (let player = 0; player < 8; player++) {
      for (let q = 0; q < 2; q++) items.push({ subjectId: `p${player}`, q });
    }
    const picked = sampleSubjects(items, 6, () => 0.3);
    expect(picked).toHaveLength(6);
    const counts = new Map<string, number>();
    for (const item of picked) counts.set(item.subjectId, (counts.get(item.subjectId) ?? 0) + 1);
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
  });

  it('does not ask a player to be the subject more times than they answered', () => {
    const items = [
      { subjectId: 'a' },
      { subjectId: 'b' },
      { subjectId: 'b' },
      { subjectId: 'c' },
      { subjectId: 'c' },
    ];
    const picked = sampleSubjects(items, 10, () => 0.2);
    const counts = new Map<string, number>();
    for (const item of picked) counts.set(item.subjectId, (counts.get(item.subjectId) ?? 0) + 1);
    expect(counts.get('a')).toBe(1);
    expect((counts.get('b') ?? 0) - (counts.get('c') ?? 0)).toBeLessThanOrEqual(1);
  });

  it('never hands a question back to its author', () => {
    const questions = ['a', 'b', 'c', 'd'].flatMap((author) => (
      [1, 2].map((n) => ({ id: `${author}${n}`, authorId: author, text: `${author} ${n}` }))
    ));
    const assigned = assignQuestions(questions, ['a', 'b', 'c', 'd'], () => 0.4, seq());
    expect(assigned.length).toBe(8);
    const load = new Map<string, number>();
    for (const row of assigned) {
      const question = questions.find((item) => item.id === row.questionId)!;
      expect(row.subjectId).not.toBe(question.authorId);
      load.set(row.subjectId, (load.get(row.subjectId) ?? 0) + 1);
    }
    expect([...load.values()].every((count) => count === 2)).toBe(true);

    const trio = ['a', 'b', 'c'].map((author) => ({ id: author, authorId: author, text: author }));
    const dealt = assignQuestions(trio, ['a', 'b', 'c'], () => 0.2, seq());
    const dealtLoad = new Map<string, number>();
    for (const row of dealt) dealtLoad.set(row.subjectId, (dealtLoad.get(row.subjectId) ?? 0) + 1);
    expect([...dealtLoad.values()]).toEqual([1, 1, 1]);
  });
});

describe('merging and scoring', () => {
  it('folds case, accents, whitespace and punctuation', () => {
    expect(normalizeAnswer('Pizza!')).toBe(normalizeAnswer('pizza'));
    expect(normalizeAnswer('well known')).toBe(normalizeAnswer('well-known'));
    expect(normalizeAnswer('  café  ')).toBe(normalizeAnswer('cafe'));
    expect(normalizeAnswer('pizza   party')).toBe('pizza party');
  });

  it('rejects an identical fake and a small typo, and leaves a different answer', () => {
    expect(tooCloseToAnswer('Pizza!', 'pizza')).toBe(true);
    expect(tooCloseToAnswer('café', 'cafe')).toBe(true);
    expect(tooCloseToAnswer('pizza   party', 'pizza party')).toBe(true);
    expect(tooCloseToAnswer('piza', 'pizza')).toBe(true);
    expect(tooCloseToAnswer('pizaz', 'pizza')).toBe(true);
    expect(tooCloseToAnswer('pineaple', 'pineapple')).toBe(true);
    expect(tooCloseToAnswer('recieve', 'receive')).toBe(true);
    expect(tooCloseToAnswer('cat', 'dog')).toBe(false);
    expect(tooCloseToAnswer('a pigeon with a grudge', 'pizza')).toBe(false);
  });

  it('does not pay 100 for a fake that matched the real answer', () => {
    const result = scoreTurn({
      subjectId: 'ada',
      doubled: false,
      literallyOptionId: null,
      options: [
        { id: 'real', kind: 'real', authorIds: [], mergedAuthors: ['bea'] },
      ],
      votes: [{ playerId: 'cio', optionId: 'real' }],
    });
    expect(result.deltas.bea).toBeUndefined();
    expect(result.deltas.cio).toBe(100);
    expect(result.deltas.ada).toBe(50);
    expect(result.finders).toEqual(['cio']);
    expect(result.subjectFound).toBe(true);
    expect(result.fooled).toEqual([]);
  });

  it('pays the literally me fake once to the writer and once to each voter', () => {
    const result = scoreTurn({
      subjectId: 'ada',
      doubled: false,
      literallyOptionId: 'fake',
      options: [
        { id: 'real', kind: 'real', authorIds: [], mergedAuthors: [] },
        { id: 'fake', kind: 'fake', authorIds: ['bea'], mergedAuthors: [] },
      ],
      votes: [{ playerId: 'cio', optionId: 'fake' }],
    });
    expect(result.deltas.bea).toBe(100);
    expect(result.deltas.cio).toBe(100);
    expect(result.deltas.ada).toBe(50);
    expect(result.subjectFound).toBe(true);
    expect(result.fooled).toEqual([]);
  });

  it('scores a decoy as nothing and doubles the last pass', () => {
    const decoy = scoreTurn({
      subjectId: 'ada',
      doubled: false,
      literallyOptionId: null,
      options: [
        { id: 'real', kind: 'real', authorIds: [], mergedAuthors: [] },
        { id: 'decoy', kind: 'decoy', authorIds: [], mergedAuthors: [] },
      ],
      votes: [{ playerId: 'bea', optionId: 'decoy' }],
    });
    expect(decoy.deltas).toEqual({});
    expect(decoy.subjectFound).toBe(false);

    const doubled = scoreTurn({
      subjectId: 'ada',
      doubled: true,
      literallyOptionId: null,
      options: [{ id: 'real', kind: 'real', authorIds: [], mergedAuthors: [] }],
      votes: [{ playerId: 'bea', optionId: 'real' }],
    });
    expect(doubled.deltas.bea).toBe(200);
    expect(doubled.deltas.ada).toBe(100);
  });

  it('gives both writers of one fake the fool points', () => {
    const result = scoreTurn({
      subjectId: 'ada',
      doubled: false,
      literallyOptionId: null,
      options: [{ id: 'fake', kind: 'fake', authorIds: ['bea', 'cio'], mergedAuthors: [] }],
      votes: [{ playerId: 'dee', optionId: 'fake' }],
    });
    expect(result.deltas.bea).toBe(50);
    expect(result.deltas.cio).toBe(50);
    expect(result.deltas.dee).toBeUndefined();
  });
});

describe('awards and rank', () => {
  const players = [
    { id: 'a', name: 'ada' },
    { id: 'b', name: 'bea' },
    { id: 'c', name: 'cio' },
  ];

  it('counts open book as turns found, not the number of finders', () => {
    const awards = computeAwards([
      { subjectId: 'a', finders: ['c', 'b'], fooled: [] },
      { subjectId: 'a', finders: ['c'], fooled: [{ authorId: 'b', voterId: 'c' }] },
      { subjectId: 'b', finders: [], fooled: [] },
    ], players);
    expect(awards.find((award) => award.id === 'open-book')?.names).toEqual(['ada']);
    expect(awards.find((award) => award.id === 'mind-reader')?.names).toEqual(['cio']);
    expect(awards.find((award) => award.id === 'master-of-disguise')?.names).toEqual(['bea']);
    expect(awards.find((award) => award.id === 'who-knows-who')?.names[0]).toContain('ada');
    expect(awards.find((award) => award.id === 'who-knows-who')?.names[0]).toContain('cio');
  });

  it('shares a rank when scores match and lists the better finder first', () => {
    const ranks = rankScores([
      { id: 'a', name: 'ada', score: 100, realsFound: 1 },
      { id: 'b', name: 'bea', score: 100, realsFound: 3 },
      { id: 'c', name: 'cio', score: 50, realsFound: 9 },
    ]);
    expect(ranks.get('a')).toBe(1);
    expect(ranks.get('b')).toBe(1);
    expect(ranks.get('c')).toBe(3);
  });
});

describe('decoy fallback', () => {
  it('uses other answers and then the built in list', () => {
    const picked = fallbackDecoys(2, 'Pizza!', ['rainy tuesdays', 'pizza'], () => 0.5);
    expect(picked).toHaveLength(2);
    for (const line of picked) expect(normalizeAnswer(line)).not.toBe('pizza');
  });

  it('prefers a generated line and strips dashes', () => {
    const picked = pickDecoys(['well-known fear'], 1, 'pizza', [], () => 0.1);
    expect(picked).toEqual(['well known fear']);
  });

  it('parses a json list from the model', () => {
    expect(parseDecoyList('sure\n["one", "two"]')).toEqual(['one', 'two']);
  });

  it('returns null when the key is missing and when the call fails', async () => {
    expect(await geminiDecoys({ question: 'q', subjectName: 'ada', count: 1, avoid: [] }, {})).toBeNull();
    const fetchImpl = (async () => {
      throw new Error('slow');
    }) as unknown as typeof fetch;
    expect(await geminiDecoys(
      { question: 'q', subjectName: 'ada', count: 1, avoid: [] },
      { GEMINI_API_KEY: 'test-key' },
      fetchImpl,
    )).toBeNull();
  });

  it('reads a flash response', async () => {
    const fetchImpl = (async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '["a pigeon", "the-last biscuit"]' }] } }] }),
    })) as unknown as typeof fetch;
    const lines = await geminiDecoys(
      { question: 'what do you fear', subjectName: 'ada', count: 2, avoid: [] },
      { GEMINI_API_KEY: 'test-key' },
      fetchImpl,
    );
    expect(lines).toEqual(['a pigeon', 'the last biscuit']);
  });
});

describe('fakes settings', () => {
  it('drops questionsToAnswer and clamps questions you write to 3', () => {
    const settings = sanitizeFakesSettings({
      maxPlayers: 99,
      questionsToWrite: 5,
      questionsToAnswer: 9,
      longGame: true,
      phonesOnly: true,
    });
    expect(settings.maxPlayers).toBe(12);
    expect(settings.questionsToWrite).toBe(3);
    expect(settings.longGame).toBe(true);
    expect(settings.phonesOnly).toBe(true);
    expect('questionsToAnswer' in settings).toBe(false);
    expect(sanitizeSettings({ questionsToAnswer: 7 }).questionsToAnswer).toBe(7);
  });
});
