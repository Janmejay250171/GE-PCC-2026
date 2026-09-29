export const JOURNEY_EVENT_TYPES = {
  ADMISSION_COMPLETED: 'ADMISSION_COMPLETED',
  PREAUTH_REQUESTED: 'PREAUTH_REQUESTED',
  PREAUTH_PENDING: 'PREAUTH_PENDING',
  PREAUTH_APPROVED: 'PREAUTH_APPROVED',
  PREAUTH_PARTIALLY_APPROVED: 'PREAUTH_PARTIALLY_APPROVED',
  PREAUTH_REJECTED: 'PREAUTH_REJECTED',
  ROOM_ASSIGNED: 'ROOM_ASSIGNED',
  ROOM_CHANGED: 'ROOM_CHANGED',
  INVESTIGATION_INITIATED: 'INVESTIGATION_INITIATED',
  INVESTIGATION_COMPLETED: 'INVESTIGATION_COMPLETED',
  PROCEDURE_PLANNED: 'PROCEDURE_PLANNED',
  PROCEDURE_AUTHORIZED: 'PROCEDURE_AUTHORIZED',
  PROCEDURE_COMPLETED: 'PROCEDURE_COMPLETED',
  ADDITIONAL_EXPENSE: 'ADDITIONAL_EXPENSE',
  BILLING_INITIATED: 'BILLING_INITIATED',
  DISCHARGE_INITIATED: 'DISCHARGE_INITIATED',
  FINAL_BILL: 'FINAL_BILL',
  CLAIM_SUBMITTED: 'CLAIM_SUBMITTED',
  CLAIM_UNDER_REVIEW: 'CLAIM_UNDER_REVIEW',
  CLAIM_SETTLED: 'CLAIM_SETTLED',
  CLAIM_PARTIALLY_SETTLED: 'CLAIM_PARTIALLY_SETTLED',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  POST_DISCHARGE: 'POST_DISCHARGE'
};

export const JOURNEY_STAGES = {
  ADMISSION: 'ADMISSION',
  INVESTIGATION: 'INVESTIGATION',
  PROCEDURE: 'PROCEDURE',
  BILLING: 'BILLING',
  DISCHARGE: 'DISCHARGE',
  RECOVERY: 'RECOVERY'
};

export const EVENT_SEVERITIES = {
  INFO: 'INFO',
  ATTENTION: 'ATTENTION',
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  CRITICAL: 'CRITICAL'
};

export const PROVENANCE_TYPES = {
  POLICY_DERIVED: 'POLICY-DERIVED',
  DATASET_DERIVED: 'DATASET-DERIVED',
  MODELLED_ESTIMATE: 'MODELLED ESTIMATE',
  SYSTEM_ASSUMPTION: 'SYSTEM ASSUMPTION',
  SIMULATED_DEMO_EVENT: 'SIMULATED DEMO EVENT',
  USER_CONFIRMED: 'USER-CONFIRMED',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Predefined 12-step Judge Demo Flow for Precision Care Challenge 2026
 */
export const DEMO_JOURNEY_SEQUENCE = [
  {
    eventType: 'ADMISSION_COMPLETED',
    title: '1. Patient Admitted',
    metadata: { admissionType: 'Planned', department: 'Inpatient Medicine' }
  },
  {
    eventType: 'PREAUTH_REQUESTED',
    title: '2. Pre-Auth Submitted',
    metadata: { treatingDoctor: 'Dr. Ramesh Rao', initialEstimate: 65000 }
  },
  {
    eventType: 'PREAUTH_APPROVED',
    title: '3. Pre-Auth Approved',
    metadata: { approvedAmount: 50000, tpaRemarks: 'Approved as per standard tariff' }
  },
  {
    eventType: 'ROOM_ASSIGNED',
    title: '4. Standard Room Assigned',
    metadata: { newRoom: 'Twin Sharing', newRate: 4000 }
  },
  {
    eventType: 'ROOM_CHANGED',
    title: '5. Patient Upgrades to ₹10,000 Room',
    metadata: {
      previousRoom: 'Twin Sharing',
      newRoom: 'Single Private Room',
      previousRate: 4000,
      newRate: 10000
    }
  },
  {
    eventType: 'INVESTIGATION_COMPLETED',
    title: '6. Diagnostics Completed',
    metadata: { tests: ['CBC', 'Chest X-Ray', 'ECG', 'Ultrasound Abdomen'] }
  },
  {
    eventType: 'PROCEDURE_PLANNED',
    title: '7. Procedure Scheduled',
    metadata: { procedureName: 'Laparoscopic Cholecystectomy', estimatedDuration: '2 hours' }
  },
  {
    eventType: 'PROCEDURE_AUTHORIZED',
    title: '8. Procedure Authorized',
    metadata: { surgicalApprovalCode: 'AUTH-SURG-8821' }
  },
  {
    eventType: 'PROCEDURE_COMPLETED',
    title: '9. Procedure Completed',
    metadata: { status: 'Uneventful recovery', otCharges: 35000 }
  },
  {
    eventType: 'BILLING_INITIATED',
    title: '10. Interim Billing Compiled',
    metadata: { subtotalBill: 98000, nonAdmissibleAllowance: 4500 }
  },
  {
    eventType: 'DISCHARGE_INITIATED',
    title: '11. Discharge Initiated',
    metadata: { dischargeSummaryReady: true, finalTpaReviewHours: 3 }
  },
  {
    eventType: 'CLAIM_SUBMITTED',
    title: '12. Claim Submitted',
    metadata: { trackingDocket: 'CLM-PCC-2026-091' }
  }
];
