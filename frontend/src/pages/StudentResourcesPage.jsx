import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiGetResources } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import { 
  BookOpen, ArrowLeft, Volume2, Square, FileText, Video, 
  ExternalLink, Sparkles, CheckCircle2, Wifi, WifiOff,
  Download, HardDrive, Filter, Search, Headphones, Monitor,
  Sliders, AlertTriangle, Info, Check, ShieldCheck
} from 'lucide-react';

export const StudentResourcesPage = () => {
  const { registerPageSummary, readCurrentPage, speakText, stopSpeech, speakingState } = useVoiceAgent();
  const [resources, setResources] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & State
  const [formatFilter, setFormatFilter] = useState('all');
  const [connectivityFilter, setConnectivityFilter] = useState('all');
  const [downloadableOnly, setDownloadableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Simulation State (Demonstrates offline vs intermittent vs full internet)
  const [simulatedConnectivity, setSimulatedConnectivity] = useState('default');
  const [downloadNotification, setDownloadNotification] = useState('');

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (formatFilter !== 'all') params.format = formatFilter;
      if (connectivityFilter !== 'all') params.connectivity = connectivityFilter;
      if (downloadableOnly) params.downloadable = '1';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGetResources(params);
      if (res.ok && res.data) {
        setResources(res.data.resources || []);
        setStudentProfile(res.data.student_profile || null);

        // Register voice summary
        if (res.data.voice_summary) {
          const spoken = `${res.data.voice_summary} You can say Read resources, Read this resource, Go to Dashboard, or Stop.`;
          registerPageSummary('/student/resources', spoken);
        }
      } else {
        setError(res.error || 'Failed to load educational resources.');
      }
    } catch (err) {
      setError('Failed to connect to resources service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [formatFilter, connectivityFilter, downloadableOnly, searchQuery]);

  // Handle simulated connectivity changes
  const activeConnectivity = useMemo(() => {
    if (simulatedConnectivity !== 'default') {
      return simulatedConnectivity;
    }
    return studentProfile?.internet_access || 'full';
  }, [simulatedConnectivity, studentProfile]);

  // Client-side adjusted rankings if connectivity is simulated
  const displayedResources = useMemo(() => {
    if (simulatedConnectivity === 'default') {
      return resources;
    }
    // Re-score based on simulated connectivity
    return [...resources].sort((a, b) => {
      if (simulatedConnectivity === 'none') {
        // Boost offline friendly + downloadable
        const aScore = (a.access_requirement === 'offline_friendly' && a.is_downloadable ? 40 : 0) + (a.is_downloadable ? 30 : 0);
        const bScore = (b.access_requirement === 'offline_friendly' && b.is_downloadable ? 40 : 0) + (b.is_downloadable ? 30 : 0);
        return bScore - aScore;
      } else if (simulatedConnectivity === 'intermittent') {
        const aScore = (a.access_requirement in ['offline_friendly', 'low_bandwidth'] ? 40 : 15);
        const bScore = (b.access_requirement in ['offline_friendly', 'low_bandwidth'] ? 40 : 15);
        return bScore - aScore;
      }
      return b.suitability_score - a.suitability_score;
    });
  }, [resources, simulatedConnectivity]);

  const handleSimulateDownload = (resource) => {
    setDownloadNotification(`Downloaded "${resource.title}" (${resource.estimated_size_mb} MB) to offline cache. Zero internet required to view.`);
    speakText(`Downloaded ${resource.title}. Available in offline storage.`, { interrupt: true, isAcknowledgement: true });
    setTimeout(() => {
      setDownloadNotification('');
    }, 4500);
  };

  const handleReadResourceAloud = (resource) => {
    const speech = `Reading resource: ${resource.title}. Format is ${resource.format}, file size ${resource.estimated_size_mb} megabytes. ${resource.description}. Suitability: ${resource.explanation}`;
    speakText(speech, { interrupt: true });
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
              <Volume2 size={16} /> Read Resources Aloud
            </button>
          )}
        </div>
      </div>

      {/* Download Notification Toast */}
      {downloadNotification && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          backgroundColor: 'var(--success-50, #ecfdf5)',
          borderColor: 'var(--success-500, #10b981)',
          color: 'var(--success-800, #065f46)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem'
        }}>
          <CheckCircle2 size={20} color="var(--success-600, #059669)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{downloadNotification}</span>
        </div>
      )}

      {/* Header Banner with Profile Connectivity Context */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
              <BookOpen size={14} /> Adaptive Learning Library
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Educational Resources</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Verified textbooks, audio lectures, formula reference cards, and interactive sandboxes automatically adapted to your connectivity and learning preferences.
            </p>
          </div>

          {/* Student Profile Overview Chips */}
          {studentProfile && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.825rem'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Learning Profile
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-neutral">Class: {studentProfile.class}</span>
                <span className={`badge ${activeConnectivity === 'none' ? 'badge-warning' : activeConnectivity === 'intermittent' ? 'badge-info' : 'badge-success'}`}>
                  {activeConnectivity === 'none' ? <WifiOff size={12} /> : <Wifi size={12} />}
                  Connectivity: {activeConnectivity === 'none' ? 'Offline-Only' : activeConnectivity.charAt(0).toUpperCase() + activeConnectivity.slice(1)}
                </span>
                <span className="badge badge-primary">
                  Format: {studentProfile.preferred_response_format ? studentProfile.preferred_response_format.toUpperCase() : 'TEXT'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Connectivity Simulation Bar */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={16} color="var(--primary-600)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Live Connectivity Simulator:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSimulatedConnectivity('default')}
              className={`btn btn-sm ${simulatedConnectivity === 'default' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.775rem' }}
            >
              My Profile Default
            </button>
            <button
              type="button"
              onClick={() => setSimulatedConnectivity('none')}
              className={`btn btn-sm ${simulatedConnectivity === 'none' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <WifiOff size={13} /> Simulate Offline-Only
            </button>
            <button
              type="button"
              onClick={() => setSimulatedConnectivity('intermittent')}
              className={`btn btn-sm ${simulatedConnectivity === 'intermittent' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Wifi size={13} /> Simulate Intermittent
            </button>
            <button
              type="button"
              onClick={() => setSimulatedConnectivity('full')}
              className={`btn btn-sm ${simulatedConnectivity === 'full' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Wifi size={13} /> Simulate Full Speed
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search resources, topics, or formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Format Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Format:</span>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="input"
              style={{ fontSize: '0.825rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="all">All Formats</option>
              <option value="text">Text & PDFs</option>
              <option value="visual">Visual & Illustrated</option>
              <option value="audio">Audio Masterclasses</option>
              <option value="interactive">Interactive Labs</option>
            </select>
          </div>

          {/* Connectivity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Bandwidth:</span>
            <select
              value={connectivityFilter}
              onChange={(e) => setConnectivityFilter(e.target.value)}
              className="input"
              style={{ fontSize: '0.825rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="all">All Requirements</option>
              <option value="offline_friendly">100% Offline Friendly</option>
              <option value="low_bandwidth">Low Bandwidth</option>
              <option value="high_speed">High-Speed Streaming</option>
            </select>
          </div>

          {/* Downloadable Toggle */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={downloadableOnly}
              onChange={(e) => setDownloadableOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Downloadable Only</span>
          </label>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
            <BookOpen size={14} /> Loading Resources
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Tailoring learning materials to your profile...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ borderColor: 'var(--danger-500)', backgroundColor: 'var(--danger-50)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-700)', fontWeight: 700 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        </div>
      )}

      {/* Results Count & Summary Bar */}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{displayedResources.length}</strong> resources adapted for your profile
          </div>
          {activeConnectivity === 'none' && (
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={13} /> Prioritizing zero-internet downloadable materials
            </span>
          )}
        </div>
      )}

      {/* Resources Cards Grid */}
      {!loading && !error && displayedResources.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {displayedResources.map((r) => {
            const isDownloadable = Boolean(r.is_downloadable);
            const isOfflineOptimal = r.connectivity_status === 'optimal';
            const isHighSpeedNotRec = activeConnectivity === 'none' && r.access_requirement === 'high_speed';

            return (
              <div 
                key={r.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: isHighSpeedNotRec 
                    ? '3px solid var(--danger-400, #f87171)' 
                    : isOfflineOptimal 
                    ? '3px solid var(--success-500, #10b981)' 
                    : '3px solid var(--primary-500)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Badges: Format, Connectivity, Suitability */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {/* Format Badge */}
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {r.format === 'audio' && <Headphones size={12} />}
                        {r.format === 'visual' && <Monitor size={12} />}
                        {r.format === 'text' && <FileText size={12} />}
                        {r.format === 'interactive' && <Sliders size={12} />}
                        {r.format}
                      </span>

                      {/* Connectivity Badge */}
                      <span 
                        className={`badge ${r.access_requirement === 'offline_friendly' ? 'badge-success' : r.access_requirement === 'low_bandwidth' ? 'badge-warning' : 'badge-info'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {r.access_requirement === 'offline_friendly' ? '100% Offline' : r.access_requirement === 'low_bandwidth' ? 'Low Data' : 'High Speed'}
                      </span>
                    </div>

                    {/* Suitability Score Gauge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      backgroundColor: r.suitability_score >= 80 ? 'var(--success-50, #ecfdf5)' : 'var(--primary-50)',
                      border: `1px solid ${r.suitability_score >= 80 ? 'var(--success-400, #34d399)' : 'var(--primary-300)'}`,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: r.suitability_score >= 80 ? 'var(--success-700, #047857)' : 'var(--primary-700)'
                    }}>
                      <Sparkles size={12} />
                      {r.suitability_score}% Match
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', lineHeight: 1.35 }}>
                    {r.title}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    {r.subject_name || 'General Curriculum'} • {r.class}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {r.description}
                  </p>

                  {/* Plain Language Suitability Explanation Box */}
                  <div style={{
                    backgroundColor: isHighSpeedNotRec ? 'var(--danger-50, #fef2f2)' : 'var(--bg-surface-elevated, #f9fafb)',
                    border: `1px solid ${isHighSpeedNotRec ? 'var(--danger-200, #fecaca)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1rem',
                    fontSize: '0.775rem',
                    color: isHighSpeedNotRec ? 'var(--danger-800, #991b1b)' : 'var(--text-main)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      <Info size={13} />
                      <span>Recommendation Reason:</span>
                    </div>
                    <span>{r.explanation}</span>
                  </div>

                  {/* Accessibility & Storage Details */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: '0.725rem' }}>
                    {r.has_captions === 1 && (
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check size={11} /> Closed Captions
                      </span>
                    )}
                    {r.has_transcript === 1 && (
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check size={11} /> Verified Transcript
                      </span>
                    )}
                    <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <HardDrive size={11} /> {r.size_note || `${r.estimated_size_mb} MB`}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {/* Listen button */}
                  <button
                    type="button"
                    onClick={() => handleReadResourceAloud(r)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Read resource aloud"
                  >
                    <Volume2 size={13} /> Read Aloud
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Offline Download Button (if downloadable) */}
                    {isDownloadable && (
                      <button
                        type="button"
                        onClick={() => handleSimulateDownload(r)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success-700, #047857)', borderColor: 'var(--success-300, #6ee7b7)' }}
                      >
                        <Download size={13} /> Save Offline
                      </button>
                    )}

                    {/* External Link */}
                    <a
                      href={r.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>Open</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedResources.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Resources Match Your Criteria</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Try clearing filters or adjusting your search keyword to view other educational materials.
          </p>
          <button
            type="button"
            onClick={() => {
              setFormatFilter('all');
              setConnectivityFilter('all');
              setDownloadableOnly(false);
              setSearchQuery('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Clear All Filters
          </button>
        </div>
      )}

    </div>
  );
};

export default StudentResourcesPage;
