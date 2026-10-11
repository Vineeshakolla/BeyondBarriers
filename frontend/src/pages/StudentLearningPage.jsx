import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVoiceAgent } from '../context/VoiceContext';
import { apiGetLearningSubjects, apiGetLearningProgress, apiGetStudentRecommendations } from '../services/api';
import { 
  BookOpen, Sparkles, CheckCircle2, ArrowRight, BarChart3, 
  Layers, AlertCircle, Award, Trophy, Clock, Volume2, Target, Zap, Activity
} from 'lucide-react';

export const StudentLearningPage = () => {
  const { user } = useAuth();
  const { registerPageSummary, readCurrentPage } = useVoiceAgent();
  const [subjects, setSubjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLearningOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const [subRes, progRes, recRes] = await Promise.all([
          apiGetLearningSubjects(),
          apiGetLearningProgress(),
          apiGetStudentRecommendations()
        ]);

        let subs = [];
        if (subRes.ok && subRes.data) {
          subs = subRes.data.subjects || [];
          setSubjects(subs);
        } else {
          setError(subRes.error || 'Failed to load enrolled subjects.');
        }

        let m = null;
        if (progRes.ok && progRes.data) {
          m = progRes.data.metrics || null;
          setMetrics(m);
        }

        let recs = [];
        if (recRes.ok && recRes.data) {
          recs = recRes.data.recommendations || [];
          setRecommendations(recs);
        }

        // Build accessible voice summary from actual enrolled subjects, recommendations, and progress
        const completedCount = m?.completed_modules || 0;
        const totalCount = m?.total_modules || 0;
        const recSummary = recs.length > 0 
          ? `Top recommendation is ${recs[0].concept_name} in ${recs[0].subject_name} with action ${recs[0].action_type}.`
          : '';

        const learningSummary = `Opening My Learning. ${recSummary} You have completed ${completedCount} of ${totalCount} curriculum modules across ${subs.length} enrolled subjects. You can say Read Recommendations, Go to Dashboard, or Go to Attendance.`;

        registerPageSummary('/student/learning', learningSummary);
      } catch (err) {
        setError('Failed to connect to learning service.');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningOverview();
  }, [registerPageSummary]);

  // Voice Event Listener for Read Recommendations Command
  useEffect(() => {
    const handleVoiceReadRecs = () => {
      if (recommendations && recommendations.length > 0) {
        const textToRead = recommendations.map((r, i) => 
          `Recommendation ${i + 1}: ${r.concept_name} in ${r.subject_name}. Action: ${r.action_type}. ${r.reason}`
        ).join(' ');
        const fullMsg = `Here are your top personalized learning recommendations: ${textToRead}`;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(fullMsg);
          window.speechSynthesis.speak(u);
        }
      }
    };

    window.addEventListener('voice-read-recommendations', handleVoiceReadRecs);
    return () => window.removeEventListener('voice-read-recommendations', handleVoiceReadRecs);
  }, [recommendations]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Loading Learning Modules
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving your curriculum subjects and progress...</p>
        </div>
      </div>
    );
  }

  const p = user?.profile || {};

  return (
    <div className="container" id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <BookOpen size={22} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Learning</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              Personalized curriculum for <strong>{p.class || 'Class 10'}</strong> ({p.stream || 'General'}) • Select a subject to access adaptive modules & tests.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={readCurrentPage} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Volume2 size={15} /> Read Page Aloud
            </button>
            <span className="badge badge-neutral" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              Format: <strong>{p.preferred_response_format || 'Visual'}</strong>
            </span>
          </div>
        </div>

        {/* High-Level Metric Tiles */}
        {metrics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '0.85rem', 
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Total Subjects</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--text-main)' }}>
                {metrics.total_subjects}
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Modules Completed</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--accent-600)' }}>
                {metrics.completed_modules} / {metrics.total_modules}
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Completion Rate</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--primary-600)' }}>
                {metrics.completion_percentage}%
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Average Score</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--warning-600)' }}>
                {metrics.average_score}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-500)', backgroundColor: 'var(--danger-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="var(--danger-500)" />
            <div style={{ fontSize: '0.9rem', color: 'var(--danger-600)', fontWeight: 600 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Dynamic Personalized BKT Recommendations Section */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-main)' }}>
                <Target size={22} color="var(--primary-600)" /> Recommended for You
                <span className="badge badge-info" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Sparkles size={12} /> BKT Adaptive
                </span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Dynamically calculated based on your concept mastery, quiz confidence, academic performance, and learning pace.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {recommendations.map((rec, idx) => {
              const priorityPct = Math.round(rec.priority_score * 100);
              const masteryPct = Math.round(rec.mastery_probability * 100);
              
              const actionStyle = (type) => {
                switch (type) {
                  case 'FOUNDATION':
                  case 'CATCH_UP':
                    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' };
                  case 'RETEACH':
                    return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' };
                  case 'PRACTICE':
                    return { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' };
                  default:
                    return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' };
                }
              };

              const st = actionStyle(rec.action_type);

              return (
                <div 
                  key={rec.id || idx}
                  className="card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${st.color}`,
                    background: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '6px',
                          backgroundColor: st.bg,
                          color: st.color,
                          border: st.border,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Zap size={13} /> Action: {rec.action_type}
                      </span>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          Format: <strong>{rec.recommended_format}</strong>
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {priorityPct}% Priority
                        </span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {rec.subject_name} • {rec.chapter_title}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.35rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                      {rec.concept_name}
                    </h3>
                    
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '0.75rem' }}>
                      Lesson: {rec.lesson_title}
                    </div>

                    {/* Mastery Level Indicator */}
                    <div style={{ 
                      padding: '0.65rem 0.85rem', 
                      backgroundColor: 'var(--bg-card)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)',
                      marginBottom: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Estimated BKT Mastery:</span>
                        <span style={{ fontWeight: 700, color: st.color }}>
                          {masteryPct}% ({rec.mastery_band})
                        </span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${masteryPct}%`, backgroundColor: st.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>

                    {/* Explainable Why Reason */}
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, fontStyle: 'italic', marginBottom: '1.25rem' }}>
                      "{rec.reason}"
                    </p>
                  </div>

                  {/* Card Action Button */}
                  <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link 
                      to={`/student/learning/subject/${rec.subject_name === 'Mathematics' ? 1 : 2}`} 
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                    >
                      Start Recommended Lesson <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Layers size={20} color="var(--primary-500)" /> Enrolled Curriculum Subjects
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {subjects.map(sub => {
          const isComplete = sub.total_modules > 0 && sub.completed_modules === sub.total_modules;
          return (
            <div 
              key={sub.id} 
              className="card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                {/* Subject Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      {sub.code}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {sub.name}
                    </h3>
                  </div>
                  {isComplete ? (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  ) : sub.completed_modules > 0 ? (
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      In Progress
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                      Not Started
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                  {sub.description}
                </p>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress: <strong>{sub.progress_percentage}%</strong></span>
                    <span style={{ fontWeight: 600 }}>{sub.completed_modules} / {sub.total_modules} Modules</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    width: '100%', 
                    backgroundColor: 'var(--slate-200)', 
                    borderRadius: 'var(--radius-full)', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${sub.progress_percentage}%`, 
                      backgroundColor: isComplete ? 'var(--accent-500)' : 'var(--primary-500)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ 
                paddingTop: '0.85rem', 
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-faint)' }}>
                  {sub.average_score > 0 ? `Avg Score: ${sub.average_score}%` : 'No test attempts yet'}
                </div>
                <Link to={`/student/learning/subject/${sub.id}`} className="btn btn-primary btn-sm">
                  View Modules <ArrowRight size={14} />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default StudentLearningPage;
