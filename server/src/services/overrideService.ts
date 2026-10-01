import { PolicyDocument, ConfidenceLevel } from '../types/policy.js';

/**
 * Applies Tier 2 defaults if not found in the PDF.
 * Sets confidence to "assumed".
 */
export function applyTier2Defaults(policy: Partial<PolicyDocument>): void {
  if (!policy.confidence) policy.confidence = {};
  if (!policy.sourceSnippets) policy.sourceSnippets = {};

  // P0.3: Missing non-network co-pay must remain null / unknown
  if (policy.nonNetworkCopay === undefined) {
    policy.nonNetworkCopay = null;
  }

  // icuLimit -> { type: 'none', value: null }
  if (policy.icuLimit === null || policy.icuLimit === undefined) {
    policy.icuLimit = { type: 'none', value: null };
  }

  // subLimits -> {}
  if (!policy.subLimits || typeof policy.subLimits !== 'object') {
    policy.subLimits = {};
  }

  // P0.5: Missing networkType must remain null / unknown
  if (policy.networkType === undefined) {
    policy.networkType = null;
  }

  // cashlessAvailable -> null if missing
  if (policy.cashlessAvailable === undefined) {
    policy.cashlessAvailable = null;
  }

  // zone -> null
  if (policy.zone === undefined) {
    policy.zone = null;
  }

  // restorationBenefit -> null if missing
  if (policy.restorationBenefit === undefined) {
    policy.restorationBenefit = null;
  }

  // cumulativeBonus -> null if missing
  if (policy.cumulativeBonus === undefined) {
    policy.cumulativeBonus = null;
  }

  // hasOtherExclusions -> null if missing
  if (policy.hasOtherExclusions === undefined) {
    policy.hasOtherExclusions = null;
  }
}

/**
 * Applies Scheme Overrides (PM-JAY and ESI) AFTER extraction,
 * overriding whatever the document stated.
 * Marks confidence as "assumed" with an explanatory snippet.
 */
export function applySchemeOverrides(policy: Partial<PolicyDocument>): void {
  if (!policy.confidence) policy.confidence = {};
  if (!policy.sourceSnippets) policy.sourceSnippets = {};

  if (policy.policyType === 'pmjay') {
    policy.sumInsured = 500000;
    policy.roomLimit = { type: 'none', value: null };
    policy.icuLimit = { type: 'none', value: null };
    policy.copay = 0;
    policy.nonNetworkCopay = 0;
    policy.proportionateDeduction = false;
    policy.networkType = 'restricted-network';

    policy.confidence['sumInsured'] = 'assumed';
    policy.sourceSnippets['sumInsured'] = 'PM-JAY statutory family floater limit: ₹5,00,000 per year';

    policy.confidence['roomLimit'] = 'assumed';
    policy.sourceSnippets['roomLimit'] = 'PM-JAY package rates cover room & nursing with no capping';

    policy.confidence['icuLimit'] = 'assumed';
    policy.sourceSnippets['icuLimit'] = 'PM-JAY packages include ICU care without separate caps';

    policy.confidence['copay'] = 'assumed';
    policy.sourceSnippets['copay'] = 'Government-sponsored scheme with 100% cashless treatment (0% co-pay)';

    policy.confidence['nonNetworkCopay'] = 'assumed';
    policy.sourceSnippets['nonNetworkCopay'] = 'Treatment restricted to empanelled network hospitals only';

    policy.confidence['proportionateDeduction'] = 'assumed';
    policy.sourceSnippets['proportionateDeduction'] = 'Proportionate deduction does not apply under PM-JAY standardized packages';

    policy.confidence['networkType'] = 'assumed';
    policy.sourceSnippets['networkType'] = 'PM-JAY cashless treatment valid at empanelled hospitals only';

    policy.cashlessAvailable = true;
    policy.confidence['cashlessAvailable'] = 'assumed';
    policy.sourceSnippets['cashlessAvailable'] = '100% cashless hospitalization at empanelled network hospitals';
  }

  if (policy.policyType === 'esi') {
    policy.sumInsured = null; // treat as unlimited in the engine
    policy.roomLimit = { type: 'none', value: null };
    policy.icuLimit = { type: 'none', value: null };
    policy.copay = 0;
    policy.nonNetworkCopay = 0;
    policy.proportionateDeduction = false;
    policy.networkType = 'restricted-network';

    policy.confidence['sumInsured'] = 'assumed';
    policy.sourceSnippets['sumInsured'] = 'ESI Act statutory benefit: unlimited complete medical cover';

    policy.confidence['roomLimit'] = 'assumed';
    policy.sourceSnippets['roomLimit'] = 'ESI hospital tie-ups provide full entitlement without daily room capping';

    policy.confidence['icuLimit'] = 'assumed';
    policy.sourceSnippets['icuLimit'] = 'ICU and critical care fully covered under ESI provisions';

    policy.confidence['copay'] = 'assumed';
    policy.sourceSnippets['copay'] = 'ESI provides 100% cashless medical care without patient co-payment';

    policy.confidence['nonNetworkCopay'] = 'assumed';
    policy.sourceSnippets['nonNetworkCopay'] = 'Care delivered through ESIC dispensaries, hospitals and tie-up centers';

    policy.confidence['proportionateDeduction'] = 'assumed';
    policy.sourceSnippets['proportionateDeduction'] = 'Proportionate deductions are not applicable under statutory ESI benefits';

    policy.confidence['networkType'] = 'assumed';
    policy.sourceSnippets['networkType'] = 'Restricted to ESIC network and authorized tie-up institutions';

    policy.cashlessAvailable = true;
    policy.confidence['cashlessAvailable'] = 'assumed';
    policy.sourceSnippets['cashlessAvailable'] = '100% cashless medical care at ESIC facilities and tie-up institutions';
  }
}
