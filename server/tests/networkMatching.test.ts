import { describe, it, expect, beforeAll } from 'vitest';
import { hospitalService } from '../src/services/hospitalService.js';
import {
  getHospitalNetworkStatus,
  normalizeInsurer,
  getCanonicalInsurerKey
} from '../src/services/networkMatchingService.js';
import { HospitalRecord } from '../src/types/hospital.js';
import { PolicyDocument } from '../src/types/policy.js';

describe('Authoritative Insurer & Network Matching Engine', () => {
  beforeAll(async () => {
    await hospitalService.initData();
  });

  const baseHospital: HospitalRecord = {
    hospital_name: 'City Care Multispeciality Hospital',
    hospital_type: 'Private',
    address: '123 MG Road, Bengaluru, Karnataka',
    city: 'Bengaluru',
    insurers: ['HDFC', 'Star Health', 'ICICI Lombard'],
    insurersRaw: 'HDFC,Star Health,ICICI Lombard',
    rating: 4.5,
    specialties: ['Cardiology', 'Orthopedics', 'General Surgery'],
    tier: 'Metro 1',
    segment: 'Established'
  };

  const createMockPolicy = (overrides: Partial<PolicyDocument> = {}): PolicyDocument => ({
    _id: `test_policy_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmedByUser: true,
    insurer: 'HDFC ERGO General Insurance Company Limited',
    insurerAliases: ['HDFC ERGO', 'HDFC'],
    planName: 'Health Suraksha',
    policyType: 'private',
    policyNumber: 'HDFC/POL/2026/01',
    uin: 'HDFHLIP2026',
    policyStartDate: '2026-01-01',
    policyEndDate: '2027-01-01',
    zone: 'Zone A',
    networkType: 'all-network',
    tpa: null,
    insuredPersons: [],
    sumInsured: 500000,
    roomLimit: { type: 'percent', value: 1 },
    icuLimit: null,
    copay: 10,
    nonNetworkCopay: 25,
    copayConditions: {},
    deductible: 0,
    proportionateDeduction: true,
    subLimits: {},
    restorationBenefit: true,
    cumulativeBonus: 0,
    exclusions: [],
    hasOtherExclusions: false,
    waitingPeriods: null,
    preHospitalizationDays: 30,
    postHospitalizationDays: 60,
    daycareCovered: true,
    ambulanceLimit: 2000,
    preAuthHours: 6,
    claimIntimationHours: 24,
    sourceSnippets: {},
    confidence: {},
    rawTextRef: null,
    ...overrides
  });

  // Test 1: HDFC ERGO requested, Hospital insurer = HDFC ERGO -> verified
  it('Test 1: HDFC ERGO requested & Hospital insurer contains HDFC ERGO / alias -> verified', () => {
    const hosp: HospitalRecord = {
      ...baseHospital,
      insurers: ['HDFC ERGO General Insurance', 'Care Health']
    };
    const res = getHospitalNetworkStatus(hosp, 'HDFC ERGO General Insurance Company Limited');
    expect(res.networkStatus).toBe('verified');
    expect(res.matchEvidence).toBe('HDFC ERGO General Insurance');
    expect(['exact', 'canonical_alias']).toContain(res.matchMethod);
  });

  // Test 2: HDFC ERGO requested, Hospital insurer = ICICI Lombard -> no_match
  it('Test 2: HDFC ERGO requested & Hospital insurer = ICICI Lombard only -> no_match', () => {
    const hosp: HospitalRecord = {
      ...baseHospital,
      insurers: ['ICICI Lombard General Insurance', 'Max Bupa']
    };
    const res = getHospitalNetworkStatus(hosp, 'HDFC ERGO');
    expect(res.networkStatus).toBe('no_match');
    expect(res.matchedInsurer).toBeNull();
    expect(res.matchEvidence).toBeNull();
    expect(res.matchMethod).toBe('no_match');
  });

  // Test 3: HDFC ERGO requested, Hospital insurer field missing -> unverified
  it('Test 3: HDFC ERGO requested & Hospital insurer field is missing / empty -> unverified', () => {
    const hospEmpty: HospitalRecord = {
      ...baseHospital,
      insurers: [],
      insurersRaw: ''
    };
    const res = getHospitalNetworkStatus(hospEmpty, 'HDFC ERGO');
    expect(res.networkStatus).toBe('unverified');
    expect(res.matchedInsurer).toBeNull();
    expect(res.matchMethod).toBe('insufficient_data');
  });

  // Test 4: HDFC ERGO requested, No hospitals match HDFC ERGO -> DO NOT return all hospitals as verified
  it('Test 4: Unmatched insurer search must NEVER return unverified or no_match hospitals as verified', () => {
    const fictitiousPolicy = createMockPolicy({
      insurer: 'Fictitious Unknown Insurer Ltd',
      insurerAliases: []
    });

    const res = hospitalService.search({
      policy: fictitiousPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology'
    });

    expect(res.networkFacilityCount).toBe(0);
    // Every single returned hospital must have networkStatus !== 'verified'
    for (const item of res.hospitals) {
      expect(item.networkInfo.networkStatus).not.toBe('verified');
      expect(['no_match', 'unverified']).toContain(item.networkInfo.networkStatus);
    }
  });

  // Test 5: Network-only search with zero verified matches -> results = [], networkFacilityCount = 0
  it('Test 5: Network-only search with zero verified matches returns empty results and networkFacilityCount = 0', () => {
    const fictitiousPolicy = createMockPolicy({
      insurer: 'Nonexistent Insurer Private Limited',
      insurerAliases: []
    });

    const res = hospitalService.search({
      policy: fictitiousPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology',
      networkOnly: true
    });

    expect(res.hospitals).toEqual([]);
    expect(res.totalCount).toBe(0);
    expect(res.networkFacilityCount).toBe(0);
    expect(res.networkStatus).toBe('no_match');
    expect(res.message).toBe('No verified network hospitals were found for this insurer in the selected location.');
  });

  // Test 6: All-hospitals search with zero verified network matches -> hospitals returned with explicit networkStatus
  it('Test 6: All-hospitals search returns hospitals with explicit non-verified networkStatus without converting to verified', () => {
    const fictitiousPolicy = createMockPolicy({
      insurer: 'Zeta Health Insurance Co',
      insurerAliases: []
    });

    const res = hospitalService.search({
      policy: fictitiousPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology',
      networkOnly: false
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    expect(res.networkFacilityCount).toBe(0);
    expect(res.specialtyMatchedCount).toBeGreaterThan(0);

    for (const h of res.hospitals) {
      expect(h.networkInfo).toBeDefined();
      expect(h.networkInfo.networkStatus).not.toBe('verified');
      expect(['no_match', 'unverified']).toContain(h.networkInfo.networkStatus);
    }
  });

  // Test 7: Specialty matches but insurer does not -> specialtyMatchedCount > 0, networkFacilityCount = 0
  it('Test 7: Specialty matches but insurer does not -> specialtyMatchedCount > 0 and networkFacilityCount = 0', () => {
    const unmatchedPolicy = createMockPolicy({
      insurer: 'Nonexistent Global Health Co',
      insurerAliases: []
    });

    const res = hospitalService.search({
      policy: unmatchedPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology'
    });

    expect(res.specialtyMatchedCount).toBeGreaterThan(0);
    expect(res.networkFacilityCount).toBe(0);
  });

  // Test 8: Procedure matches but insurer does not -> procedureMatchedCount > 0, networkFacilityCount = 0
  it('Test 8: Procedure matches but insurer does not -> procedureMatchedCount > 0 and networkFacilityCount = 0', () => {
    const unmatchedPolicy = createMockPolicy({
      insurer: 'Nonexistent Global Health Co',
      insurerAliases: []
    });

    const res = hospitalService.search({
      policy: unmatchedPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology',
      procedure: 'Angioplasty'
    });

    expect(res.procedureMatchedCount).toBeGreaterThan(0);
    expect(res.networkFacilityCount).toBe(0);
  });

  // Test 9: False-positive prevention: short insurer tokens do not match unrelated strings
  it('Test 9: Short insurer tokens must NOT match unrelated substring tokens (No false positives)', () => {
    const hosp1: HospitalRecord = {
      ...baseHospital,
      insurers: ['Eastern Star Care Facility', 'Allied Diagnostics']
    };
    // "Star Health" should NOT match "Eastern Star Care Facility"
    const starRes = getHospitalNetworkStatus(hosp1, 'Star Health and Allied Insurance');
    expect(starRes.networkStatus).toBe('no_match');

    const hosp2: HospitalRecord = {
      ...baseHospital,
      insurers: ['Daycare Clinic', 'Primary Healthcare Center']
    };
    // "Care Health" should NOT match "Daycare Clinic"
    const careRes = getHospitalNetworkStatus(hosp2, 'Care Health Insurance');
    expect(careRes.networkStatus).toBe('no_match');

    const hosp3: HospitalRecord = {
      ...baseHospital,
      insurers: ['Maximal Health Institute']
    };
    // "Max Bupa" should NOT match "Maximal Health Institute"
    const maxRes = getHospitalNetworkStatus(hosp3, 'Max Bupa Health Insurance');
    expect(maxRes.networkStatus).toBe('no_match');
  });

  // Test 10: Unknown policy insurer -> networkStatus: "unknown"
  it('Test 10: Unspecified or empty policy insurer produces networkStatus: "unknown"', () => {
    const hosp = { ...baseHospital };
    const res1 = getHospitalNetworkStatus(hosp, null);
    expect(res1.networkStatus).toBe('unknown');

    const res2 = getHospitalNetworkStatus(hosp, '');
    expect(res2.networkStatus).toBe('unknown');

    const res3 = getHospitalNetworkStatus(hosp, '   ');
    expect(res3.networkStatus).toBe('unknown');
  });

  // Test 11: Canonical alias resolution for dataset abbreviation (e.g., "HDFC" -> HDFC ERGO)
  it('Test 11: Canonical alias correctly recognizes dataset abbreviation HDFC as HDFC ERGO', () => {
    const hosp: HospitalRecord = {
      ...baseHospital,
      insurers: ['HDFC', 'ICICI Lombard']
    };
    const res = getHospitalNetworkStatus(hosp, 'HDFC ERGO General Insurance');
    expect(res.networkStatus).toBe('verified');
    expect(res.matchMethod).toBe('canonical_alias');
    expect(res.matchEvidence).toBe('HDFC');
  });

  // Test 12: Ranking prioritizes verified network hospitals
  it('Test 12: Hospital ranking prioritizes verified network hospitals above non-network hospitals', () => {
    const policy = createMockPolicy({
      insurer: 'Star Health',
      insurerAliases: ['Star Health and Allied Insurance']
    });

    const res = hospitalService.search({
      policy,
      city: 'Bengaluru',
      specialty: 'Cardiology'
    });

    expect(res.hospitals.length).toBeGreaterThan(0);

    // If both verified and non-verified hospitals exist, all verified must precede non-verified
    let seenNonVerified = false;
    for (const item of res.hospitals) {
      if (item.networkInfo.networkStatus === 'verified') {
        expect(seenNonVerified).toBe(false);
      } else {
        seenNonVerified = true;
      }
    }
  });

  // Test 13: Detailed bill breakdown incorporates network status and applies non-network copay
  it('Test 13: Detailed bill breakdown identifies non-network hospital and applies nonNetworkCopay', () => {
    const policy = createMockPolicy({
      insurer: 'Nonexistent Insurer Co',
      insurerAliases: [],
      copay: 10,
      nonNetworkCopay: 25
    });

    const breakdown = hospitalService.getDetailedBillBreakdown(
      baseHospital.hospital_name,
      baseHospital.address,
      policy,
      'Cardiology',
      'Angioplasty',
      'General Ward'
    );

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      expect(breakdown.networkInfo.networkStatus).toBe('no_match');
      expect(breakdown.copayPercent).toBe(25); // Applied nonNetworkCopay
      const hasReimbursementAlert = breakdown.aiRecommendations.some(r =>
        r.title.toLowerCase().includes('reimbursement') || r.title.toLowerCase().includes('no verified network')
      );
      expect(hasReimbursementAlert).toBe(true);
    }
  });
});
