import { nameList } from '@ksero-se/types';

export interface AwardRecord {
  subjectId: string;
  finders: string[];
  fooled: Array<{ authorId: string; voterId: string }>;
}

export interface AwardWinner {
  id: 'mind-reader' | 'open-book' | 'master-of-disguise' | 'who-knows-who';
  names: string[];
}

export interface RankedPlayer {
  id: string;
  name: string;
  score: number;
  realsFound: number;
}

/**
 * Open book counts turns as the subject where at least one other player
 * found the real answer or the fake the subject called literally them.
 * It is not the sum of finders.
 *
 * Who knows who is the pair with the highest combined finds in either
 * direction. A one way pair can win if nobody found each other both ways.
 */
export function computeAwards(
  records: AwardRecord[],
  players: Array<{ id: string; name: string }>,
): AwardWinner[] {
  const nameOf = new Map(players.map((player) => [player.id, player.name]));
  const found = new Map<string, number>();
  const open = new Map<string, number>();
  const disguise = new Map<string, number>();
  const matrix = new Map<string, number>();

  const bump = (map: Map<string, number>, id: string, by = 1) => {
    map.set(id, (map.get(id) ?? 0) + by);
  };

  for (const record of records) {
    if (record.finders.length > 0) bump(open, record.subjectId);
    for (const finder of record.finders) {
      bump(found, finder);
      const key = `${finder}>${record.subjectId}`;
      bump(matrix, key);
    }
    for (const hit of record.fooled) bump(disguise, hit.authorId);
  }

  const top = (map: Map<string, number>): string[] => {
    let best = 0;
    for (const value of map.values()) best = Math.max(best, value);
    if (best <= 0) return [];
    return players.filter((player) => (map.get(player.id) ?? 0) === best).map((player) => player.name);
  };

  let bestPair = 0;
  const pairs: string[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i].id;
      const b = players[j].id;
      const total = (matrix.get(`${a}>${b}`) ?? 0) + (matrix.get(`${b}>${a}`) ?? 0);
      if (total <= 0) continue;
      const label = nameList([nameOf.get(a) ?? a, nameOf.get(b) ?? b]);
      if (total > bestPair) {
        bestPair = total;
        pairs.length = 0;
        pairs.push(label);
      } else if (total === bestPair) {
        pairs.push(label);
      }
    }
  }

  return [
    { id: 'mind-reader', names: top(found) },
    { id: 'open-book', names: top(open) },
    { id: 'master-of-disguise', names: top(disguise) },
    { id: 'who-knows-who', names: pairs },
  ];
}

/** Shared rank when scores match. More real answers found only decides the order. */
export function rankScores(players: RankedPlayer[]): Map<string, number> {
  const sorted = [...players].sort((a, b) => (
    b.score - a.score || b.realsFound - a.realsFound || a.name.localeCompare(b.name)
  ));
  const ranks = new Map<string, number>();
  sorted.forEach((player, index) => {
    if (index > 0 && player.score === sorted[index - 1].score) {
      ranks.set(player.id, ranks.get(sorted[index - 1].id)!);
    } else {
      ranks.set(player.id, index + 1);
    }
  });
  return ranks;
}
