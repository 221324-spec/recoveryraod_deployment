import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { normalizeRoleKey } from '../utils/roles';
import doctorHero from '../assets/doctorimagee.jpg';
import patientHero from '../assets/patientpng.png';
import ngoHero from '../assets/freedom.jpg';
import adminHero from '../assets/softblue.jpeg';
import './Auth.css';

const ROLES = [
  {
    id: 'supervisor',
    name: 'Supervisor',
    icon: '🧑‍⚕️',
    color: '#22c55e',
    description: 'Patient oversight and coordination',
  },
  {
    id: 'patient',
    name: 'Patient',
    icon: '🙋‍♂️',
    color: '#a855f7',
    description: 'Recovery tracking and support',
  },
  {
    id: 'ngo',
    name: 'NGO',
    icon: '🏢',
    color: '#f59e0b',
    description: 'Community support and resources',
  },
];

/** Same role keys as legacy Register.jsx (PascalCase) for /auth/register body */
const REGISTER_ROLES = [
  {
    id: 'Supervisor',
    name: 'Supervisor',
    icon: '🧑‍⚕️',
    description: 'Patient oversight and coordination',
  },
  {
    id: 'Patient',
    name: 'Patient',
    icon: '🙋‍♂️',
    description: 'Recovery tracking and support',
  },
  {
    id: 'NGO',
    name: 'NGO',
    icon: '🏢',
    description: 'Community support and resources',
  },
];

const HERO = {
  landing: {
    headline: 'Protect yourself and others — compassionate recovery care, online.',
    image: doctorHero,
    badges: (
      <>
        <div className="auth-float-badge auth-float-badge--left">
          <TrendingUp aria-hidden />
          <span>Hundreds of check-ins coordinated each month</span>
        </div>
        <div className="auth-float-badge auth-float-badge--right auth-float-badge--green">
          <BadgeCheck aria-hidden />
          <span>Secure access for patients &amp; clinicians</span>
        </div>
      </>
    ),
  },
  supervisor: {
    headline: 'Clinical supervisor portal — oversee care pathways with clarity.',
    image: doctorHero,
    badges: (
      <>
        <div className="auth-float-badge auth-float-badge--left">
          <ShieldCheck aria-hidden />
          <span>Role-based access aligned to your oversight</span>
        </div>
        <div className="auth-float-badge auth-float-badge--right auth-float-badge--green">
          <TrendingUp aria-hidden />
          <span>Realtime patient engagement signals</span>
        </div>
      </>
    ),
  },
  patient: {
    headline: 'You are supported here — guidance, milestones, and hope in one place.',
    image: patientHero,
    badges: (
      <>
        <div className="auth-float-badge auth-float-badge--left">
          <Mail aria-hidden />
          <span>Message your supervisor whenever you need</span>
        </div>
        <div className="auth-float-badge auth-float-badge--right auth-float-badge--green">
          <BadgeCheck aria-hidden />
          <span>Private journaling &amp; goal tracking built in</span>
        </div>
      </>
    ),
  },
  ngo: {
    headline: 'Community impact — oversee programs that change lives locally.',
    image: ngoHero,
    badges: (
      <>
        <div className="auth-float-badge auth-float-badge--left">
          <UsersRound aria-hidden />
          <span>Coordinate outreach across supervised teams</span>
        </div>
        <div className="auth-float-badge auth-float-badge--right auth-float-badge--green">
          <Shield aria-hidden />
          <span>Governance dashboards you can rely on</span>
        </div>
      </>
    ),
  },
  admin: {
    headline: 'Authoritative oversight — steer Recovery Road with confidence.',
    image: adminHero,
    badges: (
      <>
        <div className="auth-float-badge auth-float-badge--left">
          <ShieldCheck aria-hidden />
          <span>Enterprise-grade safeguards for admins</span>
        </div>
        <div className="auth-float-badge auth-float-badge--right auth-float-badge--green">
          <BadgeCheck aria-hidden />
          <span>Audit-ready workflows &amp; quick controls</span>
        </div>
      </>
    ),
  },
};

