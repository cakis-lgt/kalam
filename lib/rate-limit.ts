import { NextResponse } from "next/server";

/**
 * Lightweight in-memory fixed-window rate limiter (PRD §14.4 / §16.3).
 *
 * Scope & caveats:
 * - State lives in process memory, so on a multi-instance / serverless
 *   deployment each instance keeps its own counters. That is acceptable for
 *   the v1 target (≤50 concurrent) and still blunts bursts and brute force.
 *   Swap `hit()` for Upstash/Redis when horizontal scale demands a shared store.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map does not grow unbounded under many keys.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
  resetAt: number;
};

/**
 * Records one hit against `key` and reports whether it is within `limit` per
 * `windowMs`. Call once per request.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, limit, retryAfterSec: 0, resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    limit,
    retryAfterSec: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
    resetAt: existing.resetAt,
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard 429 response with Retry-After + rate-limit headers. */
export function tooManyRequests(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

/**
 * Convenience: enforce a limit for `key`; returns a ready 429 response when
 * exceeded, or `null` when the request may proceed.
 */
export function enforceRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): NextResponse | null {
  const result = rateLimit(key, opts);
  return result.allowed ? null : tooManyRequests(result);
}
