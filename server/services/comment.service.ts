import elasticsearchClient, { COMMENTS_INDEX } from '../config/elasticsearch';

export interface Comment {
  id?: string;
  postId: string;
  content: string;
  author: string;
  ipAddress: string;
  createdAt: Date;
  reactions: {
    like: number;
    love: number;
    angry: number;
    laugh: number;
    bs: number;
  };
}

export class CommentService {
  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'reactions'>): Promise<Comment> {
    const newComment = {
      ...comment,
      createdAt: new Date(),
      reactions: { like: 0, love: 0, angry: 0, laugh: 0, bs: 0 },
    };

    const response = await elasticsearchClient.index({
      index: COMMENTS_INDEX,
      document: newComment,
      refresh: 'wait_for',
    });

    return {
      id: response._id,
      ...newComment,
    };
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const response = await elasticsearchClient.search({
      index: COMMENTS_INDEX,
      body: {
        query: {
          term: { postId },
        },
        sort: [{ createdAt: 'asc' }],
        size: 1000,
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    }));
  }

  async addReaction(commentId: string, reactionType: 'like' | 'love' | 'angry' | 'laugh' | 'bs'): Promise<void> {
    // Get current comment
    const comment = await elasticsearchClient.get({
      index: COMMENTS_INDEX,
      id: commentId,
    });

    const currentReactions = (comment._source as any).reactions || {
      like: 0,
      love: 0,
      angry: 0,
      laugh: 0,
      bs: 0,
    };

    // Increment the specific reaction
    currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;

    // Update the comment
    await elasticsearchClient.update({
      index: COMMENTS_INDEX,
      id: commentId,
      body: {
        doc: {
          reactions: currentReactions,
        },
      },
      refresh: 'wait_for',
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await elasticsearchClient.delete({
      index: COMMENTS_INDEX,
      id: commentId,
      refresh: 'wait_for',
    });
  }

  async getCommentCount(postId: string): Promise<number> {
    const response = await elasticsearchClient.count({
      index: COMMENTS_INDEX,
      body: {
        query: {
          term: { postId },
        },
      },
    });

    return response.count;
  }
}

export const commentService = new CommentService();
