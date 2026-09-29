import { describe, it, expect, beforeAll } from 'vitest';
import { HospitalService } from '../src/services/hospitalService.js';
import { PolicyDocument } from '../types/policy.js';

describe('Clean Hospital Dataset & City Search Integrity', () => {
  let hospitalService: HospitalService;
  const mockPolicy: PolicyDocument = {
    id: 'test-policy',
    insurer: 'Star Health',
    policyName: 'Family Health Optima',
    policyNumber: 'P-12345',
    policyHolder: 'John Doe',
    sumInsured: 500000,
    roomRentLimit: {
      type: '1%',
      roomCategory: 'General Ward'
    },
    coPay: {
      percentage: 0
    },
    deductible: 0,
    maternityCover: false,
    pedWaitingPeriodMonths: 24,
    features: [],
    exclusions: []
  };

  beforeAll(async () => {
    hospitalService = new HospitalService();
    await hospitalService.initData();
  });

  it('should return clean Bengaluru hospitals with no cross-city OCR pollution', () => {
    const res = hospitalService.search({
      policy: mockPolicy,
      city: 'Bengaluru'
    });

    expect(res.hospitals.length).toBeGreaterThan(0);

    for (const item of res.hospitals) {
      const addr = item.hospital.address;
      // No wide OCR spaces
      expect(addr).not.toMatch(/\s{3,}/);
      // No OCR City- tags
      expect(addr).not.toMatch(/\(?\s*city\s*-\s*/i);
      // No contradictory states like Andhra Pradesh for Bengaluru
      if (addr.toLowerCase().includes('bengaluru') || addr.toLowerCase().includes('bangalore')) {
        expect(addr.toLowerCase()).not.toContain('andhra pradesh');
      }
      // No spliced unrelated metro cities in the address
      expect(addr.toLowerCase()).not.toContain('ludhiana');
      expect(addr.toLowerCase()).not.toContain('nashik');
      expect(addr.toLowerCase()).not.toContain('jalandhar');
    }
  });

  it('should return clean results for other major metro cities', () => {
    const metros = ['Mumbai', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
    for (const metro of metros) {
      const res = hospitalService.search({
        policy: mockPolicy,
        city: metro
      });
      expect(res.hospitals.length).toBeGreaterThan(0);
      for (const item of res.hospitals) {
        const addr = item.hospital.address;
        expect(addr).not.toMatch(/\s{3,}/);
        expect(addr).not.toMatch(/\(?\s*city\s*-\s*/i);
      }
    }
  });
});
