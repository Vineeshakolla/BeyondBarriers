import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVoiceAgent } from '../context/VoiceContext';
import { apiGetProfile, apiGetLearningProgress, apiGetAttendance, apiGetSupportPriority } from '../services/api';
import { 
  User, GraduationCap, Eye, Wifi, Laptop, DollarSign, 
  Compass, Sliders, CheckCircle2, ArrowRight, Sparkles, 
  BookOpen, ShieldCheck, AlertCircle, Award, Layers,
  ExternalLink, BarChart3, HelpCircle, Volume2, CalendarCheck,
  ShieldAlert, AlertTriangle, Clock, Mic
} from 'lucide-react';

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const { registerPageSummary, readCurrentPage, isVoiceEligible, voiceEnabled, setVoiceEnabled } = useVoiceAgent();
  const location = useLocation();
  const justCompletedOnboarding = location.state?.onboardingCompleted;

  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [learningMetrics, setLearningMetrics] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [supportData, setSupportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profRes, learnRes, attRes, suppRes] = await Promise.all([
          apiGetProfile(),
          apiGetLearningProgress().catch(() => ({ ok: false })),
          apiGetAttendance().catch(() => ({ ok: false })),
          apiGetSupportPriority().catch(() => ({ ok: false }))
        ]);

        let pData = null;
        let subData = [];
        if (profRes.ok && profRes.data) {
          pData = profRes.data.profile;
          subData = profRes.data.subjects || [];
          setProfile(pData);
          setSubjects(subData);
        } else {
          setError(profRes.error || 'Unable to retrieve student profile.');
        }

        let lMetrics = null;
        if (learnRes.ok && learnRes.data) {
          lMetrics = learnRes.data.metrics;
          setLearningMetrics(lMetrics);
        }

        let aData = null;
        if (attRes.ok && attRes.data) {
          aData = attRes.data;
          setAttendanceData(aData);
        }

        let sData = null;
        if (suppRes.ok && suppRes.data) {
          sData = suppRes.data;
          setSupportData(sData);
        }

        // Build authentic readable summary using actual loaded data
        const studentName = pData?.name || user?.username || 'Student';
        const completedMods = lMetrics?.completed_modules || 0;
        const totalMods = lMetrics?.total_modules || (subData.length * 3);
        const avgScore = Math.round(lMetrics?.average_score || 0);
        const attPct = Math.round(aData?.overall_percentage || 0);
        const subjNames = subData.map((s) => s.name).join(', ') || 'enrolled curriculum';
        const priorityText = sData?.support_priority ? `Academic support status is ${sData.support_priority}.` : '';

        const dashboardSummary = `Opening your Dashboard. Welcome, ${studentName}. Roll code ${pData?.roll_code || 'active'}. You have completed ${completedMods} of ${totalMods} learning modules with an average score of ${avgScore} percent. Your attendance is ${attPct} percent. ${priorityText} You have ${subData.length} enrolled subjects: ${subjNames}. You can say Go to My Learning, Go to Academic Summary, Go to Attendance, or Go to Scholarships.`;

        registerPageSummary('/student/dashboard', dashboardSummary);
      } catch (err) {
        setError('Failed to connect to student service.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [registerPageSummary, user?.username]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Loading Student Hub
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving active curriculum and profile configuration...</p>
        </div>
      </div>
    );
  }

  const p = profile || user?.profile || {};

  return (
    <div className="container" id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      
      {/* Onboarding Success Banner */}
      {justCompletedOnboarding && (
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          backgroundColor: 'var(--accent-50)', 
          borderLeft: '4px solid var(--accent-500)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-600)' }}>
                  Onboarding Completed Successfully!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  Your central student profile is active. All platform modules are now customized to your requirements.
                </p>
              </div>
            </div>
            <Link to="/student/profile" className="btn btn-secondary btn-sm">
              View Full Profile
            </Link>
          </div>
        </div>
      )}

      {/* Voice Assistant Activation Banner (Off by Default for privacy) */}
      {isVoiceEligible && !voiceEnabled && (
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          backgroundColor: 'var(--primary-50)', 
          borderLeft: '4px solid var(--primary-500)',
          padding: '1.15rem 1.35rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mic size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                  Voice Agent Control (OFF by default for Privacy)
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  As a student with Visual accessibility requirements, you can enable the native Web Speech API Voice Agent to control the portal with voice commands and listen to screen content.
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setVoiceEnabled(true)} 
              className="btn btn-primary"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <Mic size={15} /> Enable Voice Agent Now
            </button>
          </div>
        </div>
      )}

      {/* Main Student Header Hero */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
                Welcome, {p.name || user?.username}!
              </h1>
              <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                <CheckCircle2 size={13} /> Unified Profile Active
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
              Roll ID: <strong>{p.roll_code || 'CS-014'}</strong> • Academic Level: <strong>{p.class || 'Class 10'}</strong> ({p.stream || 'General'})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={readCurrentPage} 
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Volume2 size={16} /> Read Dashboard Aloud
            </button>
            <Link to="/student/learning" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={16} /> Go to My Learning
            </Link>
            <Link to="/student/profile" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} /> Edit Profile
            </Link>
          </div>
        </div>

        {/* Quick Profile Metric Badges */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
          gap: '0.75rem', 
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Accessibility</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.15rem', color: 'var(--primary-600)' }}>
              {p.disability_type || 'None'}
            </div>
          </div>

          <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Internet Pathway</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.15rem', textTransform: 'capitalize' }}>
              {p.internet_access || 'Full'}
            </div>
          </div>

          <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Device Access</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.15rem', textTransform: 'capitalize' }}>
              {(p.device_access || 'personal_laptop').replace('_', ' ')}
            </div>
          </div>

          <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Career Interest</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.15rem', color: 'var(--warning-600)' }}>
              {p.career_interest || 'Artificial Intelligence'}
            </div>
          </div>

          <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Format & Lang</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.15rem', textTransform: 'uppercase' }}>
              {p.preferred_response_format || 'Visual'} • {p.preferred_language || 'EN'}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Support Status Compact Widget */}
      {supportData && (
        <div className="card" style={{
          marginBottom: '2rem',
          backgroundColor: supportData.support_priority === 'Needs Support'
            ? 'rgba(239, 68, 68, 0.06)'
            : supportData.support_priority === 'Monitor'
            ? 'rgba(245, 158, 11, 0.06)'
            : 'rgba(16, 185, 129, 0.06)',
          borderLeft: `5px solid ${
            supportData.support_priority === 'Needs Support'
              ? 'var(--danger-500)'
              : supportData.support_priority === 'Monitor'
              ? 'var(--warning-500)'
              : 'var(--accent-500)'
          }`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ marginTop: '0.15rem' }}>
                {supportData.support_priority === 'Needs Support' ? (
                  <AlertTriangle size={22} color="var(--danger-500)" />
                ) : supportData.support_priority === 'Monitor' ? (
                  <Clock size={22} color="var(--warning-500)" />
                ) : (
                  <CheckCircle2 size={22} color="var(--accent-500)" />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Academic Support Signal
                  </h3>
                  <span
                    className={`badge ${
                      supportData.support_priority === 'Needs Support'
                        ? 'badge-danger'
                        : supportData.support_priority === 'Monitor'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}
                    style={{ fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {supportData.support_priority}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '640px' }}>
                  {supportData.reasons && supportData.reasons[0]}
                </p>
              </div>
            </div>

            <Link
              to="/student/academic-summary"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            >
              Detailed Academic Summary <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Grid: Dynamically Resolved Subjects & Next Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Dynamic Subjects Card */}
        <div className="card">
          <div className="card-header flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="var(--primary-500)" />
              <h2 className="card-title">Enrolled Curriculum Subjects</h2>
            </div>
            <Link to="/student/learning" className="badge badge-info" style={{ textDecoration: 'none' }}>
              {subjects.length} Subjects • Open Learning →
            </Link>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Resolved dynamically from the database based on your selected Class ({p.class}) and Stream ({p.stream}).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {subjects.map(sub => (
              <Link 
                key={sub.id}
                to={`/student/learning/subject/${sub.id}`}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                    {sub.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {sub.description}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-neutral" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                    {sub.code}
                  </span>
                  <ArrowRight size={14} color="var(--primary-500)" />
                </div>
              </Link>
            ))}
          </div>

          <div style={{ 
            marginTop: '1.25rem', 
            padding: '0.75rem', 
            backgroundColor: 'var(--accent-50)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--accent-700)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={14} />
            <span>Step 5 Active: Adaptive modules, diagnostic tests, and confidence tracking are fully operational.</span>
          </div>
        </div>

        {/* Platform Personalization Blueprint */}
        <div className="card">
          <div className="card-header flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-500)" />
              <h2 className="card-title">Platform Personalization Pipeline</h2>
            </div>
            <span className="badge badge-success">Step 5 Active</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Every upcoming module connects back to your central profile:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            <Link to="/student/learning" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-50)', border: '1px solid var(--accent-500)' }}>
                <div className="badge badge-success" style={{ minWidth: '70px', justifyContent: 'center' }}>Step 5 Active</div>
                <div style={{ fontSize: '0.825rem' }}>
                  <strong>Adaptive Learning:</strong> Serves modules based on stream ({p.stream}) with "Sure" vs "Guessing" confidence tracking.
                </div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)' }}>
              <div className="badge badge-info" style={{ minWidth: '70px', justifyContent: 'center' }}>Step 6</div>
              <div style={{ fontSize: '0.825rem' }}>
                <strong>Accessibility Engine:</strong> Formats UI for {p.disability_type} needs and applies {p.preferred_response_format} mode.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)' }}>
              <div className="badge badge-info" style={{ minWidth: '70px', justifyContent: 'center' }}>Step 7</div>
              <div style={{ fontSize: '0.825rem' }}>
                <strong>Support Priority Engine:</strong> Combines attendance trends with marks for mentor intervention.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)' }}>
              <div className="badge badge-info" style={{ minWidth: '70px', justifyContent: 'center' }}>Step 8</div>
              <div style={{ fontSize: '0.825rem' }}>
                <strong>Scholarships:</strong> Matches opportunities against income category ({p.income_category}) and class.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)' }}>
              <div className="badge badge-info" style={{ minWidth: '70px', justifyContent: 'center' }}>Step 9</div>
              <div style={{ fontSize: '0.825rem' }}>
                <strong>Career Roadmaps:</strong> 4-stage learning path tailored to {p.career_interest}.
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default StudentDashboardPage;
