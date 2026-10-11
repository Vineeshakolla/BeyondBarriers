import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGetMentorDashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, AlertTriangle, Eye, CheckCircle2, Search,
  ArrowRight, Filter, BookOpen, ShieldCheck,
  TrendingDown, TrendingUp, HelpCircle, UserCheck
} from 'lucide-react';

export const MentorDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const { user } = useAuth();
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    const res = await apiGetMentorDashboard();
    setLoading(false);

    if (res.ok && res.data) {
      setData(res.data);
    } else {
      setError(res.error || 'Failed to load assigned mentor cohort.');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!data || !data.students) return [];
    return data.students.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(student.roll_number).includes(searchQuery) ||
        (student.roll_code && student.roll_code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        priorityFilter === 'ALL' ||
        student.support_priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [data, searchQuery, priorityFilter]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Needs Support':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
            <AlertTriangle size={13} /> Needs Support
          </span>
        );
      case 'Monitor':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
            <Eye size={13} /> Monitor
          </span>
        );
      case 'Normal':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
            <CheckCircle2 size={13} /> Normal
          </span>
        );
      default:
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <HelpCircle size={13} /> Insufficient Data
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading assigned student cohort...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--danger-500)', backgroundColor: 'var(--danger-50)' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--danger-700)', marginBottom: '0.5rem' }}>Cohort Load Error</h2>
          <p style={{ color: 'var(--danger-600)', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={loadDashboard} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const mentor = data?.mentor || {};
  const counts = data?.summary_counts || {};

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Mentor Cohort Scope Banner */}
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
                <Users size={12} /> Academic Mentor Portal
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--accent-500)', color: '#ffffff', fontWeight: 700 }}>
                Assigned Cohort: Rolls {mentor.assigned_roll_start} – {mentor.assigned_roll_end}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {mentor.name || user?.username}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.35rem', margin: 0 }}>
              {mentor.department} • Backend Scope Strictly Restricted to Assigned Roll Range
            </p>
          </div>
        </div>
      </div>

      {/* Cohort Summary Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Assigned */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Students</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {counts.total || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Roll range {mentor.assigned_roll_start} to {mentor.assigned_roll_end}
          </div>
        </div>

        {/* Needs Support */}
        <div 
          className="card" 
          onClick={() => setPriorityFilter('Needs Support')}
          style={{ 
            padding: '1.25rem', 
            borderLeft: '4px solid var(--danger-500)',
            cursor: 'pointer',
            backgroundColor: priorityFilter === 'Needs Support' ? 'var(--danger-50)' : 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--danger-700)', fontWeight: 600 }}>Needs Support</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--danger-600)', marginTop: '0.2rem' }}>
                {counts.needs_support || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--danger-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-600)' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger-700)', marginTop: '0.5rem' }}>
            Requires immediate pedagogical review
          </div>
        </div>

        {/* Monitor */}
        <div 
          className="card" 
          onClick={() => setPriorityFilter('Monitor')}
          style={{ 
            padding: '1.25rem', 
            borderLeft: '4px solid var(--warning-500)',
            cursor: 'pointer',
            backgroundColor: priorityFilter === 'Monitor' ? 'var(--warning-50)' : 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warning-700)', fontWeight: 600 }}>Monitor</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--warning-600)', marginTop: '0.2rem' }}>
                {counts.monitor || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--warning-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-600)' }}>
              <Eye size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning-700)', marginTop: '0.5rem' }}>
            Emerging trends or guessing flags
          </div>
        </div>

        {/* Normal */}
        <div 
          className="card" 
          onClick={() => setPriorityFilter('Normal')}
          style={{ 
            padding: '1.25rem', 
            borderLeft: '4px solid var(--success-500)',
            cursor: 'pointer',
            backgroundColor: priorityFilter === 'Normal' ? 'var(--success-50)' : 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success-700)', fontWeight: 600 }}>Normal / On Track</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success-600)', marginTop: '0.2rem' }}>
                {counts.normal || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-600)' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)', marginTop: '0.5rem' }}>
            Consistent attendance & test metrics
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Priority filter pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={13} /> Filter:
            </span>
            <button
              className={`btn btn-sm ${priorityFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPriorityFilter('ALL')}
            >
              All ({counts.total || 0})
            </button>
            <button
              className={`btn btn-sm ${priorityFilter === 'Needs Support' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPriorityFilter('Needs Support')}
            >
              Needs Support ({counts.needs_support || 0})
            </button>
            <button
              className={`btn btn-sm ${priorityFilter === 'Monitor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPriorityFilter('Monitor')}
            >
              Monitor ({counts.monitor || 0})
            </button>
            <button
              className={`btn btn-sm ${priorityFilter === 'Normal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPriorityFilter('Normal')}
            >
              Normal ({counts.normal || 0})
            </button>
          </div>

        </div>
      </div>

      {/* Student List Section */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--primary-500)" />
              Assigned Students Cohort
            </h2>
            <p className="card-subtitle">
              Ordered transparently by Step 7 Support Priority calculation (Urgency & Composite Risk Score)
            </p>
          </div>
          <span className="badge badge-info">
            Showing {filteredStudents.length} of {counts.total || 0} students
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <UserCheck size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>No students found</h3>
            <p style={{ fontSize: '0.85rem' }}>
              {searchQuery || priorityFilter !== 'ALL'
                ? 'Try adjusting your search or priority filter settings.'
                : 'No students are currently assigned to your cohort.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Left: Info & Priority */}
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                      {st.name}
                    </h3>
                    <span className="badge badge-info" style={{ fontWeight: 600 }}>
                      Roll {st.roll_number} ({st.roll_code || `STU-${st.roll_number}`})
                    </span>
                    <span className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)' }}>
                      {st.class} • {st.stream}
                    </span>
                    {getPriorityBadge(st.support_priority)}
                  </div>

                  {/* Explainable Reasons Snippet */}
                  {st.reasons && st.reasons.length > 0 && (
                    <div style={{
                      marginTop: '0.65rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: st.support_priority === 'Needs Support' ? 'var(--danger-50)' : 'var(--slate-50)',
                      borderLeft: `3px solid ${st.support_priority === 'Needs Support' ? 'var(--danger-500)' : 'var(--warning-500)'}`,
                      fontSize: '0.825rem'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={13} color={st.support_priority === 'Needs Support' ? 'var(--danger-600)' : 'var(--warning-600)'} />
                        Explainable Diagnostic Reasons:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                        {st.reasons.slice(0, 2).map((r, idx) => (
                          <li key={idx} style={{ marginBottom: '0.15rem' }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Subject Support Tags */}
                  {st.subject_support_summary && st.subject_support_summary.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.65rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subjects:</span>
                      {st.subject_support_summary.map((sub, idx) => (
                        <span 
                          key={idx} 
                          className={`badge ${sub.status === 'Needs Support' ? 'badge-danger' : sub.status === 'Monitor' ? 'badge-warning' : 'badge-success'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {sub.name}: {sub.status}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Key Performance Metrics & Action Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: '200px' }}>
                  {st.metrics && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--slate-50)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Attendance</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: st.metrics.overall_attendance < 75 ? 'var(--danger-600)' : 'var(--success-600)' }}>
                          {st.metrics.overall_attendance}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Avg Score</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: st.metrics.average_test_score < 60 ? 'var(--danger-600)' : 'var(--text-main)' }}>
                          {st.metrics.average_test_score}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Guessing</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: st.metrics.guessing_rate > 30 ? 'var(--warning-600)' : 'var(--text-main)' }}>
                          {st.metrics.guessing_rate}%
                        </div>
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/mentor/student/${st.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  >
                    <span>View Student Detail</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default MentorDashboardPage;
