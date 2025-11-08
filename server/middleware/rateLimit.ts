import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 5 * 60 * 1000, maxRequests: number = 1) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  public check(ip: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || entry.resetTime < now) {
      // New window or expired window
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count < this.maxRequests) {
      // Within limit
      entry.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: entry.resetTime,
    };
  }

  public reset(ip: string): void {
    this.store.delete(ip);
  }
}

// Create rate limiter instance (1 request per 5 minutes)
const rateLimiter = new RateLimiter(5 * 60 * 1000, 1);

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get IP address from request
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';

  const result = rateLimiter.check(ip);

  if (!result.allowed && result.resetTime) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    res.status(429).json({
      error: 'Too many submissions',
      message: 'You can only submit one post every 5 minutes',
      retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
    });
    return;
  }

  next();
};

export default rateLimiter;
