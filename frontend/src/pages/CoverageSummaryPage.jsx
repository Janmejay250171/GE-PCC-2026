import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertOctagon,
  CheckCircle2,
  Building2,
  IndianRupee,
  Percent,
  Users,
  ArrowRight,
  ArrowLeft,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { TIER_1_REQUIRED_FIELDS } from '../types/policy';
import { updatePolicy } from '../services/api';
import ProvenanceBadge from '../components/ProvenanceBadge';

export default function CoverageSummaryPage({
  policy,
  onPolicyConfirmed,
  onBackToUpload
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [activeSnippet, setActiveSnippet] = useState(null);

  const FIELD_LABELS = {
    insurer: t('summary.fields.insurer', 'Insurer Name'),
    policyType: t('summary.fields.policyType', 'Policy Type'),
    sumInsured: t('summary.fields.sumInsured', 'Sum Insured'),
    roomLimit: t('summary.fields.roomRentLimit', 'Room Rent Limit'),
    copay: t('summary.fields.copay', 'Base Co-pay'),
    deductible: t('summary.fields.deductible', 'Deductible'),
    proportionateDeduction: t('summary.fields.proportionateDeduction', 'Proportionate Deduction')
  };

  // Check if policy has missing Tier 1 required items
  const missingTier1Fields = [];
  for (const field of TIER_1_REQUIRED_FIELDS) {
    if (field === 'sumInsured' && policy.policyType === 'esi') {
      continue; // ESI is statutory unlimited cover
    }
    const val = policy[field];
    if (val === null || val === undefined || val === '') {
      missingTier1Fields.push(field);
    }
  }

  const isPolicyValid = missingTier1Fields.length === 0;

  const handleContinue = async () => {
    if (!isPolicyValid || isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const result = await updatePolicy(policy._id, { confirmedByUser: true });
      onPolicyConfirmed(result);
    } catch (err) {
      console.error('Confirmation error:', err);
      setSaveError(err.message || 'Failed to confirm policy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoomLimitText = () => {
    if (!policy.roomLimit) return t('common.unknown');
    if (policy.roomLimit.type === 'amount') {
      return `₹${Number(policy.roomLimit.value).toLocaleString('en-IN')} ${t('common.perDay')}`;
    }
    if (policy.roomLimit.type === 'percent') {
      return `${policy.roomLimit.value}% of Sum Insured ${t('common.perDay')}`;
    }
    if (policy.roomLimit.type === 'category') {
      return String(policy.roomLimit.value);
    }
    if (policy.roomLimit.type === 'none') {
      return t('summary.values.noRoomCap');
    }
    return t('common.unknown');
  };

  const getIcuLimitText = () => {
    if (!policy.icuLimit || policy.icuLimit.type === 'none') {
      return t('summary.values.noIcuCap');
    }
    if (policy.icuLimit.type === 'percent') {
      return `${policy.icuLimit.value}% of Sum Insured ${t('common.perDay')}`;
    }
    if (policy.icuLimit.type === 'amount') {
      return `₹${Number(policy.icuLimit.value).toLocaleString('en-IN')} ${t('common.perDay')}`;
    }
    return String(policy.icuLimit.value);
  };

  const getPolicyTypeLabel = (type) => {
    switch (type) {
      case 'individual':
        return 'Individual Health Insurance';
      case 'floater':
        return 'Family Floater';
      case 'private':
        return 'Retail Private Insurance';
      case 'corporate':
        return 'Corporate Group Plan';
      case 'pmjay':
        return 'Ayushman Bharat PM-JAY';
      case 'esi':
        return 'ESI Statutory Cover';
      default:
        return type || 'Standard Health Insurance';
    }
  };

  return (
    <div className="coverage-summary-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Top back navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="pill-btn pill-btn-ghost pill-btn-sm"
          onClick={onBackToUpload}
        >
          <ArrowLeft size={14} style={{ marginRight: '6px' }} />
          {t('navbar.uploadPolicy')}
        </button>
      </div>

      {/* Header section card */}
      <section className="features" style={{ padding: '36px 32px', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="pill-label">{policy.insurer || 'Health Insurer'}</span>
              <span className="pill-label">{getPolicyTypeLabel(policy.policyType)}</span>
            </div>
            <h1 className="section-heading" style={{ textAlign: 'left', fontSize: '34px', letterSpacing: '-0.02em' }}>
              {policy.insurer || policy.planName || 'Policy Coverage Breakdown'}
            </h1>
            {policy.planName && (
              <div style={{ fontSize: '19px', color: 'var(--color-text)', fontWeight: 600, marginTop: '6px', marginBottom: '14px' }}>
                {policy.planName}
              </div>
            )}
            <div style={{ display: 'flex', gap: '16px 28px', flexWrap: 'wrap', marginTop: '12px', color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
              {policy.policyNumber && <span>Policy #: <strong style={{ color: 'var(--color-text)' }}>{policy.policyNumber}</strong></span>}
              {policy.zone && <span>Zone: <strong style={{ color: 'var(--color-text)' }}>{policy.zone}</strong></span>}
              {policy.networkType && <span>Network: <strong style={{ color: 'var(--color-text)' }}>{policy.networkType}</strong></span>}
            </div>
          </div>

          <div className="summary-header-badge-col">
            {isPolicyValid ? (
              <>
                <span className="pill-label" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', padding: '10px 20px', fontSize: '13px' }}>
                  <CheckCircle2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  {policy.confirmedByUser ? '✓ Verified Policy Terms' : 'AI-Extracted • Ready for Review'}
                </span>
              </>
            ) : (
              <span className="pill-label" style={{ background: '#fdf2f2', color: '#991b1b', borderColor: '#fecaca', padding: '10px 20px', fontSize: '13px' }}>
                <AlertOctagon size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Missing Critical Terms
              </span>
            )}
          </div>
        </div>

        {/* Exclusions Warning Alert */}
        {policy.exclusions && policy.exclusions.length > 0 && (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#991b1b',
              marginTop: '10px'
            }}
          >
            <AlertOctagon size={22} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
              <strong>Policy Treatment Exclusion: </strong>
              Treatments for{' '}
              <strong style={{ textTransform: 'capitalize' }}>{policy.exclusions.join(', ')}</strong> are explicitly
              excluded under your policy schedule. Claims related to these departments are not payable.
            </div>
          </div>
        )}

        {/* Invalid Policy Alert */}
        {!isPolicyValid && (
          <div className="form-alert form-alert-error" style={{ borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
            <AlertOctagon size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '15px' }}>Critical Coverage Clauses Missing from PDF</strong>
              <div style={{ fontSize: '13px', margin: '4px 0 8px' }}>
                The AI document reader could not detect the following required terms from your uploaded schedule:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {missingTier1Fields.map((field) => (
                  <span key={field} className="pill-label" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}>
                    {FIELD_LABELS[field] || field}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="pill-btn pill-btn-primary pill-btn-sm" onClick={onBackToUpload}>
                  Upload another schedule or select a demo policy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confidence transparency notice (P1.2) */}
        {isPolicyValid && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={15} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
            <span>
              <strong>Extraction Provenance:</strong> Review field confidence tags below. Terms marked <em>Document-Stated</em> were extracted directly; terms marked <em>Assumed / Scheme Default</em> reflect standard regulatory models.
            </span>
          </div>
        )}

        {saveError && (
          <div className="form-alert form-alert-error">
            <AlertOctagon size={18} />
            <span>{saveError}</span>
          </div>
        )}
      </section>

      {/* 4 Cards Grid */}
      <div className="coverage-cards-grid">
        {/* CARD 1: Key Financial Limits */}
        <div className="feature-card" style={{ gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="feature-index">FINANCIAL BOUNDS</span>
            <IndianRupee size={20} color="var(--color-text)" />
          </div>

          <h2 className="feature-title">{t('summary.tier1Title')}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="detail-row">
              <span className="detail-label">
                {t('summary.fields.sumInsured')}
                {policy.confidence?.sumInsured && (
                  <span style={{ display: 'block', fontSize: '10px', color: policy.confidence.sumInsured === 'assumed' ? 'var(--color-text-muted)' : '#166534', marginTop: '2px' }}>
                    {policy.confidence.sumInsured === 'assumed' ? 'Scheme Standard' : 'Document-Stated'}
                  </span>
                )}
              </span>
              <span className="detail-value" style={{ fontSize: '18px', fontWeight: 800 }}>
                {policy.policyType === 'esi'
                  ? 'Unlimited (ESI Statutory)'
                  : policy.sumInsured
                    ? `₹${Number(policy.sumInsured).toLocaleString('en-IN')}`
                    : t('common.unknown')}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                {t('summary.fields.roomRentLimit')}
                {policy.confidence?.roomLimit && (
                  <span style={{ display: 'block', fontSize: '10px', color: policy.confidence.roomLimit === 'assumed' ? 'var(--color-text-muted)' : '#166534', marginTop: '2px' }}>
                    {policy.confidence.roomLimit === 'assumed' ? 'Scheme Standard' : 'Document-Stated'}
                  </span>
                )}
                {policy.sourceSnippets?.roomLimit && (
                  <button
                    type="button"
                    style={{ display: 'block', background: 'none', border: 'none', padding: 0, color: 'var(--color-text-secondary)', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', marginTop: '2px' }}
                    onClick={() => setActiveSnippet(policy.sourceSnippets?.roomLimit)}
                  >
                    View text snippet
                  </button>
                )}
              </span>
              <span className="detail-value">{getRoomLimitText()}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                {t('summary.fields.icuLimit')}
                {policy.confidence?.icuLimit && (
                  <span style={{ display: 'block', fontSize: '10px', color: policy.confidence.icuLimit === 'assumed' ? 'var(--color-text-muted)' : '#166534', marginTop: '2px' }}>
                    {policy.confidence.icuLimit === 'assumed' ? 'Standard Policy Cover' : 'Document-Stated'}
                  </span>
                )}
              </span>
              <span className="detail-value">{getIcuLimitText()}</span>
            </div>
          </div>

          {/* Proportionate Deduction Callout */}
          {policy.proportionateDeduction ? (
            <div
              className="form-alert form-alert-error"
              style={{
                borderRadius: 'var(--radius-sm)',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '10px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--color-text-secondary)', marginRight: '6px' }}>
                    {t('summary.fields.proportionateDeduction')}:
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#fee2e2',
                      color: '#991b1b',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Current Status: {t('summary.values.applicable')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Action:</span>
                <button
                  type="button"
                  className="pill-btn pill-btn-sm"
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    height: 'auto',
                    background: '#ffffff',
                    color: '#b91c1c',
                    border: '1.5px solid #f87171',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onClick={async () => {
                    try {
                      const updated = await updatePolicy(policy._id, { proportionateDeduction: false });
                      onPolicyConfirmed(updated);
                    } catch (e) {
                      console.error('Failed to toggle proportionate deduction:', e);
                    }
                  }}
                >
                  Set to Not Applicable
                </button>
              </div>
            </div>
          ) : (
            <div
              className="form-alert form-alert-success"
              style={{
                borderRadius: 'var(--radius-sm)',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '10px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--color-text-secondary)', marginRight: '6px' }}>
                    {t('summary.fields.proportionateDeduction')}:
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Current Status: {t('summary.values.notApplicable')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Action:</span>
                <button
                  type="button"
                  className="pill-btn pill-btn-sm"
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    height: 'auto',
                    background: '#ffffff',
                    color: '#15803d',
                    border: '1.5px solid #86efac',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onClick={async () => {
                    try {
                      const updated = await updatePolicy(policy._id, { proportionateDeduction: true });
                      onPolicyConfirmed(updated);
                    } catch (e) {
                      console.error('Failed to toggle proportionate deduction:', e);
                    }
                  }}
                >
                  Set to Applicable
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: Co-payments & Cost Sharing */}
        <div className="feature-card" style={{ gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="feature-index">OUT-OF-POCKET</span>
            <Percent size={20} color="var(--color-text)" />
          </div>

          <h2 className="feature-title">Cost Sharing & Network</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="detail-row">
              <span className="detail-label">
                Base Co-Payment
                {policy.confidence?.copay && (
                  <span style={{ display: 'block', fontSize: '10px', color: '#166534', marginTop: '2px' }}>
                    {policy.confidence.copay === 'assumed' ? 'Scheme Zero Co-Pay' : 'Document-Stated'}
                  </span>
                )}
              </span>
              <span className="detail-value">
                {policy.copay !== null && policy.copay !== undefined ? `${policy.copay}%` : 'Not specified in document'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                Non-Network Co-Payment
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {policy.nonNetworkCopay !== null && policy.nonNetworkCopay !== undefined ? 'Document-Stated' : 'Unspecified'}
                </span>
              </span>
              <span className="detail-value">
                {policy.nonNetworkCopay !== null && policy.nonNetworkCopay !== undefined
                  ? `${policy.nonNetworkCopay}%`
                  : 'Not specified in document'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                Compulsory Deductible
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {typeof policy.deductible === 'number' ? 'Document-Stated' : 'Unspecified'}
                </span>
              </span>
              <span className="detail-value">
                {typeof policy.deductible === 'number'
                  ? `₹${Number(policy.deductible).toLocaleString('en-IN')}`
                  : 'Not specified in document'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                Cashless Settlement
                <span style={{ display: 'block', fontSize: '10px', color: policy.confidence?.cashlessAvailable === 'assumed' ? 'var(--color-text-muted)' : policy.cashlessAvailable !== null && policy.cashlessAvailable !== undefined ? '#166534' : 'var(--color-text-muted)', marginTop: '2px' }}>
                  {policy.confidence?.cashlessAvailable === 'assumed'
                    ? 'Assumed'
                    : policy.cashlessAvailable !== null && policy.cashlessAvailable !== undefined
                      ? 'Document-Stated'
                      : 'Unspecified'}
                </span>
              </span>
              <span className="detail-value">
                {policy.cashlessAvailable === true
                  ? 'Available at Verified Network Hospitals (Subject to Authorization)'
                  : policy.cashlessAvailable === false
                    ? 'Not Available (Reimbursement Only)'
                    : 'Not specified in document'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                Network Facility Status
                <span style={{ display: 'block', fontSize: '10px', color: policy.confidence?.networkType === 'assumed' ? 'var(--color-text-muted)' : policy.networkType ? '#166534' : 'var(--color-text-muted)', marginTop: '2px' }}>
                  {policy.confidence?.networkType === 'assumed'
                    ? 'Assumed Network'
                    : policy.networkType
                      ? 'Document-Stated'
                      : 'Not Classified'}
                </span>
              </span>
              <span className="detail-value">
                {policy.networkType === 'all-network'
                  ? 'All Network Hospitals'
                  : policy.networkType === 'restricted-network'
                    ? 'Empanelled Network Only'
                    : policy.networkType === 'reimbursement-only'
                      ? 'Reimbursement Only'
                      : 'Standard Hospital Network (Tiering not specified)'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Sub-limits & Waiting Periods */}
        <div className="feature-card" style={{ gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="feature-index">RESTRICTIONS</span>
            <Layers size={20} color="var(--color-text)" />
          </div>

          <h2 className="feature-title">Sub-Limits & Waiting Periods</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="detail-row">
              <span className="detail-label">Procedure Caps</span>
              <span className="detail-value">
                {policy.subLimits && Object.keys(policy.subLimits).length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {Object.entries(policy.subLimits).map(([proc, cap]) => (
                      <span key={proc} className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>
                        {proc}: ₹{Number(cap).toLocaleString('en-IN')}
                      </span>
                    ))}
                  </div>
                ) : (
                  'No disease sub-limits'
                )}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Initial Waiting Period</span>
              <span className="detail-value">{policy.waitingPeriods?.initial || 'Not specified in document'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Pre-Existing Conditions</span>
              <span className="detail-value">{policy.waitingPeriods?.preExisting || 'Not specified in document'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Pre / Post Hospitalization</span>
              <span className="detail-value">
                {policy.preHospitalizationDays || policy.postHospitalizationDays
                  ? `${policy.preHospitalizationDays || '—'}d Pre / ${policy.postHospitalizationDays || '—'}d Post`
                  : 'Not specified in document'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                Restoration Benefit
                <span style={{ display: 'block', fontSize: '10px', color: policy.confidence?.restorationBenefit === 'assumed' ? 'var(--color-text-muted)' : policy.restorationBenefit !== null && policy.restorationBenefit !== undefined ? '#166534' : 'var(--color-text-muted)', marginTop: '2px' }}>
                  {policy.confidence?.restorationBenefit === 'assumed'
                    ? 'Assumed'
                    : policy.restorationBenefit !== null && policy.restorationBenefit !== undefined
                      ? 'Document-Stated'
                      : 'Unspecified'}
                </span>
              </span>
              <span className="detail-value">
                {policy.restorationBenefit === true
                  ? '✓ 100% Sum Insured Restoration'
                  : policy.restorationBenefit === false
                    ? 'Not included'
                    : 'Not specified in document'}
              </span>
            </div>

            {/* Excluded Treatments / Specialties */}
            <div className="detail-row" style={{ alignItems: 'flex-start' }}>
              <span className="detail-label" style={{ color: policy.exclusions && policy.exclusions.length > 0 ? '#991b1b' : 'inherit' }}>
                Excluded Treatments
                <span style={{ display: 'block', fontSize: '10px', color: policy.exclusions && policy.exclusions.length > 0 ? '#b91c1c' : 'var(--color-text-muted)', marginTop: '2px' }}>
                  {policy.exclusions && policy.exclusions.length > 0 ? 'Claims Not Payable' : 'Standard Policy Scope'}
                </span>
              </span>
              <span className="detail-value">
                {policy.exclusions && policy.exclusions.length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {policy.exclusions.map((ex) => (
                      <span
                        key={ex}
                        className="pill-label"
                        style={{
                          fontSize: '11px',
                          padding: '3px 9px',
                          background: '#fef2f2',
                          color: '#991b1b',
                          border: '1.5px solid #fecaca',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}
                      >
                        🚫 {ex}
                      </span>
                    ))}
                    {policy.hasOtherExclusions && (
                      <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
                        + General policy exclusions
                      </span>
                    )}
                  </div>
                ) : (
                  'No specific disease exclusions stated'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: Insured Members & Schedule */}
        <div className="feature-card" style={{ gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="feature-index">POLICYHOLDERS</span>
            <Users size={20} color="var(--color-text)" />
          </div>

          <h2 className="feature-title">Covered Members & Dates</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="detail-row">
              <span className="detail-label">Insurance Company / Insurer</span>
              <span className="detail-value" style={{ fontWeight: 800, color: 'var(--color-text)' }}>
                {policy.insurer || 'Not specified in document'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Insured Persons</span>
              <span className="detail-value">
                {policy.insuredPersons && policy.insuredPersons.length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {policy.insuredPersons.map((p, idx) => (
                      <span key={idx} className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>
                        {p.name} ({p.age}y • {p.relation})
                      </span>
                    ))}
                  </div>
                ) : (
                  'Primary policyholder covered'
                )}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Policy Period</span>
              <span className="detail-value">
                {policy.policyStartDate && policy.policyEndDate
                  ? `${policy.policyStartDate} to ${policy.policyEndDate}`
                  : 'Annual active policy'}
              </span>
            </div>

            {policy.tpa && (
              <div className="detail-row">
                <span className="detail-label">TPA / Administrator</span>
                <span className="detail-value">{policy.tpa}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snippet modal */}
      {activeSnippet && (
        <div className="modal-backdrop" onClick={() => setActiveSnippet(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ fontSize: '18px' }}>Original Document Snippet</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveSnippet(null)}>×</button>
            </div>
            <p style={{ fontStyle: 'italic', color: 'var(--color-text)', lineHeight: 1.6, background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              "{activeSnippet}"
            </p>
            <div className="modal-actions">
              <button type="button" className="pill-btn pill-btn-primary pill-btn-sm" onClick={() => setActiveSnippet(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="strip coverage-action-strip" style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPolicyValid ? (
            <>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('summary.title')}</span>
            </>
          ) : (
            <>
              <AlertOctagon size={18} style={{ color: '#991b1b' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b' }}>Cannot proceed — policy is missing mandatory terms</span>
            </>
          )}
        </div>

        <button
          type="button"
          className="pill-btn pill-btn-primary"
          disabled={!isPolicyValid || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? (
            t('common.loading')
          ) : isPolicyValid ? (
            <>
              {t('summary.confirmButton')} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </>
          ) : (
            t('navbar.uploadPolicy')
          )}
        </button>
      </div>
    </div>
  );
}
