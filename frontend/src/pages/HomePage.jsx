import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getHealthStatus, apiTestRole, apiTestStudentScope, 
  apiTestMentorScope, apiTestParentScope, apiTestAdminPrivacy 
} from '../services/api';
import { 
  CheckCircle2, AlertCircle, RefreshCw, Server, 
  Layers, ArrowRight, BookOpen, ShieldCheck, UserCheck, 
  Users, HeartHandshake, Eye, Activity, Terminal, Lock, LogIn, KeyRound
} from 'lucide-react';

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  // Security Test Panel State
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const testApi = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    const res = await getHealthStatus();
    if (res.ok) {
      setHealthData(res.data);
    } else {
      setHealthError(res.error || 'Failed to reach backend');
      setHealthData(null);
    }
    setLoadingHealth(false);
  };

  useEffect(() => {
    testApi();
  }, []);

  const runSecurityTest = async (testName, testFn) => {
    setTestingEndpoint(true);
    setTestResult({ name: testName, status: 'loading', message: 'Executing backend query...' });
    try {
      const res = await testFn();
      setTestResult({
        name: testName,
        status: res.ok ? 'allowed' : 'denied',
        httpStatus: res.status,
        data: res.data,
        error: res.error,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (e) {
      setTestResult({
        name: testName,
        status: 'error',
        httpStatus: 0,
        error: e.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    setTestingEndpoint(false);
  };

  const routeGroups = [
    {
      title: 'Authentication & Access',
      role: 'auth',
      icon: Lock,
      badgeClass: 'badge-info',
      routes: [
        { path: '/login', label: 'Login & Demo Selector', step: 'Step 3 Complete' }
      ]
    },
    {
      title: 'Student Portal (Protected: Student Role)',
      role: 'student',
      icon: BookOpen,
      badgeClass: 'badge-info',
      routes: [
        { path: '/student/dashboard', label: 'Student Dashboard', step: 'Step 4' },
        { path: '/student/learning', label: 'My Learning & Modules', step: 'Step 5' },
        { path: '/student/attendance', label: 'Attendance & Marks', step: 'Step 7' },
        { path: '/student/scholarships', label: 'Matched Scholarships', step: 'Step 8' },
        { path: '/student/career', label: 'Career Guidance & Roadmaps', step: 'Step 9' },
        { path: '/student/resources', label: 'Adaptive Resources', step: 'Step 9' },
        { path: '/student/accessibility', label: 'Accessibility Preferences', step: 'Step 6' },
        { path: '/student/profile', label: 'Student Profile', step: 'Step 4' },
        { path: '/student/settings', label: 'Student Settings', step: 'Step 4' }
      ]
    },
    {
      title: 'Mentor Portal (Protected: Mentor Role)',
      role: 'mentor',
      icon: Users,
      badgeClass: 'badge-warning',
      routes: [
        { path: '/mentor/dashboard', label: 'Mentor Dashboard', step: 'Step 10' },
        { path: '/mentor/student/1', label: 'Student Detail & Action Notes (:id)', step: 'Step 10' },
        { path: '/mentor/profile', label: 'Mentor Profile', step: 'Step 10' }
      ]
    },
    {
      title: 'Parent Portal (Protected: Parent Role)',
      role: 'parent',
      icon: HeartHandshake,
      badgeClass: 'badge-success',
      routes: [
        { path: '/parent/dashboard', label: 'Child Overview Dashboard', step: 'Step 10' },
        { path: '/parent/profile', label: 'Parent Profile', step: 'Step 10' }
      ]
    },
    {
      title: 'Administrator Portal (Protected: Administrator Role)',
      role: 'admin',
      icon: ShieldCheck,
      badgeClass: 'badge-danger',
      routes: [
        { path: '/admin/scholarships', label: 'Active Scholarship Postings', step: 'Step 8 & 10' },
        { path: '/admin/scholarships/new', label: 'Create New Scholarship', step: 'Step 8 & 10' }
      ]
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Hero / Architecture Banner */}
      <section className="card" style={{
        backgroundColor: 'var(--primary-50)',
        borderColor: 'var(--primary-100)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-info">
            <Layers size={13} /> STEP 3 AUTHENTICATION & RBAC ACTIVE
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-700)', marginBottom: '0.5rem' }}>
          Beyond Barriers
        </h1>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.75rem' }}>
          Personalized and Inclusive Education Support System
        </p>
        <p style={{ color: 'var(--slate-700)', maxWidth: '850px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Security Principle: <strong>AUTHENTICATION + ROLE AUTHORIZATION + DATA SCOPE ENFORCEMENT</strong>
          <br />
          All role routes are guarded with <code>ProtectedRoute</code>, and all data queries are verified server-side against session identity. Passwords are securely hashed with Werkzeug.
        </p>
      </section>

      {/* Current Auth Status Card */}
      <section className="card" style={{ marginBottom: '2rem', borderLeft: isAuthenticated ? '4px solid var(--accent-500)' : '4px solid var(--warning-500)' }}>
        <div className="card-header flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} color={isAuthenticated ? 'var(--accent-500)' : 'var(--warning-500)'} />
            <h2 className="card-title">Current Authentication Identity</h2>
          </div>
          {isAuthenticated ? (
            <span className="badge badge-success">Authenticated</span>
          ) : (
            <span className="badge badge-warning">Guest (Unauthenticated)</span>
          )}
        </div>

        {isAuthenticated && user ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged In User</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                {user.profile?.name || user.username} (<code>{user.username}</code>)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Backend Role</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize', color: 'var(--primary-600)' }}>
                {user.role}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scope Parameters</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {user.role === 'student' && `Roll Code: ${user.profile?.roll_code || 'N/A'}`}
                {user.role === 'mentor' && `Cohort: Roll ${user.profile?.assigned_roll_start}–${user.profile?.assigned_roll_end}`}
                {user.role === 'parent' && `Linked Child: ${user.profile?.child_name || 'N/A'}`}
                {user.role === 'administrator' && `Privacy Wall: Zero student academic/medical access`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              You are currently viewing as an unauthenticated guest. Protected role routes will redirect to <code>/login</code>.
            </p>
            <Link to="/login" className="btn btn-primary btn-sm">
              <LogIn size={13} /> Go to Login Page
            </Link>
          </div>
        )}
      </section>

      {/* Interactive RBAC & Scope Security Sandbox */}
      <section className="card" style={{ marginBottom: '2.5rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--primary-500)" />
            Interactive RBAC & Scope Verification Sandbox
          </h2>
          <p className="card-subtitle">
            Trigger live queries against the backend to verify that permissions and scopes are enforced server-side.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Role Check Buttons */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>1. Role Gate Tests</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button 
                onClick={() => runSecurityTest('Student Role Gate (/api/auth/test/student)', () => apiTestRole('student'))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Test Student Role Endpoint
              </button>
              <button 
                onClick={() => runSecurityTest('Mentor Role Gate (/api/auth/test/mentor)', () => apiTestRole('mentor'))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Test Mentor Role Endpoint
              </button>
              <button 
                onClick={() => runSecurityTest('Parent Role Gate (/api/auth/test/parent)', () => apiTestRole('parent'))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Test Parent Role Endpoint
              </button>
              <button 
                onClick={() => runSecurityTest('Admin Role Gate (/api/auth/test/admin)', () => apiTestRole('admin'))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Test Admin Role Endpoint
              </button>
            </div>
          </div>

          {/* Scope Isolation Buttons */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>2. Scope Boundary Tests</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button 
                onClick={() => runSecurityTest('Student 1 Data Scope (/api/auth/test/student-data/1)', () => apiTestStudentScope(1))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Query Student 1 Data (Aarav)
              </button>
              <button 
                onClick={() => runSecurityTest('Student 2 Data Scope (/api/auth/test/student-data/2)', () => apiTestStudentScope(2))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Query Student 2 Data (Priya)
              </button>
              <button 
                onClick={() => runSecurityTest('Mentor Roll 14 (Dr. Sen In-Cohort)', () => apiTestMentorScope(14))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Mentor Query Roll 14 (Cohort 1-20)
              </button>
              <button 
                onClick={() => runSecurityTest('Mentor Roll 27 (Dr. Sen Out-of-Cohort)', () => apiTestMentorScope(27))} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Mentor Query Roll 27 (Cohort 21-40)
              </button>
              <button 
                onClick={() => runSecurityTest('Admin Private Data Probe', () => apiTestAdminPrivacy())} 
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                Admin Academic Data Probe (Must Deny)
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Security Output Terminal */}
        {testResult && (
          <div style={{
            backgroundColor: 'var(--slate-900)',
            color: testResult.status === 'allowed' ? '#86efac' : testResult.status === 'denied' ? '#f87171' : '#38bdf8',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'monospace',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#94a3b8' }}>
              <span>Security Probe Result: <strong>{testResult.name}</strong></span>
              <span>HTTP Status: {testResult.httpStatus || 'N/A'} • {testResult.timestamp}</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(testResult.data || { error: testResult.error, status: testResult.httpStatus }, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Protected Routes Directory */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
            Protected Platform Routes & Role Boundaries
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Routes are strictly protected by <code>ProtectedRoute</code> on frontend and authorized by session token on backend.
          </p>
        </div>

        <div className="grid grid-cols-2">
          {routeGroups.map((group, idx) => {
            const Icon = group.icon;
            return (
              <div key={idx} className="card">
                <div className="card-header flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon size={18} color="var(--primary-500)" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{group.title}</h3>
                  </div>
                  <span className={`badge ${group.badgeClass}`}>
                    {group.role}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {group.routes.map((rt, rIdx) => (
                    <Link
                      key={rIdx}
                      to={rt.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--slate-50)',
                        border: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div>
                        <strong>{rt.label}</strong>
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <code>{rt.path}</code>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                          {rt.step}
                        </span>
                        <ArrowRight size={14} color="var(--slate-400)" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
