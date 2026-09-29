import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  FileText,
  MapPin,
  Building2,
  Stethoscope,
  RotateCcw,
  Check,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
  Activity
} from 'lucide-react';
import { getCareJourneyPlan } from '../utils/careJourneyAdvisor';
import { evaluateClientJourneyEvent } from '../utils/journeyGuidanceEngine';
import { getGoogleMapsUrl } from '../utils/maps';
import {
  fetchJourneyState,
  postJourneyEvent,
  syncJourneyState,
  resetJourneyState,
  resolveAlertApi
} from '../services/journeyApi';
import ProvenanceBadge from '../components/ProvenanceBadge';
import WhyExplanationModal from '../components/WhyExplanationModal';

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function CareJourneyPage({
  policy,
  hospital,
  procedure,
  roomType = 'General Ward',
  onBackToHospitals,
  onBackToPolicy
}) {
  const { t } = useTranslation();
  const [activeStageId, setActiveStageId] = useState('admission');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedWhy, setSelectedWhy] = useState(null);

  // Compute unique key for the active hospital to isolate care journey between hospitals
  const hospitalKey = useMemo(() => {
    const name = hospital?.hospital_name || hospital?.name || 'apollo_hospitals';
    const city = hospital?.city || hospital?.address || 'bengaluru';
    return `${name}_${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
  }, [hospital]);

  const policyKey = useMemo(() => {
    const id = policy?._id || policy?.id || policy?.planName || 'demo_policy';
    return String(id).toLowerCase().replace(/[^a-z0-9]/g, '_');
  }, [policy]);

  const storagePrefix = `care_journey_${policyKey}_${hospitalKey}`;

  // Journey state with events, active alerts, and financial snapshot
  const [journeyState, setJourneyState] = useState(() => {
    try {
      const saved =
        localStorage.getItem(`sehatsure_state_${storagePrefix}`) ||
        localStorage.getItem(`sehatsure_journey_${storagePrefix}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [completedStages, setCompletedStages] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_completed`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_checklist`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Whenever storagePrefix changes (hospital or policy switch), reload that specific journey!
  useEffect(() => {
    // 1. Immediately read from localStorage for instant display
    try {
      const saved =
        localStorage.getItem(`sehatsure_state_${storagePrefix}`) ||
        localStorage.getItem(`sehatsure_journey_${storagePrefix}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setJourneyState(parsed);
        if (parsed.isEmergency) setIsEmergency(true);
        else setIsEmergency(false);
      } else {
        setJourneyState(null);
        setIsEmergency(false);
      }
    } catch {
      setJourneyState(null);
    }

    // 2. Query backend to sync persistent state
    fetchJourneyState(storagePrefix)
      .then((backendState) => {
        if (backendState) {
          setJourneyState(backendState);
          if (backendState.isEmergency) setIsEmergency(true);
          try {
            localStorage.setItem(`sehatsure_state_${storagePrefix}`, JSON.stringify(backendState));
            localStorage.setItem(`sehatsure_journey_${storagePrefix}`, JSON.stringify(backendState));
          } catch {}
        }
      })
      .catch((e) => console.warn('Could not fetch backend journey state:', e));

    // 3. Load completed stages & checklists for this specific hospital
    try {
      const savedCompleted = localStorage.getItem(`${storagePrefix}_completed`);
      setCompletedStages(savedCompleted ? JSON.parse(savedCompleted) : {});
    } catch {
      setCompletedStages({});
    }

    try {
      const savedChecklist = localStorage.getItem(`${storagePrefix}_checklist`);
      setCheckedItems(savedChecklist ? JSON.parse(savedChecklist) : {});
    } catch {
      setCheckedItems({});
    }
  }, [storagePrefix]);

  // Compute base reference stages
  const stages = useMemo(() => {
    return getCareJourneyPlan({
      policy,
      hospital,
      procedure,
      roomType: journeyState?.currentRoom || roomType
    });
  }, [policy, hospital, procedure, roomType, journeyState?.currentRoom]);

  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  const toggleCheckItem = (id) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`${storagePrefix}_checklist`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const toggleStageCompletion = (stageId) => {
    setCompletedStages((prev) => {
      const next = { ...prev, [stageId]: !prev[stageId] };
      try {
        localStorage.setItem(`${storagePrefix}_completed`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Handler when simulated event is triggered from CareJourneySimulator
  const handleTriggerSimulatedEvent = useCallback(
    async (eventType, metadata = {}) => {
      // 1. Evaluate immediately via Client Guidance Engine for zero lag
      const evalResult = evaluateClientJourneyEvent({
        event: { eventType, metadata, isEmergency },
        policy,
        hospital,
        procedure,
        roomType: metadata.newRoom || journeyState?.currentRoom || roomType,
        isEmergency
      });

      const currentEvents = journeyState?.events || [];
      const updatedEvents = [...currentEvents, evalResult.normalizedEvent];
      const updatedAlerts = [...(journeyState?.activeAlerts || [])];
      if (evalResult.alert) {
        updatedAlerts.unshift(evalResult.alert);
      }

      // Map transition to UI activeStageId
      if (evalResult.stageTransition) {
        const stageMap = {
          ADMISSION: 'admission',
          INVESTIGATION: 'investigation',
          PROCEDURE: 'procedure',
          BILLING: 'recovery',
          DISCHARGE: 'recovery',
          RECOVERY: 'recovery'
        };
        const mappedId = stageMap[evalResult.stageTransition];
        if (mappedId) setActiveStageId(mappedId);
      }

      const nextState = {
        _id: storagePrefix,
        patientId: `pat_${hospitalKey}`,
        policyId: policy?._id || 'default',
        hospitalName: hospital?.hospital_name || 'Medical Center',
        hospitalAddress: hospital?.address || '',
        procedure: procedure || 'General Consultation',
        currentRoom: metadata.newRoom || journeyState?.currentRoom || roomType,
        currentStage: evalResult.stageTransition || 'ADMISSION',
        authorizationStatus:
          eventType === 'PREAUTH_APPROVED'
            ? 'APPROVED'
            : eventType === 'PREAUTH_REJECTED'
            ? 'REJECTED'
            : eventType === 'PREAUTH_PENDING'
            ? 'PENDING'
            : eventType === 'PREAUTH_REQUESTED'
            ? 'SUBMITTED'
            : journeyState?.authorizationStatus || 'NOT_STARTED',
        claimStatus:
          eventType === 'CLAIM_SETTLED'
            ? 'APPROVED'
            : eventType === 'CLAIM_REJECTED'
            ? 'REJECTED'
            : eventType === 'CLAIM_SUBMITTED'
            ? 'SUBMITTED'
            : journeyState?.claimStatus || 'NOT_SUBMITTED',
        events: updatedEvents,
        activeAlerts: updatedAlerts,
        resolvedAlerts: journeyState?.resolvedAlerts || [],
        financialSnapshot: evalResult.updatedFinancialSnapshot,
        isEmergency,
        lastUpdated: new Date().toISOString()
      };

      setJourneyState(nextState);
      try {
        localStorage.setItem(`sehatsure_state_${storagePrefix}`, JSON.stringify(nextState));
        localStorage.setItem(`sehatsure_journey_${storagePrefix}`, JSON.stringify(nextState));
      } catch {
        // ignore
      }

      // 2. Persist to backend
      postJourneyEvent(storagePrefix, {
        event: { eventType, metadata, isEmergency },
        policyId: policy?._id || policy?.id || 'pol_demo_star',
        hospitalName: hospital?.hospital_name || 'Apollo Hospitals',
        hospitalAddress: hospital?.address || 'Bannerghatta Road, Bengaluru',
        procedure,
        roomType: nextState.currentRoom,
        isEmergency
      }).then((res) => {
        if (res && res.state) {
          setJourneyState(res.state);
          try {
            localStorage.setItem(`sehatsure_state_${storagePrefix}`, JSON.stringify(res.state));
            localStorage.setItem(`sehatsure_journey_${storagePrefix}`, JSON.stringify(res.state));
          } catch {}
        }
      }).catch((e) => console.warn('Backend sync deferred:', e));
    },
    [hospital, hospitalKey, isEmergency, journeyState, policy, procedure, roomType, storagePrefix]
  );

  const handleResetJourney = () => {
    resetJourneyState(storagePrefix);
    try {
      localStorage.removeItem(`sehatsure_state_${storagePrefix}`);
      localStorage.removeItem(`sehatsure_journey_${storagePrefix}`);
      localStorage.removeItem(`${storagePrefix}_completed`);
      localStorage.removeItem(`${storagePrefix}_checklist`);
    } catch {}
    setJourneyState(null);
    setCompletedStages({});
    setCheckedItems({});
    setIsEmergency(false);
    setActiveStageId('admission');
  };

  const handleResolveAlert = (alertId) => {
    if (!journeyState) return;
    const target = journeyState.activeAlerts.find((a) => a.id === alertId);
    if (!target) return;

    const updated = {
      ...journeyState,
      activeAlerts: journeyState.activeAlerts.filter((a) => a.id !== alertId),
      resolvedAlerts: [...(journeyState.resolvedAlerts || []), { ...target, resolved: true }]
    };
    setJourneyState(updated);
    try {
      localStorage.setItem(`sehatsure_state_${storagePrefix}`, JSON.stringify(updated));
      localStorage.setItem(`sehatsure_journey_${storagePrefix}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    resolveAlertApi(storagePrefix, alertId);
  };

  const getStageTitle = (stg) => {
    if (!stg) return '';
    if (stg.id === 'admission') return t('journey.stepper.stage1Title', stg.title);
    if (stg.id === 'investigations') return t('journey.stepper.stage2Title', stg.title);
    if (stg.id === 'surgery') return t('journey.stepper.stage3Title', stg.title);
    if (stg.id === 'discharge' || stg.id === 'recovery') return t('journey.stepper.stage4Title', stg.title);
    return stg.title;
  };

  const getStageSubtitle = (stg) => {
    if (!stg) return '';
    if (stg.id === 'admission') return t('journey.stepper.stage1Subtitle', stg.subtitle);
    if (stg.id === 'investigations') return t('journey.stepper.stage2Subtitle', stg.subtitle);
    if (stg.id === 'surgery') return t('journey.stepper.stage3Subtitle', stg.subtitle);
    if (stg.id === 'discharge' || stg.id === 'recovery') return t('journey.stepper.stage4Subtitle', stg.subtitle);
    return stg.subtitle;
  };

  const isNetworkMatch = hospital?.networkInfo?.networkStatus === 'verified';

  return (
    <div className="discovery-page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Context Top Strip: Hospital + Active Policy + Provenance Status */}
      <section className="features" style={{ padding: '24px clamp(20px, 3.5vw, 36px)', borderRadius: 'var(--radius-lg)', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="pill-label" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
                {t('journey.badge', 'PATIENT CARE JOURNEY & FINANCIAL COPILOT')}
              </span>
            </div>
            <h1 className="section-heading" style={{ textAlign: 'left', fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
              {t('journey.title', 'Care Journey Tracker')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {t('journey.subtitle', 'Track each hospital phase with real-time insurance coverage expectations and plain-language guidance.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="pill-btn pill-btn-ghost" onClick={onBackToHospitals}>
              {t('journey.backToHospitals', 'Back to Hospitals')}
            </button>
            <button type="button" className="pill-btn pill-btn-ghost" onClick={onBackToPolicy}>
              {t('journey.viewPolicyTerms', 'View Policy Terms')}
            </button>
          </div>
        </div>

        {/* Hospital & Policy Snapshot row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', width: '100%' }}>
          {/* Hospital Cardlet */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} style={{ color: 'var(--color-text)', flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('journey.selectedHospital', 'Selected Hospital')}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {hospital?.hospital_name || 'Medical Center'}
              </div>
              <a
                href={getGoogleMapsUrl({
                  hospital_name: hospital?.hospital_name,
                  address: hospital?.address,
                  city: hospital?.city,
                  latitude: hospital?.latitude,
                  longitude: hospital?.longitude
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="hospital-map-link"
                style={{ fontSize: '12px', marginTop: '2px', alignItems: 'center' }}
                title={`Open "${hospital?.hospital_name || 'Hospital'}" in Google Maps`}
              >
                <span className="hospital-map-pin-btn" style={{ width: '18px', height: '18px' }}>
                  <MapPin size={11} />
                </span>
                <span className="hospital-address-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hospital?.address || (isNetworkMatch ? 'Network Hospital' : 'Healthcare Facility')}
                </span>
                <ExternalLink size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
              </a>
            </div>
          </div>

          {/* Policy Cardlet */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('journey.activeCover', 'Active Health Cover')}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                {policy?.insurer || 'Active Insurer'} • {policy?.planName || 'Plan'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                SI: <strong>₹{policy?.sumInsured ? Number(policy.sumInsured).toLocaleString('en-IN') : t('common.unlimited', 'Unlimited')}</strong> • Room Limit: <strong>{policy?.roomLimit ? (policy.roomLimit.type === 'amount' ? `₹${policy.roomLimit.value}/d` : `${policy.roomLimit.value}%`) : t('common.standard', 'Standard')}</strong> • Co-pay: <strong>{policy?.copay || 0}%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Interactive Stepper Navigation (Preserved) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId;
          const isDone = completedStages[stage.id];

          return (
            <div
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              style={{
                background: isActive ? 'var(--color-white)' : 'var(--color-surface)',
                border: isActive ? '2px solid var(--color-text)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: isDone ? '#dcfce7' : isActive ? 'var(--color-text)' : 'var(--color-border)',
                    color: isDone ? '#15803d' : isActive ? '#ffffff' : 'var(--color-text-secondary)'
                  }}
                >
                  {t('journey.stagePill', { stage: stage.stageNumber, duration: stage.duration, defaultValue: `Stage 0${stage.stageNumber} • ${stage.duration}` })}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStageCompletion(stage.id);
                  }}
                  title={isDone ? t('journey.markInProgress', 'Mark as In-Progress') : t('journey.markCompleted', 'Mark as Completed')}
                  style={{
                    border: 'none',
                    background: isDone ? '#16a34a' : 'transparent',
                    color: isDone ? '#ffffff' : 'var(--color-text-muted)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: isDone ? 'none' : '1.5px solid var(--color-border)'
                  }}
                >
                  {isDone ? <Check size={14} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
                </button>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                {getStageTitle(stage)}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {getStageSubtitle(stage)}
              </div>
            </div>
          );
        })}
      </section>

      {/* Active Stage Detailed View (Preserved) */}
      <section className="features" style={{ padding: '32px clamp(20px, 4vw, 40px)', gap: '28px', borderRadius: 'var(--radius-lg)' }}>
        {/* Stage Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pill-label" style={{ background: 'var(--color-text)', color: '#ffffff' }}>
                {t('journey.stageOfFour', { stage: activeStage.stageNumber, defaultValue: `STAGE 0${activeStage.stageNumber} OF 04` })}
              </span>
              <span className="pill-label">{activeStage.badge}</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {activeStage.duration}
              </span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {getStageTitle(activeStage)}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '6px', maxWidth: '720px', lineHeight: 1.5 }}>
              {activeStage.summary}
            </p>
          </div>

          <button
            type="button"
            className={`pill-btn ${completedStages[activeStage.id] ? 'pill-btn-ghost' : 'pill-btn-primary'}`}
            onClick={() => toggleStageCompletion(activeStage.id)}
            style={{ padding: '10px 22px', fontSize: '14px' }}
          >
            {completedStages[activeStage.id] ? t('journey.stageCompleted', '✓ Stage Marked Completed') : t('journey.markCompleted', 'Mark Stage as Complete')}
          </button>
        </div>

        {/* 1. Expected Insurance Coverage Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={18} style={{ color: '#16a34a' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('journey.coverageSectionTitle', 'Expected Insurance Coverage for This Phase')}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {activeStage.expectedCoverage.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {item.label}
                  </span>
                  <ProvenanceBadge type={item.provenance} size="xs" />
                </div>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: '4px 0' }}>
                  {item.value}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {item.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Contextual Suggestions & Alternatives */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Lightbulb size={18} style={{ color: '#eab308' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('journey.alternativesTitle', 'Smart Alternatives & Contextual Suggestions')}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {activeStage.alternatives.map((alt, idx) => {
              const isWarn = alt.type === 'warning';
              return (
                <div
                  key={idx}
                  style={{
                    background: isWarn ? '#fffbeb' : 'var(--color-white)',
                    border: isWarn ? '1px solid #fde68a' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isWarn ? (
                        <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                      ) : (
                        <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '15px', fontWeight: 700, color: isWarn ? '#92400e' : 'var(--color-text)' }}>
                        {alt.title}
                      </span>
                    </div>
                    <ProvenanceBadge type={alt.provenance || 'POLICY-DERIVED'} size="xs" />
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: isWarn ? '#b45309' : 'var(--color-text)' }}>
                    {alt.highlight}
                  </div>

                  <p style={{ fontSize: '13px', color: isWarn ? '#78350f' : 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {alt.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Patient Stage Checklist */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FileText size={18} style={{ color: 'var(--color-text)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('journey.checklistTitle', { stage: activeStage.stageNumber, defaultValue: `Actionable Patient Checklist for Stage 0${activeStage.stageNumber}` })}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeStage.checklist.map((item) => {
              const isChecked = checkedItems[item.id];
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 18px',
                    background: isChecked ? '#f0fdf4' : 'var(--color-surface)',
                    border: isChecked ? '1px solid #bbf7d0' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!isChecked}
                    onChange={() => toggleCheckItem(item.id)}
                    style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#16a34a', width: '16px', height: '16px' }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: isChecked ? '#166534' : 'var(--color-text)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      lineHeight: 1.4,
                      fontWeight: isChecked ? 500 : 600
                    }}
                  >
                    {item.text}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation for Stages */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', paddingTop: '20px', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          {activeStage.stageNumber > 1 ? (
            <button
              type="button"
              className="pill-btn pill-btn-ghost"
              onClick={() => setActiveStageId(stages[activeStage.stageNumber - 2].id)}
            >
              {t('journey.previousStage', { title: getStageTitle(stages[activeStage.stageNumber - 2]) })}
            </button>
          ) : <div />}

          {activeStage.stageNumber < stages.length ? (
            <button
              type="button"
              className="pill-btn pill-btn-primary"
              onClick={() => setActiveStageId(stages[activeStage.stageNumber].id)}
            >
              {t('journey.nextStage', { title: getStageTitle(stages[activeStage.stageNumber]) })}
            </button>
          ) : (
            <button
              type="button"
              className="pill-btn pill-btn-primary"
              onClick={onBackToHospitals}
            >
              {t('journey.finishTracker', 'Finish Tracker & Return to Hospitals ✓')}
            </button>
          )}
        </div>
      </section>

      {/* Universal Safeguards Box & Disclaimer */}
      <section className="strip" style={{ padding: '20px 28px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={22} style={{ color: '#16a34a', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>
              {t('journey.goldenRuleTitle', 'Golden Rule of Health Insurance Claims')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {t('journey.goldenRuleDesc', 'Never leave the hospital without the original signed discharge summary, detailed itemized final bill with pharmacy breakups, and payment receipts.')}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency / Non-Medical AI Safeguard Notice (Requirement 13) */}
      <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        <strong>{t('journey.healthcareDisclaimerTitle', 'Healthcare Decision Support Disclaimer:')}</strong> {t('journey.healthcareDisclaimerDesc', 'SehatSure provides insurance coverage estimation and financial trajectory planning. It does not provide medical diagnosis, clinical treatment recommendations, or advice regarding the timing of emergency healthcare.')}
      </div>
    </div>
  );
}
