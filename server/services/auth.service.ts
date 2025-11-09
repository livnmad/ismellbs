import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export class AuthService {
  private readonly ADMIN_USERNAME = 'admin';
  private readonly ADMIN_PASSWORD_HASH: string;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
  private readonly MAX_ATTEMPTS = 2;
  private readonly LOCKOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  private loginAttempts: Map<string, LoginAttempt> = new Map();

  constructor() {
    // Hash the password 'admin' - in production, this should be from env
    this.ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin', 10);
  }

  async login(username: string, password: string, ipAddress: string): Promise<{ token?: string; error?: string; lockedUntil?: Date }> {
    // Check if IP is locked out
    const attempt = this.loginAttempts.get(ipAddress);
    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      return {
        error: `Account locked. Try again after ${attempt.lockedUntil.toLocaleString()}`,
        lockedUntil: attempt.lockedUntil,
      };
    }

    // Validate credentials
    if (username !== this.ADMIN_USERNAME || !bcrypt.compareSync(password, this.ADMIN_PASSWORD_HASH)) {
      // Record failed attempt
      const currentAttempt = this.loginAttempts.get(ipAddress) || { count: 0, lastAttempt: new Date() };
      currentAttempt.count += 1;
      currentAttempt.lastAttempt = new Date();

      if (currentAttempt.count >= this.MAX_ATTEMPTS) {
        currentAttempt.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
        this.loginAttempts.set(ipAddress, currentAttempt);
        
        return {
          error: `Too many failed attempts. Account locked for 24 hours until ${currentAttempt.lockedUntil.toLocaleString()}`,
          lockedUntil: currentAttempt.lockedUntil,
        };
      }

      this.loginAttempts.set(ipAddress, currentAttempt);
      const remainingAttempts = this.MAX_ATTEMPTS - currentAttempt.count;
      
      return {
        error: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      };
    }

    // Clear failed attempts on successful login
    this.loginAttempts.delete(ipAddress);

    // Generate JWT token
    const token = jwt.sign(
      { username: this.ADMIN_USERNAME, role: 'admin' },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token };
  }

  verifyToken(token: string): { valid: boolean; username?: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { username: string; role: string };
      return { valid: true, username: decoded.username };
    } catch (error) {
      return { valid: false };
    }
  }

  // Clean up old lockouts periodically
  cleanupLockouts(): void {
    const now = new Date();
    for (const [ip, attempt] of this.loginAttempts.entries()) {
      if (attempt.lockedUntil && attempt.lockedUntil < now) {
        this.loginAttempts.delete(ip);
      }
    }
  }
}

export const authService = new AuthService();

// Clean up lockouts every hour
setInterval(() => authService.cleanupLockouts(), 60 * 60 * 1000);
