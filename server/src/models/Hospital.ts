import mongoose, { Schema, Document } from 'mongoose';
import { Hospital } from '../types/hospital.js';

export interface HospitalModelType extends Omit<Hospital, '_id'> {
  _id: string;
}

const HospitalSchema = new Schema<HospitalModelType>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    networkInsurers: { type: [String], default: [] },
    city: { type: String, required: true },
    zone: { type: String, required: true },
    tier: { type: String, enum: ['tier-1', 'tier-2', 'tier-3'], default: 'tier-2' },
    cashlessSupported: { type: Boolean, default: true },
    empanelledSchemes: { type: [String], default: [] },
    roomCategories: [
      {
        name: { type: String, required: true },
        dailyRate: { type: Number, required: true }
      }
    ],
    procedureCostEstimates: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

export const HospitalModel = mongoose.model<HospitalModelType>('Hospital', HospitalSchema);
