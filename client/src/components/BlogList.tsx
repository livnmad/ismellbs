import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi, BlogPost, PaginatedResponse, commentApi, Comment } from '../services/api';
import axios from 'axios';

interface BlogListProps {
  refreshTrigger: number;
}

const BlogList: React.FC<BlogListProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: { content: string; author: string } }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});
  const [commentError, setCommentError] = useState<{ [key: string]: string }>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }
  }, []);

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

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    setExpandedPost(postId);
    
    if (!comments[postId]) {
      setLoadingComments({ ...loadingComments, [postId]: true });
      try {
        const fetchedComments = await commentApi.getComments(postId);
        setComments({ ...comments, [postId]: fetchedComments });
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoadingComments({ ...loadingComments, [postId]: false });
      }
    }
  };

  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const comment = newComment[postId];
    if (!comment?.content.trim() || !comment?.author.trim()) return;

    setSubmittingComment({ ...submittingComment, [postId]: true });
    setCommentError({ ...commentError, [postId]: '' });

    try {
      const createdComment = await commentApi.createComment(
        postId,
        comment.content,
        comment.author
      );
      
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), createdComment],
      });
      
      setNewComment({
        ...newComment,
        [postId]: { content: '', author: userProfile?.displayName || '' },
      });

      // Update comment count in posts
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          const message = err.response.data.message || 'Rate limit exceeded. Please try again later.';
          setCommentError({ ...commentError, [postId]: message });
        } else {
          setCommentError({ ...commentError, [postId]: 'Failed to post comment' });
        }
      } else {
        setCommentError({ ...commentError, [postId]: 'An unexpected error occurred' });
      }
      
      setTimeout(() => {
        setCommentError({ ...commentError, [postId]: '' });
      }, 5000);
    } finally {
      setSubmittingComment({ ...submittingComment, [postId]: false });
    }
  };

  const handleReaction = async (postId: string, commentId: string, reactionType: string) => {
    try {
      await commentApi.addReaction(commentId, reactionType);
      
      // Refresh comments for this post
      const fetchedComments = await commentApi.getComments(postId);
      setComments({ ...comments, [postId]: fetchedComments });
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const initCommentForm = (postId: string) => {
    if (!newComment[postId]) {
      setNewComment({
        ...newComment,
        [postId]: { content: '', author: userProfile?.displayName || '' },
      });
    }
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
            >
              <div 
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
              
              <div className="post-actions">
                <button 
                  className="comments-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComments(post.id);
                  }}
                >
                  💬 {post.commentCount || 0} {post.commentCount === 1 ? 'Comment' : 'Comments'}
                  {expandedPost === post.id ? ' ▼' : ' ▶'}
                </button>
              </div>

              {expandedPost === post.id && (
                <div className="inline-comments" onClick={(e) => e.stopPropagation()}>
                  {loadingComments[post.id] ? (
                    <div className="comments-loading">Loading comments...</div>
                  ) : (
                    <>
                      {comments[post.id] && comments[post.id].length > 0 && (
                        <div className="comments-list-inline">
                          {comments[post.id].slice(0, 3).map((comment) => (
                            <div key={comment.id} className="comment-inline">
                              <div className="comment-header">
                                <span className="comment-author">{comment.author}</span>
                                <span className="comment-date">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="comment-content">{comment.content}</p>
                              <div className="comment-reactions">
                                <button onClick={() => handleReaction(post.id, comment.id, 'like')} className="reaction-btn">
                                  👍 {comment.reactions.like > 0 && comment.reactions.like}
                                </button>
                                <button onClick={() => handleReaction(post.id, comment.id, 'love')} className="reaction-btn">
                                  ❤️ {comment.reactions.love > 0 && comment.reactions.love}
                                </button>
                                <button onClick={() => handleReaction(post.id, comment.id, 'laugh')} className="reaction-btn">
                                  😂 {comment.reactions.laugh > 0 && comment.reactions.laugh}
                                </button>
                                <button onClick={() => handleReaction(post.id, comment.id, 'angry')} className="reaction-btn">
                                  😡 {comment.reactions.angry > 0 && comment.reactions.angry}
                                </button>
                                <button onClick={() => handleReaction(post.id, comment.id, 'bs')} className="reaction-btn">
                                  💩 {comment.reactions.bs > 0 && comment.reactions.bs}
                                </button>
                              </div>
                            </div>
                          ))}
                          {comments[post.id].length > 3 && (
                            <button 
                              className="view-all-comments"
                              onClick={() => navigate(`/post/${post.id}`)}
                            >
                              View all {comments[post.id].length} comments
                            </button>
                          )}
                        </div>
                      )}

                      <form 
                        className="comment-form-inline"
                        onSubmit={(e) => handleCommentSubmit(post.id, e)}
                        onFocus={() => initCommentForm(post.id)}
                      >
                        {commentError[post.id] && (
                          <div className="error-message">{commentError[post.id]}</div>
                        )}
                        <input
                          type="text"
                          placeholder="Your name"
                          value={newComment[post.id]?.author || userProfile?.displayName || ''}
                          onChange={(e) => setNewComment({
                            ...newComment,
                            [post.id]: { 
                              ...newComment[post.id], 
                              author: e.target.value 
                            }
                          })}
                          maxLength={100}
                          required
                          disabled={!!userProfile}
                        />
                        <textarea
                          placeholder="Add your comment..."
                          value={newComment[post.id]?.content || ''}
                          onChange={(e) => setNewComment({
                            ...newComment,
                            [post.id]: { 
                              ...newComment[post.id], 
                              author: newComment[post.id]?.author || userProfile?.displayName || '',
                              content: e.target.value 
                            }
                          })}
                          maxLength={1000}
                          rows={2}
                          required
                        />
                        <button type="submit" disabled={submittingComment[post.id]}>
                          {submittingComment[post.id] ? 'Posting...' : 'Post Comment'}
                        </button>
                      </form>
                    </>
                  )}
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
