import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Percent,
  Receipt,
  FileText,
  ChevronRight
} from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';

function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

export default function ScoreBreakdownModal({
  isOpen,
  onClose,
  data,
  policy,
  onOpenBillBreakdown
}) {
  const { t } = useTranslation();

  if (!isOpen || !data) return null;

  const { hospital, score, estimate, networkInfo } = data;
  const granularScore = Number(score?.granularScore ?? score?.finalScore ?? 0).toFixed(1);
  const finalScoreNum = parseFloat(granularScore);

  // Four scoring pillars
  const coverageFit = Number(score?.coverageFit ?? 70);
  const patientCostFit = Number(score?.patientCostFit ?? 70);
  const hospitalTypeScore = Number(score?.hospitalTypeScore ?? 70);
  const coPayFit = Number(score?.coPayFit ?? 70);

  // Points earned out of their maximum weights
  const coveragePoints = (coverageFit * 0.50).toFixed(1); // 50 max
  const patientCostPoints = (patientCostFit * 0.25).toFixed(1); // 25 max
  const hospitalTypePoints = (hospitalTypeScore * 0.15).toFixed(1); // 15 max
  const coPayPoints = (coPayFit * 0.10).toFixed(1); // 10 max

  // Score tier assessment
  let scoreBadgeColor = '#15803d';
  let scoreBadgeBg = '#f0fdf4';
  let scoreBadgeBorder = '#bbf7d0';
  let scoreStatusText = 'Strong Match — High Cashless & Coverage Fit';

  if (finalScoreNum < 60) {
    scoreBadgeColor = '#b91c1c';
    scoreBadgeBg = '#fef2f2';
    scoreBadgeBorder = '#fecaca';
    scoreStatusText = 'Limited Match — High Out-of-Pocket or Non-Network';
  } else if (finalScoreNum < 78) {
    scoreBadgeColor = '#b45309';
    scoreBadgeBg = '#fffbeb';
    scoreBadgeBorder = '#fde68a';
    scoreStatusText = 'Moderate Match — Partial Coverage or Co-Pay Applicable';
  }

  const networkStatus = networkInfo?.networkStatus || score?.networkStatus || 'unknown';
  const isVerifiedNetwork = networkStatus === 'verified';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog modal-dialog-wide"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', gap: '18px' }}
      >
        {/* Modal Header */}
        <div className="modal-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={22} style={{ color: 'var(--color-primary)' }} />
              <h2 className="modal-title" style={{ fontSize: '20px' }}>
                SehatSure Score Breakdown
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
                {hospital?.hospital_name}
              </span>
              <span className="pill-label" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {hospital?.hospital_type || 'Private'}
              </span>
              <span className="pill-label" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {hospital?.tier || 'Tier 2'}
              </span>
              {hospital?.rating > 0 && (
                <span className="pill-label" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 700 }}>
                  ★ {Number(hospital.rating).toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Big Score Summary Hero */}
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
              Overall Hospital Compatibility
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '38px', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {granularScore}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                / 100 pts
              </span>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '10px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 700,
                background: scoreBadgeBg,
                color: scoreBadgeColor,
                border: `1px solid ${scoreBadgeBorder}`
              }}
            >
              {finalScoreNum >= 80 ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{scoreStatusText}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Active Policy Schedule:</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              {policy?.insurer || 'Retail Floater'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {policy?.planName || policy?.policyType || 'Comprehensive Plan'}
            </div>
          </div>
        </div>

        {/* Four Scoring Pillars (The Points Breakdown) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Score Points Breakdown
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Deterministic 4-Pillar Model
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Pillar 1: Coverage Fit (50%) */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                    Coverage & Network Fit (50% Weight)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    +{coveragePoints}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {' '}/ 50.0 pts
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${coverageFit}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                {isVerifiedNetwork
                  ? 'Verified Network Hospital: Eligible for cashless admission and seamless TPA pre-authorization under your insurer.'
                  : 'Network status unverified in reference dataset; non-network reimbursement rules and deductible filing apply.'}
              </p>
            </div>

            {/* Pillar 2: Patient Cost Fit (25%) */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                    Patient Out-of-Pocket Fit (25% Weight)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-success)' }}>
                    +{patientCostPoints}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {' '}/ 25.0 pts
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${patientCostFit}%`, height: '100%', background: 'var(--color-success)', borderRadius: '4px' }} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                Measures out-of-pocket exposure. Estimated patient payable is{' '}
                <strong>{formatINR(score?.patientPayable)}</strong> against total estimated procedure cost of{' '}
                <strong>{formatINR(estimate?.totalEstimate)}</strong>.
              </p>
            </div>

            {/* Pillar 3: Hospital Quality & Tier (15%) */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-secondary-teal)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                    Hospital Tier & Infrastructure (15% Weight)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-secondary-teal)' }}>
                    +{hospitalTypePoints}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {' '}/ 15.0 pts
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${hospitalTypeScore}%`, height: '100%', background: 'var(--color-secondary-teal)', borderRadius: '4px' }} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                Accreditation & tier rating ({hospital?.tier || 'Tier 2'}, {hospital?.hospital_type || 'Private'}),
                reflecting facilities, specialty departments, and clinical infrastructure standards.
              </p>
            </div>

            {/* Pillar 4: Co-Pay & Policy Clauses Fit (10%) */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                    Co-Pay & Deductibles Fit (10% Weight)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#b45309' }}>
                    +{coPayPoints}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {' '}/ 10.0 pts
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${coPayFit}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                Evaluates compliance with room rent caps, policy co-pays ({formatINR(score?.coPayAmount)}),
                and remaining Sum Insured headroom.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Impact Quick Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            padding: '14px',
            background: '#f8fafc',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
              Est. Total Cost
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              {formatINR(estimate?.totalEstimate)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#15803d' }}>
              Est. Insurer Share
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              {formatINR(score?.insurerEstimatedShare)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#b91c1c' }}>
              Est. Patient Payable
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
              {formatINR(score?.patientPayable)}
            </div>
          </div>
        </div>

        {/* Explanatory Formula Note */}
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4, background: '#f1f5f9', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
          <strong>Formula:</strong> (0.50 × Coverage) + (0.25 × Cost Fit) + (0.15 × Hospital Tier) + (0.10 × Co-Pay) = <strong>{granularScore} / 100</strong>.
          {' '}This score reflects financial and insurance compatibility with your policy clauses; it is not a clinical accreditation.
        </div>

        {/* Modal Action Buttons */}
        <div className="modal-actions" style={{ marginTop: '4px' }}>
          {onOpenBillBreakdown && (
            <button
              type="button"
              className="pill-btn pill-btn-ghost pill-btn-sm"
              onClick={() => {
                onClose();
                onOpenBillBreakdown();
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Receipt size={14} />
              <span>View Itemized Bill Breakdown</span>
            </button>
          )}

          <button
            type="button"
            className="pill-btn pill-btn-primary pill-btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
