import React, { useState, useEffect } from 'react';
import { apiGetParentDashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake, CalendarCheck, Award, BookOpen, MessageSquare,
  AlertTriangle, Eye, CheckCircle2, ShieldCheck,
  TrendingUp, TrendingDown, HelpCircle, User, Info
} from 'lucide-react';

export const ParentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const { user } = useAuth();

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    const res = await apiGetParentDashboard();
    setLoading(false);

    if (res.ok && res.data) {
      setData(res.data);
    } else {
      setError(res.error || 'Failed to load child overview.');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading child academic overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem', maxWidth: '600px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--warning-500)', padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--warning-50)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning-600)',
            marginBottom: '1rem'
          }}>
            <HelpCircle size={26} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Parent Link Notice</h2>
          <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
          <button onClick={loadDashboard} className="btn btn-secondary btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  const { parent, child, summary_cards, attendance, marks, learning_progress, support_priority, shared_notes } = data;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Parent Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--slate-900) 100%)',
        color: '#ffffff',
        marginBottom: '1.75rem',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
                <HeartHandshake size={12} /> Parent Portal
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--accent-500)', color: '#ffffff', fontWeight: 700 }}>
                Linked Child: {child.name} (Roll {child.roll_number})
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Welcome, {parent.name || user?.username}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.35rem', margin: 0 }}>
              {child.class} • {child.stream} • Single-Child Private Academic Boundary Active
            </p>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* Attendance */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${summary_cards.attendance_percentage < 75 ? 'var(--danger-500)' : 'var(--success-500)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Attendance</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: summary_cards.attendance_percentage < 75 ? 'var(--danger-600)' : 'var(--success-600)', marginTop: '0.2rem' }}>
                {summary_cards.attendance_percentage}%
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
              <CalendarCheck size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Trend: {summary_cards.attendance_trend}
          </div>
        </div>

        {/* Academic Marks */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Academic Average</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {summary_cards.average_marks_percentage}%
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-600)' }}>
              <Award size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Overall evaluation average
          </div>
        </div>

        {/* Modules Progress */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Modules Completed</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '0.2rem' }}>
                {summary_cards.completed_modules} / {summary_cards.total_modules}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {summary_cards.learning_progress_percentage}% syllabus explored
          </div>
        </div>

        {/* Support Priority Status */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${summary_cards.support_priority === 'Needs Support' ? 'var(--danger-500)' : summary_cards.support_priority === 'Monitor' ? 'var(--warning-500)' : 'var(--success-500)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Support Status</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {summary_cards.status_label || summary_cards.support_priority}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {summary_cards.support_priority === 'Needs Support' ? (
                <AlertTriangle size={22} color="var(--danger-600)" />
              ) : summary_cards.support_priority === 'Monitor' ? (
                <Eye size={22} color="var(--warning-600)" />
              ) : (
                <CheckCircle2 size={22} color="var(--success-600)" />
              )}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {summary_cards.shared_notes_count} mentor note(s) shared
          </div>
        </div>
      </div>

      {/* Constructive Guidance Banner if available */}
      {support_priority.guidance && support_priority.guidance.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem', backgroundColor: 'var(--primary-50)', borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Info size={16} color="var(--primary-700)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--primary-800)' }}>
              Home Learning Guidance & Advice
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary-900)', margin: 0, lineHeight: 1.45 }}>
            {support_priority.guidance[0]}
          </p>
        </div>
      )}

      {/* Two Column Detailed Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.75rem'
      }}>
        
        {/* Subject Attendance Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck size={16} color="var(--primary-500)" />
              Subject Attendance
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attendance.records?.map((r, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--slate-50)',
                fontSize: '0.85rem'
              }}>
                <div>
                  <strong>{r.subject_name}</strong>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Attended {r.attended_classes} of {r.total_classes} classes
                  </div>
                </div>
                <span className={`badge ${r.attendance_percentage < 75 ? 'badge-danger' : 'badge-success'}`}>
                  {r.attendance_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Marks & Examinations */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} color="var(--primary-500)" />
              Academic Evaluations & Marks
            </h2>
          </div>

          {marks?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No evaluations recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {marks.map((m) => (
                <div key={m.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--slate-50)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <strong>{m.subject_name}</strong> — {m.assessment_name}
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Marks: {m.marks_obtained} / {m.total_marks}
                    </div>
                  </div>
                  <span className="badge badge-info" style={{ fontWeight: 700 }}>
                    {m.percentage}% ({m.grade})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Shared Mentor Notes Section */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--primary-500)" />
              Mentor Notes Shared with Parents
            </h2>
            <p className="card-subtitle">
              Observations and suggestions explicitly shared by your child's mentor to support home learning
            </p>
          </div>
          <span className="badge badge-success">
            {shared_notes?.length || 0} Shared Notes
          </span>
        </div>

        {shared_notes?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              No mentor notes have been shared for home review yet.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              When a mentor records a note intended for family collaboration, it will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {shared_notes.map((n) => (
              <div key={n.id} style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                backgroundColor: 'var(--bg-surface)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{n.mentor_name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({n.mentor_department || 'Academic Support'})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {n.created_at}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  {n.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ParentDashboardPage;
