import { Router, Request, Response } from 'express';

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

export default router;
