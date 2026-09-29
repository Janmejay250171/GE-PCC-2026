import { HospitalRecord, HospitalNetworkInfo, NetworkStatus, MatchMethod } from '../types/hospital.js';

export interface CanonicalInsurerDefinition {
  canonicalName: string;
  aliases: string[];
}

export const CANONICAL_INSURER_REGISTRY: Record<string, CanonicalInsurerDefinition> = {
  hdfc_ergo: {
    canonicalName: 'HDFC ERGO General Insurance',
    aliases: [
      'hdfc ergo',
      'hdfc ergo general insurance company limited',
      'hdfc ergo general insurance co ltd',
      'hdfc ergo general insurance',
      'hdfc ergo health insurance',
      'hdfc ergo health',
      'hdfc health insurance',
      'hdfc health insurance demo',
      'hdfc health',
      'hdfc health secure',
      'hdfc health secure demo plan',
      'hdfc health secure demo',
      'hdfc general insurance',
      'hdfc insurance',
      'hdfc standard',
      'hdfc standard life',
      'hdfc life',
      'hdfc ltd',
      'hdfc'
    ]
  },
  star_health: {
    canonicalName: 'Star Health and Allied Insurance',
    aliases: [
      'star health',
      'star health and allied insurance',
      'star health and allied insurance company limited',
      'star health and allied insurance co ltd',
      'star health insurance'
    ]
  },
  icici_lombard: {
    canonicalName: 'ICICI Lombard General Insurance',
    aliases: [
      'icici lombard',
      'icici lombard general insurance',
      'icici lombard general insurance company limited',
      'icici lombard general insurance co ltd',
      'icici'
    ]
  },
  care_health: {
    canonicalName: 'Care Health Insurance',
    aliases: [
      'care health',
      'care health insurance',
      'care health insurance limited',
      'care health insurance co ltd',
      'care insurance',
      'religare',
      'religare health insurance'
    ]
  },
  niva_bupa: {
    canonicalName: 'Niva Bupa Health Insurance',
    aliases: [
      'niva bupa',
      'niva bupa health insurance',
      'niva bupa health insurance company limited',
      'max bupa',
      'max bupa health insurance',
      'max bupa health insurance co ltd'
    ]
  },
  aditya_birla: {
    canonicalName: 'Aditya Birla Health Insurance',
    aliases: [
      'aditya birla',
      'aditya birla health insurance',
      'aditya birla health insurance co ltd',
      'aditya birla health'
    ]
  },
  bajaj_allianz: {
    canonicalName: 'Bajaj Allianz General Insurance',
    aliases: [
      'bajaj allianz',
      'bajaj allianz general insurance',
      'bajaj allianz general insurance company limited',
      'bajaj allianz general insurance co ltd'
    ]
  },
  tata_aig: {
    canonicalName: 'Tata AIG General Insurance',
    aliases: [
      'tata aig',
      'tata aig general insurance',
      'tata aig general insurance company limited'
    ]
  },
  sbi_general: {
    canonicalName: 'SBI General Insurance',
    aliases: [
      'sbi general',
      'sbi general insurance',
      'sbi general insurance company limited'
    ]
  },
  new_india: {
    canonicalName: 'The New India Assurance',
    aliases: [
      'new india',
      'new india assurance',
      'the new india assurance',
      'the new india assurance company limited'
    ]
  },
  national_insurance: {
    canonicalName: 'National Insurance Company',
    aliases: [
      'national insurance',
      'national insurance company',
      'national insurance company limited'
    ]
  },
  oriental_insurance: {
    canonicalName: 'The Oriental Insurance Company',
    aliases: [
      'oriental insurance',
      'the oriental insurance',
      'the oriental insurance company limited'
    ]
  },
  united_india: {
    canonicalName: 'United India Insurance',
    aliases: [
      'united india',
      'united india insurance',
      'united india insurance company limited'
    ]
  },
  pmjay: {
    canonicalName: 'PM-JAY (Ayushman Bharat)',
    aliases: [
      'pmjay',
      'pm jay',
      'ayushman bharat',
      'ayushman bharat pm jay',
      'ayushman bharat pmjay',
      'ab pmjay',
      'national health authority'
    ]
  },
  esi: {
    canonicalName: 'ESI (Employee State Insurance)',
    aliases: [
      'esi',
      'esic',
      'employees state insurance',
      'employees state insurance corporation'
    ]
  },
  manipal_cigna: {
    canonicalName: 'ManipalCigna Health Insurance',
    aliases: [
      'manipal cigna',
      'manipalcigna',
      'manipal cigna health insurance',
      'cigna ttk'
    ]
  }
};

/**
 * Controlled normalization for insurer names:
 * 1. trim
 * 2. lowercase
 * 3. remove punctuation (replace non-alphanumeric with space)
 * 4. collapse whitespace
 */
