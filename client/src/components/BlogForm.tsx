import React, { useState } from 'react';
import { blogApi, CreateBlogPostDTO } from '../services/api';
import axios from 'axios';

interface BlogFormProps {
  onPostCreated: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ onPostCreated }) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState<CreateBlogPostDTO>({
    title: '', // Will be auto-generated from content
    content: '',
    author: '',
    email: 'anonymous@ismellbs.com',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errorFading, setErrorFading] = useState(false);
  const [successFading, setSuccessFading] = useState(false);

  React.useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserProfile(parsed);
      setFormData(prev => ({
        ...prev,
        author: parsed.displayName,
        email: parsed.email,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If anonymous is checked, override the author name
      // If user is logged in, include userId for rate limiting
      const submitData: any = {
        ...formData,
        author: isAnonymous ? 'Anonymous' : formData.author,
      };
      
      // Add userId if user is authenticated
      if (userProfile?.id) {
        submitData.userId = userProfile.id;
      }
      
      await blogApi.createPost(submitData);
      setSuccess('Post created successfully!');
      setSuccessFading(false);
      
      // Reset form appropriately
      if (userProfile) {
        // For logged-in users, just reset content
        setFormData(prev => ({
          ...prev,
          content: '',
          tags: [],
        }));
      } else {
        // For anonymous users, reset everything
        setFormData({
          title: '',
          content: '',
          author: '',
          email: 'anonymous@ismellbs.com',
          tags: [],
        });
        setIsAnonymous(false);
      }
      
      onPostCreated();
      
      setTimeout(() => setSuccessFading(true), 4500);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          const retryAfter = err.response.data.retryAfter;
          const message = err.response.data.message || `Rate limit exceeded. You can submit another post in ${Math.ceil(retryAfter / 60)} minutes.`;
          setError(message);
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
      
      setTimeout(() => setErrorFading(true), 4500);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Post some bullshit</h2>
      
      {error && <div className={`error-message ${errorFading ? 'fade-out' : ''}`}>{error}</div>}
      {success && <div className={`success-message ${successFading ? 'fade-out' : ''}`}>{success}</div>}

      <form onSubmit={handleSubmit}>
        {!userProfile && (
          <>
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
          </>
        )}

        {userProfile && (
          <div className="logged-in-info">
            <span>📝 Posting as: <strong>{userProfile.displayName}</strong></span>
          </div>
        )}

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
