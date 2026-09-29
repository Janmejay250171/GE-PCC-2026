import { describe, it, expect, beforeAll } from 'vitest';
import { hospitalService } from '../src/services/hospitalService.js';
import { PolicyDocument } from '../src/types/policy.js';

describe('Hospital Discovery, Ranking & Bill Breakdown Engine', () => {
  beforeAll(async () => {
    await hospitalService.initData();
  });

  it('should load datasets and extract cities', () => {
    const cities = hospitalService.getCities();
    expect(cities.length).toBeGreaterThan(10);
    const hasBengaluru = cities.some(c => c.name.toLowerCase() === 'bengaluru');
    expect(hasBengaluru).toBe(true);
  });

  it('should return taxonomy with specialties and procedures', () => {
    const taxonomy = hospitalService.getTaxonomy();
    expect(taxonomy.specialties.length).toBeGreaterThan(0);
    expect(taxonomy.specialties).toContain('Cardiology');
    expect(taxonomy.proceduresBySpecialty['Cardiology']).toBeDefined();
    expect(taxonomy.proceduresBySpecialty['Cardiology']).toContain('Angioplasty');
  });

  it('should filter hospitals by city and insurer, and rank by SehatSure formula', () => {
    const mockPolicy: PolicyDocument = {
      _id: 'test_star_policy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedByUser: true,
      insurer: 'Star Health',
      insurerAliases: ['Star Health and Allied Insurance', 'Star'],
      planName: 'Family Health Optima',
      policyType: 'private',
      policyNumber: 'P/TEST/2026',
      uin: 'SHAHLIP26046V092526',
      policyStartDate: '2026-04-01',
      policyEndDate: '2027-03-31',
      zone: 'Zone B',
      networkType: 'all-network',
      tpa: 'Medi Assist',
      insuredPersons: [],
      sumInsured: 300000,
      roomLimit: { type: 'amount', value: 3000 },
      icuLimit: { type: 'percent', value: 2 },
      copay: 10,
      nonNetworkCopay: 20,
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
      rawTextRef: null
    };

    const res = hospitalService.search({
      policy: mockPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology',
      procedure: 'Angioplasty',
      roomType: 'General Ward'
    });

    expect(res.hospitals.length).toBeGreaterThan(0);

    // Verify all ranked hospitals have valid SehatSure scores between 0 and 100
    for (const h of res.hospitals) {
      expect(h.score.finalScore).toBeGreaterThanOrEqual(0);
      expect(h.score.finalScore).toBeLessThanOrEqual(100);
      expect(h.score.coverageFit).toBeGreaterThanOrEqual(0);
      expect(h.score.coverageFit).toBeLessThanOrEqual(100);
      expect(h.score.patientCostFit).toBeGreaterThanOrEqual(0);
      expect(h.score.patientCostFit).toBeLessThanOrEqual(100);
      expect(h.score.hospitalTypeScore).toBeGreaterThanOrEqual(0);
      expect(h.score.hospitalTypeScore).toBeLessThanOrEqual(100);
      expect(h.score.coPayFit).toBeGreaterThanOrEqual(0);
      expect(h.score.coPayFit).toBeLessThanOrEqual(100);

      // Verify formula components:
      // FinalScore = 0.50*CoverageFit + 0.25*PatientCostFit + 0.15*HospitalTypeScore + 0.10*CoPayFit
      const expectedScore = Math.round(
        0.50 * h.score.coverageFit +
        0.25 * h.score.patientCostFit +
        0.15 * h.score.hospitalTypeScore +
        0.10 * h.score.coPayFit
      );
      expect(h.score.finalScore).toBe(expectedScore);
    }

    // Verify hospitals are sorted descending: verified network first, then specialty name relevance, then final score
    for (let i = 0; i < res.hospitals.length - 1; i++) {
      const curr = res.hospitals[i];
      const next = res.hospitals[i + 1];
      const currVerified = curr.networkInfo.networkStatus === 'verified' ? 1 : 0;
      const nextVerified = next.networkInfo.networkStatus === 'verified' ? 1 : 0;
      if (currVerified !== nextVerified) {
        expect(currVerified).toBeGreaterThan(nextVerified);
      } else {
        const currName = curr.specialtyNameMatch?.score || 0;
        const nextName = next.specialtyNameMatch?.score || 0;
        if (currName !== nextName) {
          expect(currName).toBeGreaterThan(nextName);
        } else {
          expect(curr.score.finalScore).toBeGreaterThanOrEqual(next.score.finalScore);
        }
      }
    }
  });

  it('should calculate detailed bill and detect room limit capping & proportionate deduction', () => {
    const mockPolicy: PolicyDocument = {
      _id: 'test_cap_policy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedByUser: true,
      insurer: 'Star Health',
      insurerAliases: [],
      planName: 'Family Plan',
      policyType: 'private',
      policyNumber: 'P/1234',
      uin: 'UIN123',
      policyStartDate: '2026-01-01',
      policyEndDate: '2027-01-01',
      zone: 'Zone A',
      networkType: 'all-network',
      tpa: null,
      insuredPersons: [],
      sumInsured: 300000,
      roomLimit: { type: 'amount', value: 2500 }, // Capped at ₹2,500/day
      icuLimit: null,
      copay: 10, // 10% co-pay
      nonNetworkCopay: 20,
      copayConditions: {},
      deductible: 0,
      proportionateDeduction: true, // Active proportionate deduction
      subLimits: {},
      restorationBenefit: false,
      cumulativeBonus: 0,
      exclusions: [],
      hasOtherExclusions: false,
      waitingPeriods: null,
      preHospitalizationDays: 30,
      postHospitalizationDays: 60,
      daycareCovered: true,
      ambulanceLimit: 1500,
      preAuthHours: 6,
      claimIntimationHours: 24,
      sourceSnippets: {},
      confidence: {},
      rawTextRef: null
    };

    const cities = hospitalService.getCities();
    const res = hospitalService.search({
      policy: mockPolicy,
      city: 'Bengaluru',
      specialty: 'Cardiology',
      procedure: 'CABG',
      roomType: 'Single Private Room' // Single private is much higher than ₹2500/day
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    const topHosp = res.hospitals[0];

    const breakdown = hospitalService.getDetailedBillBreakdown(
      topHosp.hospital.hospital_name,
      topHosp.hospital.address,
      mockPolicy,
      'Cardiology',
      'CABG',
      'Single Private Room'
    );

    expect(breakdown).not.toBeNull();
    if (breakdown) {
      expect(breakdown.itemizedBill.totalBill).toBeGreaterThan(0);
      expect(breakdown.itemizedBill.roomCharges).toBeGreaterThan(0);
      expect(breakdown.itemizedBill.procedureCharges).toBeGreaterThan(0);
      expect(breakdown.itemizedBill.doctorFees).toBeGreaterThan(0);

      // Single private room rate > ₹2500, so excess room rent must be detected
      expect(breakdown.totalRoomRentExcess).toBeGreaterThan(0);

      // Proportionate deduction must be triggered because proportionateDeduction is true and room exceeded
      expect(breakdown.proportionateDeductionActive).toBe(true);
      expect(breakdown.proportionateDisallowance).toBeGreaterThan(0);

      // AI recommendation should contain room limit warning
      const hasWarning = breakdown.aiRecommendations.some(r => r.type === 'warning');
      expect(hasWarning).toBe(true);
    }
  });
});
