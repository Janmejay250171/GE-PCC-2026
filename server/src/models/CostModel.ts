import mongoose, { Schema, Document } from 'mongoose';
import { CostEstimate } from '../types/cost.js';

export interface CostEstimateModelType extends CostEstimate {
  _id: string;
}

const CostBreakdownItemSchema = new Schema(
  {
    category: { type: String, required: true },
    grossAmount: { type: Number, required: true },
    approvedAmount: { type: Number, required: true },
    deductionReason: { type: String }
  },
  { _id: false }
);

const CostEstimateSchema = new Schema<CostEstimateModelType>(
  {
    _id: { type: String, required: true },
    policyId: { type: String, required: true, ref: 'Policy' },
    hospitalId: { type: String, required: true, ref: 'Hospital' },
    procedureName: { type: String, required: true },
    roomCategory: { type: String, required: true },
    expectedDays: { type: Number, required: true },
    totalEstimatedBill: { type: Number, required: true },
    insurerPayable: { type: Number, required: true },
    patientPayable: { type: Number, required: true },
    proportionateDeductionApplied: { type: Boolean, default: false },
    copayAmount: { type: Number, default: 0 },
    deductibleApplied: { type: Number, default: 0 },
    breakdown: { type: [CostBreakdownItemSchema], default: [] }
  },
  { timestamps: true }
);

export const CostEstimateModel = mongoose.model<CostEstimateModelType>('CostEstimate', CostEstimateSchema);
