import { Request, Response } from 'express';
import { Journey } from '../models/Journey.js';
import { Policy } from '../models/Policy.js';
import { DEMO_POLICIES } from '../utils/demoData.js';
import { PolicyDocument } from '../types/policy.js';
import { JourneyState, JourneyEvent, JourneyEventType } from '../types/journey.js';
import { journeyGuidanceEngine } from '../services/journeyGuidanceEngine.js';
import { RoomCategory } from '../types/hospital.js';

// Fallback in-memory store in case of DB downtime
const inMemoryJourneys: Map<string, JourneyState> = new Map();

function getIdParam(req: Request, paramName = 'id'): string {
  const val = req.params[paramName];
  if (Array.isArray(val)) return val[0];
  return String(val || '');
}

async function resolvePolicy(policyId: string): Promise<PolicyDocument | null> {
  const demo = DEMO_POLICIES.find(d => d.id === policyId || d.key === policyId);
  if (demo) {
    return {
      _id: demo.id,
      confirmedByUser: true,
      ...demo.data
    } as PolicyDocument;
  }

  try {
    const doc = await Policy.findById(policyId);
    if (doc) return doc.toJSON() as PolicyDocument;
  } catch {
    // fallback
  }

  return null;
}

export async function getJourney(req: Request, res: Response): Promise<void> {
  try {
    const id = getIdParam(req, 'id');
    let journeyDoc = null;

    try {
      journeyDoc = await Journey.findById(id);
    } catch {
      // In-memory fallback
    }

    if (!journeyDoc) {
      const mem = inMemoryJourneys.get(id);
      if (mem) {
        res.json(mem);
        return;
      }

      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No care journey found for this identifier.' }
      });
      return;
    }

    res.json(journeyDoc.toJSON ? journeyDoc.toJSON() : journeyDoc);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to fetch journey state.' } });
  }
}

export async function processJourneyEvent(req: Request, res: Response): Promise<void> {
  try {
    const id = getIdParam(req, 'id');
    const {
      event,
      policyId,
      hospitalName,
      hospitalAddress,
      procedure,
      roomType,
      isEmergency
    } = req.body;

    if (!event || !event.eventType) {
      res.status(400).json({ error: { message: 'Valid event object with eventType is required.' } });
      return;
    }

    // Resolve Policy
    const policy = (await resolvePolicy(policyId)) || {
      _id: policyId || 'demo_policy',
      confirmedByUser: true,
      insurer: 'HDFC ERGO General Insurance',
      insurerAliases: ['HDFC ERGO', 'HDFC'],
      planName: 'Optima Secure',
      policyType: 'private',
      sumInsured: 500000,
      roomLimit: { type: 'amount', value: 5000 },
      copay: 0,
      proportionateDeduction: true,
      preHospitalizationDays: 60,
      postHospitalizationDays: 180,
      daycareCovered: true,
      preAuthHours: 24
    } as unknown as PolicyDocument;

    // Retrieve or initialize Journey state
    let existingDoc: any = null;
    try {
      existingDoc = await Journey.findById(id);
    } catch {
      // ignore
    }

    const memoryState = inMemoryJourneys.get(id);
    const resolvedDoc = existingDoc?.toJSON ? existingDoc.toJSON() : existingDoc;

    const currentState: JourneyState = resolvedDoc || memoryState || {
      _id: id,
      patientId: req.body.patientId || `patient_${Date.now()}`,
      policyId: policy._id,
      hospitalName: hospitalName || 'Apollo Hospitals',
      hospitalAddress: hospitalAddress || 'Bannerghatta Road, Bengaluru',
      procedure: procedure || 'General Consultation',
      currentRoom: roomType || 'General Ward',
      currentStage: 'ADMISSION',
      authorizationStatus: 'NOT_STARTED',
      claimStatus: 'NOT_SUBMITTED',
      events: [],
      activeAlerts: [],
      resolvedAlerts: [],
      financialSnapshot: null,
      isEmergency: Boolean(isEmergency),
      lastUpdated: new Date().toISOString()
    };

    // Determine current room from metadata if upgrade/change event
    const activeRoom = (event.metadata?.newRoom as RoomCategory) || (currentState.currentRoom as RoomCategory) || 'General Ward';

    // Evaluate through Centralized Journey Guidance Engine
    const evalResult = journeyGuidanceEngine.evaluateEvent({
      event,
      policy,
      hospitalName: hospitalName || currentState.hospitalName,
      hospitalAddress: hospitalAddress || currentState.hospitalAddress,
      procedure: procedure || currentState.procedure,
      roomType: activeRoom,
      isEmergency: Boolean(isEmergency || event.isEmergency)
    });

    const normalized = evalResult.normalizedEvent;

    // Update Authorization State if preauth event
    let newAuthStatus = currentState.authorizationStatus;
    if (normalized.eventType === 'PREAUTH_REQUESTED') newAuthStatus = 'SUBMITTED';
    else if (normalized.eventType === 'PREAUTH_PENDING') newAuthStatus = 'PENDING';
    else if (normalized.eventType === 'PREAUTH_APPROVED') newAuthStatus = 'APPROVED';
    else if (normalized.eventType === 'PREAUTH_PARTIALLY_APPROVED') newAuthStatus = 'PARTIALLY_APPROVED';
    else if (normalized.eventType === 'PREAUTH_REJECTED') newAuthStatus = 'REJECTED';

    // Update Claim State if claim event
    let newClaimStatus = currentState.claimStatus;
    if (normalized.eventType === 'CLAIM_SUBMITTED') newClaimStatus = 'SUBMITTED';
    else if (normalized.eventType === 'CLAIM_UNDER_REVIEW') newClaimStatus = 'UNDER_REVIEW';
    else if (normalized.eventType === 'CLAIM_SETTLED') newClaimStatus = 'APPROVED';
    else if (normalized.eventType === 'CLAIM_PARTIALLY_SETTLED') newClaimStatus = 'PARTIALLY_APPROVED';
    else if (normalized.eventType === 'CLAIM_REJECTED') newClaimStatus = 'REJECTED';

    // Append event
    const updatedEvents = [...currentState.events, normalized];

    // Manage Alerts
    const updatedActiveAlerts = [...currentState.activeAlerts];
    if (evalResult.alert) {
      updatedActiveAlerts.unshift(evalResult.alert);
    }

    // Construct updated Journey State
    const updatedState: JourneyState = {
      _id: id,
      patientId: currentState.patientId,
      policyId: currentState.policyId,
      hospitalName: hospitalName || currentState.hospitalName,
      hospitalAddress: hospitalAddress || currentState.hospitalAddress,
      procedure: procedure || currentState.procedure,
      currentRoom: activeRoom,
      currentStage: evalResult.stageTransition || currentState.currentStage,
      authorizationStatus: newAuthStatus,
      claimStatus: newClaimStatus,
      events: updatedEvents,
      activeAlerts: updatedActiveAlerts,
      resolvedAlerts: currentState.resolvedAlerts || [],
      financialSnapshot: evalResult.updatedFinancialSnapshot,
      isEmergency: Boolean(isEmergency || event.isEmergency),
      lastUpdated: new Date().toISOString()
    };

    // Save in DB and in-memory
    inMemoryJourneys.set(id, updatedState);
    try {
      await Journey.findByIdAndUpdate(id, updatedState, { upsert: true, new: true });
    } catch (e) {
      console.warn('[JourneyController] Saved to in-memory store (MongoDB sync deferred):', e);
    }

    res.json({
      success: true,
      event: normalized,
      insuranceImpact: evalResult.insuranceImpact,
      alert: evalResult.alert,
      state: updatedState
    });
  } catch (err: any) {
    console.error('[Process Journey Event Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to process journey event.' } });
  }
}

