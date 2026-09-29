import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateSpecialtyNameRelevance,
  normalizeSpecialtyKey,
  SPECIALTY_NAME_KEYWORDS
} from '../src/config/specialtyNameKeywords.js';
import { hospitalService } from '../src/services/hospitalService.js';
import { HospitalRecord } from '../src/types/hospital.js';
import { PolicyDocument } from '../src/types/policy.js';

describe('Specialty Keyword Hospital Name Priority Suite', () => {
  const mockBasePolicy: PolicyDocument = {
    _id: 'test_specialty_policy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmedByUser: true,
    insurer: 'Star Health',
    insurerAliases: ['Star'],
    policyNumber: 'STAR-POL-001',
    planName: 'Star Comprehensive Plan',
    policyType: 'private',
    uin: 'STAR-UIN-001',
    sumInsured: 500000,
    roomRentDailyLimit: { type: 'none', value: null },
    icuDailyLimit: { type: 'none', value: null },
    coPayPercent: null,
    copayAppliesTo: 'none',
    deductible: 0,
    proportionateDeduction: false,
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

  beforeAll(async () => {
    await hospitalService.initData();
  });

  // 1. Cardiology
  describe('Cardiology Name Keywords', () => {
    const candidates = [
      'Naruka Heart Hospital',
      'ABC Cardiac Institute',
      'XYZ Cardiology Centre',
      'National Cardio Hospital',
      'City Heart Care Hospital'
    ];

    candidates.forEach((name) => {
      it(`should grant strong Cardiology relevance to "${name}"`, () => {
        const res = calculateSpecialtyNameRelevance(name, 'Cardiology');
        expect(res.matched).toBe(true);
        expect(res.strength).toBe('strong');
        expect(res.score).toBe(100);
        expect(res.explanation).toContain('Cardiology');
      });
    });
  });

  // 2. Orthopedics
  describe('Orthopedics Name Keywords', () => {
    const candidates = [
      'ABC Ortho Hospital',
      'XYZ Bone & Joint Centre',
      'National Orthopaedic Institute',
      'City Bone and Joint Care'
    ];

    candidates.forEach((name) => {
      it(`should grant strong Orthopedics relevance to "${name}"`, () => {
        const res = calculateSpecialtyNameRelevance(name, 'Orthopedics');
        expect(res.matched).toBe(true);
        expect(res.strength).toBe('strong');
        expect(res.score).toBe(100);
      });
    });

    it('should support British spelling Orthopaedics as specialty input', () => {
      const res = calculateSpecialtyNameRelevance('City Bone & Joint Hospital', 'Orthopaedics');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });
  });

  // 3. Neurology
  describe('Neurology Name Keywords', () => {
    const candidates = [
      'ABC Neuro Hospital',
      'XYZ Brain Centre',
      'National Neuroscience Institute',
      'Apex Neurocare Centre'
    ];

    candidates.forEach((name) => {
      it(`should grant strong Neurology relevance to "${name}"`, () => {
        const res = calculateSpecialtyNameRelevance(name, 'Neurology');
        expect(res.matched).toBe(true);
        expect(res.strength).toBe('strong');
        expect(res.score).toBe(100);
      });
    });
  });

  // 4. Oncology
  describe('Oncology Name Keywords', () => {
    const candidates = [
      'ABC Cancer Hospital',
      'XYZ Oncology Centre',
      'National Cancer Institute',
      'Metro Tumour Centre'
    ];

    candidates.forEach((name) => {
      it(`should grant strong Oncology relevance to "${name}"`, () => {
        const res = calculateSpecialtyNameRelevance(name, 'Oncology');
        expect(res.matched).toBe(true);
        expect(res.strength).toBe('strong');
        expect(res.score).toBe(100);
      });
    });
  });

  // 5. Ophthalmology
  describe('Ophthalmology Name Keywords', () => {
    const candidates = [
      'ABC Eye Hospital',
      'XYZ Vision Centre',
      'National Eye Institute',
      'National Ophthalmology Institute'
    ];

    candidates.forEach((name) => {
      it(`should grant strong Ophthalmology relevance to "${name}"`, () => {
        const res = calculateSpecialtyNameRelevance(name, 'Ophthalmology');
        expect(res.matched).toBe(true);
        expect(res.strength).toBe('strong');
        expect(res.score).toBe(100);
      });
    });
  });

  // 6. Urology
  describe('Urology Name Keywords', () => {
    const candidates = [
      'ABC Urology Hospital',
      'XYZ Kidney Care Centre',
      'National Renal Institute'
    ];

    candidates.forEach((name) => {
      it(`should grant strong Urology relevance to "${name}"`, () => {
        const res = calculateSpecialtyNameRelevance(name, 'Urology');
        expect(res.matched).toBe(true);
        expect(res.strength).toBe('strong');
        expect(res.score).toBe(100);
      });
    });
  });

  // 7. Extended Clinical Specialties
  describe('Extended Specialties Coverage', () => {
    it('Nephrology: Apex Nephrology & Dialysis Centre', () => {
      const res = calculateSpecialtyNameRelevance('Apex Nephrology & Dialysis Centre', 'Nephrology');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Gastroenterology: Global Gastro & Digestive Hospital', () => {
      const res = calculateSpecialtyNameRelevance('Global Gastro & Digestive Hospital', 'Gastroenterology');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Pulmonology: City Chest & Pulmonary Care Hospital', () => {
      const res = calculateSpecialtyNameRelevance('City Chest & Pulmonary Care Hospital', 'Pulmonology');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Dermatology: Skin Care & Cosmetology Centre', () => {
      const res = calculateSpecialtyNameRelevance('Skin Care & Cosmetology Centre', 'Dermatology');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('ENT: National ENT & Otolaryngology Hospital', () => {
      const res = calculateSpecialtyNameRelevance('National ENT & Otolaryngology Hospital', 'ENT');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Pediatrics: Children Hospital & Child Care Centre', () => {
      const res = calculateSpecialtyNameRelevance('Children Hospital & Child Care Centre', 'Pediatrics');
      expect(res.matched).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(75);
    });

    it('General Surgery: Advanced Laparoscopic Surgery Centre', () => {
      const res = calculateSpecialtyNameRelevance('Advanced Laparoscopic Surgery Centre', 'General Surgery');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Endocrinology: Diabetes & Endocrine Hospital', () => {
      const res = calculateSpecialtyNameRelevance('Diabetes & Endocrine Hospital', 'Endocrinology');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Psychiatry: Metro Psychiatric Hospital', () => {
      const res = calculateSpecialtyNameRelevance('Metro Psychiatric Hospital', 'Psychiatry');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Dentistry: Apollo Dental Care Clinic', () => {
      const res = calculateSpecialtyNameRelevance('Apollo Dental Care Clinic', 'Dentistry');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });

    it('Physiotherapy: Sports Rehab & Physical Therapy Centre', () => {
      const res = calculateSpecialtyNameRelevance('Sports Rehab & Physical Therapy Centre', 'Physiotherapy');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
    });
  });

  // 8. Name-Only Match (Section 54)
  describe('Name-Only Match Independence', () => {
    it('grants strong Cardiology relevance even if specialties list is empty', () => {
      const res = calculateSpecialtyNameRelevance('Naruka Heart Hospital', 'Cardiology');
      expect(res.matched).toBe(true);
      expect(res.strength).toBe('strong');
      expect(res.score).toBe(100);
      expect(res.explanation).toContain('Cardiology');
      expect(res.explanation).not.toContain('Verified Cardiology Specialty');
    });
  });

  // 9. Generic Hospital / No Name Match (Section 55)
  describe('Generic Hospitals with No Name Match', () => {
    it('returns score 0 and matched false for ABC Multispeciality Hospital', () => {
      const res = calculateSpecialtyNameRelevance('ABC Multispeciality Hospital', 'Cardiology');
      expect(res.matched).toBe(false);
      expect(res.strength).toBe('none');
      expect(res.score).toBe(0);
      expect(res.keywords).toHaveLength(0);
      expect(res.explanation).toBeNull();
    });
  });

  // 10. Multiple Keywords Capping (Section 56)
  describe('Multiple Keywords Capping', () => {
    it('caps final score at 100 for hospital matching multiple keywords', () => {
      const res = calculateSpecialtyNameRelevance('National Heart Cardiac Cardiology Institute', 'Cardiology');
      expect(res.score).toBeLessThanOrEqual(100);
      expect(res.score).toBe(100);
      expect(res.matchedKeywords.length).toBeGreaterThan(1);
    });
  });

  // 11. Case Insensitivity (Section 57)
  describe('Case Insensitivity', () => {
    const variants = [
      'Heart Hospital',
      'HEART HOSPITAL',
      'heart hospital',
      'Heart hospital'
    ];

    it('behaves identically across different cases', () => {
      const scores = variants.map(v => calculateSpecialtyNameRelevance(v, 'Cardiology').score);
      const allEqual = scores.every(s => s === scores[0]);
      expect(allEqual).toBe(true);
      expect(scores[0]).toBe(100);
    });
  });

  // 12. Punctuation & Ampersands (Section 58)
  describe('Punctuation and Ampersands Normalization', () => {
    const variants = [
      'Heart-Care Hospital',
      'Heart Care Hospital',
      'Heart & Care Hospital'
    ];

    it('evaluates consistently across hyphen, space, and ampersand variants', () => {
      const results = variants.map(v => calculateSpecialtyNameRelevance(v, 'Cardiology'));
      for (const r of results) {
        expect(r.matched).toBe(true);
        expect(r.score).toBe(100);
      }
    });
  });

  // 13. False Positive Protection (Section 59)
  describe('False Positive Protection', () => {
    it('does NOT match "ear" inside "heart"', () => {
      const res = calculateSpecialtyNameRelevance('Naruka Heart Hospital', 'ENT');
      // ENT keywords include 'ear', but 'heart' must not match 'ear'
      expect(res.keywords).not.toContain('ear');
      expect(res.matched).toBe(false);
    });

    it('does NOT match "ear" inside "clear" or "near"', () => {
      const res = calculateSpecialtyNameRelevance('Clear View General Hospital', 'ENT');
      expect(res.keywords).not.toContain('ear');
      expect(res.matched).toBe(false);
    });

    it('does NOT match "eye" inside "they" or "conveyance"', () => {
      const res = calculateSpecialtyNameRelevance('They Conveyance Hospital', 'Ophthalmology');
      expect(res.keywords).not.toContain('eye');
      expect(res.matched).toBe(false);
    });

    it('does NOT match "gi" inside "regional" or "original"', () => {
      const res = calculateSpecialtyNameRelevance('Regional Multispeciality Hospital', 'Gastroenterology');
      expect(res.keywords).not.toContain('gi');
      expect(res.matched).toBe(false);
    });

    it('does NOT match "ortho" inside unrelated words', () => {
      const res = calculateSpecialtyNameRelevance('Apollo Heart Institute', 'Orthopedics');
      expect(res.matched).toBe(false);
      expect(res.score).toBe(0);
    });
  });

  // 14. Network Status Independence (Section 60)
  describe('Network Status Independence', () => {
    it('keeps network status unverified while scoring high specialty relevance', () => {
      const mockHospital: HospitalRecord = {
        hospital_name: 'Naruka Heart Hospital',
        hospital_type: 'Private',
        address: '123 MG Road, Bengaluru',
        city: 'Bengaluru',
        insurers: [], // No insurer data -> strictly unverified
        insurersRaw: '',
        rating: 4.5,
        specialties: ['Cardiology'],
        tier: 'Metro 1',
        segment: 'Standard Private'
      };

      const ranked = hospitalService.rankHospitals([mockHospital], mockBasePolicy, 'Cardiology');
      expect(ranked).toHaveLength(1);
      const item = ranked[0];

      // Specialty relevance is strong
      expect(item.specialtyNameMatch?.matched).toBe(true);
      expect(item.specialtyNameMatch?.strength).toBe('strong');
      expect(item.specialtyNameMatch?.score).toBe(100);

      // Network status remains strictly unverified
      expect(item.networkInfo.networkStatus).toBe('unverified');
    });
  });

  // 15. Network-Only Constraint (Section 35 & 61)
  describe('Network-Only Constraint Enforced', () => {
    it('verified generic hospital outranks unverified heart hospital when network constraint applies', () => {
      const unverifiedHeartHospital: HospitalRecord = {
        hospital_name: 'Naruka Heart Hospital',
        hospital_type: 'Private',
        address: '123 MG Road, Bengaluru',
        city: 'Bengaluru',
        insurers: [], // Unverified for Star Health (no insurer data)
        insurersRaw: '',
        rating: 4.5,
        specialties: ['Cardiology'],
        tier: 'Metro 1',
        segment: 'Standard Private'
      };

      const verifiedGenericHospital: HospitalRecord = {
        hospital_name: 'City Multispeciality Hospital',
        hospital_type: 'Private',
        address: '456 Brigade Road, Bengaluru',
        city: 'Bengaluru',
        insurers: ['Star Health'], // Verified for Star Health
        insurersRaw: 'Star Health',
        rating: 4.0,
        specialties: ['Cardiology'],
        tier: 'Metro 1',
        segment: 'Standard Private'
      };

      const ranked = hospitalService.rankHospitals(
        [unverifiedHeartHospital, verifiedGenericHospital],
        mockBasePolicy,
        'Cardiology'
      );

      // Verified generic hospital must rank #1 over unverified heart hospital
      expect(ranked[0].hospital.hospital_name).toBe('City Multispeciality Hospital');
      expect(ranked[0].networkInfo.networkStatus).toBe('verified');
      expect(ranked[1].hospital.hospital_name).toBe('Naruka Heart Hospital');
      expect(ranked[1].networkInfo.networkStatus).toBe('unverified');
    });

    it('within verified hospitals, specialty-named hospital outranks generic multispecialty hospital', () => {
      const verifiedHeartHospital: HospitalRecord = {
        hospital_name: 'Naruka Heart Hospital',
        hospital_type: 'Private',
        address: '123 MG Road, Bengaluru',
        city: 'Bengaluru',
        insurers: ['Star Health'],
        insurersRaw: 'Star Health',
        rating: 4.2,
        specialties: ['Cardiology'],
        tier: 'Metro 1',
        segment: 'Standard Private'
      };

      const verifiedGenericHospital: HospitalRecord = {
        hospital_name: 'City Multispeciality Hospital',
        hospital_type: 'Private',
        address: '456 Brigade Road, Bengaluru',
        city: 'Bengaluru',
        insurers: ['Star Health'],
        insurersRaw: 'Star Health',
        rating: 4.8, // higher rating, but generic name
        specialties: ['Cardiology'],
        tier: 'Metro 1',
        segment: 'Standard Private'
      };

      const ranked = hospitalService.rankHospitals(
        [verifiedGenericHospital, verifiedHeartHospital],
        mockBasePolicy,
        'Cardiology'
      );

      // Heart hospital ranks FIRST because of specialty name relevance
      expect(ranked[0].hospital.hospital_name).toBe('Naruka Heart Hospital');
      expect(ranked[0].specialtyNameMatch?.score).toBe(100);
      expect(ranked[1].hospital.hospital_name).toBe('City Multispeciality Hospital');
      expect(ranked[1].specialtyNameMatch?.score).toBe(0);
    });
  });

  // 16. No Specialty Selected / All Specialties (Section 62)
  describe('No Specialty Selected', () => {
    it('produces score 0 and no specialty reordering when selectedSpecialty is null or All Specialties', () => {
      const resNull = calculateSpecialtyNameRelevance('Naruka Heart Hospital', null);
      expect(resNull.matched).toBe(false);
      expect(resNull.score).toBe(0);

      const resAll = calculateSpecialtyNameRelevance('Naruka Heart Hospital', 'All Specialties');
      expect(resAll.matched).toBe(false);
      expect(resAll.score).toBe(0);
    });
  });
});
