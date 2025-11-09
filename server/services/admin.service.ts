import elasticsearchClient, { INDEX_NAME } from '../config/elasticsearch';
import geoip from 'geoip-lite';
import { BlogPostDocument } from '../types/blog.types';

export interface PostWithLocation extends BlogPostDocument {
  location?: {
    lat: number;
    lon: number;
    city?: string;
    region?: string;
    country?: string;
  };
}

export class AdminService {
  async getAllPostsWithLocations(): Promise<PostWithLocation[]> {
    try {
      const response = await elasticsearchClient.search({
        index: INDEX_NAME,
        body: {
          size: 1000,
          sort: [{ createdAt: { order: 'desc' } }],
          query: {
            match_all: {},
          },
        },
      });

      const posts: PostWithLocation[] = response.hits.hits.map((hit: any) => {
        const post = {
          id: hit._id,
          ...hit._source,
        };

        // Get geolocation for IP address
        if (post.ipAddress && post.ipAddress !== 'unknown') {
          const geo = geoip.lookup(post.ipAddress);
          if (geo) {
            post.location = {
              lat: geo.ll[0],
              lon: geo.ll[1],
              city: geo.city,
              region: geo.region,
              country: geo.country,
            };
          }
        }

        return post;
      });

      return posts;
    } catch (error) {
      console.error('Error fetching posts with locations:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await elasticsearchClient.delete({
        index: INDEX_NAME,
        id: postId,
        refresh: 'wait_for',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  }

  async getPostStats(): Promise<{
    total: number;
    byCountry: Record<string, number>;
    recentIPs: string[];
  }> {
    try {
      const response = await elasticsearchClient.search({
        index: INDEX_NAME,
        body: {
          size: 1000,
          query: {
            match_all: {},
          },
        },
      });

      const posts = response.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      }));

      const byCountry: Record<string, number> = {};
      const recentIPs: Set<string> = new Set();

      posts.forEach((post: any) => {
        if (post.ipAddress && post.ipAddress !== 'unknown') {
          recentIPs.add(post.ipAddress);
          const geo = geoip.lookup(post.ipAddress);
          if (geo) {
            byCountry[geo.country] = (byCountry[geo.country] || 0) + 1;
          }
        }
      });

      return {
        total: posts.length,
        byCountry,
        recentIPs: Array.from(recentIPs).slice(0, 20),
      };
    } catch (error) {
      console.error('Error getting post stats:', error);
      throw new Error('Failed to get statistics');
    }
  }
}

export const adminService = new AdminService();
