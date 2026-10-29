/**
 * A fake the subject marks as literally them pays 100 to each of its
 * writers and 100 to each player who voted for it. That 100 is the whole
 * payout for the vote (not 100 plus the usual 50 for fooling someone).
 * The subject also receives 50 for each of those voters, because the call
 * counts as the real answer. Decoy votes pay nothing.
 *
 * A fake that matches or nearly matches the real answer is rejected
 * before it is stored, so it is not merged and it does not pay 100.
 *
 * The last turn doubles every one of those amounts.
 * Open book still counts a turn when at least one other player found
 * the real answer or the fake the subject called.
 */

export interface ScoreOption {
  id: string;
  kind: 'real' | 'fake' | 'decoy';
  authorIds: string[];
  mergedAuthors: string[];
}

export interface ScoreVote {
  playerId: string;
  optionId: string;
}

export interface TurnScore {
  deltas: Record<string, number>;
  /** Players who found the real option or the fake the subject called. */
  finders: string[];
  /** Authors of ordinary fakes, once per player they fooled. */
  fooled: Array<{ authorId: string; voterId: string }>;
  subjectFound: boolean;
}

const FIND_REAL = 100;
const FOOL = 50;
const KNOWN = 50;
const LITERALLY = 100;

export function scoreTurn(input: {
  subjectId: string;
  options: ScoreOption[];
  votes: ScoreVote[];
  literallyOptionId: string | null;
  doubled: boolean;
}): TurnScore {
  const mult = input.doubled ? 2 : 1;
  const deltas: Record<string, number> = {};
  const add = (id: string, amount: number) => {
    if (!id || amount === 0) return;
    deltas[id] = (deltas[id] ?? 0) + amount * mult;
  };

  const byId = new Map(input.options.map((option) => [option.id, option]));
  const literally = input.literallyOptionId ? byId.get(input.literallyOptionId) : undefined;
  const literallyOk = !!literally && literally.kind === 'fake';

  const finders: string[] = [];
  const fooled: Array<{ authorId: string; voterId: string }> = [];

  if (literallyOk) {
    for (const authorId of literally!.authorIds) add(authorId, LITERALLY);
  }

  for (const vote of input.votes) {
    if (vote.playerId === input.subjectId) continue;
    const option = byId.get(vote.optionId);
    if (!option) continue;
    if (option.kind === 'decoy') continue;

    if (option.kind === 'real') {
      add(vote.playerId, FIND_REAL);
      add(input.subjectId, KNOWN);
      finders.push(vote.playerId);
      continue;
    }

    if (literallyOk && option.id === literally!.id) {
      add(vote.playerId, LITERALLY);
      add(input.subjectId, KNOWN);
      finders.push(vote.playerId);
      continue;
    }

    for (const authorId of option.authorIds) {
      if (authorId === vote.playerId) continue;
      add(authorId, FOOL);
      fooled.push({ authorId, voterId: vote.playerId });
    }
  }

  return {
    deltas,
    finders,
    fooled,
    subjectFound: finders.length > 0,
  };
}
