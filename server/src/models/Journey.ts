import mongoose, { Schema } from 'mongoose';
import { JourneyState } from '../types/journey.js';

const WhyExplanationSchema = new Schema(
  {
    title: { type: String, required: true },
    policyRule: { type: String, required: true },
    policyValue: { type: String, required: true },
    patientValue: { type: String, required: true },
    consequence: { type: String, required: true },
    suggestedAction: { type: String, required: true }
  },
  { _id: false }
);

const InsuranceImpactSchema = new Schema(
  {
    hasImpact: { type: Boolean, default: false },
    severity: { type: String, default: 'INFO' },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    implications: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] },
    whyExplanation: { type: WhyExplanationSchema, default: null },
    financialDelta: { type: Schema.Types.Mixed, default: {} },
    provenance: { type: String, default: 'SIMULATED DEMO EVENT' }
  },
  { _id: false }
);

const JourneyAlertSchema = new Schema(
  {
    id: { type: String, required: true },
    eventId: { type: String, required: true },
    stage: { type: String, required: true },
    severity: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    whyExplanation: { type: WhyExplanationSchema, required: true },
    actionable: { type: String, default: null },
    provenance: { type: String, default: 'POLICY-DERIVED' },
    timestamp: { type: String, required: true },
    resolved: { type: Boolean, default: false }
  },
  { _id: false }
);

const JourneyEventSchema = new Schema(
  {
    id: { type: String, required: true },
    patientId: { type: String, required: true },
    timestamp: { type: String, required: true },
    eventType: { type: String, required: true },
    stage: { type: String, required: true },
    source: { type: String, required: true },
    status: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    insuranceImpact: { type: InsuranceImpactSchema, default: null },
    requiresAction: { type: Boolean, default: false },
    severity: { type: String, default: 'INFO' },
    isEmergency: { type: Boolean, default: false },
    provenance: { type: String, default: 'SIMULATED DEMO EVENT' }
  },
  { _id: false }
);

const FinancialSnapshotSchema = new Schema(
  {
    estimatedBill: { type: Number, default: 0 },
    roomCharges: { type: Number, default: 0 },
    roomRatePerDay: { type: Number, default: 0 },
    procedureCharges: { type: Number, default: 0 },
    doctorFees: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    roomRentExcess: { type: Number, default: 0 },
    proportionateDisallowance: { type: Number, default: 0 },
    deductibleApplied: { type: Number, default: null },
    copayAmount: { type: Number, default: 0 },
    excessOverSumInsured: { type: Number, default: 0 },
    patientPayable: { type: Number, default: 0 },
    insurerEstimatedShare: { type: Number, default: 0 },
    sumInsuredRemaining: { type: Number, default: null },
    provenance: { type: String, default: 'MODELLED ESTIMATE' }
  },
  { _id: false }
);

const JourneySchema = new Schema<JourneyState>(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true },
    policyId: { type: String, required: true },
    hospitalName: { type: String, required: true },
    hospitalAddress: { type: String, default: '' },
    procedure: { type: String, default: '' },
    currentRoom: { type: String, default: 'General Ward' },
    currentStage: {
      type: String,
      enum: ['ADMISSION', 'INVESTIGATION', 'PROCEDURE', 'BILLING', 'DISCHARGE', 'RECOVERY'],
      default: 'ADMISSION'
    },
    authorizationStatus: {
      type: String,
      enum: ['NOT_STARTED', 'SUBMITTED', 'PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
      default: 'NOT_STARTED'
    },
    claimStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
      default: 'NOT_SUBMITTED'
    },
    events: { type: [JourneyEventSchema], default: [] },
    activeAlerts: { type: [JourneyAlertSchema], default: [] },
    resolvedAlerts: { type: [JourneyAlertSchema], default: [] },
    financialSnapshot: { type: FinancialSnapshotSchema, default: null },
    isEmergency: { type: Boolean, default: false },
    lastUpdated: { type: String, required: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        if (ret.createdAt && typeof ret.createdAt.toISOString === 'function') {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt && typeof ret.updatedAt.toISOString === 'function') {
          ret.updatedAt = ret.updatedAt.toISOString();
        }
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Journey = mongoose.model<JourneyState>('Journey', JourneySchema);
