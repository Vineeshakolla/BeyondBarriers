import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  apiGetProfile, apiGetProfileOptions, apiGetSubjects, apiUpdateProfile 
} from '../services/api';
import { 
  User, GraduationCap, Eye, Wifi, Laptop, DollarSign, 
  Compass, Sliders, CheckCircle2, AlertCircle, ArrowRight, 
  ArrowLeft, Sparkles, BookOpen, ShieldCheck, Check
} from 'lucide-react';

const ONBOARDING_STEPS = [
  { id: 1, title: 'About You', icon: User, desc: 'Personal details' },
  { id: 2, title: 'Education', icon: GraduationCap, desc: 'Class & Stream' },
  { id: 3, title: 'Access & Tools', icon: Wifi, desc: 'Disabilities & Devices' },
  { id: 4, title: 'Future Goals', icon: Compass, desc: 'Financial & Career' },
  { id: 5, title: 'Preferences', icon: Sliders, desc: 'Format & Language' },
  { id: 6, title: 'Review & Save', icon: CheckCircle2, desc: 'Confirm Profile' }
];

export const StudentOnboardingPage = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [options, setOptions] = useState(null);
  const [previewSubjects, setPreviewSubjects] = useState([]);
  const [fetchingSubjects, setFetchingSubjects] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    roll_code: '',
    class: 'Class 10',
    stream: 'General',
    disability_type: 'none',
    internet_access: 'full',
    device_access: 'personal_laptop',
    income_category: '<3L',
    career_interest: 'Artificial Intelligence',
    preferred_response_format: 'visual',
    preferred_language: 'en'
  });

  // Load profile and options on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const [optRes, profRes] = await Promise.all([
          apiGetProfileOptions(),
          apiGetProfile()
        ]);

        if (optRes.ok && optRes.data) {
          setOptions(optRes.data);
        }

        if (profRes.ok && profRes.data && profRes.data.profile) {
          const p = profRes.data.profile;
          setFormData({
            name: p.name || user?.username || '',
            roll_number: p.roll_number || '',
            roll_code: p.roll_code || '',
            class: p.class || 'Class 10',
            stream: p.stream || 'General',
            disability_type: p.disability_type || 'none',
            internet_access: p.internet_access || 'full',
            device_access: p.device_access || 'personal_laptop',
            income_category: p.income_category || '<3L',
            career_interest: p.career_interest || 'Artificial Intelligence',
            preferred_response_format: p.preferred_response_format || 'visual',
            preferred_language: p.preferred_language || 'en'
          });
          if (profRes.data.subjects) {
            setPreviewSubjects(profRes.data.subjects);
          }
        }
      } catch (err) {
        setError('Failed to load profile setup options.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Dynamically fetch subjects whenever class or stream changes
  useEffect(() => {
    if (!formData.class) return;
    const fetchCurriculum = async () => {
      setFetchingSubjects(true);
      try {
        const res = await apiGetSubjects(formData.class, formData.stream);
        if (res.ok && res.data && res.data.subjects) {
          setPreviewSubjects(res.data.subjects);
        }
      } catch (err) {
        console.error('Failed to resolve subjects', err);
      } finally {
        setFetchingSubjects(false);
      }
    };
    fetchCurriculum();
  }, [formData.class, formData.stream]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // If class changes, adapt stream automatically
      if (field === 'class') {
        next.stream = value === 'Class 10' ? 'General' : 'Science';
      }
      return next;
    });
    // Clear field-specific error
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAccessibilityToggle = (val) => {
    setFormData(prev => {
      if (val === 'none') return { ...prev, disability_type: 'none' };

      const current = prev.disability_type === 'none' ? [] : prev.disability_type.split(',').map(s => s.trim());
      let nextList;
      if (current.includes(val)) {
        nextList = current.filter(item => item !== val);
      } else {
        nextList = [...current, val];
      }
      return {
        ...prev,
        disability_type: nextList.length === 0 ? 'none' : nextList.join(',')
      };
    });
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.name.trim()) errs.name = 'Please provide your full legal name.';
    } else if (step === 2) {
      if (!formData.class) errs.class = 'Please select your current class.';
      if (!formData.stream) errs.stream = 'Please select your academic stream.';
    } else if (step === 3) {
      if (!formData.internet_access) errs.internet_access = 'Internet access selection is required.';
      if (!formData.device_access) errs.device_access = 'Device access selection is required.';
    } else if (step === 4) {
      if (!formData.income_category) errs.income_category = 'Income category is required.';
      if (!formData.career_interest) errs.career_interest = 'Career interest is required.';
    } else if (step === 5) {
      if (!formData.preferred_response_format) errs.preferred_response_format = 'Response format is required.';
      if (!formData.preferred_language) errs.preferred_language = 'Preferred language is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError('');
      setCurrentStep(prev => Math.min(prev + 1, ONBOARDING_STEPS.length));
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setFieldErrors({});

    try {
      const res = await apiUpdateProfile(formData);
      if (res.ok && res.data && res.data.profile) {
        updateUserProfile(res.data.profile);
        navigate('/student/dashboard', { 
          replace: true,
          state: { onboardingCompleted: true }
        });
      } else {
        setError(res.error || 'Failed to save profile. Please verify your inputs.');
        if (res.data?.errors) {
          setFieldErrors(res.data.errors);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred while saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Initializing Onboarding
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Preparing your personalized profile workspace...</p>
        </div>
      </div>
    );
  }

  const selectedDisabilities = formData.disability_type === 'none' 
    ? ['none'] 
    : formData.disability_type.split(',').map(s => s.trim());

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* Top Header Card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-500)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)'
              }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Student Profile Onboarding</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Beyond Barriers personalizes all learning, accessibility, and scholarships from this central profile.
                </p>
              </div>
            </div>
            <span className="badge badge-warning">
              Step {currentStep} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {ONBOARDING_STEPS.map(st => {
              const Icon = st.icon;
              const isDone = st.id < currentStep;
              const isCurrent = st.id === currentStep;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    if (st.id < currentStep) setCurrentStep(st.id);
                  }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.65rem 0.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: isCurrent 
                      ? 'var(--primary-500)' 
                      : isDone 
                        ? 'var(--slate-200)' 
                        : 'var(--bg-surface-elevated)',
                    color: isCurrent ? '#ffffff' : isDone ? 'var(--text-main)' : 'var(--text-faint)',
                    cursor: isDone ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {isDone ? <Check size={14} /> : <Icon size={14} />}
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{st.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-500)', backgroundColor: 'var(--danger-50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertCircle size={20} color="var(--danger-500)" />
              <div style={{ fontSize: '0.9rem', color: 'var(--danger-600)', fontWeight: 600 }}>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* STEP CONTENT CONTAINER */}
        <div className="card" style={{ padding: '2rem' }}>

          {/* STEP 1: ABOUT YOU */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} color="var(--primary-500)" /> Personal Information
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Provide your official school identity details.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-name">
                  Full Name <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  id="student-name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Kavya Patel"
                />
                {fieldErrors.name && (
                  <div style={{ color: 'var(--danger-500)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {fieldErrors.name}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.roll_number || '38'}
                    disabled
                    style={{ backgroundColor: 'var(--slate-100)', color: 'var(--text-muted)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Assigned by institution</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Identifier Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.roll_code || 'CS-038'}
                    disabled
                    style={{ backgroundColor: 'var(--slate-100)', color: 'var(--text-muted)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Cohort tracking code</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION & DYNAMIC SUBJECTS */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={20} color="var(--primary-500)" /> Academic Level & Stream
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Your curriculum subjects are automatically derived from database records based on your selection.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Academic Class <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                  <select
                    className="form-select"
                    value={formData.class}
                    onChange={(e) => handleChange('class', e.target.value)}
                  >
                    {options?.classes?.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Curriculum Stream <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                  <select
                    className="form-select"
                    value={formData.stream}
                    onChange={(e) => handleChange('stream', e.target.value)}
                  >
                    {options?.streams?.[formData.class]?.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Curriculum Preview Card */}
              <div className="card" style={{ backgroundColor: 'var(--slate-50)', border: '1px dashed var(--slate-300)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={16} color="var(--primary-600)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                      Dynamically Resolved Subjects ({formData.class} • {formData.stream})
                    </span>
                  </div>
                  {fetchingSubjects && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Querying DB...</span>
                  )}
                </div>

                {previewSubjects.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No curriculum subjects configured.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {previewSubjects.map(sub => (
                      <div 
                        key={sub.id} 
                        style={{ 
                          padding: '0.65rem 0.85rem', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)' 
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {sub.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Code: <strong>{sub.code}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                  * The backend dynamically queries the subjects database entity. The frontend contains zero hardcoded subject lists.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACCESSIBILITY & RESOURCE ACCESS */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi size={20} color="var(--primary-500)" /> Accessibility Needs & Resource Access
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Select any accessibility accommodations and declare your connectivity environment.
                </p>
              </div>

              {/* Accessibility Selection */}
              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                  Accessibility Needs (Select all that apply)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                  {options?.accessibility?.map(acc => {
                    const isSelected = selectedDisabilities.includes(acc.value);
                    return (
                      <button
                        key={acc.value}
                        type="button"
                        onClick={() => handleAccessibilityToggle(acc.value)}
                        style={{
                          textAlign: 'left',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--primary-700)' : 'var(--text-main)' }}>
                            {acc.label}
                          </span>
                          {isSelected && <CheckCircle2 size={16} color="var(--primary-500)" />}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                          {acc.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Internet Access Selection */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Internet Availability <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                  {options?.internet_access?.map(net => {
                    const isSelected = formData.internet_access === net.value;
                    return (
                      <div
                        key={net.value}
                        onClick={() => handleChange('internet_access', net.value)}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--accent-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--accent-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{net.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {net.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device Access Selection */}
              <div className="form-group">
                <label className="form-label">Device Availability <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                  {options?.device_access?.map(dev => {
                    const isSelected = formData.device_access === dev.value;
                    return (
                      <div
                        key={dev.value}
                        onClick={() => handleChange('device_access', dev.value)}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--warning-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--warning-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{dev.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {dev.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FINANCIAL & CAREER */}
          {currentStep === 4 && (
            <div>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={20} color="var(--primary-500)" /> Financial Context & Career Focus
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Used to automatically match scholarships and construct personalized career roadmaps in later modules.
                </p>
              </div>

              {/* Income Category */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Household Income Category <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {options?.income_category?.map(inc => {
                    const isSelected = formData.income_category === inc.value;
                    return (
                      <div
                        key={inc.value}
                        onClick={() => handleChange('income_category', inc.value)}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{inc.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {inc.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Career Interest */}
              <div className="form-group">
                <label className="form-label">Primary Career Interest <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                  {options?.career_interests?.map(cr => {
                    const isSelected = formData.career_interest === cr.value;
                    return (
                      <button
                        key={cr.value}
                        type="button"
                        onClick={() => handleChange('career_interest', cr.value)}
                        style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--bg-surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cr.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREFERENCES */}
          {currentStep === 5 && (
            <div>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={20} color="var(--primary-500)" /> Platform Preferences
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Choose how content is delivered to you across adaptive modules and communication tools.
                </p>
              </div>

              {/* Preferred Response Format */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Preferred Response Format <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {options?.preferred_response_format?.map(fmt => {
                    const isSelected = formData.preferred_response_format === fmt.value;
                    return (
                      <div
                        key={fmt.value}
                        onClick={() => handleChange('preferred_response_format', fmt.value)}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fmt.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {fmt.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Language */}
              <div className="form-group">
                <label className="form-label">Preferred Language <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  {options?.preferred_language?.map(lng => {
                    const isSelected = formData.preferred_language === lng.value;
                    return (
                      <button
                        key={lng.value}
                        type="button"
                        onClick={() => handleChange('preferred_language', lng.value)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--accent-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--accent-500)' : 'var(--bg-surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{lng.label}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{lng.native}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & SAVE */}
          {currentStep === 6 && (
            <div>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} color="var(--accent-500)" /> Review Your Unified Profile
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Confirm your details below. Once saved, this profile becomes the central source for all modules.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* Academic Card */}
                <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--slate-50)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Identity & Academics
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formData.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {formData.class} • {formData.stream}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Roll: {formData.roll_code || 'CS-038'}
                  </div>
                </div>

                {/* Environment Card */}
                <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--slate-50)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Access & Tools
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Accessibility: <span className="badge badge-info">{formData.disability_type}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>
                    Internet: <strong>{formData.internet_access}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    Device: <strong>{formData.device_access}</strong>
                  </div>
                </div>

                {/* Goals & Preferences */}
                <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--slate-50)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Goals & Format
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Career: <span className="badge badge-warning">{formData.career_interest}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>
                    Income Category: <strong>{formData.income_category}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    Format: <strong>{formData.preferred_response_format}</strong> ({formData.preferred_language.toUpperCase()})
                  </div>
                </div>

                {/* Subjects Preview */}
                <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--slate-50)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Dynamic Subjects ({previewSubjects.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {previewSubjects.map(s => (
                      <span key={s.id} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-100)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <ShieldCheck size={22} color="var(--primary-600)" />
                <div style={{ fontSize: '0.825rem', color: 'var(--primary-700)', lineHeight: 1.4 }}>
                  <strong>Single Central Data Source:</strong> This unified profile will be referenced by all future modules:
                  Adaptive Learning (Step 5), Accessibility Engine (Step 6), Support Priority (Step 7), Scholarships (Step 8), and Career Roadmaps (Step 9).
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '2rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            {currentStep > 1 ? (
              <button 
                type="button" 
                onClick={handleBack} 
                className="btn btn-secondary"
                disabled={saving}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {currentStep < ONBOARDING_STEPS.length ? (
              <button 
                type="button" 
                onClick={handleNext} 
                className="btn btn-primary"
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSaveProfile} 
                className="btn btn-primary"
                disabled={saving}
                style={{ backgroundColor: 'var(--accent-600)', borderColor: 'var(--accent-600)' }}
              >
                {saving ? 'Saving Profile...' : 'Complete Onboarding & Go to Dashboard'}
                <Sparkles size={16} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentOnboardingPage;
