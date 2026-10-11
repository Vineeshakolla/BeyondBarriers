import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetAttendance } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import { 
  CalendarCheck, AlertTriangle, TrendingUp, TrendingDown, 
  Minus, Award, CheckCircle, Clock, BookOpen, ArrowLeft, Volume2
} from 'lucide-react';

export const StudentAttendancePage = () => {
  const { registerPageSummary, readCurrentPage } = useVoiceAgent();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGetAttendance();
        if (res.ok && res.data) {
          setData(res.data);

          // Build rich, accessible voice summary from actual student records
          const records = res.data.attendance || [];
          const subjectSummaries = records.map(
            (r) => `${r.subject_name}: ${Math.round(r.attendance_percentage)} percent, trend ${r.trend}.`
          ).join(' ');

          const marksList = res.data.marks || [];
          const latestMark = marksList.length > 0 ? marksList[0] : null;
          const marksSummary = latestMark 
            ? `Your latest ${latestMark.assessment_name} in ${latestMark.subject_name} is ${Math.round(latestMark.percentage)} percent, grade ${latestMark.grade}.`
            : '';

          const fullSummary = `Opening Attendance and Academic Performance. Your overall attendance is ${Math.round(res.data.overall_percentage)} percent across ${records.length} subjects with an overall ${res.data.dominant_trend} trend. ${subjectSummaries} ${marksSummary} You can say Go to Dashboard, Go to My Learning, or Go to Scholarships.`;

          registerPageSummary('/student/attendance', fullSummary);
        } else {
          setError(res.error || 'Failed to load attendance.');
        }
      } catch (err) {
        setError('Connection error while fetching attendance records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [registerPageSummary]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <CalendarCheck size={14} /> Loading Attendance & Marks
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving academic records and attendance trends...</p>
        </div>
      </div>
    );
  }

  const attendanceList = data?.attendance || [];
  const marksList = data?.marks || [];
  const overallPercentage = data?.overall_percentage || 0;
  const dominantTrend = data?.dominant_trend || 'stable';

  return (
    <div className="container" id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '5.5rem' }}>
      
      {/* Top Navigation & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/student/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <button 
          type="button" 
          onClick={readCurrentPage} 
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Volume2 size={16} /> Read Attendance Aloud
        </button>
      </div>

      {/* Header Banner */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
              Academic Health Record
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Attendance & Academic Marks</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Live attendance ratios and formal assessment scores tracked from the central student database.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '2px solid var(--primary-500)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.5rem',
              textAlign: 'center',
              minWidth: '130px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Overall Ratio
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: overallPercentage >= 75 ? 'var(--success-600)' : 'var(--danger-600)' }}>
                {overallPercentage}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {data?.attended_classes} of {data?.total_classes} Classes
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Trend
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.3rem', textTransform: 'capitalize' }}>
                {dominantTrend === 'declining' ? (
                  <span style={{ color: 'var(--danger-600)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <TrendingDown size={18} /> Declining
                  </span>
                ) : dominantTrend === 'improving' ? (
                  <span style={{ color: 'var(--success-600)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <TrendingUp size={18} /> Improving
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Minus size={18} /> Stable
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Subject Attendance Table & Academic Marks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Subject-Wise Attendance Breakdown */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck size={18} color="var(--primary-500)" />
            <h2 className="card-title">Subject-Wise Attendance</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {attendanceList.map((att) => (
              <div 
                key={att.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{att.subject_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({att.subject_code})</span>
                  </div>
                  <span 
                    className={`badge ${att.attendance_percentage >= 75 ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontWeight: 700 }}
                  >
                    {Math.round(att.attendance_percentage)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, att.attendance_percentage)}%`,
                    backgroundColor: att.attendance_percentage >= 75 ? 'var(--success-500)' : 'var(--danger-500)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span>{att.attended_classes} of {att.total_classes} sessions attended</span>
                  <span>Trend: <strong style={{ textTransform: 'capitalize' }}>{att.trend}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Academic Assessment Marks */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--primary-500)" />
            <h2 className="card-title">Recent Academic Assessments</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {marksList.length > 0 ? (
              marksList.map((m) => (
                <div 
                  key={m.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.subject_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {m.assessment_name} • Recorded: {m.recorded_at ? m.recorded_at.split(' ')[0] : 'Term 1'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                      {Math.round(m.percentage)}%
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      Grade {m.grade} ({m.marks_obtained}/{m.total_marks})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No term assessments recorded yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default StudentAttendancePage;
