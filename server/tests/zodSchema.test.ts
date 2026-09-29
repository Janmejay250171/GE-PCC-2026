import { describe, it, expect } from 'vitest';
import { ExtractedPolicyZod, getMissingTier1Fields } from '../src/schemas/policySchema.js';

describe('Zod Schema Validation', () => {
  it('accepts a valid extraction payload', () => {
    const validData = {
      insurer: 'Star Health',
      insurerAliases: ['Star Health and Allied Insurance Co. Ltd.'],
      planName: 'Family Health Optima',
      policyType: 'private',
      sumInsured: 300000,
      roomLimit: { type: 'amount', value: 3000 },
      icuLimit: { type: 'percent', value: 2 },
      copay: 10,
      nonNetworkCopay: 20,
      deductible: 0,
      proportionateDeduction: true,
      subLimits: { 'Knee Replacement': 150000 },
      insuredPersons: [{ name: 'R. Sharma', age: 52, relation: 'self' }],
      exclusions: ['cosmetic surgery', 'dental'],
      hasOtherExclusions: true,
      confidence: { roomLimit: 'high', copay: 'low' },
      sourceSnippets: { roomLimit: 'Room rent up to Rs.3,000 per day' }
    };

    const result = ExtractedPolicyZod.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.insurer).toBe('Star Health');
      expect(result.data.sumInsured).toBe(300000);
      expect(result.data.roomLimit?.type).toBe('amount');
    }
  });

  it('rejects a payload with invalid policyType enum', () => {
    const invalidData = {
      insurer: 'Star Health',
      policyType: 'super-luxurious-custom-type',
      sumInsured: 300000
    };

    const result = ExtractedPolicyZod.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects a payload with invalid roomLimit type', () => {
    const invalidData = {
      insurer: 'Star Health',
      roomLimit: { type: 'unsupported_type', value: 5000 }
    };

    const result = ExtractedPolicyZod.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('correctly identifies missing Tier 1 required fields', () => {
    const partialPolicy = {
      insurer: 'Star Health',
      policyType: 'private' as const,
      sumInsured: 300000,
      roomLimit: null, // missing
      copay: null, // missing
      deductible: 0,
      proportionateDeduction: null // missing
    };

    const missing = getMissingTier1Fields(partialPolicy as any);
    expect(missing).toContain('roomLimit');
    expect(missing).toContain('copay');
    expect(missing).toContain('proportionateDeduction');
    expect(missing).not.toContain('insurer');
    expect(missing).not.toContain('sumInsured');
    expect(missing.length).toBe(3);
  });
});
