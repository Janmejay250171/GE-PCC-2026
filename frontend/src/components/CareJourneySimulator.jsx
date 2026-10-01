import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  RotateCcw,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Building,
  Activity,
  CreditCard,
  Send,
  Bed,
  Stethoscope,
  Clock,
  Sparkles
} from 'lucide-react';
import { DEMO_JOURNEY_SEQUENCE, JOURNEY_EVENT_TYPES } from '../types/journey';

export default function CareJourneySimulator({
  onTriggerEvent,
  onResetJourney,
  currentStage,
  eventsCount = 0,
  isEmergency = false,
  onToggleEmergency
}) {
  const { t } = useTranslation();
  const [isPlayingAutoDemo, setIsPlayingAutoDemo] = useState(false);
  const [autoStepIndex, setAutoStepIndex] = useState(0);

  // Auto-play demo runner
  useEffect(() => {
    let timer;
    if (isPlayingAutoDemo && autoStepIndex < DEMO_JOURNEY_SEQUENCE.length) {
      timer = setTimeout(() => {
        const step = DEMO_JOURNEY_SEQUENCE[autoStepIndex];
        onTriggerEvent(step.eventType, step.metadata);
        setAutoStepIndex((prev) => prev + 1);
      }, 1600);
    } else if (autoStepIndex >= DEMO_JOURNEY_SEQUENCE.length) {
      setIsPlayingAutoDemo(false);
    }
    return () => clearTimeout(timer);
  }, [isPlayingAutoDemo, autoStepIndex, onTriggerEvent]);

  const handleStartAutoDemo = () => {
    setAutoStepIndex(0);
    setIsPlayingAutoDemo(true);
  };

  const handleStopAutoDemo = () => {
    setIsPlayingAutoDemo(false);
  };

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '2px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Top Header of Simulator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--color-teal-light, #F0FDFA)',
              color: 'var(--color-primary, #0F766E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}
          >
            <Zap size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)' }}>
                {t('simulator.title', 'Care Journey Simulator')}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-teal-light, #F0FDFA)',
                  color: 'var(--color-primary, #0F766E)',
                  border: '1px solid var(--color-teal-border, #CCFBF1)'
                }}
              >
                {t('simulator.badge', 'SIMULATED DEMO FEED • PCC 2026')}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              {t('simulator.description', 'Simulates hospital ADT, TPA authorization, and billing events to test real-time guidance recalculations.')}
            </p>
          </div>
        </div>

        {/* Global Controls: Play 2-min demo or Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isPlayingAutoDemo ? (
            <button
              type="button"
              className="pill-btn pill-btn-ghost pill-btn-sm"
              onClick={handleStopAutoDemo}
              style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
            >
              ⏸ {t('simulator.pauseDemo', { step: autoStepIndex, total: DEMO_JOURNEY_SEQUENCE.length, defaultValue: `Pause Demo (${autoStepIndex}/${DEMO_JOURNEY_SEQUENCE.length})` })}
            </button>
          ) : (
            <button
              type="button"
              className="pill-btn pill-btn-primary pill-btn-sm"
              onClick={handleStartAutoDemo}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={13} fill="currentColor" /> {t('simulator.playDemo', 'Play 2-Min Demo Journey')}
            </button>
          )}

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => {
              if (window.confirm(t('simulator.resetConfirm', 'Reset care journey for this hospital? This will clear all recorded milestones for this hospital and policy.'))) {
                onResetJourney();
              }
            }}
            title="Reset recorded milestones for this hospital and policy"
          >
            <RotateCcw size={13} style={{ marginRight: '4px' }} /> {t('simulator.reset', 'Reset')}
          </button>
        </div>
      </div>

      {/* Button Strip for Individual Event Triggers */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          {t('simulator.stepTriggersTitle', 'Interactive Step Triggers (Click to inject simulated event):')}
        </div>

        <div className="simulator-btn-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.ADMISSION_COMPLETED, { admissionType: 'Planned' })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Building size={13} style={{ marginRight: '5px', color: '#16a34a' }} />
            {t('simulator.buttons.admit', '1. Admit Patient')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.PREAUTH_REQUESTED, { initialEstimate: 60000 })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Send size={13} style={{ marginRight: '5px', color: '#0F766E' }} />
            {t('simulator.buttons.submitPreauth', '2. Submit Pre-Auth')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.PREAUTH_APPROVED, { approvedAmount: 50000 })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <CheckCircle size={13} style={{ marginRight: '5px', color: '#15803d' }} />
            {t('simulator.buttons.approvePreauth', '3. Approve Pre-Auth')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.ROOM_ASSIGNED, { newRoom: 'Twin Sharing', newRate: 4000 })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Bed size={13} style={{ marginRight: '5px', color: '#0D9488' }} />
            {t('simulator.buttons.assignRoom', '4. Assign Standard Room')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.ROOM_CHANGED, { previousRoom: 'Twin Sharing', newRoom: 'Single Private Room', newRate: 10000 })}
            style={{ fontSize: '12px', background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', fontWeight: 700 }}
            title="Triggers room rent excess & proportionate deduction alert!"
          >
            <AlertTriangle size={13} style={{ marginRight: '5px', color: '#d97706' }} />
            {t('simulator.buttons.upgradeRoom', '5. Upgrade Room (₹10,000/d) ⚠')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.INVESTIGATION_COMPLETED, { tests: ['CBC', 'X-Ray', 'USG'] })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Activity size={13} style={{ marginRight: '5px', color: '#0F766E' }} />
            {t('simulator.buttons.completeDiagnostics', '6. Complete Diagnostics')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.PROCEDURE_PLANNED, { procedureName: 'Surgical Treatment' })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Stethoscope size={13} style={{ marginRight: '5px', color: '#0D9488' }} />
            {t('simulator.buttons.planProcedure', '7. Plan Procedure')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.PROCEDURE_AUTHORIZED, { code: 'SURG-AUTH-101' })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <FileCheck size={13} style={{ marginRight: '5px', color: '#059669' }} />
            {t('simulator.buttons.authorizeProcedure', '8. Authorize Procedure')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.PROCEDURE_COMPLETED, { otCost: 35000 })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <CheckCircle size={13} style={{ marginRight: '5px', color: '#16a34a' }} />
            {t('simulator.buttons.completeProcedure', '9. Complete Procedure')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.BILLING_INITIATED, { interimTotal: 95000 })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <CreditCard size={13} style={{ marginRight: '5px', color: '#d97706' }} />
            {t('simulator.buttons.interimBilling', '10. Interim Billing')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.DISCHARGE_INITIATED, {})}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Building size={13} style={{ marginRight: '5px', color: '#0F766E' }} />
            {t('simulator.buttons.initiateDischarge', '11. Initiate Discharge')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.CLAIM_SUBMITTED, { docket: 'CLM-DEMO-99' })}
            style={{ fontSize: '12px', background: 'var(--color-white)' }}
          >
            <Send size={13} style={{ marginRight: '5px', color: '#0D9488' }} />
            {t('simulator.buttons.submitClaim', '12. Submit Claim')}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => onTriggerEvent(JOURNEY_EVENT_TYPES.CLAIM_SETTLED, {})}
            style={{ fontSize: '12px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', fontWeight: 700 }}
          >
            <CheckCircle size={13} style={{ marginRight: '5px', color: '#16a34a' }} />
            {t('simulator.buttons.settleClaim', '13. Settle Claim ✓')}
          </button>

          {/* Emergency protocol simulator trigger */}
          <button
            type="button"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            onClick={() => {
              if (onToggleEmergency) onToggleEmergency();
              onTriggerEvent(JOURNEY_EVENT_TYPES.ADMISSION_COMPLETED, { isEmergency: true });
            }}
            style={{
              fontSize: '12px',
              background: isEmergency ? '#fee2e2' : '#fef2f2',
              borderColor: '#fca5a5',
              color: '#991b1b',
              fontWeight: 700
            }}
            title="Demonstrate Emergency Safety principle overriding financial delay"
          >
            <ShieldAlert size={13} style={{ marginRight: '5px', color: '#dc2626' }} />
            {isEmergency ? t('simulator.buttons.emergencyActive', '🚨 Emergency Mode Active') : t('simulator.buttons.simulateEmergency', '🚨 Simulate Emergency Admission')}
          </button>
        </div>
      </div>
    </div>
  );
}
