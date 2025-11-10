import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentSection from './CommentSection';
import './PostDetail.css';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tags: string[];
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://ismellbullshit.com/api/posts/${postId}`);
      
      if (response.data.success) {
        setPost(response.data.data);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="post-detail-loading">Loading post...</div>;
  }

  if (error || !post) {
    return (
      <div className="post-detail-error">
        <h2>{error || 'Post not found'}</h2>
        <button onClick={() => navigate('/')}>Go Back Home</button>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Posts
      </button>

      <article className="post-detail">
        <header className="post-detail-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span className="post-author">By {post.author}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="post-content">
          <p>{post.content}</p>
        </div>

        <CommentSection postId={post.id} />
      </article>
    </div>
  );
};

export default PostDetail;
