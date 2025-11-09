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
  private readonly API_KEY = process.env.NEWS_API_KEY || 'demo';
  private readonly BASE_URL = 'https://newsapi.org/v2';

  async getUSPoliticsNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      // Use NewsAPI's everything endpoint for US politics and White House
      const response = await axios.get(`${this.BASE_URL}/everything`, {
        params: {
          q: 'white house OR congress OR senate OR biden OR trump OR politics',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: this.API_KEY,
        },
      });

      if (response.data.status === 'ok') {
        return response.data.articles.map((article: any) => ({
          title: article.title,
          description: article.description || '',
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name,
          urlToImage: article.urlToImage || undefined,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching news:', error);
      // Return fallback mock data if API fails
      return this.getMockNews();
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
