import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User as UserIcon,
  Shield,
  Building2,
  Bookmark,
  Trash2,
  ExternalLink,
  LogOut,
  FileText,
  MapPin,
  ArrowRight,
  Plus
} from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/maps';

export default function ProfileModal({
  isOpen,
  onClose,
  activePolicy,
  onSelectPolicy,
  onGoToUpload,
  onSelectHospitalForDiscovery,
  onTrackJourneyWithHospital,
  onDeletePolicy
}) {
  const { user, logout, savedHospitals, userPolicies, toggleSaveHospital, removePolicy } = useAuth();
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' or 'hospitals'
  const [deletingPolicyId, setDeletingPolicyId] = useState(null);
  const [deletedIds, setDeletedIds] = useState(new Set());

  if (!isOpen || !user) return null;

  // Aggregate user policies: any from backend plus current activePolicy if not already present
  const allPolicies = [...(userPolicies || [])].filter(p => !deletedIds.has(p._id));
  if (activePolicy && activePolicy._id && !deletedIds.has(activePolicy._id) && !allPolicies.some(p => p._id === activePolicy._id)) {
    allPolicies.unshift(activePolicy);
  }

  const handleDeletePolicy = async (p, e) => {
    e.stopPropagation();
    const policyName = p.planName || p.insurer || 'this policy';
    if (!window.confirm(`Are you sure you want to delete "${policyName}"? This policy will be permanently removed.`)) {
      return;
    }

    try {
      setDeletingPolicyId(p._id);
      await removePolicy(p._id);
      setDeletedIds(prev => new Set([...prev, p._id]));
      if (onDeletePolicy) {
        onDeletePolicy(p._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete policy.');
    } finally {
      setDeletingPolicyId(null);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handlePolicyCardClick = (p) => {
    if (onSelectPolicy) {
      onSelectPolicy(p);
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="feature-card"
        style={{
          width: '92vw',
          maxWidth: '850px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with User Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                flexShrink: 0
              }}
            >
              {getInitials(user.name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                  {user.name}
                </h2>
                <span className="pill-label" style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857' }}>
                  Verified User
                </span>
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleLogout}
              className="pill-btn pill-btn-ghost"
              style={{ padding: '6px 14px', fontSize: '12.5px', color: '#dc2626', borderColor: '#fca5a5', fontWeight: 600 }}
              title="Sign out of your account"
            >
              <LogOut size={14} style={{ marginRight: '6px' }} />
              Log Out
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: '#f8fafc',
            borderBottom: '1px solid var(--color-border)',
            padding: '6px',
            gap: '10px',
            marginTop: '14px',
            borderRadius: '10px'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '11px 16px',
              border: 'none',
              background: activeTab === 'policies' ? '#ffffff' : 'transparent',
              color: activeTab === 'policies' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === 'policies' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setActiveTab('policies')}
          >
            <Shield size={17} />
            <span>My Policies</span>
            <span style={{
              background: activeTab === 'policies' ? '#eff6ff' : '#e2e8f0',
              color: activeTab === 'policies' ? '#1d4ed8' : '#64748b',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              {allPolicies.length}
            </span>
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '11px 16px',
              border: 'none',
              background: activeTab === 'hospitals' ? '#ffffff' : 'transparent',
              color: activeTab === 'hospitals' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === 'hospitals' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setActiveTab('hospitals')}
          >
            <Bookmark size={17} />
            <span>Saved Hospitals</span>
            <span style={{
              background: activeTab === 'hospitals' ? '#eff6ff' : '#e2e8f0',
              color: activeTab === 'hospitals' ? '#1d4ed8' : '#64748b',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              {savedHospitals.length}
            </span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* TAB 1: POLICIES */}
          {activeTab === 'policies' && (
            <div>
              {allPolicies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-text-secondary)' }}>
                  <FileText size={42} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>No policies loaded yet</div>
                  <p style={{ fontSize: '13.5px', margin: '6px 0 20px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Upload your health insurance policy document to extract sum insured, room rent capping, and cashless hospital empanelment.
                  </p>
                  <button
                    type="button"
                    className="pill-btn pill-btn-primary"
                    onClick={() => {
                      if (onGoToUpload) onGoToUpload();
                      onClose();
                    }}
                  >
                    <Plus size={16} style={{ marginRight: '6px' }} />
                    Upload Policy PDF
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allPolicies.map((p) => {
                    const isCurrent = activePolicy && activePolicy._id === p._id;
                    return (
                      <div
                        key={p._id || p.planName}
                        onClick={() => handlePolicyCardClick(p)}
                        style={{
                          border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: isCurrent ? '#f8fafc' : '#ffffff',
                          borderRadius: '14px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isCurrent ? '0 4px 12px rgba(37, 99, 235, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isCurrent ? 'var(--color-primary)' : 'var(--color-border)';
                          e.currentTarget.style.background = isCurrent ? '#f8fafc' : '#ffffff';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span className="pill-label" style={{ fontSize: '11px', padding: '3px 10px', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>
                              {p.insurer || 'Private Insurer'}
                            </span>
                            {p.policyType && (
                              <span className="pill-label" style={{ fontSize: '11px', padding: '3px 10px' }}>
                                {p.policyType.toUpperCase()}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="pill-label" style={{ fontSize: '11px', padding: '3px 10px', background: '#dcfce7', color: '#166534', fontWeight: 800 }}>
                                Active Selection
                              </span>
                            )}
                          </div>
                          
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.planName || 'Comprehensive Health Cover'}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            <span>Sum Insured: <strong style={{ color: 'var(--color-text)' }}>₹{Number(p.sumInsured || 500000).toLocaleString('en-IN')}</strong></span>
                            {p.roomLimit?.value ? (
                              <span>Room Limit: <strong style={{ color: 'var(--color-text)' }}>₹{Number(p.roomLimit.value).toLocaleString('en-IN')}/day</strong></span>
                            ) : (
                              <span>Room Limit: <strong style={{ color: 'var(--color-text)' }}>No Capping</strong></span>
                            )}
                            {p.coPay?.percentage !== undefined && (
                              <span>Co-Pay: <strong style={{ color: 'var(--color-text)' }}>{p.coPay.percentage}%</strong></span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            className="pill-btn pill-btn-primary pill-btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700,
                              padding: '8px 14px',
                              fontSize: '13px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePolicyCardClick(p);
                            }}
                            title="Open policy coverage summary"
                          >
                            <FileText size={14} />
                            <span>View Summary</span>
                            <ArrowRight size={13} />
                          </button>

                          <button
                            type="button"
                            className="pill-btn pill-btn-ghost pill-btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: '#dc2626',
                              background: '#fff',
                              border: '1px solid #fecaca',
                              padding: '7px 11px',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              cursor: deletingPolicyId === p._id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                              opacity: deletingPolicyId === p._id ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (deletingPolicyId !== p._id) {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.borderColor = '#f87171';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.borderColor = '#fecaca';
                            }}
                            onClick={(e) => handleDeletePolicy(p, e)}
                            disabled={deletingPolicyId === p._id}
                            title="Delete this policy"
                          >
                            <Trash2 size={14} />
                            <span>{deletingPolicyId === p._id ? 'Deleting…' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="pill-btn pill-btn-ghost pill-btn-sm"
                      style={{ fontWeight: 700, padding: '8px 18px' }}
                      onClick={() => {
                        if (onGoToUpload) onGoToUpload();
                        onClose();
                      }}
                    >
                      <Plus size={14} style={{ marginRight: '6px' }} />
                      Upload Another Policy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED HOSPITALS */}
          {activeTab === 'hospitals' && (
            <div>
              {savedHospitals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-text-secondary)' }}>
                  <Building2 size={42} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>No saved hospitals yet</div>
                  <p style={{ fontSize: '13.5px', margin: '6px 0 20px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    While exploring hospitals in Discovery, click the <strong>Save</strong> button on any hospital card to bookmark it for fast access here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
                  {savedHospitals.map((hosp) => (
                    <div
                      key={hosp.hospitalKey || hosp.hospital_name}
                      style={{
                        border: '1px solid var(--color-border)',
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="pill-label" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              {hosp.hospital_type || 'Private'}
                            </span>
                            <span className="pill-label" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              {hosp.segment || 'Standard'}
                            </span>
                            {hosp.fitScore > 0 && (
                              <span className="pill-label" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 800, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                Fit: {Number(hosp.fitScore).toFixed(1)}/100
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSaveHospital(hosp)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '5px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Remove from saved hospitals"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--color-text)', marginTop: '8px' }}>
                          {hosp.hospital_name}
                        </div>
                        <a
                          href={getGoogleMapsUrl({
                            hospital_name: hosp.hospital_name,
                            address: hosp.address,
                            city: hosp.city,
                            latitude: hosp.latitude,
                            longitude: hosp.longitude
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hospital-map-link"
                          style={{ marginTop: '4px', alignItems: 'center' }}
                          title={`Open "${hosp.hospital_name}" in Google Maps`}
                        >
                          <span className="hospital-map-pin-btn" style={{ width: '18px', height: '18px' }}>
                            <MapPin size={11} />
                          </span>
                          <span className="hospital-address-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {hosp.address || hosp.city}
                          </span>
                          <ExternalLink size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
                        </a>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        {onSelectHospitalForDiscovery && (
                          <button
                            type="button"
                            className="pill-btn pill-btn-ghost pill-btn-sm"
                            style={{ flex: 1, fontSize: '12px', padding: '7px 10px', fontWeight: 700 }}
                            onClick={() => {
                              onSelectHospitalForDiscovery(hosp);
                              onClose();
                            }}
                          >
                            <ExternalLink size={13} style={{ marginRight: '5px' }} />
                            Discovery
                          </button>
                        )}
                        {onTrackJourneyWithHospital && (
                          <button
                            type="button"
                            className="pill-btn pill-btn-primary pill-btn-sm"
                            style={{ flex: 1, fontSize: '12px', padding: '7px 10px', fontWeight: 700 }}
                            onClick={() => {
                              onTrackJourneyWithHospital(hosp);
                              onClose();
                            }}
                          >
                            Track Journey
                            <ArrowRight size={13} style={{ marginLeft: '5px' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
