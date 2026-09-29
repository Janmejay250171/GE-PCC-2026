import { describe, it, expect } from 'vitest';
import { journeyGuidanceEngine } from '../src/services/journeyGuidanceEngine.js';
import { PolicyDocument } from '../src/types/policy.js';
import {
  mockHospitalEventProvider,
  mockTPAProvider,
  mockNetworkProvider
} from '../src/services/integration/MockIntegrationProviders.js';

describe('Care Journey Guidance Engine & PCC 2026 Scenarios', () => {
  const basePolicy: PolicyDocument = {
    _id: 'test_policy_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmedByUser: true,
    insurer: 'HDFC ERGO General Insurance',
    insurerAliases: ['HDFC ERGO', 'HDFC'],
    planName: 'Optima Secure',
    policyType: 'private',
    sumInsured: 500000,
    roomLimit: { type: 'amount', value: 5000 },
    copay: 10,
    proportionateDeduction: true,
    policyNumber: 'HDFC/2026/PCC',
    uin: 'HDFCHLIP26001',
    policyStartDate: '2026-01-01',
    policyEndDate: '2026-12-31',
    zone: 'Zone A',
    networkType: 'all-network',
    tpa: 'Medi Assist',
    insuredPersons: [],
    icuLimit: { type: 'percent', value: 2 },
    nonNetworkCopay: 20,
    copayConditions: {},
    deductible: 0,
    subLimits: {},
    restorationBenefit: true,
    cumulativeBonus: 25000,
    exclusions: ['Cosmetic surgery', 'Weight loss'],
    hasOtherExclusions: false,
    waitingPeriods: null,
    preHospitalizationDays: 60,
    postHospitalizationDays: 180,
    daycareCovered: true,
    ambulanceLimit: 2000,
    preAuthHours: 24,
    claimIntimationHours: 48,
    sourceSnippets: {},
    confidence: {},
    rawTextRef: null
  };

  it('Scenario 1: Network hospital + eligible room produces INFO guidance without penalties', () => {
    const res = journeyGuidanceEngine.evaluateEvent({
      event: {
        eventType: 'ROOM_ASSIGNED',
        metadata: { newRoom: 'Twin Sharing', newRate: 4000 }
      },
      policy: basePolicy,
      hospitalName: 'Apollo Hospitals',
      roomType: 'Twin Sharing'
    });

    expect(res.normalizedEvent.severity).toBe('INFO');
    expect(res.updatedFinancialSnapshot.roomRentExcess).toBe(0);
    expect(res.updatedFinancialSnapshot.proportionateDisallowance).toBe(0);
    expect(res.insuranceImpact.whyExplanation.consequence).toContain('No proportionate deductions');
  });

  it('Scenario 2: Network hospital + room above limit triggers ATTENTION and proportionate deduction alert', () => {
    const res = journeyGuidanceEngine.evaluateEvent({
      event: {
        eventType: 'ROOM_CHANGED',
        metadata: { previousRoom: 'General Ward', newRoom: 'Single Private Room', newRate: 10000 }
      },
      policy: basePolicy,
      hospitalName: 'Apollo Hospitals',
      roomType: 'Single Private Room'
    });

    expect(res.normalizedEvent.severity).toBe('ATTENTION');
    expect(res.insuranceImpact.hasImpact).toBe(true);
    expect(res.alert).not.toBeNull();
    expect(res.updatedFinancialSnapshot.roomRentExcess).toBeGreaterThan(0);
    expect(res.updatedFinancialSnapshot.proportionateDisallowance).toBeGreaterThan(0);
    expect(res.insuranceImpact.whyExplanation.policyRule).toContain('5,000');
    expect(res.insuranceImpact.whyExplanation.patientValue).toContain('10,000');
  });

  it('Scenario 3: Pre-auth pending triggers informational advisory without clinical intervention', () => {
    const res = journeyGuidanceEngine.evaluateEvent({
      event: {
        eventType: 'PREAUTH_PENDING',
        metadata: { queueTime: '2 hours' }
      },
      policy: basePolicy,
      hospitalName: 'Manipal Hospital'
    });

    expect(res.normalizedEvent.severity).toBe('ATTENTION');
    expect(res.insuranceImpact.summary).toContain('awaiting authorization');
    expect(res.insuranceImpact.implications).toContain('This is informational only. Final authorization remains with the insurer/TPA.');
  });

  it('Scenario 4: Pre-auth rejected triggers CRITICAL reimbursement warning', () => {
    const res = journeyGuidanceEngine.evaluateEvent({
      event: {
        eventType: 'PREAUTH_REJECTED',
        metadata: { reason: 'Initial documentation incomplete' }
      },
      policy: basePolicy,
      hospitalName: 'Fortis Hospital'
    });

    expect(res.normalizedEvent.severity).toBe('CRITICAL');
    expect(res.normalizedEvent.requiresAction).toBe(true);
    expect(res.insuranceImpact.implications.some(i => i.includes('reimbursement'))).toBe(true);
  });

  it('Scenario 5: Emergency event triggers explicit safety notice overriding financial delays', () => {
    const res = journeyGuidanceEngine.evaluateEvent({
      event: {
        eventType: 'ADMISSION_COMPLETED',
        isEmergency: true
      },
      policy: basePolicy,
      hospitalName: 'Apollo Hospitals',
      isEmergency: true
    });

    expect(res.normalizedEvent.isEmergency).toBe(true);
    const hasEmergencyNotice = res.insuranceImpact.implications.some(i =>
      i.includes('EMERGENCY CARE PRINCIPLE')
    );
    expect(hasEmergencyNotice).toBe(true);
  });

  it('Scenario 6: Mock integration providers emit properly labeled simulated events', async () => {
    const emitted = await mockHospitalEventProvider.emitEvent({
      id: 'test_evt',
      patientId: 'pat_1',
      timestamp: new Date().toISOString(),
      eventType: 'ADMISSION_COMPLETED',
      stage: 'ADMISSION',
      source: 'SIMULATED_HOSPITAL_FEED',
      status: 'COMPLETED',
      metadata: {},
      requiresAction: false,
      severity: 'INFO',
      provenance: 'SIMULATED DEMO EVENT'
    });

    expect(emitted.source).toBe('SIMULATED_HOSPITAL_FEED');
    expect(emitted.provenance).toBe('SIMULATED DEMO EVENT');

    const tpaAuth = await mockTPAProvider.submitPreAuth({
      patientId: 'pat_1',
      policyId: 'pol_1',
      hospitalName: 'Apollo Hospitals',
      treatingDoctor: 'Dr. Ramesh Rao',
      diagnosis: 'Acute appendicitis',
      estimatedCost: 80000,
      roomCategory: 'General Ward'
    });

    expect(tpaAuth.status).toBe('APPROVED');
    expect(tpaAuth.source).toBe('SIMULATED_TPA_FEED');
  });
});
