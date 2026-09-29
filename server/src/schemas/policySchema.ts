import { z } from 'zod';
import { TIER_1_REQUIRED_FIELDS, PolicyDocument } from '../types/policy.js';

export const RoomOrIcuLimitZod = z.object({
  type: z.enum(['amount', 'percent', 'category', 'none']),
  value: z.union([z.number(), z.string()]).nullable().optional()
});

export const InsuredPersonZod = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().nonnegative('Age must be a positive integer'),
  relation: z.string().min(1, 'Relation is required')
});

export const WaitingPeriodsZod = z.object({
  initial: z.string().nullable().optional(),
  preExisting: z.string().nullable().optional(),
  maternity: z.string().nullable().optional(),
  procedures: z.record(z.string(), z.string()).optional()
});

/**
 * Extraction Schema matching the AI JSON extraction format.
 * Nullable for best-effort fields.
 */
export const ExtractedPolicyZod = z.object({
  insurer: z.string().nullable().optional(),
  insurerAliases: z.array(z.string()).default([]),
  planName: z.string().nullable().optional(),
  policyType: z.enum(['private', 'corporate', 'pmjay', 'esi']).nullable().optional(),
  policyNumber: z.string().nullable().optional(),
  uin: z.string().nullable().optional(),
  policyStartDate: z.string().nullable().optional(),
  policyEndDate: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  networkType: z.enum(['all-network', 'restricted-network', 'reimbursement-only']).nullable().optional(),
  tpa: z.string().nullable().optional(),
  insuredPersons: z.array(InsuredPersonZod).default([]),

  sumInsured: z.number().nullable().optional(),
  roomLimit: RoomOrIcuLimitZod.nullable().optional(),
  icuLimit: RoomOrIcuLimitZod.nullable().optional(),
  copay: z.number().nullable().optional(),
  nonNetworkCopay: z.number().nullable().optional(),
  copayConditions: z.record(z.string(), z.number()).default({}),
  deductible: z.number().nullable().optional(),
  proportionateDeduction: z.boolean().nullable().optional(),
  subLimits: z.record(z.string(), z.number()).default({}),
  restorationBenefit: z.boolean().nullable().optional(),
  cumulativeBonus: z.number().nullable().optional(),

  exclusions: z.array(z.string()).default([]),
  hasOtherExclusions: z.boolean().nullable().optional(),
  waitingPeriods: WaitingPeriodsZod.nullable().optional(),
  preHospitalizationDays: z.number().nullable().optional(),
  postHospitalizationDays: z.number().nullable().optional(),
  daycareCovered: z.boolean().nullable().optional(),
  ambulanceLimit: z.number().nullable().optional(),
  preAuthHours: z.number().nullable().optional(),
  claimIntimationHours: z.number().nullable().optional(),

  sourceSnippets: z.record(z.string(), z.string()).default({}),
  confidence: z.record(z.string(), z.enum(['high', 'medium', 'low', 'assumed'])).default({})
});

export type ExtractedPolicyInput = z.infer<typeof ExtractedPolicyZod>;

/**
 * Validates which Tier 1 fields are missing (null or undefined).
 * If policyType is 'esi', sumInsured is legally unlimited / null, so it's not considered missing.
 */
export function getMissingTier1Fields(policy: Partial<PolicyDocument>): string[] {
  const missing: string[] = [];

  for (const field of TIER_1_REQUIRED_FIELDS) {
    if (field === 'sumInsured' && policy.policyType === 'esi') {
      // ESI explicitly sets sumInsured to null (statutory unlimited cover)
      continue;
    }
    const val = policy[field];
    if (val === null || val === undefined || val === '') {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Returns low confidence fields ('low' or empty).
 */
export function getLowConfidenceFields(policy: Partial<PolicyDocument>): string[] {
  const lowFields: string[] = [];
  const conf = policy.confidence || {};

  for (const [key, level] of Object.entries(conf)) {
    if (level === 'low') {
      lowFields.push(key);
    }
  }

  return lowFields;
}
