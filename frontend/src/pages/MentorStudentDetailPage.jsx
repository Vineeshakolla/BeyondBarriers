import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  apiGetMentorStudentDetail,
  apiCreateMentorNote,
  apiUpdateMentorNote
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Users, AlertTriangle, Eye, CheckCircle2,
  CalendarCheck, Award, BookOpen, MessageSquare, Send,
  Lock, ShieldAlert, Clock, Check, Plus, AlertCircle
} from 'lucide-react';

export const MentorStudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [data, setData] = useState(null);

  // New note form state
  const [noteText, setNoteText] = useState('');
  const [shareWithParent, setShareWithParent] = useState(false);
  const [followUpCompleted, setFollowUpCompleted] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState('');

  const loadStudentDetail = async () => {
    setLoading(true);
    setError('');
    setIsAccessDenied(false);

    const res = await apiGetMentorStudentDetail(id);
    setLoading(false);

    if (res.ok && res.data) {
      setData(res.data);
    } else {
      if (res.status === 403) {
        setIsAccessDenied(true);
        setError(res.error || 'Access Denied: Student is outside your assigned cohort roll range.');
      } else {
        setError(res.error || 'Failed to load student details.');
      }
    }
  };

  useEffect(() => {
    loadStudentDetail();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    setNoteSuccess('');

    const res = await apiCreateMentorNote(id, {
      note: noteText.trim(),
      share_with_parent: shareWithParent,
      follow_up_completed: followUpCompleted
    });
    setSubmittingNote(false);

    if (res.ok && res.data) {
      setNoteText('');
      setShareWithParent(false);
      setFollowUpCompleted(false);
      setNoteSuccess('Mentor educational note recorded successfully.');
      setTimeout(() => setNoteSuccess(''), 4000);
      // Reload student details to refresh notes list
      loadStudentDetail();
    } else {
      alert(res.error || 'Failed to save note.');
    }
  };

  const handleToggleNoteShare = async (noteId, currentStatus) => {
    const res = await apiUpdateMentorNote(noteId, {
      share_with_parent: !currentStatus
    });
    if (res.ok) {
      loadStudentDetail();
    }
  };

  const handleToggleFollowUp = async (noteId, currentStatus) => {
    const res = await apiUpdateMentorNote(noteId, {
      follow_up_completed: !currentStatus
    });
    if (res.ok) {
      loadStudentDetail();
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading student diagnostic details...</p>
      </div>
    );
  }

  // Strict roll range access denied UI
  if (isAccessDenied) {
    return (
      <div className="container" style={{ paddingTop: '3rem', maxWidth: '650px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--danger-500)', padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'var(--danger-50)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--danger-600)',
            marginBottom: '1rem'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger-700)', marginBottom: '0.5rem' }}>
            Roll-Range Scope Violation
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {error}
          </p>
          <div style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--slate-50)',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem'
          }}>
            <Lock size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            Security Rule: Mentors are cryptographically restricted to their assigned cohort range. Out-of-cohort records cannot be inspected or altered.
          </div>
          <Link to="/mentor/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={16} /> Return to Mentor Cohort
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--danger-500)' }}>
          <p style={{ color: 'var(--danger-600)' }}>{error || 'Student not found.'}</p>
          <Link to="/mentor/dashboard" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { student, attendance, marks, learning_progress, test_attempts, support_priority, mentor_notes } = data;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Back button & quick navigation */}
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/mentor/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={14} /> Back to Assigned Cohort
        </Link>
      </div>

      {/* Student Academic Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                Roll Number {student.roll_number}
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)' }}>
                {student.roll_code || `STU-${student.roll_number}`}
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                {student.class} • {student.stream}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              {student.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Educational Support & Pedagogical Tracking Portal
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {support_priority.priority === 'Needs Support' && (
              <span className="badge badge-danger" style={{ padding: '0.5rem 0.85rem', fontSize: '0.9rem', fontWeight: 800 }}>
                <AlertTriangle size={15} style={{ marginRight: '0.35rem' }} /> Needs Academic Support
              </span>
            )}
            {support_priority.priority === 'Monitor' && (
              <span className="badge badge-warning" style={{ padding: '0.5rem 0.85rem', fontSize: '0.9rem', fontWeight: 800 }}>
                <Eye size={15} style={{ marginRight: '0.35rem' }} /> Monitoring Recommended
              </span>
            )}
            {support_priority.priority === 'Normal' && (
              <span className="badge badge-success" style={{ padding: '0.5rem 0.85rem', fontSize: '0.9rem', fontWeight: 800 }}>
                <CheckCircle2 size={15} style={{ marginRight: '0.35rem' }} /> Normal / On Track
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Support Priority Explainable Diagnostic Banner */}
      {support_priority.reasons && support_priority.reasons.length > 0 && (
        <div className="card" style={{
          marginBottom: '1.75rem',
          borderLeft: `4px solid ${support_priority.priority === 'Needs Support' ? 'var(--danger-500)' : 'var(--warning-500)'}`,
          backgroundColor: support_priority.priority === 'Needs Support' ? 'var(--danger-50)' : 'var(--warning-50)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} color={support_priority.priority === 'Needs Support' ? 'var(--danger-600)' : 'var(--warning-600)'} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Explainable Pedagogical Support Reasons
            </h2>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
            {support_priority.reasons.map((r, idx) => (
              <li key={idx} style={{ marginBottom: '0.35rem', lineHeight: 1.4 }}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Three Column Diagnostic Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.75rem'
      }}>
        
        {/* Card 1: Attendance Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck size={16} color="var(--primary-500)" />
              Attendance Record
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: attendance.overall_percentage < 75 ? 'var(--danger-600)' : 'var(--success-600)' }}>
                {attendance.overall_percentage}%
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({attendance.attended_classes} of {attendance.total_classes} total classes)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attendance.records?.map((rec, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--slate-50)',
                fontSize: '0.825rem'
              }}>
                <div>
                  <strong>{rec.subject_name}</strong>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {rec.attended_classes} / {rec.total_classes} classes • Trend: {rec.trend}
                  </div>
                </div>
                <span className={`badge ${rec.attendance_percentage < 75 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.75rem' }}>
                  {rec.attendance_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Academic Marks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} color="var(--primary-500)" />
              Assessment Marks
            </h2>
            <p className="card-subtitle">Term examinations and unit assessment records</p>
          </div>

          {marks?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No marks recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {marks.map((m) => (
                <div key={m.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--slate-50)',
                  fontSize: '0.825rem'
                }}>
                  <div>
                    <strong>{m.subject_name}</strong> — {m.assessment_name}
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Score: {m.marks_obtained} / {m.total_marks}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-info" style={{ fontWeight: 700 }}>
                      {m.percentage}% ({m.grade})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Module Learning Progress */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} color="var(--primary-500)" />
              Learning Modules
            </h2>
            <p className="card-subtitle">Self-paced learning module mastery</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {learning_progress?.map((mod, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--slate-50)',
                fontSize: '0.825rem'
              }}>
                <div>
                  <strong>{mod.subject_name}</strong> M{mod.module_number}: {mod.module_title}
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Attempts: {mod.attempts} • Best Score: {mod.best_score}%
                  </div>
                </div>
                <span className={`badge ${mod.status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.725rem' }}>
                  {mod.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MENTOR EDUCATIONAL NOTES SECTION */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--primary-500)" />
              Mentor Educational Notes & Actions
            </h2>
            <p className="card-subtitle">
              Professional pedagogic observations, remediation tracking, and parent communication
            </p>
          </div>
          <span className="badge badge-info">
            {mentor_notes?.length || 0} Recorded Notes
          </span>
        </div>

        {/* Success Alert */}
        {noteSuccess && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--success-50)',
            color: 'var(--success-700)',
            border: '1px solid var(--success-500)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{noteSuccess}</span>
          </div>
        )}

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem', backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label" htmlFor="new-note" style={{ fontSize: '0.85rem' }}>
              Record New Pedagogical Note / Action
            </label>
            <textarea
              id="new-note"
              className="form-input"
              rows={3}
              placeholder="e.g. Discussed Mathematics Module 2 Polynomials. Provided audio-guided practice questions. Scheduled check-in for next Tuesday."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Toggles */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={shareWithParent}
                  onChange={(e) => setShareWithParent(e.target.checked)}
                />
                <span>Share with Parent (default: private)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={followUpCompleted}
                  onChange={(e) => setFollowUpCompleted(e.target.checked)}
                />
                <span>Mark Follow-Up Completed</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submittingNote || !noteText.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Send size={13} />
              <span>{submittingNote ? 'Saving...' : 'Save Mentor Note'}</span>
            </button>
          </div>
        </form>

        {/* Notes History */}
        {mentor_notes?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
            No mentor notes recorded yet for this student.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mentor_notes.map((n) => (
              <div key={n.id} style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--bg-surface)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{n.mentor_name || 'Mentor'}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {n.created_at}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {/* Share with parent toggle button */}
                    <button
                      onClick={() => handleToggleNoteShare(n.id, n.share_with_parent)}
                      className={`btn btn-sm ${n.share_with_parent ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                      title="Click to toggle parent visibility"
                    >
                      {n.share_with_parent ? '✓ Shared with Parent' : '🔒 Private (Not Shared)'}
                    </button>

                    {/* Follow-up toggle button */}
                    <button
                      onClick={() => handleToggleFollowUp(n.id, n.follow_up_completed)}
                      className={`btn btn-sm ${n.follow_up_completed ? 'btn-secondary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderColor: n.follow_up_completed ? 'var(--success-500)' : 'var(--border-color)', color: n.follow_up_completed ? 'var(--success-700)' : 'var(--text-muted)' }}
                      title="Click to toggle follow-up completion"
                    >
                      {n.follow_up_completed ? '✓ Follow-up Completed' : 'Pending Follow-up'}
                    </button>
                  </div>
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

export default MentorStudentDetailPage;
