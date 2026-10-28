import "server-only";

/**
 * Token-bucket rate limiter en memoria (por instancia Fluid).
 * Para producción multi-región: migrar a Vercel Runtime Cache o Upstash.
 */

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const refillRate = limit / windowMs; // tokens per ms
  const existing = buckets.get(key);

  const tokens = existing
    ? Math.min(limit, existing.tokens + (now - existing.updatedAt) * refillRate)
    : limit;

  if (tokens < 1) {
    buckets.set(key, { tokens, updatedAt: now });
    const needed = 1 - tokens;
    return {
      success: false,
      remaining: 0,
      reset: now + needed / refillRate,
    };
  }

  const nextTokens = tokens - 1;
  buckets.set(key, { tokens: nextTokens, updatedAt: now });

  return {
    success: true,
    remaining: Math.floor(nextTokens),
    reset: now + (limit - nextTokens) / refillRate,
  };
}

export function clientKey(ip: string | null | undefined, suffix: string): string {
  return `${ip ?? "unknown"}:${suffix}`;
}
