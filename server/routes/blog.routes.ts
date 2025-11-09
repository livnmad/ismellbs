import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { blogPostValidation } from '../middleware/validation';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import blogService from '../services/blog.service';
import { BlogPost } from '../types/blog.types';

const router = Router();

// GET /api/posts - Get all posts with pagination
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);

    const result = await blogService.getPosts(page, pageSize);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/search - Search posts
router.get('/posts/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);

    const result = await blogService.searchPosts(query, page, pageSize);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /posts/search:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// GET /api/posts/:idOrSlug - Get single post by ID or slug
router.get('/posts/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    
    // Try to find by slug first (contains hyphens or lowercase letters)
    let post = null;
    if (idOrSlug.includes('-') || /^[a-z]/.test(idOrSlug)) {
      post = await blogService.getPostBySlug(idOrSlug);
    }
    
    // If not found by slug, try by ID
    if (!post) {
      post = await blogService.getPostById(idOrSlug);
    }

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error in GET /posts/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

// POST /api/posts - Create new post (with rate limiting and validation)
router.post(
  '/posts',
  rateLimitMiddleware,
  blogPostValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown';

      const blogPost: BlogPost = {
        title: req.body.title,
        slug: '', // Will be auto-generated in service
        content: req.body.content,
        author: req.body.author,
        email: req.body.email,
        tags: req.body.tags || [],
        ipAddress: ip,
        createdAt: new Date(),
      };

      const createdPost = await blogService.createPost(blogPost);

      res.status(201).json({
        message: 'Blog post created successfully',
        post: {
          ...createdPost,
          ipAddress: undefined, // Don't return IP to client
        },
      });
    } catch (error) {
      console.error('Error in POST /posts:', error);
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  }
);

export default router;
