import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Lock size={13} /> Authenticating
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Verifying session security clearance...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role authorized
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    // If student has not completed onboarding and is accessing student portal routes
    if (
      user.role === 'student' &&
      !user.profile?.is_profile_completed &&
      !location.pathname.startsWith('/student/onboarding') &&
      !location.pathname.startsWith('/student/profile')
    ) {
      return <Navigate to="/student/onboarding" replace />;
    }
    return children;
  }

  // Role mismatch -> Show accessible 403 Forbidden page
  const getRoleDashboard = (role) => {
    switch (role) {
      case 'student': return '/student/dashboard';
      case 'mentor': return '/mentor/dashboard';
      case 'parent': return '/parent/dashboard';
      case 'administrator': return '/admin/scholarships';
      default: return '/';
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="card" style={{ maxWidth: '580px', margin: '0 auto', borderLeft: '4px solid var(--danger-500)' }}>
        <div className="card-header flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldAlert size={24} color="var(--danger-500)" />
            <h2 className="card-title" style={{ color: 'var(--danger-600)', fontSize: '1.25rem' }}>
              403 Forbidden: Access Denied
            </h2>
          </div>
          <span className="badge badge-danger">Role Mismatch</span>
        </div>

        <div style={{ margin: '1rem 0', lineHeight: 1.6, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            Your account is authenticated as <strong>{user.username}</strong> with role{' '}
            <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}>{user.role}</span>.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            This resource strictly requires one of the following roles: <strong>{allowedRoles.join(', ')}</strong>.
            The backend authorization layer enforces role boundaries to protect student privacy and data integrity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-secondary btn-sm">
            <ArrowLeft size={13} /> Architecture Home
          </Link>
          <Link to={getRoleDashboard(user.role)} className="btn btn-primary btn-sm">
            Go to Your {user.role} Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
