import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { hospitalService, parseCSVRecords } from '../src/services/hospitalService.js';
import { applyTier2Defaults } from '../src/services/overrideService.js';
import { getCareJourneyPlan } from '../../frontend/src/utils/careJourneyAdvisor.js';
import { PolicyDocument } from '../src/types/policy.js';

describe('SehatSure Product Audit Regression Test Suite', () => {
  beforeAll(async () => {
    await hospitalService.initData();
  });

  const basePolicy: PolicyDocument = {
    _id: 'test_regression_policy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmedByUser: true,
    insurer: 'Star Health',
    insurerAliases: ['Star Health and Allied Insurance', 'Star'],
    planName: 'Comprehensive Health Plan',
    policyType: 'private',
    policyNumber: 'P/REG/2026',
    uin: 'UIN-REG-2026',
    policyStartDate: '2026-04-01',
    policyEndDate: '2027-03-31',
    zone: 'Zone A',
    networkType: null,
    tpa: null,
    insuredPersons: [],
    sumInsured: 500000,
    roomLimit: { type: 'amount', value: 2500 },
    icuLimit: null,
    copay: 10,
    nonNetworkCopay: null,
    copayConditions: {},
    deductible: null,
    proportionateDeduction: true,
    subLimits: {},
    restorationBenefit: null,
    cumulativeBonus: null,
    exclusions: [],
    hasOtherExclusions: false,
    waitingPeriods: null,
    preHospitalizationDays: null,
    postHospitalizationDays: null,
    daycareCovered: null,
    ambulanceLimit: null,
    preAuthHours: null,
    claimIntimationHours: null,
    sourceSnippets: {},
    confidence: {},
    rawTextRef: null
  };

  // =========================================================================
  // P0.1: One Authoritative Backend Financial Calculation
  // =========================================================================
  describe('P0.1 — Authoritative Financial Parity between Ranking and Detailed Breakdown', () => {
    it('guarantees ranking.patientPayable === breakdown.totalPatientPayable and insurer share matches', () => {
      const searchRes = hospitalService.search({
        policy: basePolicy,
        city: 'Bengaluru',
        specialty: 'Cardiology',
        procedure: 'CABG',
        roomType: 'Single Private Room' // Single Private triggers room limit & proportionate deduction
      });

      expect(searchRes.hospitals.length).toBeGreaterThan(0);

      for (const item of searchRes.hospitals.slice(0, 5)) {
        const breakdown = hospitalService.getDetailedBillBreakdown(
          item.hospital.hospital_name,
          item.hospital.address,
          basePolicy,
          'Cardiology',
          'CABG',
          'Single Private Room'
        );

        expect(breakdown).not.toBeNull();
        if (breakdown) {
          // Canonical financial invariant: ranking MUST equal breakdown
          expect(item.score.patientPayable).toBe(breakdown.totalPatientPayable);
          expect(item.score.insurerEstimatedShare).toBe(breakdown.totalInsuranceCovered);

          // Sub-components must match
          expect(item.score.totalRoomRentExcess).toBe(breakdown.totalRoomRentExcess);
          expect(item.score.proportionateDisallowance).toBe(breakdown.proportionateDisallowance);
          expect(item.score.coPayAmount).toBe(breakdown.copayAmount);
        }
      }
    });

    it('handles proportionate deduction cases consistently across ranking and breakdown', () => {
      const policyWithRoomLimit: PolicyDocument = {
        ...basePolicy,
        roomLimit: { type: 'amount', value: 2000 },
        proportionateDeduction: true
      };

      const searchRes = hospitalService.search({
        policy: policyWithRoomLimit,
        city: 'Bengaluru',
        specialty: 'Cardiology',
        procedure: 'Angioplasty',
        roomType: 'Single Private Room'
      });

      expect(searchRes.hospitals.length).toBeGreaterThan(0);
      const top = searchRes.hospitals[0];

      const breakdown = hospitalService.getDetailedBillBreakdown(
        top.hospital.hospital_name,
        top.hospital.address,
        policyWithRoomLimit,
        'Cardiology',
        'Angioplasty',
        'Single Private Room'
      );

      expect(breakdown).not.toBeNull();
      expect(top.score.proportionateDisallowance).toBeGreaterThan(0);
      expect(top.score.patientPayable).toBe(breakdown?.totalPatientPayable);
      expect(top.score.insurerEstimatedShare).toBe(breakdown?.totalInsuranceCovered);
    });
  });

  // =========================================================================
  // P0.2 & P2.1: Deductible Handling vs Modelled Non-Medical Consumables
  // =========================================================================
  describe('P0.2 & P2.1 — Deductible Handling vs Modelled Non-Medical Allowance', () => {
    const sampleEstimate = {
      level: 'procedure' as const,
      baseTreatmentCost: 50000,
      hospitalVariation: 1,
      treatmentCost: 50000,
      roomCost: 6000,
      roomCostPerDay: 2000,
      estimatedStayDays: 3,
      totalCost: 86000,
      displayLow: 80000,
      displayHigh: 90000
    };

    it('applies explicit deductible = 0 correctly', () => {
      const pZero: PolicyDocument = { ...basePolicy, deductible: 0 };
      const impact = hospitalService.calculatePolicyImpact(sampleEstimate, pZero, 'verified');

      expect(impact.deductibleApplied).toBe(0);
      expect(impact.deductibleUnknown).toBe(false);
      expect(impact.modelledNonMedicalAllowance).toBe(Math.round(86000 * 0.05));
    });

    it('applies explicit deductible = 5000 correctly and increases patient payable', () => {
      const pZero: PolicyDocument = { ...basePolicy, deductible: 0 };
      const p5000: PolicyDocument = { ...basePolicy, deductible: 5000 };

      const impact0 = hospitalService.calculatePolicyImpact(sampleEstimate, pZero, 'verified');
      const impact5000 = hospitalService.calculatePolicyImpact(sampleEstimate, p5000, 'verified');

      expect(impact5000.deductibleApplied).toBe(5000);
      expect(impact5000.deductibleUnknown).toBe(false);
      expect(impact5000.patientPayable).toBeGreaterThan(impact0.patientPayable);
    });

    it('preserves deductible = null as explicitly unknown without silently assuming zero', () => {
      const pNull: PolicyDocument = { ...basePolicy, deductible: null };
      const impact = hospitalService.calculatePolicyImpact(sampleEstimate, pNull, 'verified');
      expect(impact.deductibleApplied).toBeNull();
      expect(impact.deductibleUnknown).toBe(true);
    });
  });

  // =========================================================================
  // P0.3: Non-Network Co-pay Default Removal
  // =========================================================================
  describe('P0.3 — Safe Non-Network Co-pay Handling', () => {
    const sampleEstimate = {
      level: 'procedure' as const,
      baseTreatmentCost: 50000,
      hospitalVariation: 1,
      treatmentCost: 50000,
      roomCost: 6000,
      roomCostPerDay: 2000,
      estimatedStayDays: 3,
      totalCost: 86000,
      displayLow: 80000,
      displayHigh: 90000
    };

    it('preserves nonNetworkCopay = null when copay = 10 during normalization', () => {
      const doc: Partial<PolicyDocument> = {
        ...basePolicy,
        copay: 10,
        nonNetworkCopay: undefined
      };

      applyTier2Defaults(doc);
      expect(doc.nonNetworkCopay).toBeNull();
    });

    it('flags non-network calculations as uncertain when nonNetworkCopay is null', () => {
      const pUncertain: PolicyDocument = {
        ...basePolicy,
        copay: 10,
        nonNetworkCopay: null
      };

      const impact = hospitalService.calculatePolicyImpact(sampleEstimate, pUncertain, 'no_match');

      expect(impact.isCopayUncertain).toBe(true);
      expect(impact.copayAmount).toBe(0);
    });
  });

  // =========================================================================
  // P0.5: Network Type Default Removal
  // =========================================================================
  describe('P0.5 — Network Type Preservation', () => {
    it('preserves networkType = null instead of defaulting to all-network', () => {
      const doc: Partial<PolicyDocument> = {
        ...basePolicy,
        networkType: undefined
      };

      applyTier2Defaults(doc);
      expect(doc.networkType).toBeNull();
    });
  });

  // =========================================================================
  // P0.6: Statutory Schemes Consistency (PM-JAY & ESI)
  // =========================================================================
  describe('P0.6 — PM-JAY and ESI Financial Consistency', () => {
    it('guarantees ranking and detailed breakdown agree for PM-JAY empanelled facilities', () => {
      const pmjayPolicy: PolicyDocument = {
        ...basePolicy,
        _id: 'pmjay_policy_test',
        policyType: 'pmjay',
        insurer: 'PMJAY',
        copay: 0,
        deductible: 0
      };

      const searchRes = hospitalService.search({
        policy: pmjayPolicy,
        city: 'Bengaluru',
        specialty: 'General Medicine',
        roomType: 'General Ward'
      });

      const pmjayHosp = searchRes.hospitals.find(h => h.networkInfo.networkStatus === 'verified');
      if (pmjayHosp) {
        const breakdown = hospitalService.getDetailedBillBreakdown(
          pmjayHosp.hospital.hospital_name,
          pmjayHosp.hospital.address,
          pmjayPolicy,
          'General Medicine',
          undefined,
          'General Ward'
        );

        expect(pmjayHosp.score.patientPayable).toBe(0);
        expect(breakdown?.totalPatientPayable).toBe(0);
        expect(pmjayHosp.score.insurerEstimatedShare).toBe(breakdown?.totalInsuranceCovered);
      }
    });

    it('guarantees ranking and detailed breakdown agree for ESI empanelled facilities', () => {
      const esiPolicy: PolicyDocument = {
        ...basePolicy,
        _id: 'esi_policy_test',
        policyType: 'esi',
        insurer: 'ESIC',
        copay: 0,
        deductible: 0
      };

      const searchRes = hospitalService.search({
        policy: esiPolicy,
        city: 'Bengaluru',
        specialty: 'General Medicine',
        roomType: 'General Ward'
      });

      const esiHosp = searchRes.hospitals.find(h => h.networkInfo.networkStatus === 'verified');
      if (esiHosp) {
        const breakdown = hospitalService.getDetailedBillBreakdown(
          esiHosp.hospital.hospital_name,
          esiHosp.hospital.address,
          esiPolicy,
          'General Medicine',
          undefined,
          'General Ward'
        );

        expect(esiHosp.score.patientPayable).toBe(0);
        expect(breakdown?.totalPatientPayable).toBe(0);
      }
    });
  });

  // =========================================================================
  // P0.7 & P2.4: Multiline CSV Parsing & Dataset Validation
  // =========================================================================
  describe('P0.7 & P2.4 — Multiline CSV Parsing & Dataset Validation', () => {
    it('parses multiline quoted addresses as exactly one record', () => {
      const sampleCSV = `hospital_name,hospital_type,address,insurers,rating,specialties,tier,segment
Apollo Speciality,Private,"154/11 Bannerghatta Road
Opposite IIM, Bengaluru, Karnataka 560076",Star Health;HDFC ERGO,4.5,Cardiology;Oncology,Metro 1,Premium`;

      const records = parseCSVRecords(sampleCSV);
      expect(records.length).toBe(2); // Header + 1 data record
      expect(records[1][0]).toBe('Apollo Speciality');
      expect(records[1][2]).toBe('154/11 Bannerghatta Road\nOpposite IIM, Bengaluru, Karnataka 560076');
    });

    it('handles commas and escaped quotes inside quoted fields', () => {
      const sampleCSV = `hospital_name,hospital_type,address,insurers,rating,specialties,tier,segment
"St. John""s Medical College",Private,"Sarjapur Road, John's Nagar, Bengaluru",Star Health,4.4,General Medicine,Metro 1,Established`;

      const records = parseCSVRecords(sampleCSV);
      expect(records.length).toBe(2);
      expect(records[1][0]).toBe('St. John"s Medical College');
      expect(records[1][2]).toBe("Sarjapur Road, John's Nagar, Bengaluru");
    });

    it('reports dataset validation statistics upon initialization', () => {
      const stats = hospitalService.getDatasetStats();
      expect(stats.totalRecordsParsed).toBeGreaterThan(50000);
      expect(stats.validRecordsLoaded).toBeGreaterThan(50000);
      const cities = hospitalService.getCities();
      expect(cities.length).toBeGreaterThan(10);
    });
  });

  // =========================================================================
  // P0.8: Security of Uploaded Policy PDFs
  // =========================================================================
  describe('P0.8 — Uploaded Policy Document Security', () => {
    it('does not expose /uploads statically via unauthenticated direct URL', async () => {
      const res = await request(app).get('/uploads/test_policy.pdf');
      // Express static was removed, so this route returns 404
      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // P1.8: Contextual procedureMatchedCount
  // =========================================================================
  describe('P1.8 — Contextual procedureMatchedCount Semantics', () => {
    it('counts procedure matches within the selected specialty context', () => {
      const resWithoutProcedure = hospitalService.search({
        policy: basePolicy,
        city: 'Bengaluru',
        specialty: 'Cardiology'
      });

      const resWithProcedure = hospitalService.search({
        policy: basePolicy,
        city: 'Bengaluru',
        specialty: 'Cardiology',
        procedure: 'Angioplasty'
      });

      expect(resWithProcedure.procedureMatchedCount).toBeLessThanOrEqual(resWithProcedure.specialtyMatchedCount);
      expect(resWithProcedure.procedureMatchedCount).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Care Journey Provenance & Guarantee Removal (P1.10, P1.11, P1.12)
  // =========================================================================
  describe('Care Journey — Guarantee Removal & Provenance Tagging', () => {
    it('removes guarantee language from all care journey stages', () => {
      const stages = getCareJourneyPlan({
        policy: basePolicy,
        hospital: { hospital_name: 'Manipal Hospital', networkInfo: { networkStatus: 'verified' } },
        procedure: 'Angioplasty',
        roomType: 'General Ward'
      });

      const jsonStr = JSON.stringify(stages).toLowerCase();
      expect(jsonStr).not.toContain('guarantees');
      expect(jsonStr).not.toContain('100% reimbursable');
      expect(jsonStr).not.toContain('100% payable');
    });

    it('marks policy-derived windows when present on policy', () => {
      const customPolicy: PolicyDocument = {
        ...basePolicy,
        preHospitalizationDays: 45,
        postHospitalizationDays: 90,
        daycareCovered: true,
        preAuthHours: 12
      };

      const stages = getCareJourneyPlan({
        policy: customPolicy,
        hospital: { hospital_name: 'Manipal Hospital', networkInfo: { networkStatus: 'verified' } },
        procedure: 'Angioplasty',
        roomType: 'General Ward'
      });

      const diagStage = stages.find(s => s.id === 'investigation');
      const preHosp = diagStage?.expectedCoverage.find(c => c.label.includes('Pre-Hospitalization'));
      expect(preHosp?.value).toBe('45 Days');
      expect(preHosp?.provenance).toBe('Policy-derived');

      const recoveryStage = stages.find(s => s.id === 'recovery');
      const postHosp = recoveryStage?.expectedCoverage.find(c => c.label.includes('Post-Hospitalization'));
      expect(postHosp?.value).toBe('90 Days');
      expect(postHosp?.provenance).toBe('Policy-derived');
    });

    it('shows "Not established from uploaded policy" when policy windows are unstated', () => {
      const stages = getCareJourneyPlan({
        policy: basePolicy, // has preHospitalizationDays: null, postHospitalizationDays: null
        hospital: { hospital_name: 'Manipal Hospital', networkInfo: { networkStatus: 'verified' } },
        procedure: 'Angioplasty',
        roomType: 'General Ward'
      });

      const diagStage = stages.find(s => s.id === 'investigation');
      const preHosp = diagStage?.expectedCoverage.find(c => c.label.includes('Pre-Hospitalization'));
      expect(preHosp?.value).toBe('Not established from uploaded policy');
      expect(preHosp?.provenance).toBe('Reference guidance');
    });
  });

  // =========================================================================
  // P3: Mathematical Parity: Stay Days, Room Rent, and Accounting Identity
  // =========================================================================
  describe('P3 — Mathematical Parity: Stay Days, Room Rent, and Accounting Identity', () => {
    it('guarantees stayDays is an integer and roomCost strictly equals roomCostPerDay * stayDays', () => {
      const searchRes = hospitalService.search({
        policy: basePolicy,
        city: 'Chennai',
        specialty: 'Cardiology',
        roomType: 'General Ward'
      });
      expect(searchRes.hospitals.length).toBeGreaterThan(0);
      const item = searchRes.hospitals[0];

      const estimate = hospitalService.calculateHospitalEstimate(item.hospital, 'Cardiology', undefined, 'General Ward');
      expect(estimate.available).toBe(true);

      // Inpatient stay days must be discrete integer days
      expect(Number.isInteger(estimate.estimatedStayDays)).toBe(true);
      expect(estimate.estimatedStayDays).toBeGreaterThanOrEqual(1);

      // Room cost must equal rate * stayDays exactly
      expect(estimate.roomCost).toBe(estimate.roomCostPerDay * estimate.estimatedStayDays);

      // Total cost must equal sum of its constituent items
      const doctorFees = Math.round(estimate.treatmentCost * 0.20);
      const medicineCharges = Math.round(estimate.treatmentCost * 0.10);
      expect(estimate.totalCost).toBe(estimate.treatmentCost + doctorFees + medicineCharges + estimate.roomCost);
    });

    it('guarantees detailed bill breakdown has exact parity with estimate and accounting identity holds', () => {
      const searchRes = hospitalService.search({
        policy: basePolicy,
        city: 'Chennai',
        specialty: 'Cardiology',
        roomType: 'General Ward'
      });
      expect(searchRes.hospitals.length).toBeGreaterThan(0);
      const item = searchRes.hospitals[0];

      const breakdown = hospitalService.getDetailedBillBreakdown(
        item.hospital.hospital_name,
        item.hospital.address,
        basePolicy,
        'Cardiology',
        undefined,
        'General Ward'
      );

      expect(breakdown).not.toBeNull();
      if (!breakdown) return;

      const { itemizedBill, totalPatientPayable, totalInsuranceCovered } = breakdown;

      // Mathematical identity: roomCharges = roomRatePerDay * stayDays
      expect(itemizedBill.roomCharges).toBe(itemizedBill.roomRatePerDay * itemizedBill.stayDays);

      // Line item summation
      const expectedTotal = itemizedBill.procedureCharges +
        itemizedBill.doctorFees +
        itemizedBill.medicineCharges +
        itemizedBill.roomCharges +
        itemizedBill.otherCharges;
      expect(itemizedBill.totalBill).toBe(expectedTotal);

      // Accounting identity: Patient Payable + Insurer Payable = Total Bill
      expect(totalPatientPayable + totalInsuranceCovered).toBe(itemizedBill.totalBill);
    });
  });
});
