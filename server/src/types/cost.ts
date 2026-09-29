export interface CostBreakdownItem {
  category: string;
  grossAmount: number;
  approvedAmount: number;
  deductionReason?: string;
}

export interface CostEstimate {
  policyId: string;
  hospitalId: string;
  procedureName: string;
  roomCategory: string;
  expectedDays: number;
  totalEstimatedBill: number;
  insurerPayable: number;
  patientPayable: number;
  proportionateDeductionApplied: boolean;
  copayAmount: number;
  deductibleApplied: number;
  breakdown: CostBreakdownItem[];
}
