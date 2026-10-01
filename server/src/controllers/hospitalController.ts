import { Request, Response } from 'express';
import { hospitalService } from '../services/hospitalService.js';
import { Policy } from '../models/Policy.js';
import { DEMO_POLICIES } from '../utils/demoData.js';
import { PolicyDocument } from '../types/policy.js';
import { RoomCategory } from '../types/hospital.js';

async function resolvePolicy(policyId?: string, fallbackPolicy?: Partial<PolicyDocument>): Promise<PolicyDocument> {
  if (policyId) {
    // Check if it's a demo policy key or id
    const demo = DEMO_POLICIES.find(d => d.id === policyId || d.key === policyId);
    if (demo) {
      return {
        _id: demo.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmedByUser: true,
        ...demo.data
      } as PolicyDocument;
    }

    try {
      const doc = await Policy.findById(policyId);
      if (doc) {
        return doc.toJSON() as PolicyDocument;
      }
    } catch {
      // MongoDB query failed or not an ObjectId, fallback below
    }
  }

  if (fallbackPolicy && fallbackPolicy.insurer) {
    return {
      _id: 'temp_policy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedByUser: true,
      insurer: fallbackPolicy.insurer || 'Star Health',
      insurerAliases: fallbackPolicy.insurerAliases || [],
      planName: fallbackPolicy.planName || 'Comprehensive Health Plan',
      policyType: fallbackPolicy.policyType || 'private',
      sumInsured: fallbackPolicy.sumInsured !== undefined ? fallbackPolicy.sumInsured : null,
      roomLimit: fallbackPolicy.roomLimit || { type: 'amount', value: 3000 },
      rawTextRef: null,
      ...fallbackPolicy
    } as PolicyDocument;
  }

  // Default fallback if nothing provided
  return {
    _id: 'default_demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmedByUser: true,
    insurer: 'Star Health',
    insurerAliases: ['Star Health and Allied Insurance', 'Star'],
    planName: 'Family Health Optima',
    policyType: 'private',
    sumInsured: 300000,
    roomLimit: { type: 'amount', value: 3000 },
    copay: 10,
    proportionateDeduction: true,
    policyNumber: 'P/DEMO/2026',
    uin: 'SHAHLIP26046V092526',
    policyStartDate: '2026-04-01',
    policyEndDate: '2027-03-31',
    zone: 'Zone B',
    networkType: 'all-network',
    cashlessAvailable: true,
    tpa: 'Medi Assist',
    insuredPersons: [],
    icuLimit: { type: 'percent', value: 2 },
    nonNetworkCopay: 20,
    copayConditions: {},
    deductible: 0,
    subLimits: {},
    restorationBenefit: true,
    cumulativeBonus: 15000,
    exclusions: [],
    hasOtherExclusions: false,
    waitingPeriods: null,
    preHospitalizationDays: 30,
    postHospitalizationDays: 60,
    daycareCovered: true,
    ambulanceLimit: 2000,
    preAuthHours: 6,
    claimIntimationHours: 24,
    sourceSnippets: {},
    confidence: {},
    rawTextRef: null
  };
}

export async function getCities(req: Request, res: Response): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    let cities = hospitalService.getCities();
    if (q) {
      const filtered = cities.filter((c) => c.name.toLowerCase().includes(q));
      res.json({ cities: filtered.slice(0, 50) });
    } else {
      res.json({ cities: cities.slice(0, 300) });
    }
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to fetch cities.' } });
  }
}

export async function getTaxonomy(_req: Request, res: Response): Promise<void> {
  try {
    const taxonomy = hospitalService.getTaxonomy();
    res.json(taxonomy);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to fetch clinical taxonomy.' } });
  }
}

export async function searchHospitals(req: Request, res: Response): Promise<void> {
  try {
    const { policyId, policy: reqPolicy, city, specialty, procedure, roomType, query, networkOnly } = req.body;
    const policy = await resolvePolicy(policyId, reqPolicy);
    const isNetworkOnly = Boolean(
      networkOnly === true ||
      req.query.networkOnly === 'true' ||
      (policy.insurer && policy.insurer.trim() && networkOnly !== false)
    );

    const result = hospitalService.search({
      policy,
      city: city || 'Bengaluru',
      specialty,
      procedure,
      roomType: (roomType as RoomCategory) || 'General Ward',
      query: typeof query === 'string' ? query : undefined,
      networkOnly: isNetworkOnly
    });

    res.json({
      policy: {
        id: policy._id,
        insurer: policy.insurer,
        sumInsured: policy.sumInsured,
        copay: policy.copay,
        roomLimit: policy.roomLimit,
        proportionateDeduction: policy.proportionateDeduction
      },
      city: city || 'Bengaluru',
      specialty: specialty || null,
      procedure: procedure || null,
      roomType: roomType || 'General Ward',
      networkOnly: isNetworkOnly,
      totalCount: result.totalCount,
      networkFacilityCount: result.networkFacilityCount,
      specialtyMatchedCount: result.specialtyMatchedCount,
      procedureMatchedCount: result.procedureMatchedCount,
      networkStatus: result.networkStatus,
      message: result.message,
      cityAverageCost: result.cityAverageCost,
      hospitals: result.hospitals
    });
  } catch (err: any) {
    console.error('[Search Hospitals Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to search hospitals.' } });
  }
}

export async function getHospitalCostBreakdown(req: Request, res: Response): Promise<void> {
  try {
    const {
      policyId,
      policy: reqPolicy,
      hospitalName,
      hospitalAddress,
      specialty,
      procedure,
      roomType = 'General Ward'
    } = req.body;

    if (!hospitalName) {
      res.status(400).json({ error: { message: 'hospitalName is required.' } });
      return;
    }

    const policy = await resolvePolicy(policyId, reqPolicy);
    const breakdown = hospitalService.getDetailedBillBreakdown(
      hospitalName,
      hospitalAddress || '',
      policy,
      specialty,
      procedure,
      roomType as RoomCategory
    );

    if (!breakdown) {
      res.status(404).json({ error: { message: 'Hospital estimate not available.' } });
      return;
    }

    res.json({
      hospitalName,
      roomType,
      policy: {
        insurer: policy.insurer,
        sumInsured: policy.sumInsured,
        copay: policy.copay,
        roomLimit: policy.roomLimit,
        proportionateDeduction: policy.proportionateDeduction
      },
      ...breakdown
    });
  } catch (err: any) {
    console.error('[Hospital Breakdown Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to generate bill breakdown.' } });
  }
}
