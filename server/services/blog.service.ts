import elasticsearchClient, { INDEX_NAME } from '../config/elasticsearch';
import { BlogPost, BlogPostDocument, PaginatedResponse } from '../types/blog.types';
import { commentService } from './comment.service';

export class BlogService {
  /**
   * Generate a URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Check if slug exists and return unique version with incremental number
   */
  private async getUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      // Check if slug exists
      const exists = await this.getPostBySlug(slug);
      if (!exists) {
        return slug;
      }
      // Increment and try again
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Generate an SEO-friendly title from post content
   * Extracts keywords and creates a concise, searchable title
   */
  private generateTitle(content: string): string {
    // Common words to exclude (stop words)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which',
      'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
    ]);

    // Remove punctuation and convert to lowercase
    const cleanContent = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into words and filter
    const words = cleanContent.split(' ');
    
    // Get word frequency (excluding stop words and short words)
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Sort by frequency and get top keywords
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // If we have keywords, create title from them
    if (topWords.length > 0) {
      // Capitalize first letter of each word
      const titleWords = topWords.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      );
      
      // Create title with separator
      let title = titleWords.slice(0, 3).join(' • ');
      
      // Ensure title isn't too long (max 100 chars)
      if (title.length > 100) {
        title = titleWords.slice(0, 2).join(' • ');
      }
      
      return title;
    }

    // Fallback: use first few words of content
    const firstWords = content.split(' ').slice(0, 8).join(' ');
    let fallbackTitle = firstWords.length > 60 
      ? firstWords.substring(0, 60) + '...' 
      : firstWords;
    
    return fallbackTitle || 'Untitled Post';
  }

  async createPost(post: BlogPost): Promise<BlogPostDocument> {
    try {
      // Generate SEO title from content
      const generatedTitle = this.generateTitle(post.content);
      
      // Generate base slug from title
      const baseSlug = this.generateSlug(generatedTitle);
      
      // Get unique slug (handles duplicates)
      const uniqueSlug = await this.getUniqueSlug(baseSlug);
      
      const response = await elasticsearchClient.index({
        index: INDEX_NAME,
        document: {
          ...post,
          title: generatedTitle,
          slug: uniqueSlug,
          createdAt: new Date(),
        },
        refresh: 'wait_for',
      });

      return {
        id: response._id,
        ...post,
        title: generatedTitle,
        slug: uniqueSlug,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new Error('Failed to create blog post');
    }
  }

  async getPosts(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<BlogPostDocument>> {
    try {
      const from = (page - 1) * pageSize;

      const response = await elasticsearchClient.search({
        index: INDEX_NAME,
        body: {
          from,
          size: pageSize,
          sort: [{ createdAt: { order: 'desc' } }],
          query: {
            match_all: {},
          },
        },
      });

      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      const posts: BlogPostDocument[] = hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));

      // Add comment counts to each post
      const postsWithComments = await Promise.all(
        posts.map(async (post) => ({
          ...post,
          commentCount: await commentService.getCommentCount(post.id),
        }))
      );

      return {
        data: postsWithComments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw new Error('Failed to fetch blog posts');
    }
  }

  async getPostBySlug(slug: string): Promise<BlogPostDocument | null> {
    try {
      const response = await elasticsearchClient.search({
        index: INDEX_NAME,
        body: {
          query: {
            term: {
              'slug.keyword': slug,
            },
          },
        },
      });

      const hits = response.hits.hits;
      if (hits.length === 0) {
        return null;
      }

      const hit = hits[0];
      return {
        id: hit._id as string,
        ...hit._source as BlogPost,
      };
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  async getPostById(id: string): Promise<BlogPostDocument | null> {
    try {
      const response = await elasticsearchClient.get({
        index: INDEX_NAME,
        id,
      });

      if (!response.found) {
        return null;
      }

      return {
        id: response._id,
        ...(response._source as BlogPost),
      };
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      console.error('Error fetching blog post by ID:', error);
      throw new Error('Failed to fetch blog post');
    }
  }

  async searchPosts(
    query: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<BlogPostDocument>> {
    try {
      const from = (page - 1) * pageSize;

      const response = await elasticsearchClient.search({
        index: INDEX_NAME,
        body: {
          from,
          size: pageSize,
          sort: [{ createdAt: { order: 'desc' } }],
          query: {
            multi_match: {
              query,
              fields: ['title^2', 'content', 'author', 'tags'],
              fuzziness: 'AUTO',
            },
          },
        },
      });

      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      const posts: BlogPostDocument[] = hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));

      return {
        data: posts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error searching blog posts:', error);
      throw new Error('Failed to search blog posts');
    }
  }
}

export default new BlogService();