export function normalizeInsurer(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a normalized string to its canonical key in CANONICAL_INSURER_REGISTRY.
 * Uses exact normalized alias match, with smart token-boundary fallback.
 */
export function getCanonicalInsurerKey(input: string): string | null {
  const norm = normalizeInsurer(input);
  if (!norm) return null;

  for (const [key, def] of Object.entries(CANONICAL_INSURER_REGISTRY)) {
    for (const alias of def.aliases) {
      if (norm === alias) {
        return key;
      }
    }
  }

  // Fallback: Check whole-word tokens for compound or descriptive insurer titles (e.g. "HDFC Health Insurance (Demo)")
  if (/\bhdfc\b/i.test(norm)) return 'hdfc_ergo';
  if (/\bstar\s+health\b/i.test(norm)) return 'star_health';
  if (/\bcare\s+health\b|\breligare\b/i.test(norm)) return 'care_health';
  if (/\bicici\b/i.test(norm)) return 'icici_lombard';
  if (/\bniva\s+bupa\b|\bmax\s+bupa\b/i.test(norm)) return 'niva_bupa';
  if (/\baditya\s+birla\b/i.test(norm)) return 'aditya_birla';
  if (/\bbajaj\s+allianz\b/i.test(norm)) return 'bajaj_allianz';
  if (/\btata\s+aig\b/i.test(norm)) return 'tata_aig';
  if (/\bsbi\b/i.test(norm)) return 'sbi_general';
  if (/\bnew\s+india\b/i.test(norm)) return 'new_india';
  if (/\bunited\s+india\b/i.test(norm)) return 'united_india';
  if (/\boriental\b/i.test(norm)) return 'oriental_insurance';
  if (/\bnational\s+insurance\b/i.test(norm)) return 'national_insurance';
  if (/\bpm\s*jay\b|\bayushman\b/i.test(norm)) return 'pmjay';
  if (/\besi\b|\besic\b/i.test(norm)) return 'esi';
  if (/\bmanipal\s*cigna\b/i.test(norm)) return 'manipal_cigna';

  return null;
}

/**
 * Authoritative backend function to calculate network status for a hospital against an insurer.
 *
 * Guaranteed return status:
 * - 'verified': reliable, validated match found.
 * - 'unverified': hospital exists, but hospital insurer data is missing/empty/invalid.
 * - 'no_match': hospital has insurer data, but requested insurer does not match.
 * - 'unknown': policy insurer is missing, empty, or cannot be determined.
 */
export function getHospitalNetworkStatus(
  hospital: HospitalRecord | { insurers?: string[]; insurersRaw?: string; hospital_name?: string },
  policyInsurer?: string | null,
  policyAliases: string[] = []
): HospitalNetworkInfo {
  const freshnessInfo = {
    sourceType: 'Empanelment Registry',
    sourceName: 'Healthcare Provider Reference Dataset',
    lastUpdated: 'Freshness: Unknown',
    verificationLevel: 'Reference Dataset Match',
    freshnessStatus: 'UNKNOWN' as const
  };

  // 1. Check if policy insurer is provided
  const normPolicyInsurer = normalizeInsurer(policyInsurer);
  if (!normPolicyInsurer) {
    return {
      networkStatus: 'unknown',
      matchedInsurer: null,
      matchMethod: 'insufficient_data',
      matchEvidence: null,
      freshness: freshnessInfo
    };
  }

  // 2. Check hospital insurer data
  const rawList = Array.isArray(hospital.insurers) ? hospital.insurers : [];
  const cleanedHospInsurers = rawList
    .map(i => ({ raw: i, norm: normalizeInsurer(i) }))
    .filter(item => item.norm.length > 0);

  // If hospital has no insurer information at all, it is unverified
  if (cleanedHospInsurers.length === 0) {
    return {
      networkStatus: 'unverified',
      matchedInsurer: null,
      matchMethod: 'insufficient_data',
      matchEvidence: null,
      freshness: freshnessInfo
    };
  }

  // Build list of all candidate policy names to match against
  const allPolicyCandidateNames: string[] = [normPolicyInsurer];
  for (const a of policyAliases) {
    const normA = normalizeInsurer(a);
    if (normA && !allPolicyCandidateNames.includes(normA)) {
      allPolicyCandidateNames.push(normA);
    }
  }

  // Find canonical key for the policy insurer (if recognized)
  const policyCanonicalKeys = new Set<string>();
  for (const cand of allPolicyCandidateNames) {
    const k = getCanonicalInsurerKey(cand);
    if (k) policyCanonicalKeys.add(k);
  }

  // A. Check exact normalized match
  for (const hItem of cleanedHospInsurers) {
    for (const pCand of allPolicyCandidateNames) {
      if (hItem.norm === pCand) {
        return {
          networkStatus: 'verified',
          matchedInsurer: policyInsurer || hItem.raw,
          matchMethod: 'exact',
          matchEvidence: hItem.raw,
          freshness: freshnessInfo
        };
      }
    }
  }

  // B. Check canonical alias match
  if (policyCanonicalKeys.size > 0) {
    for (const hItem of cleanedHospInsurers) {
      const hospKey = getCanonicalInsurerKey(hItem.norm);
      if (hospKey && policyCanonicalKeys.has(hospKey)) {
        return {
          networkStatus: 'verified',
          matchedInsurer: policyInsurer || hItem.raw,
          matchMethod: 'canonical_alias',
          matchEvidence: hItem.raw,
          freshness: freshnessInfo
        };
      }
    }
  }

  // No verified match found among listed insurers
  return {
    networkStatus: 'no_match',
    matchedInsurer: null,
    matchMethod: 'no_match',
    matchEvidence: null,
    freshness: freshnessInfo
  };
}
