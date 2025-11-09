import React, { useState } from 'react';
import { blogApi, CreateBlogPostDTO } from '../services/api';
import axios from 'axios';

interface BlogFormProps {
  onPostCreated: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ onPostCreated }) => {
  const [formData, setFormData] = useState<CreateBlogPostDTO>({
    title: 'Bullshit Alert',
    content: '',
    author: '',
    email: 'anonymous@ismellbs.com',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (formData.tags && formData.tags.length >= 5) {
        setError('Maximum 5 tags allowed');
        return;
      }
      if (formData.tags?.includes(tagInput.trim())) {
        setError('Tag already added');
        return;
      }
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
      setError(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If anonymous is checked, override the author name
      const submitData = {
        ...formData,
        author: isAnonymous ? 'Anonymous' : formData.author,
      };
      
      await blogApi.createPost(submitData);
      setSuccess('Post created successfully!');
      setFormData({
        title: 'Bullshit Alert',
        content: '',
        author: '',
        email: 'anonymous@ismellbs.com',
        tags: [],
      });
      setTagInput('');
      setIsAnonymous(false);
      onPostCreated();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          const retryAfter = err.response.data.retryAfter;
          setError(
            `Rate limit exceeded. You can submit another post in ${Math.ceil(
              retryAfter / 60
            )} minutes.`
          );
        } else if (err.response?.data?.errors) {
          const errors = err.response.data.errors
            .map((e: any) => e.msg)
            .join(', ');
          setError(errors);
        } else {
          setError(err.response?.data?.error || 'Failed to create post');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Post some bullshit</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required={!isAnonymous}
            maxLength={100}
            placeholder="Name"
            disabled={isAnonymous}
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <span>Post as Anonymous</span>
          </label>
        </div>

        <div className="form-group">
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            maxLength={10000}
            placeholder="Message"
            rows={5}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default BlogForm;
