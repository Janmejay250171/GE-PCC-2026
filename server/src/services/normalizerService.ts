import { RoomOrIcuLimit } from '../types/policy.js';

/**
 * Normalizes Indian currency string or number to integer rupees.
 * Handles "3,00,000", "₹3 lakh", "3 Lakhs", "5 Cr", "500000", etc.
 */
export function normalizeIndianCurrency(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Math.round(val);

  if (typeof val === 'string') {
    let clean = val.trim();
    // Check for Lakhs / Cr
    const lakhMatch = clean.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|lacs|lakhs)\b/i);
    if (lakhMatch) {
      const num = parseFloat(lakhMatch[1]);
      return Math.round(num * 100000);
    }

    const croreMatch = clean.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:crore|cr|crores)\b/i);
    if (croreMatch) {
      const num = parseFloat(croreMatch[1]);
      return Math.round(num * 10000000);
    }

    // Strip currency symbols, commas, spaces
    clean = clean.replace(/[₹,]/g, '').replace(/\b(?:rs\.?|inr)\b/gi, '').trim();
    if (/^(nil|none|zero|na|n\/a|0)$/i.test(clean)) {
      return 0;
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : Math.round(parsed);
  }

  return null;
}

/**
 * Normalizes percentage strings or numbers to a plain number.
 * e.g. "10%", " 10 % ", 10 -> 10
 */
export function normalizePercentage(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;

  if (typeof val === 'string') {
    const clean = val.replace(/%/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Normalizes room or ICU limit strings/objects.
 * "Rs.3,000 per day" -> { type: 'amount', value: 3000 }
 * "1% of sum insured" -> { type: 'percent', value: 1 }
 * "Single Standard A/C Room" -> { type: 'category', value: 'Single Standard A/C Room' }
 * "no limit mentioned" / "none" -> { type: 'none', value: null }
 */
export function normalizeRoomOrIcuLimit(val: unknown): RoomOrIcuLimit | null {
  if (val === null || val === undefined) return null;

  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, any>;
    if (obj.type) {
      let normalizedType = obj.type;
      let normalizedVal = obj.value;

      if (normalizedType === 'amount') {
        normalizedVal = normalizeIndianCurrency(normalizedVal);
      } else if (normalizedType === 'percent') {
        normalizedVal = normalizePercentage(normalizedVal);
      } else if (normalizedType === 'none') {
        normalizedVal = null;
      }
      return {
        type: normalizedType,
        value: normalizedVal
      };
    }
  }

  if (typeof val === 'string') {
    const text = val.trim();

    if (/no limit|none|not applicable|unlimited/i.test(text)) {
      return { type: 'none', value: null };
    }

    // Check percent: "1% of sum insured" or "1%"
    const percentMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:of\s+sum\s+insured)?/i);
    if (percentMatch) {
      return {
        type: 'percent',
        value: parseFloat(percentMatch[1])
      };
    }

    // Check amount: "Rs.3,000 per day" or "₹ 3,000 / day" or "3000 per day"
    const amountMatch = text.match(/(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per\s+day|\/day)?/i);
    if (amountMatch && amountMatch[1].replace(/,/g, '')) {
      const parsedAmount = normalizeIndianCurrency(amountMatch[1]);
      if (parsedAmount !== null && !isNaN(parsedAmount)) {
        return {
          type: 'amount',
          value: parsedAmount
        };
      }
    }

    // Otherwise category (e.g. "Single Standard A/C Room")
    return {
      type: 'category',
      value: text
    };
  }

  return null;
}

/**
 * Strips code fences and cleans raw JSON text from LLM output.
 */
