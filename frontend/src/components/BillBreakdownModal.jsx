import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Bed,
  ShieldAlert,
  ArrowDownCircle,
  Loader2,
  MapPin,
  ExternalLink,
  AlertOctagon
} from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/maps';
import { fetchHospitalBreakdown } from '../services/hospitalApi';
import ProvenanceBadge from './ProvenanceBadge';

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

export default function BillBreakdownModal({
  isOpen,
  onClose,
  hospitalName,
  hospitalAddress,
  hospitalSegment,
  hospitalTier,
  hospitalRating,
  hospitalInsurers,
  initialRoomType,
  policyId,
  policy,
  specialty,
  procedure,
  onTrackJourney
}) {
  const { t } = useTranslation();
  const [currentRoom, setCurrentRoom] = useState(initialRoomType || 'General Ward');
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentRoom(initialRoomType || 'General Ward');
    loadBreakdown(initialRoomType || 'General Ward');
  }, [isOpen, initialRoomType, hospitalName, specialty, procedure]);

  const loadBreakdown = async (roomType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHospitalBreakdown({
        policyId,
        policy,
        hospitalName,
        hospitalAddress,
        specialty,
        procedure,
        roomType
      });
      setBreakdown(data);
    } catch (err) {
      console.error('Failed to load bill breakdown:', err);
      setError(err.message || 'Failed to calculate bill breakdown.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomChange = (roomType) => {
    setCurrentRoom(roomType);
    loadBreakdown(roomType);
  };

  if (!isOpen) return null;

  const isSpecialtyExcluded = Boolean(
    specialty &&
    policy?.exclusions &&
    Array.isArray(policy.exclusions) &&
    policy.exclusions.some(ex => {
      const e = ex.toLowerCase().trim();
      const s = specialty.toLowerCase().trim();
      return s.includes(e) || e.includes(s);
    })
  );

  const b = breakdown;
  const bill = b?.itemizedBill;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-xl" onClick={(e) => e.stopPropagation()}>
        {/* Head */}
        <div className="modal-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Building2 size={24} style={{ color: 'var(--color-text)', flexShrink: 0 }} />
              <h2 className="modal-title">{hospitalName}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="pill-label">{hospitalSegment}</span>
              <span className="pill-label">{hospitalTier}</span>
              {hospitalRating > 0 && (
                <span className="pill-label" style={{ fontWeight: 700 }}>
                  ★ {Number(hospitalRating).toFixed(1)}
                </span>
              )}
              {hospitalAddress && (
                <a
                  href={getGoogleMapsUrl({
                    hospital_name: hospitalName,
                    address: hospitalAddress
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hospital-map-link"
                  style={{ fontSize: '13px', marginLeft: '4px', alignItems: 'center' }}
                  title={`Open "${hospitalName}" in Google Maps`}
                >
                  <span className="hospital-map-pin-btn" style={{ width: '20px', height: '20px' }}>
                    <MapPin size={12} />
                  </span>
                  <span className="hospital-address-text">{hospitalAddress}</span>
                  <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Policy Quick Strip */}
        {b && (
          <div className="strip" style={{ padding: '16px 24px', borderRadius: 'var(--radius-md)' }}>
            <div className="strip-item">
              <span className="strip-mark strip-mark-circle" />
              <span className="strip-label">{t('summary.fields.insurer', 'Insurance Provider')}: <strong>{b.policy.insurer || 'Not Specified'}</strong></span>
            </div>
            <div className="strip-item">
              <span className="strip-mark strip-mark-diamond" />
              <span
                className="strip-label"
                title={t('discovery.hospitalCard.networkTooltip', 'This network status is based on the available reference dataset. Final network/cashless eligibility must be confirmed with the insurer/TPA.')}
              >
                {t('discovery.hospitalCard.acceptedInsurers', 'Network')}: <strong style={{
                  color: b.networkInfo?.networkStatus === 'verified' ? '#16a34a' :
                         b.networkInfo?.networkStatus === 'no_match' ? '#dc2626' : '#d97706'
                }}>
                  {b.networkInfo?.networkStatus === 'verified' ? 'Network Hospital' :
                   b.networkInfo?.networkStatus === 'no_match' ? 'Non-Network Hospital' :
                   b.networkInfo?.networkStatus === 'unverified' ? 'Status Unverified' : t('common.unknown', 'Unknown')}
                </strong>
              </span>
            </div>
            <div className="strip-item">
              <span className="strip-mark strip-mark-bar" />
              <span className="strip-label">{t('summary.fields.roomRentLimit', 'Room Limit')}: <strong>{b.roomLimitType}</strong></span>
            </div>
            <div className="strip-item">
              <span className="strip-mark strip-mark-cross" />
              <span className="strip-label">{t('summary.fields.copay', 'Co-pay')}: <strong>{b.copayPercent !== null && b.copayPercent !== undefined ? `${b.copayPercent}%` : t('cost.policyDeductibleNotStated', 'Not stated')}</strong></span>
            </div>
          </div>
        )}

        {/* Accepted Insurers in this facility */}
        {hospitalInsurers && hospitalInsurers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('discovery.hospitalCard.acceptedInsurers', 'Accepted Insurers at this Hospital')}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(() => {
                const checkMatch = (ins) => {
                  if (!policy?.insurer) return false;
                  const p = policy.insurer.toLowerCase().trim();
                  const i = ins.toLowerCase().trim();
                  if (p.includes(i) || i.includes(p)) return true;
                  if (p.includes('hdfc') && i.includes('hdfc')) return true;
                  if (p.includes('star') && i.includes('star')) return true;
                  if (p.includes('care') && i.includes('care')) return true;
                  if (p.includes('icici') && i.includes('icici')) return true;
                  return false;
                };

                return [...hospitalInsurers].sort((a, b) => {
                  const aMatch = checkMatch(a);
                  const bMatch = checkMatch(b);
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                  return a.localeCompare(b);
                }).map((ins) => {
                  const isMatched = checkMatch(ins);
                  return (
                    <span
                      key={ins}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        border: isMatched ? '1.5px solid #86efac' : '1px solid var(--color-border)',
                        background: isMatched ? '#f0fdf4' : 'var(--color-surface)',
                        color: isMatched ? '#166534' : 'var(--color-text)',
                        fontWeight: isMatched ? 800 : 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isMatched && <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>}
                      {ins}
                    </span>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Network Status Notice */}
        {b && b.networkInfo?.networkStatus !== 'verified' && (
          <div className="form-alert" style={{
            background: b.networkInfo?.networkStatus === 'no_match' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${b.networkInfo?.networkStatus === 'no_match' ? '#fecaca' : '#fde68a'}`,
            color: b.networkInfo?.networkStatus === 'no_match' ? '#991b1b' : '#92400e',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>
              {b.networkInfo?.networkStatus === 'no_match' ? (
                b.nonNetworkCopay > 0 ? (
                  t('cost.nonNetworkNoticeWithCopay', { insurer: b.policy.insurer || 'your insurer', defaultValue: `Non-Network Hospital: This hospital does not have a verified cashless empanelment with ${b.policy.insurer || 'your insurer'}. A non-network co-payment has been applied per policy terms.` })
                ) : (
                  t('cost.nonNetworkNoticeNoCopay', { insurer: b.policy.insurer || 'your insurer', defaultValue: `Non-Network Hospital: This hospital does not have a verified cashless empanelment with ${b.policy.insurer || 'your insurer'}. Non-network co-payment terms are unstated in the policy and have not been assumed.` })
                )
              ) : (
                t('cost.unverifiedNetworkNotice', { insurer: b.policy.insurer || 'your insurer', defaultValue: `Unverified Network Status: Hospital empanelment could not be conclusively verified for ${b.policy.insurer || 'your insurer'}. Cashless admission may require prior approval.` })
              )}
            </span>
          </div>
        )}

        {/* Specialty Exclusion Alert */}
        {isSpecialtyExcluded && (
          <div
            className="form-alert"
            style={{
              background: '#fef2f2',
              border: '1.5px solid #f87171',
              color: '#991b1b',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px'
            }}
          >
            <AlertOctagon size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span>
              <strong>Department / Specialty Exclusion: </strong>
              Treatments in <strong>{specialty}</strong> are excluded under your {policy?.insurer || 'policy'} coverage schedule. Claims are not payable by the insurer, so the entire procedure cost must be borne out-of-pocket.
            </span>
          </div>
        )}

        {/* Room Category Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {t('cost.simulateRoomCategory', 'SIMULATE ROOM CATEGORY')}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {t('cost.liveDeductionCalc', 'Live deduction calculation')}
            </span>
          </div>

          <div className="role-tabs" style={{ maxWidth: '100%' }}>
            {['General Ward', 'Twin Sharing', 'Single Private Room'].map((cat) => {
              const translatedRoom =
                cat === 'General Ward' ? t('discovery.roomOptions.generalWard', 'General Ward') :
                cat === 'Twin Sharing' ? t('discovery.roomOptions.twinSharing', 'Twin Sharing') :
                t('discovery.roomOptions.singlePrivate', 'Single Private Room');

              return (
                <button
                  key={cat}
                  type="button"
                  className={`role-tab ${currentRoom === cat ? 'role-tab-active' : ''}`}
                  onClick={() => handleRoomChange(cat)}
                  disabled={loading}
                >
                  <span>{translatedRoom}</span>
                  {bill && currentRoom === cat && (
                    <span style={{ marginLeft: '8px', opacity: 0.7, fontSize: '11px' }}>
                      ({formatINR(bill.roomRatePerDay)}{t('common.perDay', '/day')})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)' }}>
            <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {t('cost.calculatingItemized', 'Calculating itemized bill and proportionate deduction disallowance...')}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="form-alert form-alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Content Grid */}
        {!loading && b && bill && (
          <div className="breakdown-grid">
            {/* Box 1: Hospital Bill Estimate */}
            <div className="breakdown-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  {t('cost.box1Title', '1. Estimated Treatment Cost Breakdown')}
                </h3>
                <span className="pill-label" style={{ fontSize: '11px', padding: '4px 10px' }}>
                  {t('cost.stayDaysCount', { days: bill.stayDays, defaultValue: `${bill.stayDays} Days Stay` })}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">{t('cost.roomRentWithDays', { days: bill.stayDays, rate: formatINR(bill.roomRatePerDay), defaultValue: `Room Rent (${bill.stayDays} days @ ${formatINR(bill.roomRatePerDay)}/day)` })}</span>
                <span className="detail-value">{formatINR(bill.roomCharges)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('cost.procedureCharges', 'Procedure / Surgery Charges')}</span>
                <span className="detail-value">{formatINR(bill.procedureCharges)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('cost.doctorFees', 'Specialist & Doctor Fees (20%)')}</span>
                <span className="detail-value">{formatINR(bill.doctorFees)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('cost.medicineCharges', 'Medicines & Diagnostics (10%)')}</span>
                <span className="detail-value">{formatINR(bill.medicineCharges)}</span>
              </div>
              <div className="detail-row" style={{ borderTop: '2px solid var(--color-border-strong)', paddingTop: '12px' }}>
                <strong style={{ fontSize: '15px' }}>{t('cost.totalTreatmentCost', 'Total Estimated Treatment Cost')}</strong>
                <strong style={{ fontSize: '16px' }}>{formatINR(bill.totalBill)}</strong>
              </div>
            </div>

            {/* Box 2: Insurance Deductions & Patient Share */}
            <div className="breakdown-card">
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>
                {t('cost.box2Title', '2. Deductions & Patient Share')}
              </h3>

              <div className="detail-row">
                <span className="detail-label">
                  {t('cost.roomRentExcess', 'Room Rent Excess')}
                  {b.roomRentExcessPerDay > 0 && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#991b1b' }}>
                      {t('cost.exceedsDailyCap', { amount: formatINR(b.roomRentExcessPerDay), defaultValue: `Exceeds daily cap by ${formatINR(b.roomRentExcessPerDay)}/day` })}
                    </span>
                  )}
                </span>
                <span className="detail-value" style={{ color: b.totalRoomRentExcess > 0 ? '#991b1b' : 'inherit' }}>
                  {formatINR(b.totalRoomRentExcess)}
                </span>
              </div>

              {b.proportionateDeductionActive && (
                <div className="detail-row" style={{ background: '#fdf2f2', padding: '10px 12px', borderRadius: 'var(--radius-sm)', margin: '4px 0' }}>
                  <span className="detail-label" style={{ color: '#991b1b' }}>
                    <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {t('cost.proportionateDisallowance', 'Proportionate Disallowance (OT/Doctor)')}
                  </span>
                  <span className="detail-value" style={{ color: '#991b1b' }}>
                    +{formatINR(b.proportionateDisallowance)}
                  </span>
                </div>
              )}

              {/* Policy Deductible (P0.2) */}
              {b.deductibleApplied !== null && b.deductibleApplied !== undefined && b.deductibleApplied > 0 && (
                <div className="detail-row" style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: 'var(--radius-sm)', margin: '4px 0' }}>
                  <span className="detail-label" style={{ color: '#991b1b' }}>
                    {t('cost.policyDeductibleApplied', 'Policy Deductible Applied')}
                  </span>
                  <span className="detail-value" style={{ color: '#991b1b' }}>
                    +{formatINR(b.deductibleApplied)}
                  </span>
                </div>
              )}
              {b.deductibleUnknown && (
                <div className="detail-row" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                  <span className="detail-label">{t('cost.policyDeductibleLabel', 'Policy Deductible')}</span>
                  <span className="detail-value">{t('cost.policyDeductibleNotStated', 'Not stated in policy')}</span>
                </div>
              )}

              <div className="detail-row">
                <span className="detail-label">
                  {t('cost.baseCopayWithPercent', { percent: b.copayPercent !== null && b.copayPercent !== undefined ? `${b.copayPercent}%` : t('cost.policyDeductibleNotStated', 'Not stated'), defaultValue: `Base Co-pay (${b.copayPercent !== null && b.copayPercent !== undefined ? `${b.copayPercent}%` : 'Not stated'})` })}
                </span>
                <span className="detail-value">{formatINR(b.copayAmount)}</span>
              </div>

              {b.nonNetworkCopay > 0 && (
                <div className="detail-row" style={{ background: '#fef3c7', padding: '10px 12px', borderRadius: 'var(--radius-sm)', margin: '4px 0' }}>
                  <span className="detail-label" style={{ color: '#b45309' }}>
                    <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {t('cost.nonNetworkCopayWithPercent', { percent: b.nonNetworkCopayPercent ?? 20, defaultValue: `Non-Network Co-pay (${b.nonNetworkCopayPercent ?? 20}%)` })}
                  </span>
                  <span className="detail-value" style={{ color: '#b45309' }}>
                    +{formatINR(b.nonNetworkCopay)}
                  </span>
                </div>
              )}

              {b.isCopayUncertain && (
                <div className="detail-row" style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: '4px 0' }}>
                  <span className="detail-label" style={{ color: '#b45309', fontSize: '12px' }}>
                    {t('cost.nonNetworkCopayNotAssumed', 'ℹ️ Non-network co-pay rule not stated in policy; not assumed.')}
                  </span>
                </div>
              )}

              {b.excessOverSumInsured > 0 && (
                <div className="detail-row" style={{ background: '#fdf2f2', padding: '10px 12px', borderRadius: 'var(--radius-sm)', margin: '4px 0' }}>
                  <span className="detail-label" style={{ color: '#991b1b' }}>
                    {t('cost.excessOverSI', 'Excess Over Sum Insured')}
                  </span>
                  <span className="detail-value" style={{ color: '#991b1b' }}>
                    +{formatINR(b.excessOverSumInsured)}
                  </span>
                </div>
              )}

              {/* Modelled non-medical consumables (P2.1) */}
              <div className="detail-row" title="Modelled estimate of non-medical consumable items typically excluded from health insurance claims.">
                <span className="detail-label">
                  {t('cost.modelledNonMedicalAllowance', 'Modelled Non-Medical Allowance (~5%)')}
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {t('cost.modelledNonMedicalNote', '(Modelled assumption, not a policy deductible)')}
                  </span>
                </span>
                <span className="detail-value">{formatINR(b.modelledNonMedicalAllowance ?? b.nonMedicalDeductible)}</span>
              </div>

              <div className="breakdown-split-box">
                <div className="split-item">
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('cost.estInsurerShareUpper', 'ESTIMATED INSURER SHARE')}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                    {formatINR(b.totalInsuranceCovered)}
                  </span>
                </div>
                <div className="split-item" style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('cost.estPatientShareUpper', 'ESTIMATED PATIENT SHARE')}</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
                    {formatINR(b.totalPatientPayable)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Care Advisor Recommendations */}
        {!loading && b && b.aiRecommendations && b.aiRecommendations.length > 0 && (
          <div className="ai-advisor-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} />
              <strong style={{ fontSize: '14px', letterSpacing: '0.02em' }}>
                {t('cost.policyAdvisoryTitle', 'SEHATSURE POLICY ADVISORY')}
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {b.aiRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`form-alert ${rec.type === 'warning' ? 'form-alert-error' : 'form-alert-success'}`}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{rec.title}</strong>
                    <div style={{ fontSize: '13px', marginTop: '2px' }}>{rec.message}</div>
                    {rec.actionable && (
                      <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                        💡 {rec.actionable}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {t('cost.modalFootnote', 'Empirical calculations based on reference hospital cost distribution data.')}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onTrackJourney && (
              <button
                type="button"
                className="pill-btn pill-btn-ghost pill-btn-sm"
                onClick={() => {
                  onClose();
                  onTrackJourney({
                    hospital_name: hospitalName,
                    address: hospitalAddress,
                    tier: hospitalTier,
                    rating: hospitalRating,
                    segment: hospitalSegment
                  }, procedure, currentRoom);
                }}
              >
                {t('cost.planCareJourney', 'Plan Care Journey →')}
              </button>
            )}
            <button type="button" className="pill-btn pill-btn-primary pill-btn-sm" onClick={onClose}>
              {t('cost.closeBreakdown', 'Close Breakdown')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
