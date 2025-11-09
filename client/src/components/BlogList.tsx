import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi, BlogPost, PaginatedResponse } from '../services/api';

interface BlogListProps {
  refreshTrigger: number;
}

const BlogList: React.FC<BlogListProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchPosts = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse = await blogApi.getPosts(page, 10);
      setPosts(response.data);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, [refreshTrigger]);

  const handlePageChange = (newPage: number) => {
    fetchPosts(newPage);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="blog-posts">
      {posts.length === 0 ? (
        <div className="no-posts">
          No posts yet. Be the first to submit!
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="blog-post"
              onClick={() => navigate(`/post/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="blog-post-meta">
                <span><strong>{post.author}</strong></span>
              </div>
              <div className="blog-post-content">{post.content}</div>
              {post.tags && post.tags.length > 0 && (
                <div className="blog-post-tags">
                  {post.tags.map((tag) => (
                    <span key={tag} className="blog-post-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;
