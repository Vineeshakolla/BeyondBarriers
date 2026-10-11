import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetAccessibility, apiUpdateAccessibility } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import { 
  Sliders, ArrowLeft, Volume2, Eye, Sun, Type, 
  Sparkles, CheckCircle2, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';

export const StudentAccessibilityPage = () => {
  const { 
    voiceEnabled,
    setVoiceEnabled,
    voiceSettings, 
    updateVoiceSettings, 
    speakText, 
    registerPageSummary, 
    readCurrentPage,
    availableVoices 
  } = useVoiceAgent();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileAcc, setProfileAcc] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await apiGetAccessibility();
        if (res.ok && res.data) {
          setProfileAcc(res.data.accessibility);

          const fullSummary = `Opening Accessibility Settings. Screen reader and interactive voice assistant are active. High contrast is currently ${voiceSettings.highContrast ? 'enabled' : 'disabled'}. Font scale is set to ${voiceSettings.fontScale}. Colorblind mode is ${voiceSettings.colorblindMode}. You can say High Contrast On, Increase Font, or Go to Dashboard.`;

          registerPageSummary('/student/accessibility', fullSummary);
        }
      } catch (e) {
        console.warn('Failed to load remote accessibility profile:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [registerPageSummary, voiceSettings.highContrast, voiceSettings.fontScale, voiceSettings.colorblindMode]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      if (profileAcc) {
        await apiUpdateAccessibility({
          preferred_response_format: profileAcc.preferred_response_format,
          preferred_language: profileAcc.preferred_language
        });
        setSaveSuccess(true);
        speakText('Accessibility preferences saved successfully.', { interrupt: true, isAcknowledgement: true });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSpeech = () => {
    speakText('Hello! Beyond Voice Assistant is functioning properly at your selected speech rate and pitch.', { interrupt: true });
  };

  return (
    <div className="container" data-voice-content id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '5.5rem' }}>
      
      {/* Navigation */}
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
          <Volume2 size={16} /> Read Settings Aloud
        </button>
      </div>

      {/* Header Banner */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
          <Sliders size={14} /> Universal Design & Inclusivity Center
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Accessibility & Voice Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          Personalize screen reader speech rate, high-contrast modes, font scale, and voice-assisted page reading.
        </p>
      </div>

      {saveSuccess && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--success-50)', borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-700)', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> Accessibility preferences updated and saved!
          </div>
        </div>
      )}

      {/* Grid: Voice Settings & Visual Accommodation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Voice Assistant & TTS Controls */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Volume2 size={18} color="var(--primary-500)" />
            <h2 className="card-title">Voice Assistant & Speech Synthesis</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            
            {/* Voice Agent Enable / Disable Toggle (Off by default for privacy) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '1rem',
              backgroundColor: voiceEnabled ? 'var(--primary-50, #f0f9ff)' : 'var(--bg-surface-elevated)',
              border: `1.5px solid ${voiceEnabled ? 'var(--primary-400)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: voiceEnabled ? 'var(--primary-700)' : 'inherit' }}>
                  Voice Agent Status: [{voiceEnabled ? ' ON ' : ' OFF '}]
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {voiceEnabled 
                    ? 'Voice Agent is active. Click 🎤 Start Listening on the bar to speak.'
                    : 'Voice Agent is OFF by default. Click ON to enable voice navigation and controls.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`btn ${voiceEnabled ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontWeight: 800, padding: '0.5rem 1.25rem' }}
              >
                {voiceEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {/* Auto Read Pages Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>Automatic Page Reading</span>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Automatically read page content when navigating via voice</span>
              </div>
              <input 
                type="checkbox"
                checked={voiceSettings.autoReadPages}
                onChange={(e) => updateVoiceSettings({ autoReadPages: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                aria-label="Toggle Automatic Page Reading"
              />
            </div>

            {/* Speech Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Speech Speed:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{voiceSettings.speechRate}x</span>
              </div>
              <input 
                type="range"
                min="0.7"
                max="1.6"
                step="0.1"
                value={voiceSettings.speechRate}
                onChange={(e) => updateVoiceSettings({ speechRate: parseFloat(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Speech Speed Slider"
              />
            </div>

            {/* Speech Pitch Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Speech Pitch:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{voiceSettings.speechPitch}</span>
              </div>
              <input 
                type="range"
                min="0.8"
                max="1.4"
                step="0.1"
                value={voiceSettings.speechPitch}
                onChange={(e) => updateVoiceSettings({ speechPitch: parseFloat(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Speech Pitch Slider"
              />
            </div>

            {/* Test Voice Button */}
            <button 
              type="button" 
              onClick={handleTestSpeech} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
            >
              <Volume2 size={15} /> Test Speech Synthesis
            </button>
          </div>
        </div>

        {/* Visual Accommodations & Contrast */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} color="var(--primary-500)" />
            <h2 className="card-title">Visual & Display Accommodations</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            
            {/* High Contrast Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>High Contrast Theme</span>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Maximize text & border contrast for low vision</span>
              </div>
              <input 
                type="checkbox"
                checked={voiceSettings.highContrast}
                onChange={(e) => updateVoiceSettings({ highContrast: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                aria-label="Toggle High Contrast Mode"
              />
            </div>

            {/* Dyslexia-Friendly Font Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>Dyslexia-Friendly Typography</span>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Optimized weighted letterforms and wider spacing</span>
              </div>
              <input 
                type="checkbox"
                checked={voiceSettings.dyslexicFont}
                onChange={(e) => updateVoiceSettings({ dyslexicFont: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                aria-label="Toggle Dyslexia-Friendly Font"
              />
            </div>

            {/* Font Scale Buttons */}
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Font Size Scaling:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['100%', '115%', '130%'].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => updateVoiceSettings({ fontScale: scale })}
                    className={`btn btn-sm ${voiceSettings.fontScale === scale ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    {scale === '100%' ? 'Standard (100%)' : scale === '115%' ? 'Large (115%)' : 'Extra Large (130%)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Colorblind Filter Selector */}
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Color Vision Filter (Colorblindness):
              </span>
              <select
                value={voiceSettings.colorblindMode}
                onChange={(e) => updateVoiceSettings({ colorblindMode: e.target.value })}
                className="input-field"
                aria-label="Select Colorblindness Filter"
              >
                <option value="none">Standard Vision (None)</option>
                <option value="protanopia">Protanopia (Red-Blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                <option value="tritanopia">Tritanopia (Blue-Blind)</option>
              </select>
            </div>

          </div>
        </div>

      </div>

      {/* Save Button */}
      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
        >
          {saving ? 'Saving...' : 'Save Accessibility Configuration'}
        </button>
      </div>

    </div>
  );
};

export default StudentAccessibilityPage;
