import { Router, Request, Response } from 'express';
import { newsService } from '../services/news.service';

const router = Router();

/**
 * GET /api/news
 * Fetch recent US politics and White House news
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const news = await newsService.getUSPoliticsNews(limit);
    
    res.json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (error) {
    console.error('Error in news route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
    });
  }
});

export default router;
