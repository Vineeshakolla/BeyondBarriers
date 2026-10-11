import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  apiGetAdminScholarships, apiCreateAdminScholarship, 
  apiUpdateAdminScholarship, apiToggleScholarshipStatus, 
  apiDeleteAdminScholarship 
} from '../services/api';
import { 
  Award, Calendar, AlertTriangle, Clock, AlertOctagon, 
  Plus, Edit, Trash2, CheckCircle2, XCircle, Search, 
  Filter, DollarSign, ExternalLink, ShieldCheck, X, Check, Eye
} from 'lucide-react';

export const AdminScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, urgent_deadlines: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal States
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | null
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    title: '',
    provider: '',
    description: '',
    amount: '₹50,000 / year',
    eligible_class: 'Class 10',
    eligible_stream: 'All',
    min_academic_percentage: 50.0,
    max_income_limit: 300000.0,
    category_requirement: 'All',
    disability_required: false,
    deadline: '',
    application_url: '',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchScholarships = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetAdminScholarships();
      if (res.ok && res.data) {
        setScholarships(res.data.scholarships || []);
        setStats(res.data.stats || { total: 0, active: 0, inactive: 0, urgent_deadlines: 0 });
      } else {
        setError(res.error || 'Failed to load scholarship postings.');
      }
    } catch (err) {
      setError('Connection error with administration service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  const openCreateModal = () => {
    setFormData(initialForm);
    setFormErrors([]);
    setModalMode('create');
  };

  const openEditModal = (sch) => {
    setSelectedScholarship(sch);
    setFormData({
      title: sch.title || '',
      provider: sch.provider || '',
      description: sch.description || '',
      amount: sch.amount || '₹50,000 / year',
      eligible_class: sch.eligible_class || 'Class 10',
      eligible_stream: sch.eligible_stream || 'All',
      min_academic_percentage: sch.min_academic_percentage ?? 50.0,
      max_income_limit: sch.max_income_limit ?? 300000.0,
      category_requirement: sch.category_requirement || 'All',
      disability_required: Boolean(sch.disability_required),
      deadline: sch.deadline || '',
      application_url: sch.application_url || '',
      is_active: Boolean(sch.is_active)
    });
    setFormErrors([]);
    setModalMode('edit');
  };

  const handleToggleStatus = async (sch) => {
    const newStatus = sch.is_active ? 0 : 1;
    try {
      const res = await apiToggleScholarshipStatus(sch.id, newStatus);
      if (res.ok) {
        setSuccessMsg(`Scholarship '${sch.title}' ${newStatus ? 'activated' : 'deactivated'}.`);
        fetchScholarships();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to update status.');
      }
    } catch {
      setError('Failed to contact server.');
    }
  };

  const handleDelete = async (sch) => {
    if (!window.confirm(`Are you sure you want to delete scholarship posting: "${sch.title}"?`)) {
      return;
    }
    try {
      const res = await apiDeleteAdminScholarship(sch.id);
      if (res.ok) {
        setSuccessMsg(`Scholarship '${sch.title}' removed.`);
        fetchScholarships();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to delete scholarship.');
      }
    } catch {
      setError('Failed to contact server.');
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setSaving(true);

    // Client validation
    const errors = [];
    if (!formData.title.trim()) errors.push('Scholarship title is required.');
    if (!formData.provider.trim()) errors.push('Provider name is required.');
    if (!formData.description.trim()) errors.push('Description is required.');
    if (!formData.deadline.trim()) {
      errors.push('Application deadline is required.');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.deadline.trim())) {
      errors.push('Deadline must be in YYYY-MM-DD format.');
    }
    if (!formData.application_url.trim()) {
      errors.push('Application URL is required.');
    } else if (!/^https?:\/\//i.test(formData.application_url.trim())) {
      errors.push('Application URL must begin with http:// or https://');
    }
    if (formData.min_academic_percentage < 0 || formData.min_academic_percentage > 100) {
      errors.push('Academic percentage must be between 0% and 100%.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      setSaving(false);
      return;
    }

    try {
      let res;
      if (modalMode === 'create') {
        res = await apiCreateAdminScholarship(formData);
      } else if (modalMode === 'edit') {
        res = await apiUpdateAdminScholarship(selectedScholarship.id, formData);
      }

      if (res && res.ok) {
        setSuccessMsg(
          modalMode === 'create' 
            ? 'New scholarship posting successfully published!'
            : 'Scholarship posting successfully updated!'
        );
        setModalMode(null);
        fetchScholarships();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const details = res?.data?.details || [res?.error || 'Failed to save scholarship.'];
        setFormErrors(details);
      }
    } catch {
      setFormErrors(['Server connection error while saving scholarship.']);
    } finally {
      setSaving(false);
    }
  };

  // Render Urgency Badge (Non-color only)
  const renderUrgencyBadge = (urgency) => {
    if (!urgency) return null;
    const { urgency_state, urgency_label, days_remaining, formatted_deadline, is_expired } = urgency;

    let icon = <Calendar size={13} aria-hidden="true" />;
    let badgeClass = 'badge-secondary';
    let text = urgency_label || `${days_remaining} days`;

    if (urgency_state === 'due_today') {
      icon = <AlertTriangle size={13} aria-hidden="true" />;
      badgeClass = 'badge-danger';
      text = '⚠ Due today';
    } else if (urgency_state === 'closing_tomorrow') {
      icon = <AlertTriangle size={13} aria-hidden="true" />;
      badgeClass = 'badge-danger';
      text = '⚠ 1 day remaining';
    } else if (urgency_state === 'closing_soon') {
      icon = <Clock size={13} aria-hidden="true" />;
      badgeClass = 'badge-warning';
      text = `⏳ ${days_remaining} days remaining`;
    } else if (is_expired || urgency_state === 'expired') {
      icon = <AlertOctagon size={13} aria-hidden="true" />;
      badgeClass = 'badge-secondary';
      text = 'Expired';
    } else {
      icon = <Calendar size={13} aria-hidden="true" />;
      badgeClass = 'badge-info';
      text = `📅 ${days_remaining} days`;
    }

    return (
      <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem' }}>
        {icon} <span>{text}</span>
      </span>
    );
  };

  const filteredScholarships = scholarships.filter((s) => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return s.is_active === 1;
    if (statusFilter === 'inactive') return s.is_active === 0;
    return true;
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5.5rem' }}>
      
      {/* Header Banner */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--accent-50, #f8fafc) 100%)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> Administrator Portal • Step 8
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
              Scholarship & Opportunity Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '640px' }}>
              Publish, configure, and manage financial aid programs. Strictly scoped to scholarship domain operations with zero exposure to sensitive student records.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.25rem', fontWeight: 700 }}
          >
            <Plus size={18} /> Post New Scholarship
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <XCircle size={18} /> {error}
        </div>
      )}

      {/* Stats Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Postings
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem' }}>
            {stats.total}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-700)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Opportunities
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.2rem' }}>
            {stats.active}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Inactive / Archived
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats.inactive}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--warning-700, #b45309)', fontWeight: 600, textTransform: 'uppercase' }}>
            Urgent Deadlines (≤ 7d)
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--warning-700, #b45309)', marginTop: '0.2rem' }}>
            {stats.urgent_deadlines}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search postings by title or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', fontSize: '0.875rem', height: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({scholarships.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({stats.active})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive ({stats.inactive})
          </button>
        </div>
      </div>

      {/* Scholarship Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Scholarship & Provider</th>
              <th style={{ padding: '0.85rem 1rem' }}>Benefit Amount</th>
              <th style={{ padding: '0.85rem 1rem' }}>Eligibility Scope</th>
              <th style={{ padding: '0.85rem 1rem' }}>Deadline & Urgency</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredScholarships.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: '0.2rem' }}>
                    {s.title}
                  </div>
                  <div style={{ color: 'var(--primary-600)', fontSize: '0.775rem', fontWeight: 600 }}>
                    {s.provider}
                  </div>
                </td>

                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--success-700)' }}>
                  {s.amount || '₹50,000 / year'}
                </td>

                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{s.eligible_class}</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{s.eligible_stream}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Min: {s.min_academic_percentage}% | Max Inc: ₹{s.max_income_limit ? s.max_income_limit.toLocaleString('en-IN') : 'None'}
                  </div>
                </td>

                <td style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    {renderUrgencyBadge(s.urgency)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.urgency?.formatted_deadline || s.deadline}
                  </div>
                </td>

                <td style={{ padding: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(s)}
                    className={`badge ${s.is_active ? 'badge-success' : 'badge-secondary'}`}
                    style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.65rem' }}
                    title="Click to toggle status"
                  >
                    {s.is_active ? '✓ Active' : '✕ Inactive'}
                  </button>
                </td>

                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(s)}
                      aria-label={`Edit ${s.title}`}
                      style={{ padding: '0.35rem 0.6rem' }}
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(s)}
                      aria-label={`Delete ${s.title}`}
                      style={{ padding: '0.35rem 0.6rem', color: 'var(--danger-600, #dc2626)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =================================================================== */}
      {/* CREATE / EDIT SCHOLARSHIP MODAL                                     */}
      {/* =================================================================== */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-form-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setModalMode(null)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '680px', 
              width: '100%', 
              maxHeight: '92vh', 
              overflowY: 'auto',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 id="modal-form-title" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                {modalMode === 'create' ? 'Post New Scholarship' : 'Edit Scholarship Posting'}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalMode(null)}
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Banners */}
            {formErrors.length > 0 && (
              <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Please address the following errors:</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem' }}>
                  {formErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSaveForm}>
              {/* GROUP 1: Basic Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                  1. Basic Program Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Scholarship Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. National Pre-Matric Merit Scholarship"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        Provider / Organization *
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Ministry of Social Justice"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        Benefit Amount / Grant *
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. ₹50,000 / year"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Description *
                    </label>
                    <textarea
                      className="input"
                      rows="3"
                      placeholder="Summary of scholarship purpose, eligible beneficiary group, and award disbursement details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 2: Eligibility Requirements */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                  2. Eligibility Criteria
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Target Class / Grade
                    </label>
                    <select
                      className="input"
                      value={formData.eligible_class}
                      onChange={(e) => setFormData({ ...formData, eligible_class: e.target.value })}
                    >
                      <option value="Class 10">Class 10</option>
                      <option value="Class 12">Class 12</option>
                      <option value="All">All Grades</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Eligible Stream / Course
                    </label>
                    <select
                      className="input"
                      value={formData.eligible_stream}
                      onChange={(e) => setFormData({ ...formData, eligible_stream: e.target.value })}
                    >
                      <option value="All">All Streams</option>
                      <option value="General">General</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Minimum Academic Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="input"
                      value={formData.min_academic_percentage}
                      onChange={(e) => setFormData({ ...formData, min_academic_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Max Family Income Limit (₹)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      className="input"
                      placeholder="0 for no limit"
                      value={formData.max_income_limit}
                      onChange={(e) => setFormData({ ...formData, max_income_limit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Social Category Requirement
                    </label>
                    <select
                      className="input"
                      value={formData.category_requirement}
                      onChange={(e) => setFormData({ ...formData, category_requirement: e.target.value })}
                    >
                      <option value="All">All Categories</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                      <option value="Disability">Disability</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.disability_required}
                        onChange={(e) => setFormData({ ...formData, disability_required: e.target.checked })}
                      />
                      <span>Designate as Disability Support Fellowship</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* GROUP 3: Application Details & Status */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                  3. Application Details & Publication Status
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Application Deadline (YYYY-MM-DD) *
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Application URL *
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://scholarships.gov.in/..."
                      value={formData.application_url}
                      onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <strong>Publish as Active Scholarship (visible to matched students)</strong>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalMode(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Publish Scholarship' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminScholarshipsPage;
