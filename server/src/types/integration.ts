import { JourneyEvent, JourneyEventType, JourneyStage } from './journey.js';
import { HospitalNetworkInfo } from './hospital.js';

export interface PreAuthSubmissionRequest {
  patientId: string;
  policyId: string;
  hospitalName: string;
  treatingDoctor: string;
  diagnosis: string;
  proposedProcedure?: string;
  estimatedCost: number;
  roomCategory: string;
  isEmergency?: boolean;
}

export interface PreAuthSubmissionResponse {
  preAuthId: string;
  status: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  approvedAmount?: number;
  copayDeduction?: number;
  remarks: string;
  timestamp: string;
  source: string;
}

export interface ClaimSubmissionRequest {
  patientId: string;
  policyId: string;
  hospitalName: string;
  totalClaimAmount: number;
  documentsEnclosed: string[];
}

export interface ClaimStatusResponse {
  claimId: string;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  settledAmount?: number;
  deductionsAmount?: number;
  remarks: string;
  timestamp: string;
  source: string;
}

export interface RoomAvailabilityResponse {
  hospitalName: string;
  roomCategory: string;
  availableBeds: number;
  dailyRate: number;
  lastUpdated: string;
}

/**
 * Production Integration Interface: Hospital Event Provider
 * Connects to hospital EHR / ADT / HL7 FHIR event feeds.
 */
export interface HospitalEventProvider {
  getProviderName(): string;
  emitEvent(event: JourneyEvent): Promise<JourneyEvent>;
  getEventStream(patientId: string): Promise<JourneyEvent[]>;
}

/**
 * Production Integration Interface: Insurance Network Provider
 * Connects to National Health Claims Exchange (NHCX) or Insurer Empanelment APIs.
 */
export interface InsuranceNetworkProvider {
  getProviderName(): string;
  verifyNetworkStatus(hospitalIdOrName: string, insurerName: string, aliases?: string[]): Promise<HospitalNetworkInfo>;
}

/**
 * Production Integration Interface: TPA Authorization Provider
 * Connects to TPA Cashless Gateways (Medi Assist, Vidal, Paramount, etc.).
 */
export interface TPAAuthorizationProvider {
  getProviderName(): string;
  submitPreAuth(request: PreAuthSubmissionRequest): Promise<PreAuthSubmissionResponse>;
  checkAuthStatus(preAuthId: string): Promise<PreAuthSubmissionResponse>;
}

/**
 * Production Integration Interface: Hospital Availability Provider
 * Connects to live hospital bed management / occupancy systems.
 */
export interface HospitalAvailabilityProvider {
  getProviderName(): string;
  checkAvailability(hospitalName: string, roomCategory: string): Promise<RoomAvailabilityResponse>;
}

/**
 * Production Integration Interface: Claim Status Provider
 * Connects to post-discharge claim adjudication feeds.
 */
export interface ClaimStatusProvider {
  getProviderName(): string;
  submitClaim(request: ClaimSubmissionRequest): Promise<ClaimStatusResponse>;
  getClaimStatus(claimId: string): Promise<ClaimStatusResponse>;
}
