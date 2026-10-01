import { describe, it, expect } from 'vitest';
import { normalizeExtractionPayload, sanitizeExclusions } from '../src/services/normalizerService.js';
import { ExtractedPolicyZod } from '../src/schemas/policySchema.js';

describe('30-Page Fictional Policy (Northstar SecureCare Plus) Extraction & Normalization Regression', () => {
  // Mock raw Gemini extraction representing the 30-page test policy
  const rawNorthstarPayload = {
    insurer: 'Northstar Health Assurance Ltd.',
    insurerAliases: ['Northstar Health Assurance', 'Northstar Assurance'],
    planName: 'Northstar SecureCare Plus — Test Edition',
    policyType: 'individual',
    policyNumber: 'NSH-TEST-260401-78421',
    uin: 'NSH-HL-IND-2026-V01',
    policyStartDate: '2026-04-01',
    policyEndDate: '2027-03-31',
    zone: 'Zone B',
    networkType: null, // Test document specifies cashless at verified facilities, does NOT classify an all-network tier
    cashlessAvailable: true,
    tpa: null,
    insuredPersons: [{ name: 'Aarav Mehta', age: 38, relation: 'self' }],
    sumInsured: 750000,
    roomLimit: { type: 'amount', value: 6000 },
    icuLimit: { type: 'amount', value: 12000 },
    copay: 10,
    nonNetworkCopay: 20,
    copayConditions: { nonNetwork: 20 },
    deductible: 10000,
    proportionateDeduction: true,
    subLimits: {
      'Cataract surgery': 40000,
      'Road ambulance': 3000,
      'Emergency air ambulance': 75000,
      'Mental health': 100000,
      'Organ donor': 50000
    },
    restorationBenefit: true,
    cumulativeBonus: 150000,
    // Note: LLM or naive extraction previously returned maternity, cataract, dental, cosmetic
    exclusions: ['Routine cosmetic surgery', 'Maternity', 'Cataract', 'Dental'],
    hasOtherExclusions: true,
    waitingPeriods: {
      initial: '30 days',
      preExisting: '36 months',
      maternity: '24 months',
      procedures: {
        'Cataract': '24 months',
        'Hernia': '24 months',
        'Joint replacement': '24 months'
      }
    },
    preHospitalizationDays: 30,
    postHospitalizationDays: 60,
    daycareCovered: true,
    ambulanceLimit: 3000,
    sourceSnippets: {
      policyType: 'Policy type: Individual Health Insurance.',
      restorationBenefit: 'Base Sum Insured may be restored once during a policy year after exhaustion.',
      cashlessAvailable: 'Cashless service is available only at a hospital verified as current network and where authorization is granted.',
      proportionateDeduction: 'doctor consultation fees, surgeon fees, nursing charges and procedure charges are subject to the proportionate-deduction clause',
      dental: 'Dental treatment after accidental facial injury may be covered subject to terms'
    },
    confidence: {
      policyType: 'high',
      sumInsured: 'high',
      roomLimit: 'high',
      icuLimit: 'high',
      copay: 'high',
      deductible: 'high',
      proportionateDeduction: 'high',
      restorationBenefit: 'high',
      cashlessAvailable: 'high'
    }
  };

  it('Issue 1: Cross-references exclusions so maternity, cataract, and dental are not permanently excluded', () => {
    const normalized = normalizeExtractionPayload(rawNorthstarPayload);

    // Maternity has 24m waiting period -> must NOT be in exclusions
    expect(normalized.exclusions).not.toContain('Maternity');
    expect(normalized.exclusions).not.toContain('maternity');

    // Cataract has 24m waiting period and ₹40,000 limit -> must NOT be in exclusions
    expect(normalized.exclusions).not.toContain('Cataract');
    expect(normalized.exclusions).not.toContain('cataract');

    // Dental has conditional accidental-injury coverage -> must NOT be a blanket exclusion
    expect(normalized.exclusions).not.toContain('Dental');

    // Routine cosmetic surgery is truly excluded -> MUST remain in exclusions
    expect(normalized.exclusions).toContain('Routine cosmetic surgery');

    // Verify waiting periods and sub-limits survive intact
    expect(normalized.waitingPeriods.maternity).toBe('24 months');
    expect(normalized.waitingPeriods.procedures['Cataract']).toBe('24 months');
    expect(normalized.subLimits['Cataract surgery']).toBe(40000);
  });

  it('Issue 1 Unit: sanitizeExclusions correctly handles edge cases', () => {
    const rawList = ['maternity', 'cataract', 'cosmetic surgery', 'experimental therapy'];
    const waitingPeriods = {
      maternity: '24 months',
      procedures: { 'cataract': '24 months' }
    };
    const subLimits = { 'cataract': 40000 };

    const sanitized = sanitizeExclusions(rawList, waitingPeriods, subLimits);
    expect(sanitized).toEqual(['cosmetic surgery', 'experimental therapy']);
  });

  it('Issue 2: Restoration benefit explicitly extracted and survives through normalization', () => {
    const normalized = normalizeExtractionPayload(rawNorthstarPayload);
    expect(normalized.restorationBenefit).toBe(true);

    // Silent policy must NOT assume restoration
    const silentNormalized = normalizeExtractionPayload({ ...rawNorthstarPayload, restorationBenefit: null });
    expect(silentNormalized.restorationBenefit).toBeNull();
  });

  it('Issue 3: Cashless availability is decoupled from networkType and accurately normalized', () => {
    const normalized = normalizeExtractionPayload(rawNorthstarPayload);
    // Cashless availability is explicitly captured as true
    expect(normalized.cashlessAvailable).toBe(true);
    // networkType is NOT fabricated into "all-network" or "restricted-network"
    expect(normalized.networkType).toBeNull();
  });

  it('Issue 4: Active proportionate deduction clause with associated medical expenses is preserved as true', () => {
    const normalized = normalizeExtractionPayload(rawNorthstarPayload);
    expect(normalized.proportionateDeduction).toBe(true);

    // But vague speculative language without fee deduction formulas is guarded to false
    const vaguePayload = {
      ...rawNorthstarPayload,
      proportionateDeduction: true,
      sourceSnippets: {
        proportionateDeduction: 'The room charges may be subject to twin sharing 50% of the eligible room'
      }
    };
    const vagueNormalized = normalizeExtractionPayload(vaguePayload);
    expect(vagueNormalized.proportionateDeduction).toBe(false);
  });

  it('Issue 5: Policy type distinguishes individual, floater, corporate, pmjay, esi', () => {
    // Individual
    const ind = normalizeExtractionPayload({ policyType: 'individual' });
    expect(ind.policyType).toBe('individual');

    const indText = normalizeExtractionPayload({ policyType: 'Individual Health Insurance' });
    expect(indText.policyType).toBe('individual');

    // Family Floater
    const flt = normalizeExtractionPayload({ policyType: 'family floater' });
    expect(flt.policyType).toBe('floater');

    // Corporate
    const corp = normalizeExtractionPayload({ policyType: 'corporate/group' });
    expect(corp.policyType).toBe('corporate');

    // PM-JAY
    const pmjay = normalizeExtractionPayload({ policyType: 'pmjay' });
    expect(pmjay.policyType).toBe('pmjay');

    // ESI
    const esi = normalizeExtractionPayload({ policyType: 'esi' });
    expect(esi.policyType).toBe('esi');
  });

  it('Schema Validation: Extracted policy passes Zod validation with new fields', () => {
    const normalized = normalizeExtractionPayload(rawNorthstarPayload);
    const parsed = ExtractedPolicyZod.safeParse(normalized);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.policyType).toBe('individual');
      expect(parsed.data.cashlessAvailable).toBe(true);
      expect(parsed.data.restorationBenefit).toBe(true);
      expect(parsed.data.proportionateDeduction).toBe(true);
    }
  });
});
