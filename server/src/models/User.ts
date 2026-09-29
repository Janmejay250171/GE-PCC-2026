import mongoose, { Schema, Document } from 'mongoose';

export interface SavedHospitalData {
  hospitalKey: string;
  hospital_name: string;
  address: string;
  city: string;
  hospital_type?: string;
  tier?: string;
  segment?: string;
  rating?: number;
  fitScore?: number;
  savedAt: string;
}

export interface UserDocument extends Omit<Document, '_id'> {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  token?: string;
  savedHospitals: SavedHospitalData[];
  savedPolicyIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SavedHospitalSchema = new Schema(
  {
    hospitalKey: { type: String, required: true },
    hospital_name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    hospital_type: { type: String, default: 'Private' },
    tier: { type: String, default: 'Tier 2' },
    segment: { type: String, default: 'Standard' },
    rating: { type: Number, default: 0 },
    fitScore: { type: Number, default: 0 },
    savedAt: { type: String, default: () => new Date().toISOString() }
  },
  { _id: false }
);

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    token: { type: String, default: null, index: true },
    savedHospitals: { type: [SavedHospitalSchema], default: [] },
    savedPolicyIds: { type: [String], default: [] }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<UserDocument>('User', UserSchema);
