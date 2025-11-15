import axios from 'axios';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  urlToImage?: string;
}

/**
 * Fetches recent US politics and White House news from NewsAPI
 * Free tier: 100 requests/day
 * Get your API key from: https://newsapi.org/
 */
export class NewsService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://newsapi.org/v2';

  constructor() {
    this.API_KEY = process.env.NEWS_API_KEY || 'demo';
    if (!process.env.NEWS_API_KEY) {
      console.warn('⚠️  WARNING: Using demo NEWS_API_KEY. Set NEWS_API_KEY environment variable for production!');
    }
  }

  async getUSPoliticsNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      // Use NewsAPI's everything endpoint for US politics and White House
      // Request more than needed to ensure we get enough valid articles
      const response = await axios.get(`${this.BASE_URL}/everything`, {
        params: {
          q: 'entitlement or drama or conspiracy or scandal or idiot or unhinged or hollywood drama or weird',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: Math.max(limit * 2, 20), // Request 2x to ensure we have enough
          apiKey: this.API_KEY,
        },
      });

      if (response.data.status === 'ok') {
        const articles = response.data.articles
          .filter((article: any) => article.title && article.description) // Filter out incomplete articles
          .map((article: any) => ({
            title: article.title,
            description: article.description || '',
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source.name,
            urlToImage: article.urlToImage || undefined,
          }))
          .slice(0, limit); // Take only the requested number

        // If we don't have enough articles, pad with mock data
        if (articles.length < limit) {
          const mockArticles = this.getMockNews().slice(0, limit - articles.length);
          return [...articles, ...mockArticles];
        }

        return articles;
      }

      return this.getMockNews().slice(0, limit);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Return fallback mock data if API fails
      return this.getMockNews().slice(0, limit);
    }
  }

  /**
   * Fallback mock news data for when API is unavailable
   */
  private getMockNews(): NewsArticle[] {
    return [
      {
        title: 'White House Announces New Policy Initiative',
        description: 'The administration unveils a comprehensive plan addressing key issues.',
        url: '#',
        publishedAt: new Date().toISOString(),
        source: 'Mock News',
      },
      {
        title: 'Senate Debates Key Legislation',
        description: 'Senators engage in heated discussions over proposed bill.',
        url: '#',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Mock News',
      },
      {
        title: 'Political Tensions Rise in Capitol',
        description: 'Ongoing debates highlight partisan divisions.',
        url: '#',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'Mock News',
      },
    ];
  }
}

export const newsService = new NewsService();
