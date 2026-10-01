import mongoose, { Schema, Document } from 'mongoose';
import { PolicyDocument } from '../types/policy.js';

export interface PolicyModelType extends Omit<PolicyDocument, '_id'> {
  _id: string;
}

const RoomOrIcuLimitSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['amount', 'percent', 'category', 'none'],
      required: true
    },
    value: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  { _id: false }
);

const InsuredPersonSchema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    relation: { type: String, required: true }
  },
  { _id: false }
);

const WaitingPeriodsSchema = new Schema(
  {
    initial: { type: String, default: null },
    preExisting: { type: String, default: null },
    maternity: { type: String, default: null },
    procedures: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const PolicySchema = new Schema<PolicyModelType>(
  {
    _id: { type: String, required: true },
    confirmedByUser: { type: Boolean, default: false },

    insurer: { type: String, default: null },
    insurerAliases: { type: [String], default: [] },
    planName: { type: String, default: null },
    policyType: {
      type: String,
      enum: ['individual', 'floater', 'private', 'corporate', 'pmjay', 'esi', null],
      default: null
    },
    policyNumber: { type: String, default: null },
    uin: { type: String, default: null },
    policyStartDate: { type: String, default: null },
    policyEndDate: { type: String, default: null },
    zone: { type: String, default: null },
    networkType: {
      type: String,
      enum: ['all-network', 'restricted-network', 'reimbursement-only', null],
      default: null
    },
    cashlessAvailable: { type: Boolean, default: null },
    tpa: { type: String, default: null },
    insuredPersons: { type: [InsuredPersonSchema], default: [] },

    sumInsured: { type: Number, default: null },
    roomLimit: { type: RoomOrIcuLimitSchema, default: null },
    icuLimit: { type: RoomOrIcuLimitSchema, default: null },
    copay: { type: Number, default: null },
    nonNetworkCopay: { type: Number, default: null },
    copayConditions: { type: Schema.Types.Mixed, default: {} },
    deductible: { type: Number, default: null },
    proportionateDeduction: { type: Boolean, default: null },
    subLimits: { type: Schema.Types.Mixed, default: {} },
    restorationBenefit: { type: Boolean, default: null },
    cumulativeBonus: { type: Number, default: null },

    exclusions: { type: [String], default: [] },
    hasOtherExclusions: { type: Boolean, default: null },
    waitingPeriods: { type: WaitingPeriodsSchema, default: null },
    preHospitalizationDays: { type: Number, default: null },
    postHospitalizationDays: { type: Number, default: null },
    daycareCovered: { type: Boolean, default: null },
    ambulanceLimit: { type: Number, default: null },
    preAuthHours: { type: Number, default: null },
    claimIntimationHours: { type: Number, default: null },

    sourceSnippets: { type: Schema.Types.Mixed, default: {} },
    confidence: { type: Schema.Types.Mixed, default: {} },
    rawTextRef: { type: String, default: null }
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
        if (ret.subLimits instanceof Map) ret.subLimits = Object.fromEntries(ret.subLimits);
        if (ret.copayConditions instanceof Map) ret.copayConditions = Object.fromEntries(ret.copayConditions);
        if (ret.sourceSnippets instanceof Map) ret.sourceSnippets = Object.fromEntries(ret.sourceSnippets);
        if (ret.confidence instanceof Map) ret.confidence = Object.fromEntries(ret.confidence);
        if (ret.waitingPeriods?.procedures instanceof Map) {
          ret.waitingPeriods.procedures = Object.fromEntries(ret.waitingPeriods.procedures);
        }
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Policy = mongoose.model<PolicyModelType>('Policy', PolicySchema);
