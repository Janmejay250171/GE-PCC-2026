export type JourneyEventType =
  | 'ADMISSION_COMPLETED'
  | 'PREAUTH_REQUESTED'
  | 'PREAUTH_PENDING'
  | 'PREAUTH_APPROVED'
  | 'PREAUTH_PARTIALLY_APPROVED'
  | 'PREAUTH_REJECTED'
  | 'ROOM_ASSIGNED'
  | 'ROOM_CHANGED'
  | 'INVESTIGATION_INITIATED'
  | 'INVESTIGATION_COMPLETED'
  | 'PROCEDURE_PLANNED'
  | 'PROCEDURE_AUTHORIZED'
  | 'PROCEDURE_COMPLETED'
  | 'ADDITIONAL_EXPENSE'
  | 'BILLING_INITIATED'
  | 'DISCHARGE_INITIATED'
  | 'FINAL_BILL'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_UNDER_REVIEW'
  | 'CLAIM_SETTLED'
  | 'CLAIM_PARTIALLY_SETTLED'
  | 'CLAIM_REJECTED'
  | 'POST_DISCHARGE';

export type JourneyStage =
  | 'ADMISSION'
  | 'INVESTIGATION'
  | 'PROCEDURE'
  | 'BILLING'
  | 'DISCHARGE'
  | 'RECOVERY';

export type JourneyEventSource =
  | 'SIMULATED_HOSPITAL_FEED'
  | 'SIMULATED_TPA_FEED'
  | 'USER_ACTION'
  | 'INTEGRATION_FEED';

export type JourneyEventStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type EventSeverity =
  | 'INFO'
  | 'ATTENTION'
  | 'ACTION_REQUIRED'
  | 'CRITICAL';

export type DataProvenance =
  | 'POLICY-DERIVED'
  | 'DATASET-DERIVED'
  | 'MODELLED ESTIMATE'
  | 'SYSTEM ASSUMPTION'
  | 'SIMULATED DEMO EVENT'
  | 'USER-CONFIRMED'
  | 'UNKNOWN';

export interface WhyExplanation {
  title: string;
  policyRule: string;
  policyValue: string;
  patientValue: string;
  consequence: string;
  suggestedAction: string;
}

export interface InsuranceImpactResult {
  hasImpact: boolean;
  severity: EventSeverity;
  title: string;
  summary: string;
  implications: string[];
  recommendedActions: string[];
  whyExplanation: WhyExplanation;
  financialDelta?: {
    previousOutofPocket?: number;
    updatedOutofPocket?: number;
    roomRentExcessPerDay?: number;
    proportionateDisallowance?: number;
    difference?: number;
  };
  provenance: DataProvenance;
}

export interface JourneyAlert {
  id: string;
  eventId: string;
  stage: JourneyStage;
  severity: EventSeverity;
  title: string;
  message: string;
  whyExplanation: WhyExplanation;
  actionable?: string;
  provenance: DataProvenance;
  timestamp: string;
  resolved: boolean;
}

export interface JourneyEvent {
  id: string;
  patientId: string;
  timestamp: string;
  eventType: JourneyEventType;
  stage: JourneyStage;
  source: JourneyEventSource;
  status: JourneyEventStatus;
  metadata: Record<string, any>;
  insuranceImpact?: InsuranceImpactResult;
  requiresAction: boolean;
  severity: EventSeverity;
  isEmergency?: boolean;
  provenance: DataProvenance;
}

export interface FinancialSnapshot {
  estimatedBill: number;
  roomCharges: number;
  roomRatePerDay: number;
  procedureCharges: number;
  doctorFees: number;
  medicineCharges: number;
  roomRentExcess: number;
  proportionateDisallowance: number;
  deductibleApplied: number | null;
  copayAmount: number;
  excessOverSumInsured: number;
  patientPayable: number;
  insurerEstimatedShare: number;
  sumInsuredRemaining?: number;
  provenance: DataProvenance;
}

export interface JourneyState {
  _id: string;
  patientId: string;
  policyId: string;
  hospitalName: string;
  hospitalAddress?: string;
  procedure?: string;
  currentRoom: string;
  currentStage: JourneyStage;
  authorizationStatus: 'NOT_STARTED' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  claimStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  events: JourneyEvent[];
  activeAlerts: JourneyAlert[];
  resolvedAlerts: JourneyAlert[];
  financialSnapshot: FinancialSnapshot | null;
  isEmergency?: boolean;
  lastUpdated: string;
}
