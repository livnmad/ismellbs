import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequestsAnonymous: number;
  private readonly maxRequestsAuthenticated: number;

  constructor(windowMs: number = 5 * 60 * 1000, maxRequestsAnonymous: number = 1, maxRequestsAuthenticated: number = 5) {
    this.windowMs = windowMs;
    this.maxRequestsAnonymous = maxRequestsAnonymous;
    this.maxRequestsAuthenticated = maxRequestsAuthenticated;

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

  public check(identifier: string, isAuthenticated: boolean = false): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);
    const maxRequests = isAuthenticated ? this.maxRequestsAuthenticated : this.maxRequestsAnonymous;

    if (!entry || entry.resetTime < now) {
      // New window or expired window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count < maxRequests) {
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

  public clearAll(): void {
    this.store.clear();
  }

  public getStats(): { totalEntries: number; entries: Array<{ identifier: string; count: number; resetTime: string }> } {
    const entries = Array.from(this.store.entries()).map(([identifier, entry]) => ({
      identifier,
      count: entry.count,
      resetTime: new Date(entry.resetTime).toISOString(),
    }));
    return {
      totalEntries: this.store.size,
      entries,
    };
  }
}

// Create rate limiter instance (1 request per 5 minutes for anonymous, 5 for authenticated)
const rateLimiter = new RateLimiter(5 * 60 * 1000, 1, 5);

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for bypass header
  const bypassHeader = req.headers['x-bypass-rate-limit'];
  if (bypassHeader === 'true') {
    next();
    return;
  }

  // Check if user is authenticated by looking for userId in request body
  const isAuthenticated = !!(req.body?.userId);
  
  // For authenticated users, use their userId as identifier
  // For anonymous users, use their IP address
  const identifier = isAuthenticated
    ? `user-${req.body.userId}`
    : ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
       req.socket.remoteAddress ||
       'unknown');

  const result = rateLimiter.check(identifier, isAuthenticated);

  if (!result.allowed && result.resetTime) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    const limit = isAuthenticated ? 5 : 1;
    const message = isAuthenticated
      ? `You can only submit ${limit} posts every 5 minutes`
      : 'You can only submit one post every 5 minutes. Create an account to post up to 5 times per 5 minutes!';
    
    res.status(429).json({
      error: 'Too many submissions',
      message,
      retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
    });
    return;
  }

  next();
};

export default rateLimiter;
