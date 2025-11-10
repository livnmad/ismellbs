import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserAuth.css';

const UserLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`https://ismellbullshit.com${endpoint}`, payload);

      if (response.data.success) {
        localStorage.setItem('userToken', response.data.token);
        if (response.data.user) {
          localStorage.setItem('userProfile', JSON.stringify(response.data.user));
        }
        navigate('/');
        window.location.reload(); // Refresh to update navbar
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-auth-container">
      <div className="user-auth-box">
        <h1>💩 {isLogin ? 'Login' : 'Create Account'}</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Welcome back to I Smell Bullshit!' : 'Join the I Smell Bullshit community'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required={!isLogin}
                minLength={2}
                placeholder="Enter your display name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="auth-toggle-btn">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>

        <button onClick={() => navigate('/')} className="auth-back-btn">
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default UserLogin;
