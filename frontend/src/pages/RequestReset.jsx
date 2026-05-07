import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Auth.css';

export default function RequestReset() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/request-reset', { email });
      setEmailSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
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
        {!emailSent ? (
          <div className="login-form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <button className="back-btn" onClick={() => navigate('/login')}>
              ← Back to Sign In
            </button>

            <div className="form-header">
              <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
              <h2 className="form-title">Reset Your Password</h2>
              <p className="form-subtitle">
                Enter your email and we’ll send a Recovery Road reset link.
              </p>
            </div>

            <form onSubmit={submit} className="modern-auth-form">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="your.email@example.com"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn">
                Send Reset Link
              </button>
            </form>

            <div className="form-footer-link">
              <p>
                Remember your password? <a href="/login">Sign in</a>
              </p>
            </div>
          </div>
        ) : (
          <div className="verification-container">
            <div className="verification-icon">📧</div>
            <h2 className="verification-title">Check Your Email</h2>
            <p className="verification-message">
              We’ve sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="verification-instructions">
              Please check your inbox and click the link to reset your password. The link will expire in 1 hour.
            </p>
            <div className="verification-actions">
              <button onClick={() => navigate('/login')} className="submit-btn">
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
