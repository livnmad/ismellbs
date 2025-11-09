import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CommentSection.css';

interface Comment {
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

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState({ content: '', author: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/comments/${postId}`);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.content.trim() || !newComment.author.trim()) return;

    try {
      setSubmitting(true);
      const response = await axios.post('http://localhost:3001/api/comments', {
        postId,
        content: newComment.content,
        author: newComment.author,
      });

      if (response.data.success) {
        setComments([...comments, response.data.data]);
        setNewComment({ content: '', author: '' });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, reactionType: string) => {
    try {
      await axios.post(`http://localhost:3001/api/comments/${commentId}/react`, {
        reactionType,
      });
      // Refresh comments to show updated reaction count
      fetchComments();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder="Your name"
          value={newComment.author}
          onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
          maxLength={100}
          required
        />
        <textarea
          placeholder="Add your comment..."
          value={newComment.content}
          onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
          maxLength={1000}
          rows={3}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {loading ? (
        <div className="comments-loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="comment-content">{comment.content}</p>
              <div className="comment-reactions">
                <button onClick={() => handleReaction(comment.id, 'like')} className="reaction-btn">
                  👍 {comment.reactions.like > 0 && comment.reactions.like}
                </button>
                <button onClick={() => handleReaction(comment.id, 'love')} className="reaction-btn">
                  ❤️ {comment.reactions.love > 0 && comment.reactions.love}
                </button>
                <button onClick={() => handleReaction(comment.id, 'laugh')} className="reaction-btn">
                  😂 {comment.reactions.laugh > 0 && comment.reactions.laugh}
                </button>
                <button onClick={() => handleReaction(comment.id, 'angry')} className="reaction-btn">
                  😡 {comment.reactions.angry > 0 && comment.reactions.angry}
                </button>
                <button onClick={() => handleReaction(comment.id, 'bs')} className="reaction-btn">
                  💩 {comment.reactions.bs > 0 && comment.reactions.bs}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
