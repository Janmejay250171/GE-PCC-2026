import { PolicyDocument } from '../types/policy.js';

export interface DemoPolicyItem {
  id: string;
  key: string;
  title: string;
  insurer: string;
  planName: string;
  policyType: 'private' | 'corporate' | 'pmjay' | 'esi';
  description: string;
  badge: string;
  data: Omit<PolicyDocument, '_id' | 'createdAt' | 'updatedAt' | 'confirmedByUser'>;
}

export const DEMO_POLICIES: DemoPolicyItem[] = [
  {
    id: 'pol_demo_star',
    key: 'star-health',
    title: 'Star Health (Private)',
    insurer: 'Star Health and Allied Insurance',
    planName: 'Family Health Optima Insurance Plan',
    policyType: 'private',
    description: 'Retail family floater with ₹3,000/day room rent limit, 10% co-pay, and proportionate deduction clause.',
    badge: 'Retail Floater',
    data: {
      insurer: 'Star Health',
      insurerAliases: ['Star Health and Allied Insurance Co. Ltd.', 'Star Health Insurance'],
      planName: 'Family Health Optima',
      policyType: 'private',
      policyNumber: 'P/141234/01/2026/001234',
      uin: 'SHAHLIP26046V092526',
      policyStartDate: '2026-04-01',
      policyEndDate: '2027-03-31',
      zone: 'Zone B',
      networkType: 'all-network',
      tpa: 'Medi Assist',
      insuredPersons: [{ name: 'R. Sharma', age: 52, relation: 'self' }],

      sumInsured: 300000,
      roomLimit: { type: 'amount', value: 3000 },
      icuLimit: { type: 'percent', value: 2 },
      copay: 10,
      nonNetworkCopay: 20,
      copayConditions: { ageAbove60: 20, zoneUpgrade: 15 },
      deductible: 0,
      proportionateDeduction: true,
      subLimits: { 'Knee Replacement': 150000 },
      restorationBenefit: true,
      cumulativeBonus: 15000,

      exclusions: ['cosmetic surgery', 'dental'],
      hasOtherExclusions: true,
      waitingPeriods: {
        initial: '30 days',
        preExisting: '3 years',
        maternity: '9 months',
        procedures: { 'Knee Replacement': '2 years' }
      },
      preHospitalizationDays: 30,
      postHospitalizationDays: 60,
      daycareCovered: true,
      ambulanceLimit: 2000,
      preAuthHours: 48,
      claimIntimationHours: 24,

      sourceSnippets: {
        roomLimit: 'Room rent, boarding and nursing expenses up to Rs.3,000 per day for Sum Insured of Rs.3,00,000',
        icuLimit: 'ICU charges up to 2% of sum insured per day',
        copay: 'A co-payment of 10% applies to each and every admissible claim',
        nonNetworkCopay: 'For non-network hospitalizations, a co-payment of 20% shall apply',
        proportionateDeduction: 'Associated medical expenses shall be paid in proportion to the eligible room rent limit',
        subLimits: 'Sub-limit for Knee Replacement surgery is capped at Rs.1,50,000 per policy year',
        sumInsured: 'Total Sum Insured under policy schedule is Rs.3,00,000'
      },
      confidence: {
        insurer: 'high',
        planName: 'high',
        sumInsured: 'high',
        roomLimit: 'high',
        icuLimit: 'high',
        copay: 'high',
        nonNetworkCopay: 'high',
        deductible: 'high',
        proportionateDeduction: 'high',
        subLimits: 'high'
      },
      rawTextRef: 'mock-policies/star_health_optima.pdf'
    }
  },
  {
    id: 'pol_demo_hdfc',
    key: 'hdfc-ergo',
    title: 'HDFC Ergo (Corporate Group)',
    insurer: 'HDFC ERGO General Insurance',
    planName: 'Corporate Group Health Shield',
    policyType: 'corporate',
    description: 'Employer-provided policy with ₹5 Lakh Sum Insured, 1% room rent cap, zero co-pay, and restoration benefit.',
    badge: 'Employer Group',
    data: {
      insurer: 'HDFC ERGO',
      insurerAliases: ['HDFC ERGO General Insurance Company Limited'],
      planName: 'Corporate Group Health Shield',
      policyType: 'corporate',
      policyNumber: 'HDFC/GRP/2026/98214',
      uin: 'HDFHLGP21422V022021',
      policyStartDate: '2026-01-01',
      policyEndDate: '2026-12-31',
      zone: 'Zone A',
      networkType: 'all-network',
      tpa: 'Vidal Health TPA',
      insuredPersons: [
        { name: 'Amit Verma', age: 34, relation: 'self' },
        { name: 'Pooja Verma', age: 32, relation: 'spouse' }
      ],

      sumInsured: 500000,
      roomLimit: { type: 'percent', value: 1 },
      icuLimit: { type: 'none', value: null },
      copay: 0,
      nonNetworkCopay: 0,
      copayConditions: {},
      deductible: 0,
      proportionateDeduction: true,
      subLimits: {},
      restorationBenefit: true,
      cumulativeBonus: 0,

      exclusions: ['cosmetic surgery', 'dental'],
      hasOtherExclusions: false,
      waitingPeriods: {
        initial: '0 days',
        preExisting: '0 days',
        maternity: '9 months',
        procedures: {}
      },
      preHospitalizationDays: 30,
      postHospitalizationDays: 60,
      daycareCovered: true,
      ambulanceLimit: 2500,
      preAuthHours: 24,
      claimIntimationHours: 48,

      sourceSnippets: {
        roomLimit: 'Room rent eligibility is 1% of Sum Insured per day',
        sumInsured: 'Corporate Floater Sum Insured: Rs.5,00,000 per family',
        copay: 'Nil co-payment applicable across all network hospitals',
        proportionateDeduction: 'Proportionate deduction applies if room category exceeds eligible daily room rent',
        restorationBenefit: '100% Sum Insured restoration benefit triggered upon exhaustion'
      },
      confidence: {
        insurer: 'high',
        planName: 'high',
        sumInsured: 'high',
        roomLimit: 'high',
        icuLimit: 'assumed',
        copay: 'high',
        nonNetworkCopay: 'assumed',
        deductible: 'high',
        proportionateDeduction: 'high'
      },
      rawTextRef: 'mock-policies/hdfc_ergo_corporate.pdf'
    }
  },
  {
    id: 'pol_demo_pmjay',
    key: 'pmjay',
    title: 'PM-JAY (Ayushman Bharat)',
    insurer: 'National Health Authority',
    planName: 'Ayushman Bharat PM-JAY',
    policyType: 'pmjay',
    description: 'Government scheme: ₹5,00,000 cashless family cover, no room limit, zero co-pay at empanelled hospitals.',
    badge: 'Govt Scheme',
    data: {
      insurer: 'National Health Authority',
      insurerAliases: ['Pradhan Mantri Jan Arogya Yojana', 'Ayushman Bharat', 'NHA PMJAY'],
      planName: 'Pradhan Mantri Jan Arogya Yojana',
      policyType: 'pmjay',
      policyNumber: 'AB-PMJAY-2026-KA-0941',
      uin: 'GOI-PMJAY-SCHEME-01',
      policyStartDate: '2026-01-01',
      policyEndDate: '2026-12-31',
      zone: 'Zone B',
      networkType: 'restricted-network',
      tpa: 'State Health Agency Karnataka',
      insuredPersons: [{ name: 'K. Gowda', age: 48, relation: 'self' }],

      sumInsured: 500000,
      roomLimit: { type: 'none', value: null },
      icuLimit: { type: 'none', value: null },
      copay: 0,
      nonNetworkCopay: 0,
      copayConditions: {},
      deductible: 0,
      proportionateDeduction: false,
      subLimits: {},
      restorationBenefit: false,
      cumulativeBonus: 0,

      exclusions: ['cosmetic surgery'],
      hasOtherExclusions: false,
      waitingPeriods: {
        initial: '0 days',
        preExisting: '0 days',
        maternity: '0 days',
        procedures: {}
      },
      preHospitalizationDays: 3,
      postHospitalizationDays: 15,
      daycareCovered: true,
      ambulanceLimit: 1000,
      preAuthHours: 24,
      claimIntimationHours: 24,

      sourceSnippets: {
        sumInsured: 'Statutory family cover of Rs. 5,00,000 per eligible family per annum',
        roomLimit: 'Package treatment rates cover all standard hospitalization charges with no room rent ceiling',
        copay: 'Entirely cashless treatment with zero patient co-pay or user charges',
        proportionateDeduction: 'Standardized package rates apply without proportionate room deductions'
      },
      confidence: {
        sumInsured: 'assumed',
        roomLimit: 'assumed',
        icuLimit: 'assumed',
        copay: 'assumed',
        nonNetworkCopay: 'assumed',
        proportionateDeduction: 'assumed',
        networkType: 'assumed'
      },
      rawTextRef: 'mock-policies/pmjay_ayushman_bharat.pdf'
    }
  },
  {
    id: 'pol_demo_esi',
    key: 'esi',
    title: 'ESI (Employee State Insurance)',
    insurer: 'Employees State Insurance Corporation',
    planName: 'ESIC Medical Benefit Scheme',
    policyType: 'esi',
    description: 'Statutory cover: full coverage at ESIC hospitals and tie-up centers, unlimited SI, zero room rent cap or co-pay.',
    badge: 'Statutory Cover',
    data: {
      insurer: 'Employees State Insurance Corporation',
      insurerAliases: ['ESIC', 'ESI Scheme'],
      planName: 'ESIC Medical Benefit Scheme',
      policyType: 'esi',
      policyNumber: 'ESI/IP/5210984321',
      uin: 'ESIC-STATUTORY-MED-01',
      policyStartDate: '2026-04-01',
      policyEndDate: '2027-03-31',
      zone: 'Zone B',
      networkType: 'restricted-network',
      tpa: 'ESIC Medical Directorate',
      insuredPersons: [{ name: 'M. Sundaram', age: 39, relation: 'self' }],

      sumInsured: null, // unlimited in the engine
      roomLimit: { type: 'none', value: null },
      icuLimit: { type: 'none', value: null },
      copay: 0,
      nonNetworkCopay: 0,
      copayConditions: {},
      deductible: 0,
      proportionateDeduction: false,
      subLimits: {},
      restorationBenefit: false,
      cumulativeBonus: 0,

      exclusions: ['cosmetic surgery'],
      hasOtherExclusions: false,
      waitingPeriods: {
        initial: '0 days',
        preExisting: '0 days',
        maternity: '0 days',
        procedures: {}
      },
      preHospitalizationDays: 30,
      postHospitalizationDays: 30,
      daycareCovered: true,
      ambulanceLimit: 1500,
      preAuthHours: 24,
      claimIntimationHours: 24,

      sourceSnippets: {
        sumInsured: 'Statutory medical benefits under ESI Act provide full unlimited medical care',
        roomLimit: 'Medical care provided through ESIC hospitals and empaneled tie-up centers with no room rent capping',
        copay: 'Completely free and cashless medical treatment for insured person and dependents',
        proportionateDeduction: 'Statutory treatment with no proportionate deduction clauses'
      },
      confidence: {
        sumInsured: 'assumed',
        roomLimit: 'assumed',
        icuLimit: 'assumed',
        copay: 'assumed',
        nonNetworkCopay: 'assumed',
        proportionateDeduction: 'assumed',
        networkType: 'assumed'
      },
      rawTextRef: 'mock-policies/esi_scheme.pdf'
    }
  }
];
