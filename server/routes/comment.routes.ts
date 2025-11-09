import { Router, Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import rateLimiter from '../middleware/rateLimit';
import jwt from 'jsonwebtoken';

const router = Router();

// Validation middleware for comments
const commentValidation = [
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters')
    .customSanitizer((value) => xss(value)),
  body('author')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author name must be between 1 and 100 characters')
    .customSanitizer((value) => xss(value)),
];

/**
 * POST /api/comments
 * Create a new comment
 */
router.post('/', commentValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Check for bypass header
    const bypassHeader = req.headers['x-bypass-rate-limit'];
    const shouldBypass = bypassHeader === 'true';

    // Check if user is authenticated
    const token = req.headers.authorization?.split(' ')[1];
    let isAuthenticated = false;
    let userId = undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        isAuthenticated = true;
        userId = decoded.id;
      } catch (err) {
        // Token invalid, treat as anonymous
      }
    }

    // Check rate limit (1/5min for anonymous, 5/5min for authenticated) unless bypassed
    if (!shouldBypass) {
      const identifier = isAuthenticated && userId
        ? `user-comment-${userId}`
        : ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.socket.remoteAddress ||
           'unknown');

      const result = rateLimiter.check(identifier, isAuthenticated);
      
      if (!result.allowed && result.resetTime) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        const limit = isAuthenticated ? 5 : 1;
        const message = isAuthenticated
          ? `You can only submit ${limit} comments every 5 minutes`
          : 'You can only submit one comment every 5 minutes. Create an account to comment up to 5 times per 5 minutes!';
        
        return res.status(429).json({
          success: false,
          message,
          retryAfter,
        });
      }
    }

    const { postId, content, author } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    const comment = await commentService.createComment({
      postId,
      content,
      author,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
    });
  }
});

/**
 * GET /api/comments/:postId
 * Get all comments for a post
 */
router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const comments = await commentService.getCommentsByPostId(postId);

    res.json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
    });
  }
});

/**
 * POST /api/comments/:commentId/react
 * Add a reaction to a comment
 */
router.post('/:commentId/react', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { reactionType } = req.body;

    const validReactions = ['like', 'love', 'angry', 'laugh', 'bs'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type',
      });
    }

    await commentService.addReaction(commentId, reactionType);

    res.json({
      success: true,
      message: 'Reaction added successfully',
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
    });
  }
});

/**
 * DELETE /api/comments/:commentId
 * Delete a comment
 */
router.delete('/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    await commentService.deleteComment(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
    });
  }
});

export default router;