export async function saveJourney(req: Request, res: Response): Promise<void> {
  try {
    const id = getIdParam(req, 'id');
    const updates: Partial<JourneyState> = req.body;
    updates._id = id;
    updates.lastUpdated = new Date().toISOString();

    inMemoryJourneys.set(id, updates as JourneyState);
    try {
      const doc = await Journey.findByIdAndUpdate(id, updates, { upsert: true, new: true });
      res.json(doc ? doc.toJSON() : updates);
      return;
    } catch {
      res.json(updates);
    }
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to save journey.' } });
  }
}

export async function resetJourney(req: Request, res: Response): Promise<void> {
  try {
    const id = getIdParam(req, 'id');
    inMemoryJourneys.delete(id);
    try {
      await Journey.findByIdAndDelete(id);
    } catch {
      // ignore
    }

    res.json({ success: true, message: 'Journey reset to initial blank state.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to reset journey.' } });
  }
}

export async function resolveAlert(req: Request, res: Response): Promise<void> {
  try {
    const id = getIdParam(req, 'id');
    const alertId = getIdParam(req, 'alertId');
    let state = inMemoryJourneys.get(id);

    try {
      const doc = await Journey.findById(id);
      if (doc) state = doc.toJSON ? (doc.toJSON() as JourneyState) : doc;
    } catch {
      // ignore
    }

    if (!state) {
      res.status(404).json({ error: { message: 'Journey not found.' } });
      return;
    }

    const alertToResolve = state.activeAlerts.find(a => a.id === alertId);
    if (alertToResolve) {
      alertToResolve.resolved = true;
      state.activeAlerts = state.activeAlerts.filter(a => a.id !== alertId);
      state.resolvedAlerts.push(alertToResolve);
      state.lastUpdated = new Date().toISOString();

      inMemoryJourneys.set(id, state);
      try {
        await Journey.findByIdAndUpdate(id, state);
      } catch {
        // ignore
      }
    }

    res.json({ success: true, state });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to resolve alert.' } });
  }
}
