import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  FileText,
  Activity,
  ArrowRight,
  Info
} from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';
import WhyExplanationModal from './WhyExplanationModal';

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

export default function JourneyIntelligencePanel({
  journeyState,
  policy,
  hospital,
  procedure,
  roomType,
  onResolveAlert
}) {
  const { t } = useTranslation();
  const [selectedWhyExplanation, setSelectedWhyExplanation] = useState(null);
  const [whyProvenance, setWhyProvenance] = useState('POLICY-DERIVED');

  const events = journeyState?.events || [];
  const activeAlerts = journeyState?.activeAlerts || [];
  const currentRoom = journeyState?.currentRoom || roomType || 'General Ward';
  const snapshot = journeyState?.financialSnapshot;

  // Derive stage intelligence checks from current state
  const hasAdmissionEvent = events.some(e => e.eventType === 'ADMISSION_COMPLETED');
  const preAuthEvent = events.slice().reverse().find(e => e.eventType.startsWith('PREAUTH_'));
  const hasRoomUpgradeAlert = activeAlerts.some(a => a.title.toLowerCase().includes('room'));
  const hasInvestigationEvent = events.some(e => e.eventType.startsWith('INVESTIGATION_'));
  const procedureAuthEvent = events.slice().reverse().find(e => e.eventType.startsWith('PROCEDURE_'));
  const billingEvent = events.slice().reverse().find(e => e.eventType === 'BILLING_INITIATED' || e.eventType === 'FINAL_BILL');
  const dischargeEvent = events.slice().reverse().find(e => e.eventType === 'DISCHARGE_INITIATED');
  const claimEvent = events.slice().reverse().find(e => e.eventType.startsWith('CLAIM_'));

  const intelligenceStages = [
    {
      name: t('intelligence.stagesList.admission.name', 'Admission'),
      status: hasAdmissionEvent ? 'checked' : 'ready',
      text: hasAdmissionEvent
        ? t('intelligence.stagesList.admission.checked', 'Network and room eligibility checked')
        : t('intelligence.stagesList.admission.ready', 'Awaiting hospital admission check-in'),
      badge: t('intelligence.stagesList.admission.badge', 'Eligible'),
      color: '#15803d'
    },
    {
      name: t('intelligence.stagesList.preAuth.name', 'Pre-Authorization'),
      status: preAuthEvent ? preAuthEvent.eventType === 'PREAUTH_APPROVED' ? 'approved' : preAuthEvent.eventType === 'PREAUTH_REJECTED' ? 'rejected' : 'pending' : 'not_started',
      text: preAuthEvent
        ? preAuthEvent.eventType === 'PREAUTH_APPROVED'
          ? t('intelligence.stagesList.preAuth.approved', 'Approved (Provisional Cashless Sanctioned)')
          : preAuthEvent.eventType === 'PREAUTH_REJECTED'
            ? t('intelligence.stagesList.preAuth.declined', 'Cashless Declined • Reimbursement Track Active')
            : t('intelligence.stagesList.preAuth.pending', 'Pre-Authorization Docket Pending with TPA')
        : t('intelligence.stagesList.preAuth.notStarted', 'Pre-Authorization Not Started'),
      badge: preAuthEvent?.eventType === 'PREAUTH_APPROVED'
        ? t('intelligence.stagesList.preAuth.badgeApproved', 'Approved')
        : preAuthEvent
          ? t('intelligence.stagesList.preAuth.badgeActive', 'Active')
          : t('intelligence.stagesList.preAuth.badgePending', 'Pending'),
      color: preAuthEvent?.eventType === 'PREAUTH_REJECTED' ? '#b91c1c' : '#15803d'
    },
    {
      name: t('intelligence.stagesList.room.name', 'Room Allotment'),
      status: hasRoomUpgradeAlert ? 'warning' : 'ok',
      text: hasRoomUpgradeAlert
        ? t('intelligence.stagesList.room.exceeded', { room: currentRoom, defaultValue: `⚠ Selected room (${currentRoom}) exceeds policy limit` })
        : t('intelligence.stagesList.room.adherent', { room: currentRoom, defaultValue: `Room category (${currentRoom}) adheres to policy limit` }),
      badge: hasRoomUpgradeAlert
        ? t('intelligence.stagesList.room.badgeExceeded', 'Cap Exceeded')
        : t('intelligence.stagesList.room.badgeAdherent', 'Adherent'),
      color: hasRoomUpgradeAlert ? '#d97706' : '#15803d',
      alert: hasRoomUpgradeAlert ? activeAlerts.find(a => a.title.toLowerCase().includes('room')) : null
    },
    {
      name: t('intelligence.stagesList.investigation.name', 'Investigation'),
      status: hasInvestigationEvent ? 'ok' : 'ready',
      text: hasInvestigationEvent
        ? t('intelligence.stagesList.investigation.ok', 'No new insurance constraint detected')
        : t('intelligence.stagesList.investigation.ready', 'Diagnostic labs correlation tracking active'),
      badge: t('intelligence.stagesList.investigation.badge', 'Covered'),
      color: '#15803d'
    },
    {
      name: t('intelligence.stagesList.procedure.name', 'Procedure'),
      status: procedureAuthEvent ? 'confirmed' : 'pending',
      text: procedureAuthEvent
        ? procedureAuthEvent.eventType === 'PROCEDURE_COMPLETED'
          ? t('intelligence.stagesList.procedure.completed', 'Procedure completed • Sum Insured adjusted')
          : t('intelligence.stagesList.procedure.authorized', 'Authorization confirmed • Operative codes logged')
        : t('intelligence.stagesList.procedure.scheduled', 'Procedure scheduled • Awaiting surgeon ledger'),
      badge: procedureAuthEvent
        ? t('intelligence.stagesList.procedure.badgeAuthorized', 'Authorized')
        : t('intelligence.stagesList.procedure.badgePending', 'Pending'),
      color: '#15803d'
    },
    {
      name: t('intelligence.stagesList.billing.name', 'Billing'),
      status: billingEvent ? 'updated' : 'ready',
      text: billingEvent
        ? t('intelligence.stagesList.billing.updated', { amount: snapshot ? formatINR(snapshot.patientPayable) : '₹34,500', defaultValue: `Estimated patient exposure updated (${snapshot ? formatINR(snapshot.patientPayable) : '₹34,500'})` })
        : t('intelligence.stagesList.billing.ready', 'Interim accrual monitoring active'),
      badge: t('intelligence.stagesList.billing.badge', 'Modelled'),
      color: '#b45309'
    },
    {
      name: t('intelligence.stagesList.discharge.name', 'Discharge & Claim'),
      status: claimEvent ? 'submitted' : dischargeEvent ? 'checklist' : 'pending',
      text: claimEvent
        ? claimEvent.eventType === 'CLAIM_SETTLED'
          ? t('intelligence.stagesList.discharge.settled', 'Claim settled • Life cycle completed')
          : t('intelligence.stagesList.discharge.submitted', 'Claim documentation submitted for audit')
        : dischargeEvent
          ? t('intelligence.stagesList.discharge.readySummary', 'Discharge summary ready • Claim documentation checklist active')
          : t('intelligence.stagesList.discharge.standby', 'Discharge documentation checklist standby'),
      badge: claimEvent
        ? t('intelligence.stagesList.discharge.badgeSubmitted', 'Submitted')
        : t('intelligence.stagesList.discharge.badgeChecklist', 'Checklist'),
      color: '#1d4ed8'
    }
  ];

  return (
    <section
      className="features"
      style={{
        padding: '28px clamp(20px, 3.5vw, 36px)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill-label" style={{ background: 'var(--color-text)', color: '#ffffff', fontSize: '11px' }}>
              {t('intelligence.continuousEngineBadge', 'CONTINUOUS GUIDANCE ENGINE')}
            </span>
            <ProvenanceBadge type="MODELLED ESTIMATE" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px', letterSpacing: '-0.01em' }}>
            {t('intelligence.title', 'Insurance-Aware Care Journey Intelligence')}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '2px 0 0' }}>
            {t('intelligence.description', 'Real-time evaluation of hospital milestones against extracted policy constraints and out-of-pocket exposure.')}
          </p>
        </div>

        {snapshot && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px'
            }}
          >
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('intelligence.currentExposure', 'Current Est. Patient Exposure')}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
              {formatINR(snapshot.patientPayable)}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              {t('intelligence.siShare', { amount: formatINR(snapshot.insurerEstimatedShare), defaultValue: `SI Share: ${formatINR(snapshot.insurerEstimatedShare)}` })}
            </span>
          </div>
        )}
      </div>

      {/* 1. Emergency Safety Banner if Emergency Mode */}
      {journeyState?.isEmergency && (
        <div
          style={{
            background: '#fef2f2',
            border: '2px solid #f87171',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <ShieldAlert size={26} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#991b1b' }}>
              {t('intelligence.emergencyCareTitle', 'Emergency Care Takes Absolute Priority')}
            </div>
            <div style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '2px', lineHeight: 1.4 }}>
              {t('intelligence.emergencyCareDesc', 'This platform provides health insurance decision support only and must not delay clinically necessary emergency care. Proceed with urgent medical treatment; cashless intimation can be submitted within 24 hours.')}
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Contextual Alerts Strip with "Why am I seeing this?" */}
      {activeAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309' }}>
            {t('intelligence.activeAlertsCount', { count: activeAlerts.length, defaultValue: `Active Insurance Alerts (${activeAlerts.length})` })}
          </div>

          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                background: alert.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                border: alert.severity === 'CRITICAL' ? '1px solid #fecaca' : '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: '280px', flex: 1 }}>
                {alert.severity === 'CRITICAL' ? (
                  <ShieldAlert size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: alert.severity === 'CRITICAL' ? '#991b1b' : '#92400e' }}>
                      {alert.title}
                    </span>
                    <ProvenanceBadge type={alert.provenance || 'POLICY-DERIVED'} size="xs" />
                  </div>
                  <div style={{ fontSize: '13px', color: alert.severity === 'CRITICAL' ? '#7f1d1d' : '#78350f', marginTop: '2px', lineHeight: 1.4 }}>
                    {alert.message}
                  </div>
                  {alert.actionable && (
                    <div style={{ fontSize: '12px', fontWeight: 700, color: alert.severity === 'CRITICAL' ? '#b91c1c' : '#b45309', marginTop: '4px' }}>
                      {t('intelligence.actionPrefix', 'Action: ')}{alert.actionable}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {alert.whyExplanation && (
                  <button
                    type="button"
                    className="pill-btn pill-btn-ghost pill-btn-sm"
                    style={{ fontSize: '12px', background: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      setSelectedWhyExplanation(alert.whyExplanation);
                      setWhyProvenance(alert.provenance || 'POLICY-DERIVED');
                    }}
                  >
                    <HelpCircle size={13} /> {t('intelligence.whyButton', 'Why this alert?')}
                  </button>
                )}

                {onResolveAlert && (
                  <button
                    type="button"
                    className="pill-btn pill-btn-ghost pill-btn-sm"
                    style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}
                    onClick={() => onResolveAlert(alert.id)}
                  >
                    {t('intelligence.dismiss', 'Dismiss')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Section 6 Required Intelligence Panel: The 7-Stage Live Status List */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          {t('intelligence.complianceAcrossStages', 'Real-Time Policy Compliance Across Stages')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {intelligenceStages.map((stg, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--color-surface)',
                border: stg.status === 'warning' ? '1px solid #fde68a' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: stg.color,
                  marginTop: '6px',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {stg.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: stg.status === 'warning' ? '#fef3c7' : '#f0fdf4',
                      color: stg.status === 'warning' ? '#b45309' : '#15803d'
                    }}
                  >
                    {stg.badge}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                  {stg.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Simulated Event Feed Timeline */}
      {events.length > 0 && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
              {t('intelligence.eventLogStream', { count: events.length, defaultValue: `Event Log Stream (${events.length} Simulated Events)` })}
            </span>
            <ProvenanceBadge type="SIMULATED DEMO EVENT" size="xs" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            {events.slice().reverse().map((evt) => (
              <div
                key={evt.id}
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '12:00'}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                    {evt.insuranceImpact?.title || evt.eventType}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {evt.insuranceImpact?.summary || 'Event logged successfully.'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <ProvenanceBadge type={evt.provenance || 'SIMULATED DEMO EVENT'} size="xs" />
                  {evt.insuranceImpact?.whyExplanation && (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={t('whyModal.whyTitle', 'Why am I seeing this?')}
                      onClick={() => {
                        setSelectedWhyExplanation(evt.insuranceImpact.whyExplanation);
                        setWhyProvenance(evt.provenance || 'POLICY-DERIVED');
                      }}
                    >
                      <HelpCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for "Why am I seeing this?" */}
      {selectedWhyExplanation && (
        <WhyExplanationModal
          explanation={selectedWhyExplanation}
          provenance={whyProvenance}
          onClose={() => setSelectedWhyExplanation(null)}
        />
      )}
    </section>
  );
}
