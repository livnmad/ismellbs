import axios from 'axios';

const API_URL = '/api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  email: string;
  createdAt: string;
  tags?: string[];
  commentCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  createdAt: string;
  reactions: {
    like: number;
    love: number;
    angry: number;
    laugh: number;
    bs: number;
  };
}

export interface CreateBlogPostDTO {
  title: string;
  content: string;
  author: string;
  email: string;
  tags?: string[];
}

export interface PaginatedResponse {
  data: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const blogApi = {
  getPosts: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse> => {
    const response = await api.get(`/posts?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  createPost: async (post: CreateBlogPostDTO): Promise<BlogPost> => {
    const response = await api.post('/posts', post);
    return response.data.post;
  },

  searchPosts: async (query: string, page: number = 1): Promise<PaginatedResponse> => {
    const response = await api.get(`/posts/search?q=${encodeURIComponent(query)}&page=${page}`);
    return response.data;
  },
};

export const commentApi = {
  getComments: async (postId: string): Promise<Comment[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get(`/comments/${postId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data.data;
  },

  createComment: async (postId: string, content: string, author: string): Promise<Comment> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/comments', 
      { postId, content, author },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return response.data.data;
  },

  addReaction: async (commentId: string, reactionType: string): Promise<void> => {
    await api.post(`/comments/${commentId}/react`, { reactionType });
  },
};

export default api;
