export type RoomCategory = 'General Ward' | 'Twin Sharing' | 'Single Private Room';

export interface Hospital {
  _id: string;
  name: string;
  networkInsurers: string[];
  city: string;
  zone: string;
  tier: string;
  cashlessSupported: boolean;
  empanelledSchemes: string[];
  roomCategories: { name: string; dailyRate: number }[];
  procedureCostEstimates: Record<string, number>;
}

export interface HospitalRecord {
  hospital_name: string;
  hospital_type: 'Private' | 'Government' | string;
  address: string;
  city: string;
  insurers: string[];
  insurersRaw: string;
  rating: number;
  specialties: string[];
  tier: string;
  segment: string;
}

export interface CostRecord {
  tier: string;
  specialty: string;
  procedure: string;
  low_cost: number;
  highest_cost: number;
  mean_cost: number;
  estimated_stay_days: number;
  general_ward_cost_per_day: number;
  twin_sharing_cost_per_day: number;
  single_private_room_cost_per_day: number;
  isAggregate?: boolean;
}

export interface HospitalEstimate {
  available: boolean;
  level: 'procedure' | 'specialty' | 'tier' | 'unavailable';
  lowCost: number;
  meanCost: number;
  highestCost: number;
  segmentAdjustedCost: number;
  hospitalVariation: number;
  treatmentCost: number;
  roomCost: number;
  totalCost: number;
  displayLow: number;
  displayHigh: number;
  estimatedStayDays: number;
  roomCostPerDay: number;
}

export type NetworkStatus = 'verified' | 'unverified' | 'no_match' | 'unknown';
export type MatchMethod = 'exact' | 'canonical_alias' | 'no_match' | 'insufficient_data';

export interface DataFreshnessInfo {
  sourceType: string;
  sourceName: string;
  lastUpdated: string;
  verificationLevel: string;
  freshnessStatus: 'CURRENT' | 'AGING' | 'STALE' | 'UNKNOWN';
}

export interface HospitalNetworkInfo {
  networkStatus: NetworkStatus;
  matchedInsurer: string | null;
  matchMethod: MatchMethod;
  matchEvidence: string | null;
  freshness?: DataFreshnessInfo;
}

export interface CanonicalFinancialImpact {
  estimatedBill: number;
  eligibleAmount: number;
  roomRentExcess: number;
  roomRentExcessPerDay: number;
  roomLimitEligiblePerDay: number;
  roomLimitType: string;
  proportionateDeductionActive: boolean;
  proportionateDisallowance: number;
  deductibleApplied: number | null;
  deductibleUnknown: boolean;
  effectiveCopayPercent: number | null;
  copayAmount: number;
  isCopayUncertain: boolean;
  sumInsuredExcess: number;
  isSumInsuredUnknown: boolean;
  modelledNonMedicalAllowance: number;
  patientPayable: number;
  insurerEstimatedShare: number;
  sublimitExcess?: number;
  applicableSublimit?: number | null;
  sublimitName?: string | null;
  isSpecialtyExcluded?: boolean;
}

export interface ScoreBreakdown {
  coverageFit: number;      // 0 - 100 (50% weight)
  patientCostFit: number;   // 0 - 100 (25% weight)
  hospitalTypeScore: number;// 0 - 100 (15% weight)
  coPayFit: number;         // 0 - 100 (10% weight)
  finalScore: number;       // 0 - 100
  granularScore?: number;   // 0.0 - 100.0 (high resolution 1-decimal)
  patientPayable: number;
  insurerEstimatedShare: number;
  coPayAmount: number;
  excessOverSI: number;
  totalRoomRentExcess?: number;
  proportionateDisallowance?: number;
  deductibleApplied?: number | null;
  deductibleUnknown?: boolean;
  modelledNonMedicalAllowance?: number;
  isCopayUncertain?: boolean;
  isSumInsuredUnknown?: boolean;
  networkStatus?: NetworkStatus;
}

export interface SpecialtyNameMatch {
  matched: boolean;
  strength: 'strong' | 'medium' | 'weak' | 'none';
  keywords: string[];
  matchedKeywords: string[];
  score: number;
  explanation: string | null;
}

export interface RankedHospitalItem {
  hospital: HospitalRecord;
  estimate: HospitalEstimate;
  score: ScoreBreakdown;
  networkInfo: HospitalNetworkInfo;
  rank: number;
  specialtyNameMatch?: SpecialtyNameMatch;
  specialtyNameRelevance?: SpecialtyNameMatch;
}

export interface ItemizedBill {
  roomCharges: number;
  roomRatePerDay: number;
  stayDays: number;
  procedureCharges: number;
  medicineCharges: number;
  doctorFees: number;
  otherCharges: number;
  totalBill: number;
}

export interface PolicyImpactBreakdown {
  itemizedBill: ItemizedBill;
  networkInfo: HospitalNetworkInfo;
  roomLimitEligiblePerDay: number;
  roomLimitType: string;
  roomRentExcessPerDay: number;
  totalRoomRentExcess: number;
  proportionateDeductionActive: boolean;
  proportionateDisallowance: number;
  copayPercent: number | null;
  copayAmount: number;
  isCopayUncertain?: boolean;
  deductibleApplied: number | null;
  deductibleUnknown?: boolean;
  excessOverSumInsured: number;
  isSumInsuredUnknown?: boolean;
  modelledNonMedicalAllowance: number;
  nonMedicalDeductible: number; // Retained for backwards compatibility
  totalPatientPayable: number;
  totalInsuranceCovered: number;
  sublimitExcess?: number;
  applicableSublimit?: number | null;
  sublimitName?: string | null;
  isSpecialtyExcluded?: boolean;
  aiRecommendations: {
    type: 'warning' | 'info' | 'success' | 'suggestion';
    title: string;
    message: string;
    actionable?: string;
  }[];
}

export interface HospitalSearchResult {
  hospitals: RankedHospitalItem[];
  totalCount: number;
  networkFacilityCount: number;
  specialtyMatchedCount: number;
  procedureMatchedCount: number;
  cityAverageCost: number;
  networkStatus?: NetworkStatus;
  message?: string;
}

