import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVoiceAgent } from '../context/VoiceContext';
import { apiGetAcademicSummary } from '../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Brain,
  Award,
  CalendarCheck,
  BookOpen,
  ArrowLeft,
  Volume2,
  Sparkles,
  AlertCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

export const StudentAcademicSummaryPage = () => {
  const { user } = useAuth();
  const { registerPageSummary, speakText } = useVoiceAgent();

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGetAcademicSummary();
        if (res.ok && res.data && res.data.data) {
          const data = res.data.data;
          setSummaryData(data);

          // Build vocal summary for Voice Agent
          const stName = data.student?.name || 'Student';
          const priority = data.support_priority || 'Normal';
          const reasonsText = data.reasons?.slice(0, 2).join(' ') || 'Academic indicators are satisfactory.';
          const voiceReadout = `Academic Summary for ${stName}. Support Status: ${priority}. Reasons: ${reasonsText}. Overall attendance is ${data.metrics?.overall_attendance || 0} percent. Average assessment score is ${data.metrics?.average_test_score || 0} percent. Say Why do I need support, or click Read Summary Aloud.`;

          registerPageSummary('/student/academic-summary', voiceReadout);
        } else {
          setError(res.error || 'Failed to retrieve academic diagnostic summary.');
        }
      } catch (err) {
        setError('Network error connecting to academic diagnostic service.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [registerPageSummary]);

  const handleReadAloud = () => {
    if (!summaryData) return;
    const priority = summaryData.support_priority;
    const reasons = summaryData.reasons.join('. ');
    const speech = `Your current Academic Support Status is: ${priority}. Detailed reasons: ${reasons}.`;
    speakText(speech, { interrupt: true });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Analyzing Academic Signals
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Calculating attendance, assessment scores, and confidence patterns...</p>
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="var(--danger-500)" />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger-600)' }}>
              {error || 'Academic summary data unavailable.'}
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student, support_priority, status_label, composite_risk_score, metrics, reasons, guidance, subject_support } = summaryData;

  // Visual styling mapped to priority (never relying on color alone - always paired with text & icons)
  const priorityConfig = {
    'Needs Support': {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'var(--danger-500)',
      textColor: 'var(--danger-600)',
      icon: <AlertTriangle size={26} color="var(--danger-500)" aria-hidden="true" />,
      badgeClass: 'badge-danger',
      description: 'Multiple academic indicators suggest personalized review and mentor guidance would be beneficial.'
    },
    'Monitor': {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'var(--warning-500)',
      textColor: 'var(--warning-600)',
      icon: <Clock size={26} color="var(--warning-500)" aria-hidden="true" />,
      badgeClass: 'badge-warning',
      description: 'Performance is steady, but minor variations in attendance or answer confidence warrant proactive observation.'
    },
    'Normal': {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'var(--accent-500)',
      textColor: 'var(--accent-600)',
      icon: <CheckCircle2 size={26} color="var(--accent-500)" aria-hidden="true" />,
      badgeClass: 'badge-success',
      description: 'Strong academic continuity. Test scores, attendance benchmarks, and answer certainty are proficient.'
    },
    'Insufficient Data': {
      bg: 'rgba(100, 116, 139, 0.08)',
      border: 'var(--border-color)',
      textColor: 'var(--text-muted)',
      icon: <HelpCircle size={26} color="var(--text-muted)" aria-hidden="true" />,
      badgeClass: 'badge-secondary',
      description: 'Initial learning baseline is being established. Complete coursework and diagnostic quizzes to generate active support signals.'
    }
  };

  const currentConfig = priorityConfig[support_priority] || priorityConfig['Normal'];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <Link to="/student/dashboard" className="btn btn-secondary btn-sm" aria-label="Back to Dashboard">
              <ArrowLeft size={14} /> Back
            </Link>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Diagnostic Center
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Academic Performance & Support Signals
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Transparent, multi-factor evaluation of attendance, assessment comprehension, and metacognitive confidence.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReadAloud}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          aria-label="Read academic summary aloud with voice assistant"
        >
          <Volume2 size={16} /> Read Summary Aloud
        </button>
      </div>

      {/* Main Support Priority Banner */}
      <div className="card" style={{
        backgroundColor: currentConfig.bg,
        borderLeft: `6px solid ${currentConfig.border}`,
        marginBottom: '2rem',
        padding: '1.5rem 1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ marginTop: '0.15rem' }}>
              {currentConfig.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Current Support Status:
                </span>
                <span
                  className={`badge ${currentConfig.badgeClass}`}
                  style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem', fontWeight: 800 }}
                  role="status"
                  aria-label={`Academic Support Status: ${support_priority}`}
                >
                  {support_priority}
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.5rem', maxWidth: '680px', lineHeight: 1.5 }}>
                {currentConfig.description}
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            minWidth: '150px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Composite Risk Index
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: currentConfig.textColor, marginTop: '0.15rem' }}>
              {composite_risk_score} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 10</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Deterministic scale
            </div>
          </div>
        </div>
      </div>

      {/* Explainable Reasons Card (Core Requirement) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <ShieldAlert size={20} color="var(--primary-600)" aria-hidden="true" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            Observable Diagnostic Reasons
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Signals are derived strictly from concrete academic activity, test answers, and class attendance logs:
        </p>
        
        <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {reasons.map((r, i) => (
            <li key={i} style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <strong>{r}</strong>
            </li>
          ))}
        </ul>
      </div>

      {/* 4 Diagnostic Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        
        {/* Card 1: Attendance */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Attendance Continuity
            </span>
            <CalendarCheck size={18} color="var(--primary-500)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics.overall_attendance !== null ? `${metrics.overall_attendance}%` : 'N/A'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {metrics.attendance_trend === 'declining' ? (
              <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingDown size={12} /> Declining Trend
              </span>
            ) : metrics.attendance_trend === 'improving' ? (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={12} /> Improving
              </span>
            ) : (
              <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Minus size={12} /> Stable
              </span>
            )}
            {metrics.consecutive_missed_classes > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger-600)', fontWeight: 600 }}>
                {metrics.consecutive_missed_classes} missed
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Assessment Performance */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Test Performance
            </span>
            <Award size={18} color="var(--primary-500)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics.average_test_score !== null ? `${metrics.average_test_score}%` : 'N/A'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
              {metrics.total_test_attempts} Total Attempt(s)
            </span>
            {metrics.score_trend === 'improving' && (
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                Trending Up
              </span>
            )}
            {metrics.score_trend === 'declining' && (
              <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                Trending Down
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Metacognitive Confidence */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Confidence Pattern
            </span>
            <Brain size={18} color="var(--primary-500)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics.guessing_rate}% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Guessing</span>
          </div>
          
          {/* Visual Distribution Bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.65rem', display: 'flex' }}>
            <div
              style={{
                width: `${100 - metrics.guessing_rate}%`,
                backgroundColor: 'var(--accent-500)',
                height: '100%'
              }}
              title={`Sure: ${100 - metrics.guessing_rate}%`}
            />
            <div
              style={{
                width: `${metrics.guessing_rate}%`,
                backgroundColor: 'var(--warning-500)',
                height: '100%'
              }}
              title={`Guessing: ${metrics.guessing_rate}%`}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            <span>{metrics.sure_count} Sure</span>
            <span>{metrics.misconception_count} Misconceptions</span>
          </div>
        </div>

        {/* Card 4: Module Attempt Difficulties */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Curriculum Persistence
            </span>
            <BookOpen size={18} color="var(--primary-500)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics.struggling_modules_count}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {metrics.struggling_modules_count > 0 ? (
              <span style={{ color: 'var(--danger-600)', fontWeight: 600 }}>
                Challenging modules requiring 2+ attempts
              </span>
            ) : (
              <span style={{ color: 'var(--accent-600)', fontWeight: 600 }}>
                No repeated module struggle flags
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Subject-Level Analysis Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            Subject-Level Diagnostic Breakdown
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Class {student.class} {student.stream} Curriculum
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Subject</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Code</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Attendance</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Assessment Avg</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Support Status</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {subject_support.map((subj) => (
                <tr key={subj.subject_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {subj.subject_name}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                    {subj.subject_code}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    {subj.attendance_percentage !== null ? `${subj.attendance_percentage}%` : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    {subj.average_score !== null ? `${subj.average_score}%` : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span
                      className={`badge ${
                        subj.status === 'Needs Support'
                          ? 'badge-danger'
                          : subj.status === 'Monitor'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {subj.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <Link to="/student/learning" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                      Study Modules
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supportive Recommendations & Guidance */}
      {guidance && guidance.length > 0 && (
        <div className="card" style={{ backgroundColor: 'var(--primary-50)', borderLeft: '4px solid var(--primary-500)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '0.5rem' }}>
            Empowerment Recommendations & Next Steps
          </h3>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {guidance.map((g, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

export default StudentAcademicSummaryPage;
