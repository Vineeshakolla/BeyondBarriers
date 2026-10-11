import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  apiGetProfile, apiGetProfileOptions, apiGetSubjects, apiUpdateProfile 
} from '../services/api';
import { 
  User, GraduationCap, Eye, Wifi, Laptop, DollarSign, 
  Compass, Sliders, CheckCircle2, AlertCircle, Save, 
  ArrowLeft, BookOpen, ShieldCheck, Sparkles 
} from 'lucide-react';

export const StudentProfilePage = () => {
  const { user, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
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
    preferred_language: 'en',
    is_profile_completed: false
  });

  // Load profile and options on mount
  useEffect(() => {
    const loadProfileData = async () => {
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
            name: p.name || '',
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
            preferred_language: p.preferred_language || 'en',
            is_profile_completed: Boolean(p.is_profile_completed)
          });
          if (profRes.data.subjects) {
            setPreviewSubjects(profRes.data.subjects);
          }
        }
      } catch (err) {
        setError('Failed to load student profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Dynamically update subjects whenever class or stream changes
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
        console.error('Failed to query subjects from backend', err);
      } finally {
        setFetchingSubjects(false);
      }
    };
    fetchCurriculum();
  }, [formData.class, formData.stream]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'class') {
        next.stream = value === 'Class 10' ? 'General' : 'Science';
      }
      return next;
    });
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    setSuccessMessage('');
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
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    setSuccessMessage('');

    try {
      const res = await apiUpdateProfile(formData);
      if (res.ok && res.data && res.data.profile) {
        updateUserProfile(res.data.profile);
        setFormData(prev => ({
          ...prev,
          ...res.data.profile,
          is_profile_completed: Boolean(res.data.profile.is_profile_completed)
        }));
        if (res.data.subjects) {
          setPreviewSubjects(res.data.subjects);
        }
        setSuccessMessage('Student profile updated and persisted successfully.');
      } else {
        setError(res.error || 'Failed to update profile. Please verify required fields.');
        if (res.data?.errors) {
          setFieldErrors(res.data.errors);
        }
      }
    } catch (err) {
      setError('An unexpected network or server error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Loading Profile
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving your unified student profile from database...</p>
        </div>
      </div>
    );
  }

  const selectedDisabilities = formData.disability_type === 'none' 
    ? ['none'] 
    : formData.disability_type.split(',').map(s => s.trim());

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
                <ArrowLeft size={14} /> Dashboard
              </Link>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Student Profile</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
              Central unified profile driving personalized learning, accessibility, resources, scholarships, and career roadmaps.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {formData.is_profile_completed ? (
              <span className="badge badge-success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                <CheckCircle2 size={13} /> Unified Profile Active
              </span>
            ) : (
              <span className="badge badge-warning" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                <AlertCircle size={13} /> Onboarding Incomplete
              </span>
            )}
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-500)', backgroundColor: 'var(--accent-50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={20} color="var(--accent-500)" />
              <div style={{ fontSize: '0.9rem', color: 'var(--accent-600)', fontWeight: 600 }}>
                {successMessage}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
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

        <form onSubmit={handleSubmit}>

          {/* SECTION 1: PERSONAL INFORMATION */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="var(--primary-500)" />
                <h2 className="card-title">1. Personal Information</h2>
              </div>
              <span className="badge badge-neutral">Identity Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">
                  Full Name <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
                {fieldErrors.name && (
                  <div style={{ color: 'var(--danger-500)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {fieldErrors.name}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Roll Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.roll_number}
                  disabled
                  style={{ backgroundColor: 'var(--slate-100)', color: 'var(--text-muted)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Institutionally assigned ID</span>
              </div>

              <div className="form-group">
                <label className="form-label">Roll Identifier Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.roll_code}
                  disabled
                  style={{ backgroundColor: 'var(--slate-100)', color: 'var(--text-muted)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Mentor tracking cohort</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC INFORMATION & DYNAMIC SUBJECTS */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={18} color="var(--primary-500)" />
                <h2 className="card-title">2. Academic Information</h2>
              </div>
              <span className="badge badge-info">Curriculum Binding</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Determines your active subject modules. The frontend queries the database in real time.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Academic Class <span style={{ color: 'var(--danger-500)' }}>*</span></label>
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

            {/* Live Subjects Pills */}
            <div className="card" style={{ backgroundColor: 'var(--slate-50)', border: '1px dashed var(--slate-300)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BookOpen size={15} /> Database-Determined Subjects ({previewSubjects.length})
                </span>
                {fetchingSubjects && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updating...</span>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {previewSubjects.map(sub => (
                  <span 
                    key={sub.id} 
                    className="badge badge-neutral" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-surface)' }}
                  >
                    <strong>{sub.name}</strong> ({sub.code})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: ACCESSIBILITY NEEDS */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} color="var(--primary-500)" />
                <h2 className="card-title">3. Accessibility Requirements</h2>
              </div>
              <span className="badge badge-warning">Inclusive Access</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select any accessibility accommodations. Full accessibility engine (voice, TTS, captions) will activate in Step 6.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
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
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--primary-700)' : 'var(--text-main)' }}>
                        {acc.label}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color="var(--primary-500)" />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {acc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: RESOURCE ACCESS */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wifi size={18} color="var(--primary-500)" />
                <h2 className="card-title">4. Resource & Connectivity Access</h2>
              </div>
              <span className="badge badge-neutral">Resource Pathway</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Internet */}
              <div className="form-group">
                <label className="form-label">Internet Availability <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {options?.internet_access?.map(net => {
                    const isSelected = formData.internet_access === net.value;
                    return (
                      <div
                        key={net.value}
                        onClick={() => handleChange('internet_access', net.value)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--accent-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--accent-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{net.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{net.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device */}
              <div className="form-group">
                <label className="form-label">Device Availability <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {options?.device_access?.map(dev => {
                    const isSelected = formData.device_access === dev.value;
                    return (
                      <div
                        key={dev.value}
                        onClick={() => handleChange('device_access', dev.value)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--warning-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--warning-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{dev.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: FINANCIAL & CAREER */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={18} color="var(--primary-500)" />
                <h2 className="card-title">5. Financial Context & Career Ambition</h2>
              </div>
              <span className="badge badge-info">Future Matching</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Income */}
              <div className="form-group">
                <label className="form-label">Household Income Bracket <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {options?.income_category?.map(inc => {
                    const isSelected = formData.income_category === inc.value;
                    return (
                      <div
                        key={inc.value}
                        onClick={() => handleChange('income_category', inc.value)}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{inc.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Career Interest */}
              <div className="form-group">
                <label className="form-label">Career Interest Area <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {options?.career_interests?.map(cr => {
                    const isSelected = formData.career_interest === cr.value;
                    return (
                      <button
                        key={cr.value}
                        type="button"
                        onClick={() => handleChange('career_interest', cr.value)}
                        style={{
                          padding: '0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--bg-surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {cr.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: PREFERENCES */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} color="var(--primary-500)" />
                <h2 className="card-title">6. Platform Preferences</h2>
              </div>
              <span className="badge badge-neutral">Experience Settings</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Response Format */}
              <div className="form-group">
                <label className="form-label">Preferred Response Format <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {options?.preferred_response_format?.map(fmt => {
                    const isSelected = formData.preferred_response_format === fmt.value;
                    return (
                      <div
                        key={fmt.value}
                        onClick={() => handleChange('preferred_response_format', fmt.value)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fmt.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fmt.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Language */}
              <div className="form-group">
                <label className="form-label">Preferred Language <span style={{ color: 'var(--danger-500)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {options?.preferred_language?.map(lng => {
                    const isSelected = formData.preferred_language === lng.value;
                    return (
                      <button
                        key={lng.value}
                        type="button"
                        onClick={() => handleChange('preferred_language', lng.value)}
                        style={{
                          padding: '0.65rem 0.75rem',
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
                        <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{lng.native}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
            <Link to="/student/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: '160px' }}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
              <Save size={16} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StudentProfilePage;
