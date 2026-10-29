/**
 * Compare key: lower case, accents folded, punctuation removed,
 * whitespace collapsed.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A fake is too close when the normalised text matches, or a small typo
 * would make it match. One edit always counts (including a swapped pair
 * of letters). Two edits count only when the shorter text is at least
 * five characters, so short unrelated words are left alone.
 */
export function tooCloseToAnswer(candidate: string, real: string): boolean {
  const left = normalizeAnswer(candidate);
  const right = normalizeAnswer(real);
  if (!left || !right) return false;
  if (left === right) return true;
  const limit = Math.min(left.length, right.length) < 5 ? 1 : 2;
  if (Math.abs(left.length - right.length) > limit) return false;
  return damerauDistance(left, right) <= limit;
}

/** Edit distance that treats an adjacent swap as a single typo. */
export function damerauDistance(left: string, right: string): number {
  const a = [...left];
  const b = [...right];
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, matrix[i - 2][j - 2] + 1);
      }
      matrix[i][j] = best;
    }
  }
  return matrix[a.length][b.length];
}

/** Drop dash characters from generated decoy text. Player answers are left as typed. */
export function cleanDecoyText(raw: string): string {
  return raw
    .replace(/[‐‑‒–—―-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}
