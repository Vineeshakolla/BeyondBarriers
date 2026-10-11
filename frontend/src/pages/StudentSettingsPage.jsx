import React, { useState, useEffect } from 'react';
import { apiGetProfile, apiUpdateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useVoiceAgent } from '../context/VoiceContext';
import {
  Sliders, Globe, Volume2, Eye, CheckCircle2,
  AlertCircle, Save, ArrowLeft, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentSettingsPage = () => {
  const { user } = useAuth();
  const {
    voiceSettings,
    updateVoiceSettings,
    availableVoices,
    registerPageSummary,
    speakText
  } = useVoiceAgent();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [language, setLanguage] = useState('en');
  const [responseFormat, setResponseFormat] = useState('visual');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const res = await apiGetProfile();
      setLoading(false);

      if (res.ok && res.data) {
        const p = res.data.profile || {};
        setLanguage(p.preferred_language || 'en');
        setResponseFormat(p.preferred_response_format || 'visual');
      }

      setSpeechRate(voiceSettings.speechRate || 1.0);
      setSpeechPitch(voiceSettings.speechPitch || 1.0);
      setSpeechVolume(voiceSettings.speechVolume || 1.0);
      setSelectedVoice(voiceSettings.voiceName || '');

      registerPageSummary(
        '/student/settings',
        'Student Settings and Display Preferences. Customize language, preferred response format, and voice speech rate.'
      );
    };

    fetchSettings();
  }, [voiceSettings, registerPageSummary]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Update Profile in backend
    const res = await apiUpdateProfile({
      preferred_language: language,
      preferred_response_format: responseFormat
    });

    // 2. Update Voice/Display in VoiceContext
    updateVoiceSettings({
      speechRate: parseFloat(speechRate),
      speechPitch: parseFloat(speechPitch),
      speechVolume: parseFloat(speechVolume),
      voiceName: selectedVoice
    });

    setSaving(false);

    if (res.ok) {
      setSuccessMsg('Settings and preferences saved successfully.');
      speakText('Your settings have been saved.', { interrupt: true, isAcknowledgement: true });
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to save preferences.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem', maxWidth: '780px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/student/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={24} color="var(--primary-500)" />
            Student Settings & Language
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Configure language preferences, sensory response modes, and speech parameters
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--success-50)',
          color: 'var(--success-700)',
          border: '1px solid var(--success-500)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--danger-50)',
          color: 'var(--danger-700)',
          border: '1px solid var(--danger-500)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        
        {/* Language & Content Preference */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={16} color="var(--primary-500)" />
              Language & Presentation Formats
            </h2>
            <p className="card-subtitle">Select primary learning language and modality</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pref-lang">
                Preferred Interface Language
              </label>
              <select
                id="pref-lang"
                className="form-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English (Default)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="regional">Regional / Multilingual Assistance</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pref-format">
                Preferred Sensory Response Format
              </label>
              <select
                id="pref-format"
                className="form-input"
                value={responseFormat}
                onChange={(e) => setResponseFormat(e.target.value)}
              >
                <option value="visual">Visual (Diagrams, Charts, Text)</option>
                <option value="text">Text (Clear Typographic Content)</option>
                <option value="audio">Audio (Voice Agent Aloud & Audio Lessons)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Speech Synthesis Voice Settings */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={16} color="var(--primary-500)" />
              Voice Agent Audio Controls
            </h2>
            <p className="card-subtitle">Fine-tune spoken voice speed, pitch, and voice profile</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Speed Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="rate-slider" style={{ margin: 0 }}>
                  Speech Rate: <strong>{speechRate}x</strong>
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.5x (Slow) to 1.8x (Fast)</span>
              </div>
              <input
                id="rate-slider"
                type="range"
                min="0.5"
                max="1.8"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Voice Pitch */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="pitch-slider" style={{ margin: 0 }}>
                  Pitch Tone: <strong>{speechPitch}</strong>
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.5 (Low) to 1.5 (High)</span>
              </div>
              <input
                id="pitch-slider"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* System Voice Selection */}
            {availableVoices.length > 0 && (
              <div className="form-group">
                <label className="form-label" htmlFor="voice-select">
                  System Voice Persona
                </label>
                <select
                  id="voice-select"
                  className="form-input"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  <option value="">Browser Default Voice</option>
                  {availableVoices.map((v, idx) => (
                    <option key={idx} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/student/accessibility" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Eye size={15} /> Open Accessibility Settings
          </Link>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.65rem 1.25rem' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving Preferences...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

export default StudentSettingsPage;
