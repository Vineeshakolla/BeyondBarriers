import React, { useState } from 'react';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { 
  Mic, MicOff, Volume2, Pause, Play, Square, RotateCcw, 
  ChevronUp, ChevronDown, Sparkles, AlertCircle
} from 'lucide-react';

export const VoiceAgentBar = () => {
  const {
    isVoiceEligible,
    voiceEnabled,
    agentState,
    lastHeard,
    matchedCommand,
    currentSubtitle,
    micErrorMsg,
    startListening,
    stopListening,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    repeatLastSpeech,
    executeCommand
  } = useVoiceAgent();

  const [expanded, setExpanded] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // 1. SECURITY & ACCESSIBILITY GUARDING:
  // Render ONLY when user is a Student with Visual accessibility AND voiceEnabled is true in settings!
  if (!isVoiceEligible || !voiceEnabled) {
    return null;
  }

  const quickCommands = [
    'Go to Dashboard',
    'Go to My Learning',
    'Go to Attendance',
    'Go to Scholarships',
    'Go to Resources',
    'Go to Career Guidance',
    'Go to Accessibility Settings',
    'Explain Lesson 1',
    'Start the test',
    'Read the question',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Sure',
    'Guessing',
    'Read this page',
    'Pause',
    'Continue',
    'Stop',
    'Repeat',
    'Stop listening'
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      executeCommand(customInput.trim());
      setCustomInput('');
    }
  };

  // Determine State Badge UI (Section D)
  let stateBadge = null;
  switch (agentState) {
    case 'LISTENING':
      stateBadge = (
        <span className="badge badge-warning pulse-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <Mic size={14} /> Listening...
        </span>
      );
      break;
    case 'PROCESSING':
      stateBadge = (
        <span className="badge badge-info pulse-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <Sparkles size={14} /> Processing...
        </span>
      );
      break;
    case 'SPEAKING':
      stateBadge = (
        <span className="badge badge-success pulse-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <Volume2 size={14} /> Speaking...
        </span>
      );
      break;
    case 'PAUSED':
      stateBadge = (
        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <Pause size={14} /> Paused
        </span>
      );
      break;
    case 'NOT_SUPPORTED':
      stateBadge = (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <AlertCircle size={14} /> Not Supported
        </span>
      );
      break;
    case 'ERROR':
      stateBadge = (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
          <AlertCircle size={14} /> {micErrorMsg || 'Error'}
        </span>
      );
      break;
    case 'STOPPED':
      stateBadge = (
        <span className="badge" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)', fontWeight: 800 }}>
          ■ Stopped
        </span>
      );
      break;
    case 'READY':
    default:
      stateBadge = (
        <span className="badge" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)', fontWeight: 800 }}>
          ■ Ready
        </span>
      );
      break;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'var(--bg-surface-elevated, #ffffff)',
        borderTop: '2px solid var(--primary-500, #2563eb)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        fontFamily: 'inherit'
      }}
      aria-label="Student Voice Agent Bottom Controls"
    >
      {/* Subtitle / Live Reading Caption Bar */}
      {currentSubtitle && (
        <div 
          style={{
            backgroundColor: 'var(--slate-900, #0f172a)',
            color: '#f8fafc',
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '60px',
            overflowY: 'auto'
          }}
          aria-live="polite"
        >
          🔊 "{currentSubtitle}"
        </div>
      )}

      {/* Main Persistent Bar */}
      <div 
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '0.75rem 1rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Branding & State Badge + Section D Debug Fields */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-600, #2563eb)' }}>
            <Sparkles size={18} />
            <span>Voice Agent</span>
          </div>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-color, #cbd5e1)' }} />
          
          {stateBadge}

          {/* Section D Required Debugging Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.775rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginLeft: '0.25rem' }}>
            <span>Last heard: <strong style={{ color: 'var(--text-main)' }}>{lastHeard ? `"${lastHeard}"` : '—'}</strong></span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span>Matched command: <code style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700, color: 'var(--primary-700)', fontFamily: 'monospace' }}>{matchedCommand || '—'}</code></span>
          </div>
        </div>

        {/* Center: Contextual Action Button Controls (Section S & W) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* READY / STOPPED / ERROR state: [Start Listening] */}
          {(agentState === 'READY' || agentState === 'STOPPED' || agentState === 'ERROR') && (
            <button
              type="button"
              onClick={startListening}
              className="btn btn-primary"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}
              aria-label="Start Voice Listening"
            >
              <Mic size={16} /> Start Listening
            </button>
          )}

          {/* LISTENING state: [Stop Listening] */}
          {agentState === 'LISTENING' && (
            <button
              type="button"
              onClick={stopListening}
              className="btn btn-warning"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}
              aria-label="Stop Voice Listening"
            >
              <MicOff size={16} /> Stop Listening
            </button>
          )}

          {/* SPEAKING state: [Pause] [Stop] [Repeat] */}
          {agentState === 'SPEAKING' && (
            <>
              <button
                type="button"
                onClick={pauseSpeech}
                className="btn btn-secondary"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Pause Speech"
              >
                <Pause size={15} /> Pause
              </button>
              <button
                type="button"
                onClick={stopSpeech}
                className="btn btn-danger"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Stop Speech"
              >
                <Square size={15} /> Stop
              </button>
              <button
                type="button"
                onClick={repeatLastSpeech}
                className="btn btn-secondary"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Repeat Last Speech"
              >
                <RotateCcw size={15} /> Repeat
              </button>
            </>
          )}

          {/* PAUSED state: [Continue] [Stop] [Repeat] */}
          {agentState === 'PAUSED' && (
            <>
              <button
                type="button"
                onClick={resumeSpeech}
                className="btn btn-primary"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Continue Speech"
              >
                <Play size={15} /> Continue
              </button>
              <button
                type="button"
                onClick={stopSpeech}
                className="btn btn-danger"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Stop Speech"
              >
                <Square size={15} /> Stop
              </button>
              <button
                type="button"
                onClick={repeatLastSpeech}
                className="btn btn-secondary"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                aria-label="Repeat Last Speech"
              >
                <RotateCcw size={15} /> Repeat
              </button>
            </>
          )}
        </div>

        {/* Right: Expandable Quick Command Drawer Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            aria-expanded={expanded}
            aria-label="Toggle Quick Voice Commands Drawer"
          >
            <span>Commands</span>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable Voice Command Chips & Input Drawer */}
      {expanded && (
        <div 
          style={{
            backgroundColor: 'var(--bg-surface, #f8fafc)',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            padding: '1rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div className="container">
            <div style={{ fontSize: '0.775rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Supported Voice Commands (Click to simulate speech):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
              {quickCommands.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => executeCommand(cmd)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  "{cmd}"
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Or type a voice command (e.g. 'Go to Dashboard')..."
                className="input"
                style={{ flex: 1, fontSize: '0.825rem', padding: '0.35rem 0.65rem' }}
                aria-label="Manual Command Input"
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ fontSize: '0.825rem' }}>
                Run Command
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAgentBar;
