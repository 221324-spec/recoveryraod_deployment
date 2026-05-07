import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const roles = [
  { label: 'Supervisor', value: 'Supervisor' },
  { label: 'Patient', value: 'Patient' },
  { label: 'NGO', value: 'NGO' },
  { label: 'Admin', value: 'Admin' }
];

const ChooseRolePage = () => {
  const navigate = useNavigate();

  function selectRole(role) {
    localStorage.setItem('selectedRole', role);
    navigate('/login');
  }

  return (
    <div className="modern-auth-container">
      <div className="auth-background">
        <div className="auth-gradient-1"></div>
        <div className="auth-gradient-2"></div>
        <div className="auth-gradient-3"></div>
      </div>

      <div className="auth-content auth-grid">
        <div className="auth-panel auth-panel-main">
          <div className="auth-card">
            <div className="auth-logo-container">
              <div className="auth-logo">
                <span className="auth-logo-icon">🛤️</span>
              </div>
            </div>
            <div className="auth-brand">
              <h1 className="auth-brand-name">Recovery Road</h1>
              <p className="auth-brand-tagline">Choose your role</p>
            </div>
            <p className="auth-description">
              Pick the correct access path to start your experience with the right dashboard, tools and workflows.
            </p>

            <div className="roles-list">
              {roles.map((role) => (
                <div
                  key={role.value}
                  className="role-card"
                  onClick={() => selectRole(role.value)}
                >
                  <div className="role-card-content">
                    <div className="role-icon role-admin-light">{role.label.charAt(0)}</div>
                    <div className="role-info">
                      <h4 className="role-name">I am a {role.label}</h4>
                      <p className="role-description">Enter the portal for {role.label.toLowerCase()} access.</p>
                    </div>
                  </div>
                  <span className="role-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-panel auth-side-panel">
          <div className="auth-side-card">
            <span className="auth-side-badge">Choose Your Path</span>
            <h2 className="auth-side-title">Role-based access made simple</h2>
            <p className="auth-side-copy">
              Select the role that fits you and continue to the tailored sign-in experience.
            </p>
            <ul className="auth-side-list">
              <li>Supervisor tools for team oversight</li>
              <li>Patient access to recovery progress</li>
              <li>NGO workflows for approvals and reports</li>
              <li>Admin controls for system management</li>
            </ul>
            <button className="auth-btn" onClick={() => navigate('/register')}>
              Register Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseRolePage;
