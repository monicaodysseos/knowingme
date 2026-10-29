export function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

export interface WrittenQuestion {
  id: string;
  authorId: string;
  text: string;
}

export interface AssignedQuestion {
  id: string;
  questionId: string;
  text: string;
  subjectId: string;
}

/**
 * Hand each question to someone who did not write it.
 * Loads stay as even as the author rule allows.
 */
export function assignQuestions(
  questions: WrittenQuestion[],
  playerIds: string[],
  rng: () => number,
  nextId: () => string,
): AssignedQuestion[] {
  if (playerIds.length < 2) return [];
  const order = shuffle(playerIds, rng);
  const byAuthor = new Map<string, WrittenQuestion[]>();
  for (const question of shuffle(questions, rng)) {
    const list = byAuthor.get(question.authorId) ?? [];
    list.push(question);
    byAuthor.set(question.authorId, list);
  }
  const assigned: AssignedQuestion[] = [];
  const n = order.length;
  let round = 0;
  let moved = true;
  while (moved && round < questions.length + 1) {
    moved = false;
    for (let i = 0; i < n; i++) {
      const pile = byAuthor.get(order[i]);
      if (!pile || pile.length === 0) continue;
      const question = pile.shift()!;
      let receiver = i;
      for (let step = 1; step < n; step++) {
        const candidate = (i + step + round) % n;
        if (candidate !== i) {
          receiver = candidate;
          break;
        }
      }
      assigned.push({
        id: nextId(),
        questionId: question.id,
        text: question.text,
        subjectId: order[receiver],
      });
      moved = true;
    }
    round += 1;
  }
  return assigned;
}

export interface AnsweredTurn<T> {
  subjectId: string;
  item: T;
}

/**
 * Pick up to `cap` answered turns so subject counts differ by at most 1
 * among players who still have answers left. A player with fewer answers
 * cannot be padded, so the spare turns stay with everyone else, still
 * within one of each other.
 */
export function sampleSubjects<T extends { subjectId: string }>(
  items: T[],
  cap: number,
  rng: () => number,
): T[] {
  if (cap <= 0 || items.length === 0) return [];
  const target = Math.min(cap, items.length);
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const list = buckets.get(item.subjectId) ?? [];
    list.push(item);
    buckets.set(item.subjectId, list);
  }
  for (const [id, list] of buckets) buckets.set(id, shuffle(list, rng));

  const subjects = shuffle([...buckets.keys()], rng);
  const used = new Map<string, number>();
  const picked: T[] = [];
  while (picked.length < target) {
    let best: string | null = null;
    let bestCount = Infinity;
    for (const id of subjects) {
      const have = buckets.get(id)?.length ?? 0;
      const count = used.get(id) ?? 0;
      if (count >= have) continue;
      if (count < bestCount) {
        best = id;
        bestCount = count;
      }
    }
    if (!best) break;
    const count = used.get(best) ?? 0;
    picked.push(buckets.get(best)![count]);
    used.set(best, count + 1);
  }

  // Spread the same subject apart.
  const groups = new Map<string, T[]>();
  for (const item of picked) {
    const list = groups.get(item.subjectId) ?? [];
    list.push(item);
    groups.set(item.subjectId, list);
  }
  const order = shuffle([...groups.keys()], rng);
  const out: T[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const id of order) {
      const list = groups.get(id);
      if (!list || list.length === 0) continue;
      out.push(list.shift()!);
      added = true;
    }
  }
  return out;
}
