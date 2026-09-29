import {
  HospitalEventProvider,
  InsuranceNetworkProvider,
  TPAAuthorizationProvider,
  ClaimStatusProvider,
  PreAuthSubmissionRequest,
  PreAuthSubmissionResponse,
  ClaimSubmissionRequest,
  ClaimStatusResponse
} from '../../types/integration.js';
import { JourneyEvent } from '../../types/journey.js';
import { HospitalNetworkInfo } from '../../types/hospital.js';
import { getHospitalNetworkStatus } from '../networkMatchingService.js';
import { hospitalService } from '../hospitalService.js';

/**
 * MockHospitalEventProvider
 * Simulated Care Journey Event Provider for PCC 2026 Demonstrations.
 * Clearly tags all emitted feeds as SIMULATED DEMO EVENT.
 */
export class MockHospitalEventProvider implements HospitalEventProvider {
  private events: Map<string, JourneyEvent[]> = new Map();

  getProviderName(): string {
    return 'MockHospitalEventProvider (Simulated Feed)';
  }

  async emitEvent(event: JourneyEvent): Promise<JourneyEvent> {
    const list = this.events.get(event.patientId) || [];
    const normalizedEvent: JourneyEvent = {
      ...event,
      source: 'SIMULATED_HOSPITAL_FEED',
      provenance: 'SIMULATED DEMO EVENT',
      timestamp: event.timestamp || new Date().toISOString()
    };
    list.push(normalizedEvent);
    this.events.set(event.patientId, list);
    return normalizedEvent;
  }

  async getEventStream(patientId: string): Promise<JourneyEvent[]> {
    return this.events.get(patientId) || [];
  }
}

/**
 * MockTPAProvider
 * Simulated TPA Cashless Pre-Auth Gateway.
 * Emits explicit 'Simulated Demo' responses without claiming live connectivity.
 */
export class MockTPAProvider implements TPAAuthorizationProvider {
  getProviderName(): string {
    return 'MockTPAProvider (Simulated TPA Gateway)';
  }

  async submitPreAuth(request: PreAuthSubmissionRequest): Promise<PreAuthSubmissionResponse> {
    const isRoomExcess = request.roomCategory?.toLowerCase().includes('private');
    const approvedAmount = isRoomExcess
      ? Math.round(request.estimatedCost * 0.75)
      : Math.round(request.estimatedCost * 0.90);

    return {
      preAuthId: `SIM-TPA-${Date.now().toString(36).toUpperCase()}`,
      status: 'APPROVED',
      approvedAmount,
      copayDeduction: Math.round(request.estimatedCost * 0.10),
      remarks: 'Simulated initial pre-authorization generated for PCC 2026 demonstration.',
      timestamp: new Date().toISOString(),
      source: 'SIMULATED_TPA_FEED'
    };
  }

  async checkAuthStatus(preAuthId: string): Promise<PreAuthSubmissionResponse> {
    return {
      preAuthId,
      status: 'APPROVED',
      approvedAmount: 50000,
      remarks: 'Simulated pre-authorization status verification.',
      timestamp: new Date().toISOString(),
      source: 'SIMULATED_TPA_FEED'
    };
  }
}

/**
 * MockNetworkProvider
 * Uses verified local empanelment dataset with explicit reference dataset provenance.
 */
export class MockNetworkProvider implements InsuranceNetworkProvider {
  getProviderName(): string {
    return 'MockNetworkProvider (Empanelment Reference Dataset)';
  }

  async verifyNetworkStatus(
    hospitalIdOrName: string,
    insurerName: string,
    aliases: string[] = []
  ): Promise<HospitalNetworkInfo> {
    const hosp = hospitalService.getHospitalByName(hospitalIdOrName);
    if (!hosp) {
      return {
        networkStatus: 'unknown',
        matchedInsurer: null,
        matchMethod: 'insufficient_data',
        matchEvidence: null,
        freshness: {
          sourceType: 'Empanelment Registry',
          sourceName: 'Healthcare Provider Reference Dataset',
          lastUpdated: 'Freshness: Unknown',
          verificationLevel: 'Reference Dataset Match',
          freshnessStatus: 'UNKNOWN'
        }
      };
    }

    const info = getHospitalNetworkStatus(hosp, insurerName, aliases);
    return {
      ...info,
      freshness: {
        sourceType: 'Empanelment Registry',
        sourceName: 'Healthcare Provider Reference Dataset',
        lastUpdated: 'Freshness: Unknown',
        verificationLevel: 'Reference Dataset Match',
        freshnessStatus: 'UNKNOWN'
      }
    };
  }
}

/**
 * MockClaimStatusProvider
 * Simulated post-discharge claim review feed.
 */
export class MockClaimStatusProvider implements ClaimStatusProvider {
  getProviderName(): string {
    return 'MockClaimStatusProvider (Simulated Feed)';
  }

  async submitClaim(request: ClaimSubmissionRequest): Promise<ClaimStatusResponse> {
    return {
      claimId: `SIM-CLM-${Date.now().toString(36).toUpperCase()}`,
      status: 'SUBMITTED',
      remarks: 'Simulated claim docket generated for testing and demonstration.',
      timestamp: new Date().toISOString(),
      source: 'SIMULATED_TPA_FEED'
    };
  }

  async getClaimStatus(claimId: string): Promise<ClaimStatusResponse> {
    return {
      claimId,
      status: 'UNDER_REVIEW',
      remarks: 'Simulated claim audit currently under review by simulated TPA audit desk.',
      timestamp: new Date().toISOString(),
      source: 'SIMULATED_TPA_FEED'
    };
  }
}

export const mockHospitalEventProvider = new MockHospitalEventProvider();
export const mockTPAProvider = new MockTPAProvider();
export const mockNetworkProvider = new MockNetworkProvider();
export const mockClaimStatusProvider = new MockClaimStatusProvider();