function resolveLoginHero(showForm, isAdminLogin, selectedRoleId, portalTab, reg) {
  if (portalTab === 'register') {
    if (reg?.verified || reg?.verificationSent) return HERO.landing;
    const rid = reg?.selectedRole?.id?.toLowerCase?.();
    if (rid === 'supervisor') return HERO.supervisor;
    if (rid === 'patient') return HERO.patient;
    if (rid === 'ngo') return HERO.ngo;
    return HERO.landing;
  }
  if (!showForm) return HERO.landing;
  if (isAdminLogin) return HERO.admin;
  if (selectedRoleId === 'supervisor') return HERO.supervisor;
  if (selectedRoleId === 'patient') return HERO.patient;
  if (selectedRoleId === 'ngo') return HERO.ngo;
  return HERO.landing;
}

function AuthBackdrop() {
  return (
    <div className="auth-background" aria-hidden>
      <div className="auth-gradient-1" />
      <div className="auth-gradient-2" />
      <div className="auth-gradient-3" />
    </div>
  );
}

function AuthMedicalMark() {
  return (
    <span className="auth-brand-mark" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2.65"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function AuthBrandWordmark({ title = 'Recovery Road' }) {
  return (
    <div className="auth-brand-row">
      <AuthMedicalMark />
      <span className="auth-brand-name-type">{title}</span>
    </div>
  );
}

function AuthAsideHero({ headline, imageSrc, badges }) {
  return (
    <aside className="auth-aside-panel">
      <div className="auth-aside-wave" />
      <div className="auth-aside-sparkle" aria-hidden>
        <Sparkles size={22} strokeWidth={2} />
        <Sparkles size={17} strokeWidth={2} style={{ opacity: 0.7 }} />
      </div>
      <h2 className="auth-aside-title">{headline}</h2>
      <div className="auth-aside-stage">
        <div className="auth-aside-pillar" aria-hidden />
        {badges}
        <img
          src={imageSrc}
          alt=""
          className="auth-aside-photo"
          draggable={false}
          width={720}
          height={820}
        />
      </div>
    </aside>
  );
}

function SplitShell({ hero, panel }) {
  return (
    <div className="auth-split-shell">
      <div className="auth-split-card">
        <div className="auth-split-grid">
          <AuthAsideHero headline={hero.headline} imageSrc={hero.image} badges={hero.badges} />
          <div className="auth-split-body">{panel}</div>
        </div>
      </div>
    </div>
  );
}

function SecureFooterNote() {
  return (
    <div className="auth-split-footer auth-split-footer--plain">
      <p>Encrypted sessions backed by JWT and HTTPS transport.</p>
    </div>
  );
}

export default function Login() {
  useLayoutEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [portalTab, setPortalTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSelectedRole, setRegSelectedRole] = useState(null);
  const [regShowForm, setRegShowForm] = useState(false);
  const [regError, setRegError] = useState('');
  const [regVerificationSent, setRegVerificationSent] = useState(false);
  const [regUserEmail, setRegUserEmail] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regVerifying, setRegVerifying] = useState(false);
  const [regVerified, setRegVerified] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const { login } = useAuth();

  const hero = resolveLoginHero(showForm, isAdminLogin, selectedRole?.id, portalTab, {
    verified: regVerified,
    verificationSent: regVerificationSent,
    selectedRole: regSelectedRole,
  });

  function resetRegistration() {
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegSelectedRole(null);
    setRegShowForm(false);
    setRegError('');
    setRegVerificationSent(false);
    setRegUserEmail('');
    setRegOtp('');
    setRegVerifying(false);
    setRegVerified(false);
    setShowRegPassword(false);
  }

  function setPortalTabSafe(next) {
    setPortalTab(next);
    if (next === 'signin') {
      resetRegistration();
    }
  }

  useEffect(() => {
    if (searchParams.get('flow') === 'register') {
      setPortalTab('register');
      setShowForm(false);
      resetRegistration();
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('flow') === 'register') return;
    const storedRole = localStorage.getItem('selectedRole');
    if (storedRole) {
      const matchedRole = ROLES.find((role) => role.id.toLowerCase() === storedRole.toLowerCase());
      if (matchedRole) {
        setSelectedRole(matchedRole);
        setShowForm(true);
      }
    }
  }, [searchParams]);

  function handleRegRoleSelect(role) {
    setRegSelectedRole(role);
    setRegShowForm(true);
    setRegError('');
    localStorage.setItem('selectedRole', role.id);
  }

  function handleRegBackToRoles() {
    setRegShowForm(false);
    setRegSelectedRole(null);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegError('');
    localStorage.removeItem('selectedRole');
  }

  async function submitRegister(e) {
    e.preventDefault();
    setRegError('');
    try {
      const response = await api.post('/auth/register', {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regSelectedRole.id,
      });
      if (response.data.requiresVerification) {
        setRegUserEmail(regEmail.trim());
        setRegVerificationSent(true);
        if (response.data.devOtp) {
          setRegError(`Registration successful! Your OTP is: ${response.data.devOtp}`);
        }
      }
    } catch (err) {
      setRegError(err.response?.data?.error || 'Registration failed');
    }
  }

  async function verifyRegOTP(e) {
    e.preventDefault();
    if (regOtp.length !== 4) {
      setRegError('Please enter a 4-digit OTP');
      return;
    }
    setRegVerifying(true);
    setRegError('');
    try {
      await api.post('/auth/verify-otp', {
        email: regUserEmail,
        otp: regOtp,
      });
      setRegVerified(true);
      setTimeout(() => {
        resetRegistration();
        setPortalTab('signin');
        setShowForm(false);
      }, 2000);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setRegVerifying(false);
    }
  }

  async function resendRegVerification() {
    setRegError('');
    try {
      await api.post('/auth/resend-verification', { email: regUserEmail });
      setRegError('✓ Verification email resent! Please check your inbox.');
    } catch (err) {
      setRegError(err.response?.data?.error || 'Failed to resend verification email');
    }
  }

  function handleRoleSelect(role) {
    setSelectedRole(role);
    setShowForm(true);
    setError('');
    localStorage.setItem('selectedRole', role.id);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (!selectedRole && !isAdminLogin) {
      setError('Please select the portal you want to access first.');
      return;
    }

    try {
      const loginPayload = {
        email: email.trim(),
        password,
      };

      if (!isAdminLogin) {
        loginPayload.portalRole = selectedRole.id;
      } else {
        loginPayload.portalRole = 'admin';
      }

      const response = await api.post('/auth/login', loginPayload);

      const payload = response.data?.data || response.data;
      const { token, user } = payload || {};

      if (token && user) {
        if (isAdminLogin) {
          if (normalizeRoleKey(user.role) !== 'admin') {
            setError('Access denied: invalid admin credentials');
            return;
          }
        } else if (normalizeRoleKey(user.role) !== normalizeRoleKey(selectedRole.id)) {
          setError('Access denied: invalid role for this portal');
          return;
        }

        login(token, user);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const errorCode = err.response?.data?.code;
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      const requiresVerification = err.response?.data?.requiresVerification;
      const isPendingApprovalResp = err.response?.data?.pendingApproval;

      if (requiresVerification || errorCode === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setVerificationEmail(err.response?.data?.email || email);
        setError('Your email is not verified. Please verify your email to continue.');
      } else if (isPendingApprovalResp || errorCode === 'PENDING_APPROVAL') {
        setPendingApproval(true);
        setPendingUser(err.response?.data?.user || { name: '', email, role: '' });
        setError('');
      } else {
        setError(errorMsg);
      }
    }
  }

  async function resendVerification() {
    try {
      setError('');
      await api.post('/auth/resend-verification', { email: verificationEmail });
      setError('✓ Verification email resent! Please check your inbox.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    }
  }

  async function verifyOTP(e) {
    e.preventDefault();
    if (otp.length !== 4) {
      setError('Please enter a 4-digit OTP');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      const response = await api.post('/auth/verify-otp', {
        email: verificationEmail,
        otp,
      });

      if (response.data.ok) {
        setError('✓ Email verified successfully! You can now log in.');
        setNeedsVerification(false);
        setOtp('');
      }
    } catch (err) {
      setError('Invalid OTP. Please check and try again.');
    } finally {
      setVerifying(false);
    }
  }

  function backToLogin() {
    setNeedsVerification(false);
    setPendingApproval(false);
    setPendingUser(null);
    setVerificationEmail('');
    setOtp('');
    setError('');
  }

  if (pendingApproval && pendingUser) {
    const panel = (
      <>
        <AuthBrandWordmark />
        <div className="pending-card">
          <div className="pending-icon">⏳</div>
          <h2 className="verification-title">Account Pending Approval</h2>
          <p className="verification-message">
            Hi <strong>{pendingUser.name}</strong>, your email has been verified successfully!
          </p>
          <div className="pending-info-box">
            <p>
              <strong>Your {pendingUser.role} account is awaiting approval</strong> from an NGO administrator. You will
              receive a notification once your account has been approved.
            </p>
          </div>
          <div className="user-info-box">
            <p>
              📧 <strong>{pendingUser.email}</strong>
            </p>
            <p>
              🎭 Role: <strong>{pendingUser.role}</strong>
            </p>
          </div>
          <button type="button" onClick={backToLogin} className="auth-login-primary">
            ← Back to Login
          </button>
        </div>
      </>
    );
    return (
      <div className="modern-auth-container modern-auth-container--fullscreen">
        <AuthBackdrop />
        <button type="button" className="auth-landing-back" onClick={() => navigate('/')}>
          ← Back to home
        </button>
        <div className="auth-content">
          <SplitShell hero={HERO.landing} panel={panel} />
        </div>
      </div>
    );
  }

  let mainPanelContent;

  if (portalTab === 'register' && regVerified) {
    mainPanelContent = (
      <>
        <AuthBrandWordmark />
        <div className="auth-inline-flow">
          <div className="success-icon auth-reg-success-mark">✅</div>
          <h2 className="verification-title">Email Verified!</h2>
          <p className="verification-message">Your email has been successfully verified.</p>
          {regSelectedRole?.id === 'Patient' || regSelectedRole?.id === 'Supervisor' ? (
            <div className="pending-info-box">
              <p>
                <strong>⏳ Your account is now pending approval</strong>
                <br />
                An NGO administrator will review your registration. You&apos;ll receive a notification once approved.
              </p>
            </div>
          ) : null}
          <p className="verification-instructions">Taking you back to sign in…</p>
        </div>
        <SecureFooterNote />
      </>
    );
  } else if (portalTab === 'register' && regVerificationSent) {
    mainPanelContent = (
      <>
        <AuthBrandWordmark />
        <button
          type="button"
          className="auth-back-pill"
          onClick={() => {
            setRegVerificationSent(false);
            setRegOtp('');
            setRegError('');
          }}
        >
          ← Back to your details
        </button>
        <div className="auth-inline-flow verification-container">
          <h2 className="verification-title" style={{ textAlign: 'left' }}>
            Enter verification code
          </h2>
          <p className="verification-message">
            We&apos;ve emailed a 4-digit code to <strong>{regUserEmail}</strong>.
          </p>
          <p className="verification-instructions">
            Complete verification to activate your {regSelectedRole?.name ?? ''} account.
          </p>
          <form onSubmit={verifyRegOTP}>
            <div className="otp-input-container">
              <input
                type="text"
                value={regOtp}
                onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="otp-input"
                autoFocus
              />
            </div>
            {regError && <div className="error-message">{regError}</div>}
            <button type="submit" className="auth-login-primary" disabled={regVerifying || regOtp.length !== 4}>
              {regVerifying ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
          <button type="button" onClick={resendRegVerification} className="auth-login-secondary">
            Didn&apos;t receive the code? Resend OTP
          </button>
        </div>
        <SecureFooterNote />
      </>
    );
  } else if (portalTab === 'register' && regShowForm) {
    mainPanelContent = (
      <>
        <AuthBrandWordmark />
        <button type="button" className="auth-back-pill" onClick={handleRegBackToRoles}>
          ← Back to roles
        </button>
        <div className="auth-form-lead">
          <p className="auth-form-lead-title">Create {regSelectedRole?.name} account</p>
          <p className="auth-form-lead-sub">{regSelectedRole?.description}</p>
        </div>
        <form onSubmit={submitRegister} className="modern-auth-form">
          <div className="auth-field">
            <label className="auth-field-label" htmlFor="auth-reg-name">
              Full Name
            </label>
            <div className="auth-input-shell">
              <User className="auth-input-icon" strokeWidth={2} aria-hidden />
              <input
                id="auth-reg-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-field-label" htmlFor="auth-reg-email">
              Email Address
            </label>
            <div className="auth-input-shell">
              <Mail className="auth-input-icon" strokeWidth={2} aria-hidden />
              <input
                id="auth-reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-field-label" htmlFor="auth-reg-password">
              Password
            </label>
            <div className="auth-input-shell">
              <Lock className="auth-input-icon" strokeWidth={2} aria-hidden />
              <input
                id="auth-reg-password"
                type={showRegPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password (min. 6 characters)"
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowRegPassword((v) => !v)}
                aria-label={showRegPassword ? 'Hide password' : 'Show password'}
              >
                {showRegPassword ? <EyeOff size={19} strokeWidth={2} /> : <Eye size={19} strokeWidth={2} />}
              </button>
            </div>
          </div>
          {regError && (
            <div
              className={
                regError.startsWith('✓') || regError.includes('OTP is:') ? 'success-message' : 'error-message'
              }
            >
              {regError}
            </div>
          )}
          <button type="submit" className="auth-login-primary">
            Create Account
          </button>
        </form>
        <p className="auth-mini-link" style={{ marginTop: '0.75rem' }}>
          Already have an account?{' '}
          <button type="button" className="auth-link auth-link--inline" onClick={() => setPortalTabSafe('signin')}>
            Sign in instead
          </button>
          .
        </p>
        <SecureFooterNote />
      </>
    );
  } else if (!showForm) {
    mainPanelContent = (
      <>
        <AuthBrandWordmark />
        <div className="auth-portal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'register'}
            className={`auth-portal-tab ${portalTab === 'register' ? 'auth-portal-tab--active' : ''}`}
            onClick={() => setPortalTabSafe('register')}
          >
            New patient / New user
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'signin'}
            className={`auth-portal-tab ${portalTab === 'signin' ? 'auth-portal-tab--active' : ''}`}
            onClick={() => setPortalTabSafe('signin')}
          >
            Existing user
          </button>
        </div>

        {portalTab === 'register' ? (
          <>
            <div className="auth-form-lead">
              <p className="auth-form-lead-title">Join Recovery Road</p>
              <p className="auth-form-lead-sub">Choose how you participate — identical options to guided registration.</p>
            </div>
            <div className="auth-divider-soft">
              <span>Select your role</span>
            </div>
            <div>
              {REGISTER_ROLES.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  className="auth-role-card-modern"
                  onClick={() => handleRegRoleSelect(role)}
                >
                  <span className={`auth-role-modern-icon role-${role.id.toLowerCase()}-light`}>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p className="role-name">{role.name}</p>
                    <p className="role-description">{role.description}</p>
                  </div>
                  <span className="auth-role-modern-arrow">→</span>
                </button>
              ))}
            </div>
            <p className="auth-mini-link" style={{ marginTop: '0.85rem' }}>
              Already registered? Use the Existing user tab to{' '}
              <button type="button" className="auth-link auth-link--inline" onClick={() => setPortalTabSafe('signin')}>
                sign in
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <div className="auth-form-lead">
              <p className="auth-form-lead-title">Login to continue your session</p>
              <p className="auth-form-lead-sub">Secure, quick, role-aware portals for every collaborator.</p>
            </div>
            <button
              type="button"
              className="auth-admin-row"
              onClick={() => {
                setIsAdminLogin(true);
                setSelectedRole(null);
                setShowForm(true);
                setError('');
                setEmail('');
                setPassword('');
              }}
            >
              Admin portal
            </button>
            <div className="auth-divider-soft">
              <span>Or choose workspace</span>
            </div>
            <div>
              {ROLES.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  className="auth-role-card-modern"
                  onClick={() => handleRoleSelect(role)}
                >
                  <span className={`auth-role-modern-icon role-${role.id}-light`}>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p className="role-name">{role.name}</p>
                    <p className="role-description">{role.description}</p>
                  </div>
                  <span className="auth-role-modern-arrow">→</span>
                </button>
              ))}
            </div>
            <p className="auth-mini-link" style={{ marginTop: '0.85rem' }}>
              Brand new user? Jump to{' '}
              <button type="button" className="auth-link auth-link--inline" onClick={() => setPortalTabSafe('register')}>
                registration
              </button>
              .
            </p>
          </>
        )}
        <SecureFooterNote />
      </>
    );
  } else if (needsVerification) {
    mainPanelContent = (
      <>
        <AuthBrandWordmark />
        <button type="button" className="auth-back-pill" onClick={() => { setNeedsVerification(false); setError(''); }}>
          ← Back to credentials
        </button>
        <div className="verification-container" style={{ textAlign: 'left' }}>
          <div className="verification-title" style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            Verify your email
          </div>
          <p className="verification-message">
            Address <strong>{verificationEmail}</strong> must be confirmed before signing in.
          </p>
          <p className="verification-instructions">Enter your 4-digit code or ask for another email.</p>
          <form onSubmit={verifyOTP}>
            <div className="otp-input-container">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                className="otp-input"
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="auth-login-primary" disabled={verifying || otp.length !== 4}>
              {verifying ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
          <button type="button" onClick={resendVerification} className="auth-login-secondary">
            Resend OTP
          </button>
          <button type="button" onClick={backToLogin} className="auth-login-secondary">
            Restart login →
          </button>
        </div>
      </>
    );
  } else {
    const portalRoleLabel = isAdminLogin ? 'Administrator' : selectedRole?.name;
    mainPanelContent = (
      <>
        <AuthBrandWordmark />
        <button
          type="button"
          className="auth-back-pill"
          onClick={() => {
            setSelectedRole(null);
            setIsAdminLogin(false);
            setShowForm(false);
            setError('');
            setEmail('');
            setPassword('');
            localStorage.removeItem('selectedRole');
          }}
        >
          ← Back to portal selection
        </button>

        <div className="auth-form-lead">
          <p className="auth-form-lead-title">Login to start your session</p>
          <p className="auth-form-lead-sub">Secure workspace access for {portalRoleLabel ?? 'Recovery Road'}.</p>
        </div>

        <form onSubmit={submit} className="modern-auth-form">
          <div className="auth-field">
            <label className="auth-field-label" htmlFor="auth-email-input">
              Email Address
            </label>
            <div className="auth-input-shell">
              <Mail className="auth-input-icon" strokeWidth={2} aria-hidden />
              <input
                id="auth-email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-field-label" htmlFor="auth-password-input">
              Password
            </label>
            <div className="auth-input-shell">
              <Lock className="auth-input-icon" strokeWidth={2} aria-hidden />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={19} strokeWidth={2} /> : <Eye size={19} strokeWidth={2} />}
              </button>
            </div>
          </div>

          <div className="auth-form-meta">
            <Link to="/request-reset" className="auth-link">
              Forgot password?
            </Link>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-login-primary">
            Login
          </button>
        </form>

        {!isAdminLogin ? (
          <div className="auth-links auth-links--split-login">
            <button
              type="button"
              className="auth-link auth-link--inline auth-link-strong"
              onClick={() => {
                setShowForm(false);
                resetRegistration();
                setPortalTab('register');
              }}
            >
              Create account
            </button>
            <span className="auth-separator" aria-hidden>
              ·
            </span>
            <button
              type="button"
              className="auth-link auth-link--inline"
              onClick={() => {
                setShowForm(false);
                resetRegistration();
                setPortalTab('register');
              }}
            >
              Registration help
            </button>
          </div>
        ) : null}

        <p className="auth-muted-hint">
          If sign-in prompts for email verification, follow the OTP steps — that&apos;s different from resetting your password.
        </p>

        <SecureFooterNote />
      </>
    );
  }

  return (
    <div className="modern-auth-container modern-auth-container--fullscreen">
      <AuthBackdrop />
      <button type="button" className="auth-landing-back" onClick={() => navigate('/')}>
        ← Back to home
      </button>
      <div className="auth-content">
        <SplitShell hero={hero} panel={mainPanelContent} />
      </div>
    </div>
  );
}