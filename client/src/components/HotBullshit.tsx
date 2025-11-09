import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi, BlogPost } from '../services/api';
import './HotBullshit.css';

const HotBullshit: React.FC = () => {
  const navigate = useNavigate();
  const [hotPosts, setHotPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotPosts();
  }, []);

  const fetchHotPosts = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getPosts(1, 20);
      
      // Get top 2 posts with most comments
      if (response.data.length > 0) {
        const sorted = [...response.data].sort((a, b) => 
          (b.commentCount || 0) - (a.commentCount || 0)
        );
        setHotPosts(sorted.slice(0, 2));
      }
    } catch (err) {
      console.error('Error fetching hot posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="hot-bullshit">
        <h3 className="hot-title">🔥 Hot Bullshit 🔥</h3>
        <div className="hot-loading">Loading...</div>
      </div>
    );
  }

  if (!hotPosts || hotPosts.length === 0) {
    return null;
  }

  return (
    <div className="hot-bullshit">
      <h3 className="hot-title">🔥 Hot Bullshit 🔥</h3>
      <div className="hot-posts-list">
        {hotPosts.map((post, index) => (
          <div 
            key={post.id}
            className={`hot-post ${index === 0 ? 'hot-post-first' : 'hot-post-second'}`}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <div className="hot-rank">#{index + 1}</div>
            <div className="hot-post-header">
              <span className="hot-author">{post.author}</span>
              <span className="hot-time">{formatDate(post.createdAt)}</span>
            </div>
            <div className="hot-post-content">
              {post.content.length > 120 
                ? `${post.content.substring(0, 120)}...` 
                : post.content}
            </div>
            <div className="hot-post-stats">
              <span className="hot-comments">💬 {post.commentCount || 0} comments</span>
              {post.tags && post.tags.length > 0 && (
                <div className="hot-tags">
                  {post.tags.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="hot-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotBullshit;
