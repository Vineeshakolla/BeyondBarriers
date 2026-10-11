import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { 
  LogIn, Lock, User, AlertCircle, Sparkles, BookOpen, 
  ArrowRight, ShieldCheck, CheckCircle2, UserPlus 
} from 'lucide-react';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    const res = await login(username.trim(), password.trim());
    setSubmitting(false);

    if (res.success) {
      let target = from;
      if (!target || target === '/login') {
        switch (res.role) {
          case 'student': {
            const isComplete = Boolean(res.user?.profile?.is_profile_completed);
            target = isComplete ? '/student/dashboard' : '/student/onboarding';
            break;
          }
          case 'mentor': target = '/mentor/dashboard'; break;
          case 'parent': target = '/parent/dashboard'; break;
          case 'administrator': target = '/admin/dashboard'; break;
          default: target = '/';
        }
      }
      navigate(target, { replace: true });
    } else {
      setError(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    const res = await register(name.trim(), username.trim(), password, role);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        let target = '/student/dashboard';
        if (res.role === 'mentor') target = '/mentor/dashboard';
        else if (res.role === 'parent') target = '/parent/dashboard';
        else if (res.role === 'administrator') target = '/admin/dashboard';
        navigate(target, { replace: true });
      }, 500);
    } else {
      setError(res.error || 'Registration failed. Please try a different username.');
    }
  };

  const handleQuickFill = (cred) => {
    setActiveTab('login');
    setUsername(cred.username);
    setPassword(cred.password);
    if (cred.role) setRole(cred.role);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-500)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <BookOpen size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Beyond Barriers</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Unified Education Support Portal • Database-Driven Access
          </p>
        </div>

        {/* Already Authenticated Banner */}
        {isAuthenticated && user && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Currently Signed In as <strong>{user.username}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Role: <span className="badge badge-info">{user.role}</span>
                </div>
              </div>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                Sign Out First
              </button>
            </div>
          </div>
        )}

        {/* Auth Mode Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '1rem',
          backgroundColor: 'var(--slate-100)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'login' ? 'var(--bg-surface)' : 'transparent',
              fontWeight: activeTab === 'login' ? 700 : 500,
              color: activeTab === 'login' ? 'var(--primary-600)' : 'var(--text-muted)',
              boxShadow: activeTab === 'login' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn size={15} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'register' ? 'var(--bg-surface)' : 'transparent',
              fontWeight: activeTab === 'register' ? 700 : 500,
              color: activeTab === 'register' ? 'var(--primary-600)' : 'var(--text-muted)',
              boxShadow: activeTab === 'register' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={15} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Create Account
          </button>
        </div>

        {/* Main Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeTab === 'login' ? (
                <>
                  <Lock size={18} color="var(--primary-500)" />
                  Account Sign In
                </>
              ) : (
                <>
                  <UserPlus size={18} color="var(--primary-500)" />
                  Account Registration
                </>
              )}
            </h2>
            <p className="card-subtitle">
              {activeTab === 'login'
                ? 'Select your target role and enter credentials to access your portal.'
                : 'Select your target role and create a new persistent account.'}
            </p>
          </div>

          {/* ROLE SELECTION PILLS (ACKNOWLEDGES USER ROLE) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}>
              Select Account Role:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {[
                { key: 'student', label: 'Student', icon: '🎓' },
                { key: 'mentor', label: 'Mentor', icon: '👩‍🏫' },
                { key: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
                { key: 'administrator', label: 'Admin', icon: '🛡️' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { setRole(item.key); setError(''); }}
                  style={{
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: role === item.key ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                    backgroundColor: role === item.key ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: role === item.key ? 'var(--primary-700)' : 'var(--text-main)',
                    fontWeight: role === item.key ? 700 : 500,
                    fontSize: '0.775rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
              Selected Role: <strong style={{ textTransform: 'capitalize', color: 'var(--primary-600)' }}>{role}</strong>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger-50)',
              color: 'var(--danger-600)',
              border: '1px solid var(--danger-500)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-50)',
              color: 'var(--accent-700)',
              border: '1px solid var(--accent-500)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-username">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="form-input"
                  placeholder={`e.g. ${role}1, demo, vineesha`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
                disabled={submitting}
              >
                {submitting ? (
                  <span>Authenticating as {role}...</span>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span style={{ textTransform: 'capitalize' }}>Sign In as {role}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder={`e.g. ${role === 'student' ? 'Vineesha' : role === 'mentor' ? 'Dr. Sharma' : role === 'parent' ? 'Sunita' : 'Admin Director'}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-username">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  className="form-input"
                  placeholder="e.g. vineesha"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="Choose password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="reg-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
                disabled={submitting}
              >
                {submitting ? (
                  <span>Registering {role}...</span>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span style={{ textTransform: 'capitalize' }}>Create {role} Account</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Demo Accounts Quick-Fill Section */}
        <div className="card" style={{ marginTop: '1.5rem', backgroundColor: 'var(--slate-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Sparkles size={16} color="var(--warning-500)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              Hackathon Demonstration Accounts
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Click any demo profile to auto-populate credentials for role verification:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_CREDENTIALS.map((cred, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickFill(cred)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  border: username === cred.username ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {cred.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <code>{cred.username}</code> / <code>{cred.password}</code> • {cred.details}
                  </div>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  Select
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
