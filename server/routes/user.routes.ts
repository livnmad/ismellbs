import { Router, Request, Response } from 'express';
import rateLimiter from '../middleware/rateLimit';
import { FEATURE_FLAGS } from '../config/secrets';

const router = Router();

// Helper to get services from global
const getUserService = () => (global as any).userService;

export interface UserAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * POST /api/users/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ success: false, error: 'Email, password, and display name are required' });
      return;
    }

    const result = await getUserService().register(email, password, displayName);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * POST /api/users/login
 * Login to user account
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const result = await getUserService().login(email, password);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', async (req: UserAuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const verification = getUserService().verifyToken(token);

    if (!verification.valid) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const profile = await getUserService().getUserProfile(verification.userId!);
    if (!profile) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/users/verify
 * Verify if token is valid
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const verification = getUserService().verifyToken(token);

    if (!verification.valid) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    res.json({ success: true, userId: verification.userId, email: verification.email });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

/**
 * POST /api/users/forgot-password
 * Request password reset email (rate limited)
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  if (!FEATURE_FLAGS.PASSWORD_RESET_ENABLED) {
    res.status(503).json({ 
      success: false, 
      error: 'Password reset feature is currently disabled' 
    });
    return;
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                    req.socket.remoteAddress || 
                    'unknown';

  // Rate limit: 5 requests per 5 minutes (using default rate limiter)
  const rateLimitCheck = rateLimiter.check(`forgot-password:${ipAddress}`, false);

  if (!rateLimitCheck.allowed) {
    res.status(429).json({ 
      success: false, 
      error: 'Too many password reset requests. Please try again later.',
      resetTime: rateLimitCheck.resetTime,
    });
    return;
  }

  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const result = await getUserService().requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ success: false, error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/users/reset-password
 * Reset password with token (rate limited)
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  if (!FEATURE_FLAGS.PASSWORD_RESET_ENABLED) {
    res.status(503).json({ 
      success: false, 
      error: 'Password reset feature is currently disabled' 
    });
    return;
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                    req.socket.remoteAddress || 
                    'unknown';

  // Rate limit: 5 requests per 5 minutes
  const rateLimitCheck = rateLimiter.check(`reset-password:${ipAddress}`, false);

  if (!rateLimitCheck.allowed) {
    res.status(429).json({ 
      success: false, 
      error: 'Too many password reset attempts. Please try again later.',
      resetTime: rateLimitCheck.resetTime,
    });
    return;
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Token and new password are required' });
      return;
    }

    const result = await getUserService().resetPassword(token, newPassword);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

/**
 * GET /api/users/verify-reset-token
 * Verify if a reset token is valid
 */
router.get('/verify-reset-token', async (req: Request, res: Response) => {
  if (!FEATURE_FLAGS.PASSWORD_RESET_ENABLED) {
    res.status(503).json({ 
      success: false, 
      error: 'Password reset feature is currently disabled' 
    });
    return;
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    const result = await getUserService().verifyResetToken(token);
    res.json({ success: result.valid, email: result.email });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ success: false, error: 'Failed to verify token' });
  }
});

export default router;
