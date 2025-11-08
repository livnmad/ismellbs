import elasticsearchClient, { INDEX_NAME } from '../config/elasticsearch';
import { BlogPost, BlogPostDocument, PaginatedResponse } from '../types/blog.types';

export class BlogService {
  async createPost(post: BlogPost): Promise<BlogPostDocument> {
    try {
      const response = await elasticsearchClient.index({
        index: INDEX_NAME,
        document: {
          ...post,
          createdAt: new Date(),
        },
        refresh: 'wait_for',
      });

      return {
        id: response._id,
        ...post,
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

      return {
        data: posts,
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
