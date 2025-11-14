import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PasswordReset.css';

interface VerifyResponse {
  success: boolean;
  email?: string;
  error?: string;
}

interface ResetResponse {
  success: boolean;
  message: string;
  error?: string;
}

const PasswordReset: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Extract token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const resetToken = searchParams.get('token');

    if (!resetToken) {
      setError('Invalid or missing reset token');
      setLoading(false);
      return;
    }

    setToken(resetToken);
    verifyToken(resetToken);
  }, [location]);

  const verifyToken = async (resetToken: string) => {
    try {
      const response = await axios.get<VerifyResponse>(`/api/users/verify-reset-token?token=${resetToken}`);
      
      if (response.data.success) {
        setTokenValid(true);
        setEmail(response.data.email || '');
      } else {
        setError('This password reset link has expired or is invalid');
        setTokenValid(false);
      }
    } catch (err: any) {
      console.error('Error verifying token:', err);
      
      // Check if feature is disabled
      if (err.response?.status === 503) {
        setError('Password reset feature is temporarily disabled. Please try again later or contact support.');
      } else {
        setError(err.response?.data?.error || 'Failed to verify reset token');
      }
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post<ResetResponse>('/api/users/reset-password', {
        token,
        newPassword,
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      
      // Check if feature is disabled
      if (err.response?.status === 503) {
        setError('Password reset feature is temporarily disabled. Please try again later or contact support.');
      } else {
        setError(err.response?.data?.error || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="password-reset-container">
        <div className="password-reset-card">
          <div className="loading">
            <h2>Verifying reset link...</h2>
            <p>Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="password-reset-container">
        <div className="password-reset-card">
          <h2>💩 Invalid Reset Link</h2>
          <div className="error-message">
            <p>{error}</p>
            <p>Password reset links expire after 1 hour for security reasons.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-reset-container">
      <div className="password-reset-card">
        <h2>💩 Reset Your Password</h2>
        <p className="reset-email">Resetting password for: <strong>{email}</strong></p>

        {success && (
          <div className="success-message">
            <p>✅ {success}</p>
            <p>Redirecting to login...</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="password-requirements">
              <p>Password must:</p>
              <ul>
                <li className={newPassword.length >= 6 ? 'valid' : ''}>
                  Be at least 6 characters long
                </li>
                <li className={newPassword && confirmPassword && newPassword === confirmPassword ? 'valid' : ''}>
                  Match the confirmation
                </li>
              </ul>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
