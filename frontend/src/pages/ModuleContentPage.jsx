import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetModuleContent, apiGetModuleAttempts, apiGetAILessonPlan } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import DoubtChatbot from '../components/DoubtChatbot';
import { 
  ArrowLeft, BookOpen, CheckCircle2, Sliders, Sparkles, 
  HelpCircle, AlertCircle, ArrowRight, History, Award, Check, Volume2,
  Bot, Compass, Layers, Calendar, CheckSquare
} from 'lucide-react';

export const ModuleContentPage = () => {
  const { moduleId } = useParams();
  const { registerPageSummary, readCurrentPage } = useVoiceAgent();
  const [moduleData, setModuleData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiClasses, setAiClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contentMode, setContentMode] = useState('standard'); // 'light', 'standard', 'detailed'

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError('');
      try {
        const [modRes, attRes, planRes] = await Promise.all([
          apiGetModuleContent(moduleId),
          apiGetModuleAttempts(moduleId),
          apiGetAILessonPlan(moduleId)
        ]);

        if (modRes.ok && modRes.data) {
          const mod = modRes.data.module;
          setModuleData(mod);
          setProgress(modRes.data.progress);
          setTestInfo(modRes.data.test);
          if (mod.adaptive_level) {
            setContentMode(mod.adaptive_level);
          }

          // Build accessible voice summary of this lesson
          const lessonSummary = `Opening Lesson ${mod.module_number}: ${mod.title}. Difficulty level: ${mod.difficulty_level}. Here is the lesson breakdown: ${mod.summary_content}. Instructions: You can study the full lesson, say Start the test to begin the assessment, or click Start Test.`;

          registerPageSummary(`/student/learning/module/${moduleId}`, lessonSummary);
        } else {
          setError(modRes.error || 'Failed to load module content.');
        }

        if (attRes.ok && attRes.data) {
          setAttempts(attRes.data.attempts || []);
        }

        if (planRes.ok && planRes.data) {
          setAiPlan(planRes.data.lesson_plan);
          setAiClasses(planRes.data.related_classes || []);
        }
      } catch (err) {
        setError('Failed to connect to module service.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [moduleId, registerPageSummary]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Loading Study Material
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Preparing adaptive educational content...</p>
        </div>
      </div>
    );
  }

  if (error || !moduleData) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="var(--danger-500)" />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger-600)' }}>
              {error || 'Module not found.'}
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/student/learning" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back to Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = (progress?.status === 'completed');

  return (
    <div className="container" id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Top Navigation */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to={`/student/learning/subject/${moduleData.subject_id}`} className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to {moduleData.subject_name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={readCurrentPage}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Volume2 size={15} /> Explain Lesson
          </button>
          {isCompleted && (
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              <CheckCircle2 size={13} /> Completed (Score: {progress.best_score}%)
            </span>
          )}
          {testInfo && (
            <Link 
              to={`/student/learning/module/${moduleId}/test`} 
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Start Test <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Module Title Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-neutral">{moduleData.subject_name} ({moduleData.subject_code})</span>
          <span className="badge badge-info">Module {moduleData.module_number}</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{moduleData.title}</h1>
      </div>

      {/* ADAPTIVE CONTENT DEPTH SELECTOR BANNER */}
      <div className="card" style={{ 
        marginBottom: '1.75rem', 
        backgroundColor: contentMode === 'detailed' ? 'var(--warning-50)' : contentMode === 'light' ? 'var(--primary-50)' : 'var(--bg-surface)',
        border: `2px solid ${contentMode === 'detailed' ? 'var(--warning-500)' : contentMode === 'light' ? 'var(--primary-500)' : 'var(--border-color)'}`,
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="var(--primary-600)" />
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                Adaptive Learning Depth: <span style={{ textTransform: 'uppercase' }}>{contentMode}</span> Mode
              </span>
              {moduleData.adaptive_level === contentMode && (
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Recommended for you</span>
              )}
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {moduleData.adaptive_reason}
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setContentMode('light')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: contentMode === 'light' ? 'var(--primary-500)' : 'transparent',
                color: contentMode === 'light' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Light / Summary
            </button>
            <button
              type="button"
              onClick={() => setContentMode('standard')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: contentMode === 'standard' ? 'var(--primary-500)' : 'transparent',
                color: contentMode === 'standard' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setContentMode('detailed')}
              style={{
                padding: '0.4rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: contentMode === 'detailed' ? 'var(--warning-500)' : 'transparent',
                color: contentMode === 'detailed' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Detailed / Remediation
            </button>
          </div>
        </div>
      </div>

      {/* Main Educational Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Left Column: Educational Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Overview */}
          <div className="card">
            <div className="card-header flex-between">
              <h2 className="card-title" style={{ fontSize: '1.15rem' }}>1. Overview & Key Points</h2>
              <span className="badge badge-neutral">Quick Summary</span>
            </div>
            <p style={{ fontSize: '0.925rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
              {moduleData.summary_content}
            </p>
          </div>

          {/* Section 2: In-Depth Conceptual Explanation */}
          <div className="card">
            <div className="card-header flex-between">
              <h2 className="card-title" style={{ fontSize: '1.15rem' }}>2. Conceptual Deep Dive & Formulas</h2>
              <span className={`badge ${contentMode === 'detailed' ? 'badge-warning' : 'badge-info'}`}>
                {contentMode === 'detailed' ? 'Expanded In-Depth' : 'Standard View'}
              </span>
            </div>
            <div style={{ 
              fontSize: '0.925rem', 
              lineHeight: 1.7, 
              color: 'var(--text-main)',
              whiteSpace: 'pre-line'
            }}>
              {contentMode === 'light' 
                ? moduleData.summary_content 
                : moduleData.detailed_content}
            </div>
          </div>

          {/* Section 3: AI Lesson Model & Class Suggestions */}
          <div className="card" style={{ borderLeft: '4px solid var(--primary-500)', backgroundColor: 'var(--slate-50)' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={20} color="var(--primary-600)" />
                <h2 className="card-title" style={{ fontSize: '1.15rem' }}>
                  AI Lesson Model & Class Recommender
                </h2>
              </div>
              <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={12} /> AI Assisted
              </span>
            </div>

            {/* AI Suggested Classes related to Subject */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Compass size={16} color="var(--primary-600)" />
                AI Suggested Classes & Grade Alignment for {moduleData.subject_name}:
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {aiClasses.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: item.class === moduleData.class ? 'var(--primary-50)' : 'var(--bg-surface)',
                      border: item.class === moduleData.class ? '2px solid var(--primary-500)' : '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.875rem' }}>{item.class}</strong>
                      <span className={`badge ${item.class === moduleData.class ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                        {item.level_type}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Default Lesson Plan Structure */}
            {aiPlan && (
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                    📋 {aiPlan.title}
                  </h3>
                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    ⏱️ {aiPlan.estimated_duration}
                  </span>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>🎯 Lesson Objectives:</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', marginBottom: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {aiPlan.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>🗺️ Step-by-Step Pacing Roadmap:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {aiPlan.roadmap.map((step) => (
                      <div key={step.step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <span className="badge badge-info" style={{ minWidth: '60px', textAlign: 'center' }}>
                          Step {step.step}
                        </span>
                        <span style={{ fontWeight: 600 }}>{step.phase} ({step.duration}):</span>
                        <span style={{ color: 'var(--text-muted)' }}>{step.focus}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.775rem', color: 'var(--primary-700)', backgroundColor: 'var(--primary-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  💡 {aiPlan.ai_recommendation}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Take Test CTA */}
          {testInfo && (
            <div className="card" style={{ 
              backgroundColor: 'var(--primary-50)', 
              border: '1px solid var(--primary-100)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  Ready to Validate Your Understanding?
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-600)', marginTop: '0.2rem' }}>
                  Take the diagnostic check for this module. Rate your confidence on each question to help the platform adapt your next module.
                </p>
              </div>

              <Link to={`/student/learning/module/${moduleId}/test`} className="btn btn-primary">
                {isCompleted ? 'Retake Test' : 'Start Diagnostic Test'} <ArrowRight size={16} />
              </Link>
            </div>
          )}

        </div>

        {/* Right Column: AI Doubt Assistant, Progress & Attempt History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* AI Doubt Assistant Chatbot */}
          <DoubtChatbot 
            moduleId={moduleId} 
            moduleTitle={moduleData.title} 
            subjectName={moduleData.subject_name} 
          />

          {/* Progress Card */}
          <div className="card">
            <div className="card-header flex-between">
              <h3 className="card-title" style={{ fontSize: '1rem' }}>Module Mastery Status</h3>
              {isCompleted ? (
                <span className="badge badge-success">Completed</span>
              ) : (
                <span className="badge badge-info">In Progress</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Attempts:</span>
                <strong>{progress?.attempts || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Best Score:</span>
                <strong>{progress?.best_score || 0}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Score:</span>
                <strong>{progress?.last_score || 0}%</strong>
              </div>
              {progress?.last_confidence && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Confidence Trend:</span>
                  <span className="badge badge-neutral">{progress.last_confidence}</span>
                </div>
              )}
            </div>
          </div>

          {/* Historical Attempts Table */}
          <div className="card">
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} color="var(--primary-500)" />
                <h3 className="card-title" style={{ fontSize: '1rem' }}>Attempt History</h3>
              </div>
              <span className="badge badge-neutral">{attempts.length} attempts</span>
            </div>

            {attempts.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                No attempts recorded yet. Click 'Start Diagnostic Test' to complete your first attempt.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {attempts.map(att => (
                  <div 
                    key={att.id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700 }}>Attempt #{att.attempt_number}</span>
                      <span className={`badge ${att.score >= 60 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                        {att.score}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <span>Correct: {att.correct_count} / {att.total_questions}</span>
                      <span>Sure: {att.sure_count} • Guess: {att.guessing_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default ModuleContentPage;
