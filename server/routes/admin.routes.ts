import { Router, Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to get services from global (initialized in server.ts)
const getAuthService = () => (global as any).authService;
const getAdminUserService = () => (global as any).adminUserService;

/**
 * POST /api/admin/login
 * Admin login with lockout mechanism
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password required' });
      return;
    }

    const result = await getAuthService().login(username, password, ipAddress);

    if (result.error) {
      res.status(401).json({ 
        success: false, 
        error: result.error,
        lockedUntil: result.lockedUntil,
      });
      return;
    }

    res.json({ 
      success: true, 
      token: result.token,
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * GET /api/admin/posts
 * Get all posts with geolocation data (protected)
 */
router.get('/posts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const posts = await adminService.getAllPostsWithLocations();
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

/**
 * DELETE /api/admin/posts/:id
 * Delete a post (protected)
 */
router.delete('/posts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await adminService.deletePost(id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

/**
 * GET /api/admin/stats
 * Get post statistics (protected)
 */
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await adminService.getPostStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

/**
 * POST /api/admin/verify
 * Verify if token is still valid (protected)
 */
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

/**
 * POST /api/admin/users/create
 * Create a new admin user (protected)
 */
router.post('/users/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password required' });
      return;
    }

    const result = await getAdminUserService().createAdmin(username, password, req.user!.username);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

/**
 * GET /api/admin/users
 * Get all admin users (protected)
 */
router.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const admins = await getAdminUserService().getAllAdmins();
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

/**
 * DELETE /api/admin/users/:username
 * Delete an admin user (protected)
 */
router.delete('/users/:username', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const result = await getAdminUserService().deleteAdmin(username, req.user!.username);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ success: false, error: 'Failed to delete admin' });
  }
});

/**
 * POST /api/admin/change-password
 * Change current user's password (protected)
 */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Old and new passwords required' });
      return;
    }

    const result = await getAdminUserService().changePassword(req.user!.username, oldPassword, newPassword);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;
