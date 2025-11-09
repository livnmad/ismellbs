import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { adminService } from '../services/admin.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

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

    const result = await authService.login(username, password, ipAddress);

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

export default router;
