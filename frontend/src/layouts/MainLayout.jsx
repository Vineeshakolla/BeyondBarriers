import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHealthStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useVoiceAgent } from '../context/VoiceContext';
import VoiceAssistantBar from '../components/VoiceAssistantBar';
import { 
  BookOpen, CheckCircle2, AlertCircle, RefreshCw, 
  Layers, LogIn, LogOut, UserCheck, Users, HeartHandshake, ShieldCheck,
  CalendarCheck, DollarSign, Compass, Sliders, Volume2, Mic, MicOff
} from 'lucide-react';

export const MainLayout = ({ children }) => {
  const [health, setHealth] = useState({ status: 'checking', message: 'Checking API...' });
  const [checking, setChecking] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const voiceContext = useVoiceAgent();
  const isVoiceEligible = voiceContext?.isVoiceEligible;
  const voiceEnabled = voiceContext?.voiceEnabled;
  const setVoiceEnabled = voiceContext?.setVoiceEnabled;
  const navigate = useNavigate();

  const checkBackend = async () => {
    setChecking(true);
    const result = await getHealthStatus();
    if (result.ok && result.data && result.data.status === 'ok') {
      setHealth({ 
        status: 'connected', 
        message: 'Connected to Flask Backend',
        database: result.data.database,
        app: result.data.app
      });
    } else {
      setHealth({ 
        status: 'disconnected', 
        message: result.error || 'Backend offline' 
      });
    }
    setChecking(false);
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return <UserCheck size={13} />;
      case 'mentor': return <Users size={13} />;
      case 'parent': return <HeartHandshake size={13} />;
      case 'administrator': return <ShieldCheck size={13} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Brand & Status Navigation Bar */}
      <header className="navbar">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <span>Beyond Barriers</span>
              <span style={{
                fontSize: '0.65rem',
                marginLeft: '0.5rem',
                padding: '0.15rem 0.45rem',
                backgroundColor: 'var(--accent-50)',
                color: 'var(--accent-700)',
                borderRadius: '999px',
                fontWeight: 700
              }}>
                Step 6 Voice & A11y Active
              </span>
            </div>
          </Link>

          {/* Student Hub Navigation Shortcuts */}
          {isAuthenticated && user?.role === 'student' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }} aria-label="Student Navigation">
              <Link to="/student/dashboard" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Dashboard
              </Link>
              <Link to="/student/learning" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                My Learning
              </Link>
              <Link to="/student/attendance" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Attendance & Marks
              </Link>
              <Link to="/student/scholarships" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Scholarships
              </Link>
              <Link to="/student/career" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Career Guidance
              </Link>
              <Link to="/student/resources" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Resources
              </Link>
              <Link to="/student/accessibility" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                <Sliders size={13} /> A11y
              </Link>
              <Link to="/student/profile" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Profile
              </Link>
            </nav>
          )}

          {/* Mentor Hub Navigation Shortcuts */}
          {isAuthenticated && user?.role === 'mentor' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }} aria-label="Mentor Navigation">
              <Link to="/mentor/dashboard" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={13} /> Dashboard
              </Link>
              <Link to="/mentor/students" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Students
              </Link>
              <Link to="/mentor/profile" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Profile
              </Link>
            </nav>
          )}

          {/* Parent Hub Navigation Shortcuts */}
          {isAuthenticated && user?.role === 'parent' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }} aria-label="Parent Navigation">
              <Link to="/parent/dashboard" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <HeartHandshake size={13} /> Dashboard
              </Link>
              <Link to="/parent/child" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Child Overview
              </Link>
              <Link to="/parent/profile" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Profile
              </Link>
            </nav>
          )}

          {/* Administrator Hub Navigation Shortcuts */}
          {isAuthenticated && (user?.role === 'administrator' || user?.role === 'admin') && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }} aria-label="Administrator Navigation">
              <Link to="/admin/dashboard" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={13} /> Scholarship Dashboard
              </Link>
              <Link to="/admin/scholarships" className="btn btn-sm btn-secondary" style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}>
                Scholarships
              </Link>
            </nav>
          )}

          {/* Center & Right Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Voice Agent Quick Enable/Disable Toggle for Eligible Students */}
            {isVoiceEligible && setVoiceEnabled && (
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`btn btn-sm ${voiceEnabled ? 'btn-success' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.775rem',
                  padding: '0.25rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  border: voiceEnabled ? '1px solid var(--accent-500)' : '1px solid var(--primary-500)',
                  backgroundColor: voiceEnabled ? 'var(--accent-50)' : 'var(--primary-50)',
                  color: voiceEnabled ? 'var(--accent-700)' : 'var(--primary-700)'
                }}
                title={voiceEnabled ? "Voice Agent is ON (Click to disable)" : "Voice Agent is OFF by default for privacy (Click to enable)"}
              >
                {voiceEnabled ? <Volume2 size={13} /> : <MicOff size={13} />}
                <span>Voice Agent: {voiceEnabled ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Backend Health Badge */}
            <div 
              className={`badge ${
                health.status === 'connected' 
                  ? 'badge-success' 
                  : health.status === 'checking' 
                    ? 'badge-info' 
                    : 'badge-danger'
              }`}
              title={`API: /api/health - DB: ${health.database || 'unknown'}`}
            >
              {health.status === 'connected' ? (
                <CheckCircle2 size={13} />
              ) : health.status === 'checking' ? (
                <RefreshCw size={13} />
              ) : (
                <AlertCircle size={13} />
              )}
              <span>{health.message}</span>
            </div>

            {/* Authenticated User Status or Sign In Button */}
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--slate-100)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}>
                  {getRoleIcon(user.role)}
                  <span><strong>{user.profile?.name || user.username}</strong></span>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                    {user.role}
                  </span>
                </div>

                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Sign out of account"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                <LogIn size={13} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '3.5rem' }}>
        {children}
      </main>

      {/* Accessible Footer */}
      <footer style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem',
        fontSize: '0.825rem',
        color: 'var(--text-muted)',
        marginBottom: '65px' // Leave clearance for persistent VoiceAssistantBar
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>Beyond Barriers</strong> — Personalized & Inclusive Education Support System
            <div style={{ marginTop: '0.25rem', color: 'var(--text-faint)' }}>
              Interactive Voice Assistant & Universal Accessibility Engine Active
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="badge badge-success">
              <Volume2 size={12} /> Step 6 Voice & A11y Complete
            </span>
          </div>
        </div>
      </footer>

      {/* Persistent Interactive Voice Assistant & Controller */}
      <VoiceAssistantBar />
    </div>
  );
};

export default MainLayout;

