import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, UserCheck, Users, HeartHandshake } from 'lucide-react';

export const PlaceholderPage = ({ title, role, description, stepPlanned }) => {
  const params = useParams();

  const getRoleBadge = (r) => {
    switch (r) {
      case 'student':
        return <span className="badge badge-info"><UserCheck size={13} /> Student Scope</span>;
      case 'mentor':
        return <span className="badge badge-warning"><Users size={13} /> Mentor Scope</span>;
      case 'parent':
        return <span className="badge badge-success"><HeartHandshake size={13} /> Parent Scope</span>;
      case 'admin':
        return <span className="badge badge-danger"><ShieldCheck size={13} /> Administrator Scope</span>;
      default:
        return <span className="badge badge-info"><Clock size={13} /> Authentication</span>;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Architecture Overview
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div className="card-header flex-between">
          <div>
            <h1 className="card-title" style={{ fontSize: '1.4rem' }}>
              {title} {params.id ? `(ID: ${params.id})` : ''}
            </h1>
            <p className="card-subtitle">{description}</p>
          </div>
          {getRoleBadge(role)}
        </div>

        <div style={{
          backgroundColor: 'var(--slate-50)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <Clock size={16} color="var(--primary-500)" />
            <span>Route Registered & Ready for Implementation</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This placeholder route is scaffolded in <strong>Step 1 (Architecture Foundation)</strong> and will be populated with business logic, database queries, and adaptive features in <strong>{stepPlanned}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-primary">
            View All Routes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
