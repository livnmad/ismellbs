export interface BlogPost {
  title: string;
  content: string;
  author: string;
  email: string;
  ipAddress?: string;
  createdAt: Date;
  tags?: string[];
}

export interface BlogPostDocument extends BlogPost {
  id: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
