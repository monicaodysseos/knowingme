/** Case and punctuation insensitive key for merging answers. */
export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop dash characters from generated decoy text. Player answers are left as typed. */
export function cleanDecoyText(raw: string): string {
  return raw
    .replace(/[‐‑‒–—―-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}
