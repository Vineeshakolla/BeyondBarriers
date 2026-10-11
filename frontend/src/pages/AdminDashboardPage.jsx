import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetAdminDashboard, apiToggleScholarshipStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, DollarSign, Clock, AlertTriangle, CheckCircle2,
  Calendar, ArrowRight, Plus, ExternalLink, Lock,
  FileText, Check, X, ShieldAlert
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    const res = await apiGetAdminDashboard();
    setLoading(false);

    if (res.ok && res.data) {
      setData(res.data);
    } else {
      setError(res.error || 'Failed to load scholarship administration overview.');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const res = await apiToggleScholarshipStatus(id, !currentStatus);
    if (res.ok) {
      loadDashboard();
    } else {
      alert(res.error || 'Failed to update scholarship status.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading scholarship dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--danger-500)' }}>
          <p style={{ color: 'var(--danger-600)' }}>{error}</p>
          <button onClick={loadDashboard} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const urgentDeadlines = data?.urgent_deadlines || [];
  const recentlyPosted = data?.recently_posted || [];
  const administrator = data?.administrator || {};

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Admin Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--slate-900) 0%, var(--primary-900) 100%)',
        color: '#ffffff',
        marginBottom: '1.75rem',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
                <ShieldCheck size={12} /> Administrator Portal
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--accent-500)', color: '#ffffff', fontWeight: 700 }}>
                Domain: Financial Aid & Opportunity Administration
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {administrator.name || user?.username}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.35rem', margin: 0 }}>
              {administrator.title || 'Scholarship Director'} • Student Marks & Medical Data Cryptographically Shielded
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/admin/scholarships"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Post New Scholarship
            </Link>
          </div>
        </div>
      </div>

      {/* Privacy Shield Assertion Box */}
      <div className="card" style={{
        marginBottom: '1.75rem',
        backgroundColor: 'var(--slate-50)',
        borderLeft: '4px solid var(--primary-500)',
        padding: '1rem 1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={16} color="var(--primary-600)" />
          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Strict Privacy Shield Verification
          </strong>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>
          In accordance with Beyond Barriers authorization architecture, the Administrator portal is restricted exclusively to opportunity curation. Student marks, attendance records, test logs, disability classifications, and support priorities are completely inaccessible to administrative credentials.
        </p>
      </div>

      {/* Stat Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Scholarships */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Scholarships</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {stats.total_scholarships || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Curated financial opportunities
          </div>
        </div>

        {/* Active Scholarships */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success-700)', fontWeight: 600 }}>Active Postings</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success-600)', marginTop: '0.2rem' }}>
                {stats.active_scholarships || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-600)' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)', marginTop: '0.5rem' }}>
            Currently visible to eligible students
          </div>
        </div>

        {/* Closing Soon */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warning-700)', fontWeight: 600 }}>Closing Soon (&lt; 7 Days)</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--warning-600)', marginTop: '0.2rem' }}>
                {stats.closing_soon || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--warning-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-600)' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning-700)', marginTop: '0.5rem' }}>
            {stats.due_today ? `${stats.due_today} due today!` : 'Upcoming final deadlines'}
          </div>
        </div>

        {/* Inactive */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Inactive / Expired</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {stats.inactive_scholarships || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <FileText size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Drafts or closed opportunities
          </div>
        </div>
      </div>

      {/* Two Column Section: Urgent Deadlines & Recently Posted */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.75rem'
      }}>
        
        {/* Urgent Deadlines Widget */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--warning-500)" />
                Upcoming Deadlines
              </h2>
              <p className="card-subtitle">Opportunities expiring within the next 7 days</p>
            </div>
          </div>

          {urgentDeadlines.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              No scholarships are closing within 7 days.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {urgentDeadlines.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--warning-50)',
                  borderLeft: '3px solid var(--warning-500)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {item.provider} • {item.amount}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-warning" style={{ fontWeight: 700, fontSize: '0.725rem' }}>
                      {item.urgency?.formatted_label || item.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Posted / Managed Postings */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="var(--primary-500)" />
                Recently Managed Opportunities
              </h2>
              <p className="card-subtitle">Latest postings in the financial aid database</p>
            </div>
            <Link to="/admin/scholarships" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              View All Postings
            </Link>
          </div>

          {recentlyPosted.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              No scholarships have been posted yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentlyPosted.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--slate-50)',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {item.provider} • {item.amount} • Deadline: {item.deadline}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(item.id, item.is_active)}
                      className={`btn btn-sm ${item.is_active ? 'btn-success' : 'btn-secondary'}`}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      title="Click to toggle active status"
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Action Navigation Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Complete Scholarship & Grant Management Portal
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
            Full CRUD capabilities: create new aid programs, edit criteria, toggle status, and inspect application URLs.
          </p>
        </div>
        <Link to="/admin/scholarships" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>Open Full Scholarship Manager</span>
          <ArrowRight size={15} />
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
