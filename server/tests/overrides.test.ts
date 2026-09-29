import { describe, it, expect } from 'vitest';
import { applySchemeOverrides, applyTier2Defaults } from '../src/services/overrideService.js';
import { PolicyDocument } from '../types/policy.js';

describe('Scheme Overrides and Tier 2 Defaults', () => {
  it('overrides a PM-JAY policy claiming a room limit to { type: "none" }, copay 0, sumInsured 500000', () => {
    const policy: Partial<PolicyDocument> = {
      policyType: 'pmjay',
      sumInsured: 100000,
      roomLimit: { type: 'amount', value: 2500 },
      icuLimit: { type: 'percent', value: 2 },
      copay: 20,
      nonNetworkCopay: 30,
      proportionateDeduction: true
    };

    applySchemeOverrides(policy);

    expect(policy.sumInsured).toBe(500000);
    expect(policy.roomLimit).toEqual({ type: 'none', value: null });
    expect(policy.icuLimit).toEqual({ type: 'none', value: null });
    expect(policy.copay).toBe(0);
    expect(policy.nonNetworkCopay).toBe(0);
    expect(policy.proportionateDeduction).toBe(false);
    expect(policy.networkType).toBe('restricted-network');

    expect(policy.confidence?.['sumInsured']).toBe('assumed');
    expect(policy.confidence?.['roomLimit']).toBe('assumed');
    expect(policy.confidence?.['copay']).toBe('assumed');
  });

  it('overrides an ESI policy to sumInsured null, roomLimit { type: "none" }, copay 0', () => {
    const policy: Partial<PolicyDocument> = {
      policyType: 'esi',
      sumInsured: 200000,
      roomLimit: { type: 'amount', value: 1500 },
      copay: 15
    };

    applySchemeOverrides(policy);

    expect(policy.sumInsured).toBeNull();
    expect(policy.roomLimit).toEqual({ type: 'none', value: null });
    expect(policy.copay).toBe(0);
    expect(policy.nonNetworkCopay).toBe(0);
    expect(policy.proportionateDeduction).toBe(false);
    expect(policy.networkType).toBe('restricted-network');
    expect(policy.confidence?.['sumInsured']).toBe('assumed');
  });

  it('applies Tier 2 defaults: preserves null for unstated nonNetworkCopay, networkType, and benefits (P0.3, P0.5, P2.3)', () => {
    const policy: Partial<PolicyDocument> = {
      copay: 15,
      nonNetworkCopay: null,
      icuLimit: null,
      subLimits: undefined,
      networkType: null,
      restorationBenefit: null,
      cumulativeBonus: null,
      hasOtherExclusions: null
    };

    applyTier2Defaults(policy);

    // P0.3: missing nonNetworkCopay must remain null
    expect(policy.nonNetworkCopay).toBeNull();
    expect(policy.confidence?.['nonNetworkCopay']).toBeUndefined();

    // icuLimit defaults to none
    expect(policy.icuLimit).toEqual({ type: 'none', value: null });

    // subLimits defaults to empty object
    expect(policy.subLimits).toEqual({});

    // P0.5: missing networkType must remain null
    expect(policy.networkType).toBeNull();
    expect(policy.confidence?.['networkType']).toBeUndefined();

    // P2.3: missing benefits remain null, not converted to false/zero
    expect(policy.restorationBenefit).toBeNull();
    expect(policy.cumulativeBonus).toBeNull();
    expect(policy.hasOtherExclusions).toBeNull();
  });
});
