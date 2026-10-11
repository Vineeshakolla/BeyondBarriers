import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetCareer, apiGetCareerRoleDetail } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import { 
  Compass, ArrowLeft, Volume2, Square, Sparkles, 
  CheckCircle2, Layers, Briefcase, Award, Code,
  Shield, Cpu, BarChart3, ExternalLink, ChevronRight,
  BookOpen, FolderGit2, Check, ArrowRight, UserCheck
} from 'lucide-react';

export const StudentCareerPage = () => {
  const { registerPageSummary, readCurrentPage, speakText, stopSpeech, speakingState } = useVoiceAgent();
  const [careerData, setCareerData] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [steps, setSteps] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [activeTabRoleId, setActiveTabRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial career guidance matching profile
  const fetchCareerData = async (roleId = null) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetCareer(roleId);
      if (res.ok && res.data) {
        setCareerData(res.data);
        setSelectedRole(res.data.role || null);
        setSteps(res.data.steps || []);
        setAllFields(res.data.all_fields || []);
        if (res.data.role?.id) {
          setActiveTabRoleId(res.data.role.id);
        }

        // Register voice summary
        if (res.data.voice_summary) {
          const spoken = `${res.data.voice_summary} You can say Read the roadmap, Read the next step, Go to Dashboard, or Stop.`;
          registerPageSummary('/student/career', spoken);
        }
      } else {
        setError(res.error || 'Failed to load career guidance.');
      }
    } catch (err) {
      setError('Connection error while retrieving career roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareerData();
  }, []);

  // Switch role when student clicks a field or role tab
  const handleSelectRole = async (roleId) => {
    setActiveTabRoleId(roleId);
    setLoading(true);
    try {
      const res = await apiGetCareerRoleDetail(roleId);
      if (res.ok && res.data) {
        setSelectedRole(res.data.role || null);
        setSteps(res.data.steps || []);

        if (res.data.voice_summary) {
          const spoken = `${res.data.voice_summary} You can say Read the roadmap, Read the next step, or Stop.`;
          registerPageSummary('/student/career', spoken);
        }
      }
    } catch (err) {
      console.error('Failed to fetch role detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadStage = (stage) => {
    const speech = `Stage ${stage.stage_order}: ${stage.title}. ${stage.description}. Key competencies: ${stage.key_skills}. Recommended practical projects: ${stage.recommended_projects}.`;
    speakText(speech, { interrupt: true });
  };

  const getFieldIcon = (iconName) => {
    switch (iconName) {
      case 'Cpu': return <Cpu size={16} />;
      case 'Shield': return <Shield size={16} />;
      case 'Code': return <Code size={16} />;
      case 'BarChart3': return <BarChart3 size={16} />;
      default: return <Briefcase size={16} />;
    }
  };

  return (
    <div className="container" data-voice-content id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '6rem' }}>
      
      {/* Navigation & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/student/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {speakingState === 'speaking' ? (
            <button 
              type="button" 
              onClick={() => stopSpeech(true)} 
              className="btn btn-danger btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Square size={14} /> Stop Speech
            </button>
          ) : (
            <button 
              type="button" 
              onClick={readCurrentPage} 
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Volume2 size={16} /> Read Career Roadmap
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50, #f0fdf4) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge badge-warning" style={{ marginBottom: '0.75rem' }}>
              <Compass size={14} /> Structured Career Guidance
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
              Career Pathways & Milestones
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '680px' }}>
              Sequential 4-stage learning roadmaps designed to help you build real skills, develop portfolio projects, and prepare for emerging technical domains.
            </p>
          </div>

          {careerData?.career_interest && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              fontSize: '0.825rem'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Profile Career Interest
              </span>
              <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '0.95rem' }}>
                {careerData.career_interest}
              </span>
            </div>
          )}
        </div>

        {/* Career Domains Explorer Tabs */}
        {allFields.length > 0 && (
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Explore Career Fields & Roles:
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {allFields.map((field) => {
                const primaryRole = field.roles && field.roles.length > 0 ? field.roles[0] : null;
                const isSelected = activeTabRoleId === primaryRole?.id;

                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => primaryRole && handleSelectRole(primaryRole.id)}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.825rem',
                      padding: '0.45rem 0.85rem'
                    }}
                  >
                    {getFieldIcon(field.icon)}
                    <span>{field.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Target Role Overview Card */}
      {selectedRole && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem', borderLeft: '5px solid var(--primary-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                  Target Role
                </span>
                {selectedRole.field_name && (
                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    {selectedRole.field_name}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                {selectedRole.title}
              </h2>
            </div>

            {selectedRole.average_salary_range && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--warning-50, #fefce8)',
                border: '1px solid var(--warning-300, #fde047)',
                fontSize: '0.825rem',
                fontWeight: 700,
                color: 'var(--warning-900, #713f12)'
              }}>
                <Award size={15} color="var(--warning-600)" />
                <span>Industry Salary Estimate: {selectedRole.average_salary_range}</span>
              </div>
            )}
          </div>

          <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {selectedRole.description}
          </p>

          {/* Related Roles & Suggested Learning Areas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            {/* Related Roles Chips */}
            {selectedRole.related_roles_list && selectedRole.related_roles_list.length > 0 && (
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Related Specializations:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {selectedRole.related_roles_list.map((rel, idx) => (
                    <span 
                      key={idx}
                      className="badge badge-neutral"
                      style={{ fontSize: '0.775rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}
                    >
                      <UserCheck size={11} style={{ marginRight: '0.25rem' }} />
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Academic / Learning Areas */}
            {selectedRole.suggested_learning_areas && (
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Core Foundational Subjects:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {selectedRole.suggested_learning_areas.split(',').map((area, idx) => (
                    <span 
                      key={idx}
                      className="badge badge-info"
                      style={{ fontSize: '0.775rem' }}
                    >
                      <BookOpen size={11} style={{ marginRight: '0.25rem' }} />
                      {area.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4-Stage Roadmap Section Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>4-Stage Sequential Roadmap</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Work through each milestone sequentially to build verifiable competencies.
          </p>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {steps.map((st, index) => {
          const learningLinks = st.learning_resources_list || [];

          return (
            <div 
              key={st.id || st.stage_order}
              className="card" 
              style={{ 
                borderLeft: `5px solid ${index === 0 ? 'var(--primary-500)' : index === 1 ? 'var(--info-500, #3b82f6)' : index === 2 ? 'var(--warning-500, #f59e0b)' : 'var(--success-500, #10b981)'}`,
                padding: '1.75rem',
                position: 'relative'
              }}
            >
              {/* Stage Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span 
                    className="badge" 
                    style={{ 
                      fontWeight: 800, 
                      fontSize: '0.8rem',
                      backgroundColor: index === 0 ? 'var(--primary-100)' : index === 1 ? 'var(--info-100, #dbeafe)' : index === 2 ? 'var(--warning-100, #fef3c7)' : 'var(--success-100, #d1fae5)',
                      color: index === 0 ? 'var(--primary-800)' : index === 1 ? 'var(--info-800, #1e40af)' : index === 2 ? 'var(--warning-800, #92400e)' : 'var(--success-800, #065f46)'
                    }}
                  >
                    Stage {st.stage_order}: {st.stage}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{st.title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleReadStage(st)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Read this stage aloud"
                >
                  <Volume2 size={13} /> Listen to Stage
                </button>
              </div>

              {/* Stage Description */}
              <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {st.description}
              </p>

              {/* Skills & Recommended Projects Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-surface-elevated, #f9fafb)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem'
              }}>
                {/* Key Skills */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    <CheckCircle2 size={13} color="var(--primary-600)" />
                    <span>Key Competencies:</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {st.key_skills.split(',').map((skill, sIdx) => (
                      <span key={sIdx} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Practical Projects */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    <FolderGit2 size={13} color="var(--warning-600)" />
                    <span>Recommended Projects:</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.45, fontWeight: 500 }}>
                    {st.recommended_projects}
                  </div>
                </div>
              </div>

              {/* Curated Educational Learning Links */}
              {learningLinks.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Curated Free Educational Resources:
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {learningLinks.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.775rem',
                          padding: '0.35rem 0.65rem'
                        }}
                      >
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', textTransform: 'uppercase' }}>
                          {link.type || 'free'}
                        </span>
                        <span>{link.title}</span>
                        <ExternalLink size={11} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default StudentCareerPage;
