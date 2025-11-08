import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  email: string;
  createdAt: string;
  tags?: string[];
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

export default api;
