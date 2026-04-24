// Centralized rate limiter for all API routes
// In-memory with automatic cleanup

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 300_000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

// Predefined configs for different endpoints
export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 60_000, blockDurationMs: 300_000 },      // 5 per minute, block 5 min
  register: { maxRequests: 3, windowMs: 60_000, blockDurationMs: 600_000 },    // 3 per minute, block 10 min
  chat: { maxRequests: 10, windowMs: 60_000 },                                  // 10 per minute
  suggestions: { maxRequests: 5, windowMs: 60_000 },                            // 5 per minute
  notifications: { maxRequests: 30, windowMs: 60_000 },                         // 30 per minute
  general: { maxRequests: 60, windowMs: 60_000 },                               // 60 per minute
  admin: { maxRequests: 100, windowMs: 60_000 },                                // 100 per minute
} as const;

export function rateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.general
): { limited: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { limited: false, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    const retryAfterMs = entry.resetAt - now;
    return { limited: true, retryAfterMs };
  }

  return { limited: false, retryAfterMs: 0 };
}

// Get client IP from request headers
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
