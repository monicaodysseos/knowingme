interface Bucket {
  stamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Sliding window. Returns true when the call is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key) ?? { stamps: [] };
  const cutoff = now - windowMs;
  bucket.stamps = bucket.stamps.filter((stamp) => stamp > cutoff);
  if (bucket.stamps.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.stamps.push(now);
  buckets.set(key, bucket);
  return true;
}

export function pruneRateLimits(now = Date.now()): void {
  const horizon = now - 60 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (bucket.stamps.length === 0 || bucket.stamps[bucket.stamps.length - 1] < horizon) {
      buckets.delete(key);
    }
  }
}

export function resetRateLimits(): void {
  buckets.clear();
}
