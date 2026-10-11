import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetScholarships } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import { 
  Award, Calendar, CheckCircle2, AlertTriangle, Clock, 
  AlertOctagon, ExternalLink, ArrowLeft, Volume2, ShieldCheck, 
  Search, Info, X, DollarSign, Check, HelpCircle, Sparkles, Filter
} from 'lucide-react';

export const StudentScholarshipsPage = () => {
  const { registerPageSummary, readCurrentPage } = useVoiceAgent();
  const [scholarships, setScholarships] = useState([]);
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // 'all' | 'urgent' | 'open'
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScholarships = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiGetScholarships();
        if (res.ok && res.data) {
          const matched = res.data.scholarships || [];
          const all = res.data.all_opportunities || matched;
          setScholarships(matched);
          setAllOpportunities(all);
          setStudentInfo({
            name: res.data.student_name,
            academicPct: res.data.academic_percentage
          });

          // Register dynamic voice summary built on real student data
          const voiceText = res.data.voice_summary || 
            `Opening Scholarships. Found ${matched.length} matched scholarships for your academic profile.`;
          registerPageSummary('/student/scholarships', voiceText);
        } else {
          setError(res.error || 'Failed to load scholarships.');
        }
      } catch (err) {
        setError('Failed to connect to scholarship service.');
      } finally {
        setLoading(false);
      }
    };

    fetchScholarships();
  }, [registerPageSummary]);

  // Filter list based on tab, search query, and urgency
  const currentList = activeTab === 'matched' ? scholarships : allOpportunities;
  const filteredList = currentList.filter((s) => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (urgencyFilter === 'urgent') {
      return ['due_today', 'closing_tomorrow', 'closing_soon'].includes(s.urgency?.urgency_state);
    }
    if (urgencyFilter === 'open') {
      return s.urgency?.urgency_state === 'open';
    }
    return true;
  });

  // Render Urgency Badge (Never relying on color alone)
  const renderUrgencyBadge = (urgency) => {
    if (!urgency) return null;
    const { urgency_state, urgency_label, icon_name, days_remaining, formatted_deadline, is_expired, aria_label } = urgency;

    let icon = <Calendar size={14} aria-hidden="true" />;
    let badgeClass = 'badge-secondary';
    let text = `${urgency_label || `${days_remaining} days remaining`}`;

    if (urgency_state === 'due_today') {
      icon = <AlertTriangle size={14} aria-hidden="true" />;
      badgeClass = 'badge-danger';
      text = '⚠ Due today';
    } else if (urgency_state === 'closing_tomorrow') {
      icon = <AlertTriangle size={14} aria-hidden="true" />;
      badgeClass = 'badge-danger';
      text = '⚠ 1 day remaining';
    } else if (urgency_state === 'closing_soon') {
      icon = <Clock size={14} aria-hidden="true" />;
      badgeClass = 'badge-warning';
      text = `⏳ Closing Soon — ${days_remaining} days remaining`;
    } else if (is_expired || urgency_state === 'expired') {
      icon = <AlertOctagon size={14} aria-hidden="true" />;
      badgeClass = 'badge-secondary';
      text = 'Expired';
    } else {
      icon = <Calendar size={14} aria-hidden="true" />;
      badgeClass = 'badge-info';
      text = `📅 ${days_remaining} days remaining`;
    }

    return (
      <span 
        className={`badge ${badgeClass}`} 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
        aria-label={aria_label || text}
        title={`Deadline: ${formatted_deadline || 'Unspecified'}`}
      >
        {icon}
        <span>{text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem', display: 'inline-flex', gap: '0.4rem' }}>
            <Clock size={14} className="spin" /> Matching Scholarships
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Evaluating Criteria...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Cross-referencing your academic benchmarks, course stream, and family income limits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" data-voice-content id="voice-readable-content" style={{ paddingTop: '2rem', paddingBottom: '5.5rem' }}>
      
      {/* Top Action & Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/student/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <button 
          type="button" 
          onClick={readCurrentPage} 
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          aria-label="Read active scholarships aloud using Voice Assistant"
        >
          <Volume2 size={16} /> Read Scholarships Aloud
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--accent-50, #f0fdf4) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge badge-success" style={{ marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> Step 8 Verified Opportunities
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
              Scholarships & Financial Aid
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '680px' }}>
              Opportunities deterministically matched against your academic benchmark ({studentInfo?.academicPct || 60}%), 
              socioeconomic bracket, and verified accessibility eligibility.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="card" style={{ padding: '0.75rem 1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                {scholarships.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Matched For You
              </div>
            </div>
            <div className="card" style={{ padding: '0.75rem 1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {allOpportunities.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.25rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'matched' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('matched')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
            aria-label="View scholarships matched for you"
          >
            <Sparkles size={14} /> Matched For You ({scholarships.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
            aria-label="View all active scholarship opportunities"
          >
            <Award size={14} /> All Active Postings ({allOpportunities.length})
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search by title, provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.875rem', height: '38px' }}
              aria-label="Filter scholarships by keyword"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              style={{ fontSize: '0.85rem', height: '38px', padding: '0 0.75rem' }}
              aria-label="Filter by deadline urgency"
            >
              <option value="all">All Deadlines</option>
              <option value="urgent">⚠ Urgent / Closing Soon (≤ 7 days)</option>
              <option value="open">📅 Open Opportunities (&gt; 7 days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Zero Results State */}
      {filteredList.length === 0 && (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Award size={40} style={{ opacity: 0.4 }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No scholarships found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0.35rem auto 1rem' }}>
            {activeTab === 'matched' 
              ? "You currently have no matched scholarships under this filter. Try viewing 'All Active Postings' or clearing the search."
              : "No scholarship postings matched your query criteria."}
          </p>
          {(searchQuery || urgencyFilter !== 'all') && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchQuery(''); setUrgencyFilter('all'); }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Scholarships Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {filteredList.map((s) => {
          const isMatched = s.is_eligible;

          return (
            <div 
              key={s.id} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                borderLeft: isMatched ? '4px solid var(--success-600, #16a34a)' : '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div>
                {/* Header: Target Tags & Urgency Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>
                      {s.eligible_class}
                    </span>
                    {s.eligible_stream && s.eligible_stream !== 'All' && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.725rem' }}>
                        {s.eligible_stream}
                      </span>
                    )}
                    {s.category_requirement && s.category_requirement !== 'All' && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.725rem' }}>
                        {s.category_requirement}
                      </span>
                    )}
                  </div>

                  {renderUrgencyBadge(s.urgency)}
                </div>

                {/* Title & Benefit */}
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.3rem', lineHeight: 1.35 }}>
                  {s.title}
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.825rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                    {s.provider}
                  </div>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.3rem', 
                    fontSize: '0.85rem', 
                    fontWeight: 700,
                    color: 'var(--success-700, #15803d)',
                    background: 'var(--success-50, #f0fdf4)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px'
                  }}>
                    <DollarSign size={13} /> {s.amount || '₹50,000 / year'}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {s.description}
                </p>

                {/* Match Explanation Box */}
                <div style={{ 
                  marginBottom: '1.25rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: isMatched ? 'var(--success-50, #f0fdf4)' : 'var(--bg-surface)',
                  border: isMatched ? '1px solid var(--success-200, #bbf7d0)' : '1px solid var(--border-color)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                    {isMatched ? (
                      <CheckCircle2 size={15} style={{ color: 'var(--success-600)', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <Info size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <strong style={{ color: isMatched ? 'var(--success-800)' : 'var(--text-muted)' }}>
                        {isMatched ? '✓ Match Confirmed: ' : 'Eligibility Status: '}
                      </strong>
                      <span style={{ color: isMatched ? 'var(--success-900)' : 'var(--text-muted)' }}>
                        {s.match_explanation || (isMatched ? 'Eligible on all criteria.' : 'Does not match listed criteria.')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Deadline & Action Buttons */}
              <div style={{
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Min Marks: <strong>{s.min_academic_percentage}%</strong>
                  {s.max_income_limit > 0 && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      | Income: ≤ <strong>₹{intToStr(s.max_income_limit)}</strong>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedScholarship(s)}
                    aria-label={`View detailed criteria for ${s.title}`}
                  >
                    View Details
                  </button>

                  <a 
                    href={s.application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    aria-label={`Apply directly to ${s.title}`}
                  >
                    Apply <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* SCHOLARSHIP DETAILS MODAL                                           */}
      {/* =================================================================== */}
      {selectedScholarship && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-scholarship-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setSelectedScholarship(null)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '620px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              position: 'relative',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-info">{selectedScholarship.eligible_class}</span>
                  {renderUrgencyBadge(selectedScholarship.urgency)}
                </div>
                <h2 id="modal-scholarship-title" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  {selectedScholarship.title}
                </h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-600)', fontWeight: 600, marginTop: '0.2rem' }}>
                  {selectedScholarship.provider}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedScholarship(null)}
                aria-label="Close scholarship details modal"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Benefit Banner */}
            <div style={{
              background: 'var(--success-50, #f0fdf4)',
              border: '1px solid var(--success-200, #bbf7d0)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-800)', fontWeight: 600 }}>
                  AWARD / BENEFIT
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-900)' }}>
                  {selectedScholarship.amount || '₹50,000 / year'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  DEADLINE DATE
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {selectedScholarship.urgency?.formatted_deadline || selectedScholarship.deadline}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Scholarship Overview
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                {selectedScholarship.description}
              </p>
            </div>

            {/* Eligibility Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Eligibility Criteria Checklist
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedScholarship.criteria_breakdown?.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: item.satisfied ? 'var(--bg-surface)' : 'var(--bg-main, #f8fafc)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div>
                      <strong>{item.name}:</strong> Required: <span>{item.required}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Your Profile: {item.student_value}
                      </div>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      {item.satisfied ? (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          <Check size={12} /> Satisfied
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                          Not Met
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Explanation */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: selectedScholarship.is_eligible ? 'var(--success-50)' : 'var(--bg-main)',
              border: selectedScholarship.is_eligible ? '1px solid var(--success-200)' : '1px solid var(--border-color)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <strong>Evaluation Result: </strong>
              <span>{selectedScholarship.match_explanation}</span>
            </div>

            {/* Application Instructions */}
            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Application Instructions:</strong> Ensure your academic marks card and family income certificate are readily available in PDF or scanned format before navigating to the official portal.
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedScholarship(null)}
              >
                Close
              </button>
              <a
                href={selectedScholarship.application_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Apply Direct on Portal <ExternalLink size={15} />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Format large numbers (e.g. 300000 -> 3,00,000)
function intToStr(val) {
  if (!val) return '0';
  return Math.round(val).toLocaleString('en-IN');
}

export default StudentScholarshipsPage;
