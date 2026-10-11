import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetSubjectModules } from '../services/api';
import { 
  ArrowLeft, BookOpen, CheckCircle2, Lock, Play, 
  Sparkles, Award, AlertCircle, ArrowRight, ShieldCheck, 
  Sliders, HelpCircle, FileCheck
} from 'lucide-react';

export const SubjectModulesPage = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [finalAssessment, setFinalAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGetSubjectModules(subjectId);
        if (res.ok && res.data) {
          setSubject(res.data.subject);
          setModules(res.data.modules || []);
          setProgress(res.data.progress || null);
          setFinalAssessment(res.data.final_assessment || null);
        } else {
          setError(res.error || 'Failed to load subject modules.');
        }
      } catch (err) {
        setError('Failed to connect to module service.');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Loading Modules
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving course curriculum and adaptive states...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="var(--danger-500)" />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger-600)' }}>
              {error || 'Subject not found.'}
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/student/learning" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back to My Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const regularModules = modules.filter(m => !m.is_final_assessment);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Back Button */}
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/student/learning" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to My Learning
        </Link>
      </div>

      {/* Subject Header Card */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-neutral" style={{ fontWeight: 700 }}>{subject.code}</span>
              <span className="badge badge-info">{subject.class} • {subject.stream}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{subject.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {subject.description}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Curriculum Completion</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-600)' }}>
              {progress?.percentage || 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
              {progress?.completed_count || 0} of {progress?.total_count || 0} Modules Completed
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ 
          height: '8px', 
          width: '100%', 
          backgroundColor: 'var(--slate-200)', 
          borderRadius: 'var(--radius-full)', 
          overflow: 'hidden',
          marginTop: '1.25rem'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${progress?.percentage || 0}%`, 
            backgroundColor: (progress?.percentage === 100) ? 'var(--accent-500)' : 'var(--primary-500)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Modules List */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BookOpen size={20} color="var(--primary-500)" /> Sequential Learning Modules
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {regularModules.map(mod => {
          const isCompleted = (mod.status === 'completed');
          const isInProgress = (mod.status === 'in_progress');
          const isLocked = mod.is_locked;

          return (
            <div 
              key={mod.id} 
              className="card"
              style={{
                borderLeft: isCompleted 
                  ? '4px solid var(--accent-500)' 
                  : isInProgress 
                    ? '4px solid var(--primary-500)' 
                    : isLocked 
                      ? '4px solid var(--slate-300)' 
                      : '4px solid var(--warning-500)',
                opacity: isLocked ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                
                {/* Left: Module Details */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: isCompleted 
                      ? 'var(--accent-50)' 
                      : isInProgress 
                        ? 'var(--primary-50)' 
                        : 'var(--slate-100)',
                    color: isCompleted 
                      ? 'var(--accent-600)' 
                      : isInProgress 
                        ? 'var(--primary-600)' 
                        : 'var(--slate-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}>
                    {isCompleted ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={18} /> : mod.module_number}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                        Module {mod.module_number}
                      </span>
                      
                      {/* Status Badges */}
                      {isCompleted && (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                      {isInProgress && (
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                          <Play size={11} /> In Progress
                        </span>
                      )}
                      {isLocked && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          <Lock size={11} /> Locked
                        </span>
                      )}

                      {/* Adaptive Recommendation Badge */}
                      {!isLocked && (
                        <span 
                          className={`badge ${mod.adaptive_level === 'light' ? 'badge-info' : mod.adaptive_level === 'detailed' ? 'badge-warning' : 'badge-neutral'}`}
                          style={{ fontSize: '0.725rem' }}
                          title={mod.adaptive_reason}
                        >
                          Adaptive: {mod.adaptive_level.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-main)' }}>
                      {mod.title}
                    </h3>

                    {/* Score / Attempts Info */}
                    {mod.attempts > 0 && (
                      <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span>Best Score: <strong>{mod.best_score}%</strong></span>
                        <span>•</span>
                        <span>Attempts: <strong>{mod.attempts}</strong></span>
                        {mod.last_confidence && (
                          <>
                            <span>•</span>
                            <span>Confidence: <strong>{mod.last_confidence}</strong></span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action Button */}
                <div>
                  {isLocked ? (
                    <button className="btn btn-secondary btn-sm" disabled style={{ cursor: 'not-allowed', opacity: 0.6 }}>
                      <Lock size={14} /> Locked
                    </button>
                  ) : (
                    <Link to={`/student/learning/module/${mod.id}`} className="btn btn-primary btn-sm">
                      {isCompleted ? 'Review Content' : 'Study Module'} <ArrowRight size={14} />
                    </Link>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* FINAL COURSE ASSESSMENT CARD */}
      {finalAssessment && (
        <div className="card" style={{ 
          border: `2px solid ${finalAssessment.is_locked ? 'var(--slate-200)' : 'var(--primary-500)'}`,
          backgroundColor: finalAssessment.is_locked ? 'var(--slate-50)' : 'var(--bg-surface)',
          padding: '1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: finalAssessment.is_locked ? 'var(--slate-200)' : 'var(--primary-500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: finalAssessment.is_locked ? 'none' : 'var(--shadow-sm)'
              }}>
                <Award size={24} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Capstone Assessment</span>
                  {finalAssessment.is_locked ? (
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                      <Lock size={11} /> Locked
                    </span>
                  ) : finalAssessment.status === 'completed' ? (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      <CheckCircle2 size={12} /> Passed ({finalAssessment.best_score}%)
                    </span>
                  ) : (
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      Unlocked & Ready
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-main)' }}>
                  {finalAssessment.title}
                </h3>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {finalAssessment.is_locked 
                    ? finalAssessment.unlock_requirement 
                    : 'Comprehensive assessment validating your mastery across all course modules.'}
                </p>
              </div>
            </div>

            <div>
              {finalAssessment.is_locked ? (
                <button className="btn btn-secondary btn-sm" disabled style={{ cursor: 'not-allowed', opacity: 0.6 }}>
                  <Lock size={14} /> Prerequisites Required
                </button>
              ) : (
                <Link to={`/student/learning/module/${finalAssessment.id}`} className="btn btn-primary">
                  {finalAssessment.status === 'completed' ? 'Review Assessment' : 'Take Final Assessment'}
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubjectModulesPage;