export function cleanRawJsonText(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '');
    text = text.replace(/```\s*$/i, '');
  }
  return text.trim();
}

/**
 * Cross-references exclusions against waiting periods, sub-limits, and conditional coverage.
 * Ensures waiting-period coverage, sub-limits, or conditional treatments are not misclassified as permanent exclusions.
 */
export function sanitizeExclusions(
  exclusions: string[],
  waitingPeriods: any,
  subLimits: Record<string, number>,
  rawSnippets?: Record<string, string>
): string[] {
  if (!Array.isArray(exclusions) || exclusions.length === 0) return [];

  const subLimitKeys = Object.keys(subLimits || {}).map((k) => k.toLowerCase().trim());
  const procedureWaitingKeys = Object.keys(waitingPeriods?.procedures || {}).map((k) => k.toLowerCase().trim());
  const hasMaternityWaiting = Boolean(waitingPeriods?.maternity);

  return exclusions.filter((item) => {
    const lower = String(item).toLowerCase().trim();

    // 1. Maternity: If subject to a waiting period or sub-limit, NOT a permanent exclusion
    if (
      hasMaternityWaiting &&
      (lower === 'maternity' || lower.includes('maternity') || lower.includes('pregnancy') || lower.includes('childbirth'))
    ) {
      return false;
    }

    // 2. Cataract: If covered under waiting period or sub-limit, NOT a permanent exclusion
    const isCataract = lower.includes('cataract');
    const hasCataractWaiting = procedureWaitingKeys.some((k) => k.includes('cataract'));
    const hasCataractSublimit = subLimitKeys.some((k) => k.includes('cataract'));
    if (isCataract && (hasCataractWaiting || hasCataractSublimit)) {
      return false;
    }

    // 3. Any procedure with a defined waiting period is covered after waiting period, NOT permanently excluded
    if (procedureWaitingKeys.some((k) => lower === k || lower.includes(k) || k.includes(lower))) {
      return false;
    }

    // 4. Any procedure with an explicit positive sub-limit is covered up to the limit, NOT permanently excluded
    if (subLimitKeys.some((k) => (lower === k || lower.includes(k) || k.includes(lower)) && (subLimits[k] ?? 0) > 0)) {
      return false;
    }

    // 5. Dental: If the document indicates conditional accidental dental coverage, do not retain blanket unqualified "dental" as permanent exclusion
    if (lower === 'dental' || lower === 'dental treatment') {
      const dentalSnippet = String(rawSnippets?.dental || rawSnippets?.exclusions || '').toLowerCase();
      if (dentalSnippet.includes('accidental') || dentalSnippet.includes('injury')) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Normalizes entire raw extracted policy payload from Gemini.
 * Coerces types, strips extra keys, and applies normalization helpers.
 */
export function normalizeExtractionPayload(raw: any): Record<string, any> {
  if (typeof raw !== 'object' || raw === null) return {};

  const result: Record<string, any> = {};

  result.insurer = typeof raw.insurer === 'string' ? raw.insurer.trim() : null;
  result.insurerAliases = Array.isArray(raw.insurerAliases)
    ? raw.insurerAliases.map((a: any) => String(a).trim()).filter(Boolean)
    : [];
  result.planName = typeof raw.planName === 'string' ? raw.planName.trim() : null;

  let normType = typeof raw.policyType === 'string' ? raw.policyType.toLowerCase().trim() : null;
  if (normType === 'family floater' || normType === 'family_floater' || normType === 'family-floater') {
    normType = 'floater';
  } else if (normType === 'individual health insurance' || normType === 'individual plan') {
    normType = 'individual';
  } else if (normType === 'group' || normType === 'corporate/group') {
    normType = 'corporate';
  }
  result.policyType = ['individual', 'floater', 'corporate', 'pmjay', 'esi', 'private'].includes(normType)
    ? normType
    : null;

  result.policyNumber = typeof raw.policyNumber === 'string' ? raw.policyNumber.trim() : null;
  result.uin = typeof raw.uin === 'string' ? raw.uin.trim() : null;
  result.policyStartDate = typeof raw.policyStartDate === 'string' ? raw.policyStartDate.trim() : null;
  result.policyEndDate = typeof raw.policyEndDate === 'string' ? raw.policyEndDate.trim() : null;
  result.zone = typeof raw.zone === 'string' ? raw.zone.trim() : null;
  result.networkType = ['all-network', 'restricted-network', 'reimbursement-only'].includes(raw.networkType)
    ? raw.networkType
    : null;
  result.cashlessAvailable =
    typeof raw.cashlessAvailable === 'boolean'
      ? raw.cashlessAvailable
      : raw.cashlessAvailable === 'true'
      ? true
      : raw.cashlessAvailable === 'false'
      ? false
      : null;
  result.tpa = typeof raw.tpa === 'string' ? raw.tpa.trim() : null;

  result.insuredPersons = Array.isArray(raw.insuredPersons)
    ? raw.insuredPersons.map((p: any) => ({
        name: String(p.name || '').trim(),
        age: parseInt(p.age, 10) || 0,
        relation: String(p.relation || 'self').trim()
      }))
    : [];

  result.sumInsured = normalizeIndianCurrency(raw.sumInsured);
  result.roomLimit = normalizeRoomOrIcuLimit(raw.roomLimit);
  result.icuLimit = normalizeRoomOrIcuLimit(raw.icuLimit);
  result.copay = normalizePercentage(raw.copay);
  result.nonNetworkCopay = normalizePercentage(raw.nonNetworkCopay);

  result.copayConditions = {};
  if (raw.copayConditions && typeof raw.copayConditions === 'object') {
    for (const [k, v] of Object.entries(raw.copayConditions)) {
      const norm = normalizePercentage(v);
      if (norm !== null) result.copayConditions[k] = norm;
    }
  }

  result.deductible = normalizeIndianCurrency(raw.deductible);
  result.proportionateDeduction =
    typeof raw.proportionateDeduction === 'boolean'
      ? raw.proportionateDeduction
      : raw.proportionateDeduction === 'true'
      ? true
      : raw.proportionateDeduction === 'false'
      ? false
      : null;

  // Guard: if snippet indicates non-committal or 50% room sharing rule WITHOUT active medical fee deduction formula, do not treat as active proportionate deduction
  const propSnippet = String(raw.sourceSnippets?.proportionateDeduction || '').toLowerCase();
  if (
    propSnippet.includes('50% of the eligible') ||
    (propSnippet.includes('may be subject to') &&
      !propSnippet.includes('doctor') &&
      !propSnippet.includes('surgeon') &&
      !propSnippet.includes('nursing') &&
      !propSnippet.includes('associated'))
  ) {
    result.proportionateDeduction = false;
  }

  result.subLimits = {};
  if (raw.subLimits && typeof raw.subLimits === 'object') {
    for (const [k, v] of Object.entries(raw.subLimits)) {
      const norm = normalizeIndianCurrency(v);
      if (norm !== null) result.subLimits[k] = norm;
    }
  }

  result.restorationBenefit =
    typeof raw.restorationBenefit === 'boolean'
      ? raw.restorationBenefit
      : raw.restorationBenefit === 'true'
      ? true
      : raw.restorationBenefit === 'false'
      ? false
      : null;

  result.cumulativeBonus = normalizeIndianCurrency(raw.cumulativeBonus);

  result.exclusions = Array.isArray(raw.exclusions)
    ? raw.exclusions.map((e: any) => String(e).trim()).filter(Boolean)
    : [];

  result.hasOtherExclusions =
    typeof raw.hasOtherExclusions === 'boolean'
      ? raw.hasOtherExclusions
      : raw.hasOtherExclusions === 'true'
      ? true
      : raw.hasOtherExclusions === 'false'
      ? false
      : null;

  result.waitingPeriods = null;
  if (raw.waitingPeriods && typeof raw.waitingPeriods === 'object') {
    const procs: Record<string, string> = {};
    if (raw.waitingPeriods.procedures && typeof raw.waitingPeriods.procedures === 'object') {
      for (const [k, v] of Object.entries(raw.waitingPeriods.procedures)) {
        procs[k] = String(v);
      }
    }
    result.waitingPeriods = {
      initial: raw.waitingPeriods.initial ? String(raw.waitingPeriods.initial) : null,
      preExisting: raw.waitingPeriods.preExisting ? String(raw.waitingPeriods.preExisting) : null,
      maternity: raw.waitingPeriods.maternity ? String(raw.waitingPeriods.maternity) : null,
      procedures: procs
    };
  }

  // Cross-reference exclusions against waiting periods, sub-limits, and conditional coverage
  result.exclusions = sanitizeExclusions(result.exclusions, result.waitingPeriods, result.subLimits, raw.sourceSnippets);

  result.preHospitalizationDays =
    raw.preHospitalizationDays !== undefined && raw.preHospitalizationDays !== null
      ? parseInt(raw.preHospitalizationDays, 10) || null
      : null;

  result.postHospitalizationDays =
    raw.postHospitalizationDays !== undefined && raw.postHospitalizationDays !== null
      ? parseInt(raw.postHospitalizationDays, 10) || null
      : null;

  result.daycareCovered =
    typeof raw.daycareCovered === 'boolean'
      ? raw.daycareCovered
      : raw.daycareCovered === 'true'
      ? true
      : raw.daycareCovered === 'false'
      ? false
      : null;

  result.ambulanceLimit = normalizeIndianCurrency(raw.ambulanceLimit);

  result.preAuthHours =
    raw.preAuthHours !== undefined && raw.preAuthHours !== null
      ? parseInt(raw.preAuthHours, 10) || null
      : null;

  result.claimIntimationHours =
    raw.claimIntimationHours !== undefined && raw.claimIntimationHours !== null
      ? parseInt(raw.claimIntimationHours, 10) || null
      : null;

  result.sourceSnippets = {};
  if (raw.sourceSnippets && typeof raw.sourceSnippets === 'object') {
    for (const [k, v] of Object.entries(raw.sourceSnippets)) {
      if (typeof v === 'string') result.sourceSnippets[k] = v.trim();
    }
  }

  result.confidence = {};
  if (raw.confidence && typeof raw.confidence === 'object') {
    for (const [k, v] of Object.entries(raw.confidence)) {
      if (['high', 'medium', 'low', 'assumed'].includes(String(v))) {
        result.confidence[k] = String(v);
      }
    }
  }

  return result;
}

/**
 * Normalizes only the fields present in a partial update request.
 * Does not overwrite unprovided fields with null.
 */
export function normalizePartialPolicyUpdate(raw: any): Record<string, any> {
  if (typeof raw !== 'object' || raw === null) return {};

  const result: Record<string, any> = {};

  if ('insurer' in raw) {
    result.insurer = typeof raw.insurer === 'string' ? raw.insurer.trim() : null;
  }
  if ('insurerAliases' in raw) {
    result.insurerAliases = Array.isArray(raw.insurerAliases)
      ? raw.insurerAliases.map((a: any) => String(a).trim()).filter(Boolean)
      : [];
  }
  if ('planName' in raw) {
    result.planName = typeof raw.planName === 'string' ? raw.planName.trim() : null;
  }
  if ('policyType' in raw) {
    let normType = typeof raw.policyType === 'string' ? raw.policyType.toLowerCase().trim() : null;
    if (normType === 'family floater' || normType === 'family_floater' || normType === 'family-floater') {
      normType = 'floater';
    } else if (normType === 'individual health insurance' || normType === 'individual plan') {
      normType = 'individual';
    } else if (normType === 'group' || normType === 'corporate/group') {
      normType = 'corporate';
    }
    result.policyType = ['individual', 'floater', 'corporate', 'pmjay', 'esi', 'private'].includes(normType)
      ? normType
      : null;
  }
  if ('policyNumber' in raw) {
    result.policyNumber = typeof raw.policyNumber === 'string' ? raw.policyNumber.trim() : null;
  }
  if ('uin' in raw) {
    result.uin = typeof raw.uin === 'string' ? raw.uin.trim() : null;
  }
  if ('policyStartDate' in raw) {
    result.policyStartDate = typeof raw.policyStartDate === 'string' ? raw.policyStartDate.trim() : null;
  }
  if ('policyEndDate' in raw) {
    result.policyEndDate = typeof raw.policyEndDate === 'string' ? raw.policyEndDate.trim() : null;
  }
  if ('zone' in raw) {
    result.zone = typeof raw.zone === 'string' ? raw.zone.trim() : null;
  }
  if ('networkType' in raw) {
    result.networkType = ['all-network', 'restricted-network', 'reimbursement-only'].includes(raw.networkType)
      ? raw.networkType
      : null;
  }
  if ('cashlessAvailable' in raw) {
    result.cashlessAvailable =
      typeof raw.cashlessAvailable === 'boolean'
        ? raw.cashlessAvailable
        : raw.cashlessAvailable === 'true'
        ? true
        : raw.cashlessAvailable === 'false'
        ? false
        : null;
  }
  if ('tpa' in raw) {
    result.tpa = typeof raw.tpa === 'string' ? raw.tpa.trim() : null;
  }
  if ('insuredPersons' in raw) {
    result.insuredPersons = Array.isArray(raw.insuredPersons)
      ? raw.insuredPersons.map((p: any) => ({
          name: String(p.name || '').trim(),
          age: parseInt(p.age, 10) || 0,
          relation: String(p.relation || 'self').trim()
        }))
      : [];
  }
  if ('sumInsured' in raw) {
    result.sumInsured = normalizeIndianCurrency(raw.sumInsured);
  }
  if ('roomLimit' in raw) {
    result.roomLimit = normalizeRoomOrIcuLimit(raw.roomLimit);
  }
  if ('icuLimit' in raw) {
    result.icuLimit = normalizeRoomOrIcuLimit(raw.icuLimit);
  }
  if ('copay' in raw) {
    result.copay = normalizePercentage(raw.copay);
  }
  if ('nonNetworkCopay' in raw) {
    result.nonNetworkCopay = normalizePercentage(raw.nonNetworkCopay);
  }
  if ('copayConditions' in raw) {
    result.copayConditions = {};
    if (raw.copayConditions && typeof raw.copayConditions === 'object') {
      for (const [k, v] of Object.entries(raw.copayConditions)) {
        const norm = normalizePercentage(v);
        if (norm !== null) result.copayConditions[k] = norm;
      }
    }
  }
  if ('deductible' in raw) {
    result.deductible = normalizeIndianCurrency(raw.deductible);
  }
  if ('proportionateDeduction' in raw) {
    let prop =
      typeof raw.proportionateDeduction === 'boolean'
        ? raw.proportionateDeduction
        : raw.proportionateDeduction === 'true'
        ? true
        : raw.proportionateDeduction === 'false'
        ? false
        : null;

    // Guard: if snippet indicates non-committal or 50% room sharing rule, do not treat as active proportionate deduction
    const snippet = String(raw.sourceSnippets?.proportionateDeduction || '').toLowerCase();
    if (snippet.includes('may be subject to') || snippet.includes('50% of the eligible')) {
      prop = false;
    }

    result.proportionateDeduction = prop;
  }
  if ('subLimits' in raw) {
    result.subLimits = {};
    if (raw.subLimits && typeof raw.subLimits === 'object') {
      for (const [k, v] of Object.entries(raw.subLimits)) {
        const norm = normalizeIndianCurrency(v);
        if (norm !== null) result.subLimits[k] = norm;
      }
    }
  }
  if ('restorationBenefit' in raw) {
    result.restorationBenefit =
      typeof raw.restorationBenefit === 'boolean'
        ? raw.restorationBenefit
        : raw.restorationBenefit === 'true'
        ? true
        : raw.restorationBenefit === 'false'
        ? false
        : null;
  }
  if ('cumulativeBonus' in raw) {
    result.cumulativeBonus = normalizeIndianCurrency(raw.cumulativeBonus);
  }
  if ('exclusions' in raw) {
    result.exclusions = Array.isArray(raw.exclusions)
      ? raw.exclusions.map((e: any) => String(e).trim()).filter(Boolean)
      : [];
  }
  if ('hasOtherExclusions' in raw) {
    result.hasOtherExclusions =
      typeof raw.hasOtherExclusions === 'boolean'
        ? raw.hasOtherExclusions
        : raw.hasOtherExclusions === 'true'
        ? true
        : raw.hasOtherExclusions === 'false'
        ? false
        : null;
  }
  if ('waitingPeriods' in raw) {
    if (raw.waitingPeriods && typeof raw.waitingPeriods === 'object') {
      const procs: Record<string, string> = {};
      if (raw.waitingPeriods.procedures && typeof raw.waitingPeriods.procedures === 'object') {
        for (const [k, v] of Object.entries(raw.waitingPeriods.procedures)) {
          procs[k] = String(v);
        }
      }
      result.waitingPeriods = {
        initial: raw.waitingPeriods.initial ? String(raw.waitingPeriods.initial) : null,
        preExisting: raw.waitingPeriods.preExisting ? String(raw.waitingPeriods.preExisting) : null,
        maternity: raw.waitingPeriods.maternity ? String(raw.waitingPeriods.maternity) : null,
        procedures: procs
      };
    } else {
      result.waitingPeriods = null;
    }
  }
  if ('preHospitalizationDays' in raw) {
    result.preHospitalizationDays =
      raw.preHospitalizationDays !== undefined && raw.preHospitalizationDays !== null
        ? parseInt(raw.preHospitalizationDays, 10) || null
        : null;
  }
  if ('postHospitalizationDays' in raw) {
    result.postHospitalizationDays =
      raw.postHospitalizationDays !== undefined && raw.postHospitalizationDays !== null
        ? parseInt(raw.postHospitalizationDays, 10) || null
        : null;
  }
  if ('daycareCovered' in raw) {
    result.daycareCovered =
      typeof raw.daycareCovered === 'boolean'
        ? raw.daycareCovered
        : raw.daycareCovered === 'true'
        ? true
        : raw.daycareCovered === 'false'
        ? false
        : null;
  }
  if ('ambulanceLimit' in raw) {
    result.ambulanceLimit = normalizeIndianCurrency(raw.ambulanceLimit);
  }
  if ('preAuthHours' in raw) {
    result.preAuthHours =
      raw.preAuthHours !== undefined && raw.preAuthHours !== null
        ? parseInt(raw.preAuthHours, 10) || null
        : null;
  }
  if ('claimIntimationHours' in raw) {
    result.claimIntimationHours =
      raw.claimIntimationHours !== undefined && raw.claimIntimationHours !== null
        ? parseInt(raw.claimIntimationHours, 10) || null
        : null;
  }

  return result;
}

