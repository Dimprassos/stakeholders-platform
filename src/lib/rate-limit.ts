/**
 * Lightweight in-process sliding-window rate limiter for public write paths
 * (e.g. the "Become a sponsor" interest form — see docs/PLAN.md §11).
 *
 * State lives in module memory. On a multi-instance / serverless deployment
 * each instance limits independently, so an attacker spread across warm
 * lambdas gets a higher effective ceiling — but it fully stops the common
 * case (a single client scripting rapid submissions) with no datastore. For
 * hard multi-instance guarantees, back this with Redis or a DB table.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Record one attempt for `key` and report whether it is within the allowance.
 * Read-then-write is synchronous (no `await`), so concurrent server-action
 * invocations in the same process can't race past the limit.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const since = now - opts.windowMs;

  const bucket = buckets.get(key) ?? { hits: [] };
  const recent = bucket.hits.filter((t) => t > since);

  if (recent.length >= opts.limit) {
    bucket.hits = recent;
    buckets.set(key, bucket);
    const retryAfterMs = recent[0] + opts.windowMs - now;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  bucket.hits = recent;
  buckets.set(key, bucket);

  sweep(now, opts.windowMs);
  return { ok: true, retryAfterSec: 0 };
}

/** Drop stale buckets occasionally so the Map can't grow unbounded. */
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    const last = b.hits[b.hits.length - 1] ?? 0;
    if (last < now - windowMs) buckets.delete(k);
  }
}
