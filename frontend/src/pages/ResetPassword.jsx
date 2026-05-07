import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid reset link. No token provided.');
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. The link may be expired or invalid.');
    }
  }

  return (
    <div className="modern-auth-container">
      <div className="auth-background">
        <div className="auth-gradient-1"></div>
        <div className="auth-gradient-2"></div>
        <div className="auth-gradient-3"></div>
      </div>

      <div className="auth-content">
        {!success ? (
          <div className="login-form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="form-header">
              <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
              <h2 className="form-title">Create a New Password</h2>
              <p className="form-subtitle">
                Recovery Road — set a new password for your account.
              </p>
            </div>

            <form onSubmit={submit} className="modern-auth-form">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="Enter new password"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="Confirm new password"
                  minLength="6"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn">
                Reset Password
              </button>
            </form>

            <div className="form-footer-link">
              <p>
                Back to <a href="/login">Recovery Road sign in</a>
              </p>
            </div>
          </div>
        ) : (
          <div className="verification-container">
            <div className="verification-icon">✅</div>
            <h2 className="verification-title">Password Reset Successful</h2>
            <p className="verification-message">
              Your Recovery Road password has been updated.
            </p>
            <p className="verification-instructions">
              Redirecting you to sign in in 3 seconds...
            </p>
            <div className="verification-actions">
              <button onClick={() => navigate('/login')} className="submit-btn">
                Go to Sign In Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
