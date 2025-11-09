export interface BlogPost {
  title: string;
  slug: string;
  content: string;
  author: string;
  email: string;
  ipAddress?: string;
  userId?: string; // Optional - for registered users
  createdAt: Date;
  tags?: string[];
}

export interface BlogPostDocument extends BlogPost {
  id: string;
  commentCount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
