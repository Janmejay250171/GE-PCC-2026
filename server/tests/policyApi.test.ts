import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Policy } from '../src/models/Policy.js';
import policyRoutes from '../src/routes/policyRoutes.js';
import { GeminiService } from '../src/services/geminiService.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

// Setup Express test app
const app = express();
app.use(express.json());
app.use('/api/policy', policyRoutes);

describe('Policy API & Gemini Client Mocking', () => {
  beforeAll(async () => {
    // Connect to database for API testing
    await connectDB();
  });

  afterAll(async () => {
    try {
      await Policy.deleteMany({ _id: /^test_pol_/ });
    } catch {
      // Ignore
    }
    await disconnectDB();
  });

  it('PUT /api/policy/:id returns 400 when a Tier 1 field is null/missing', async () => {
    const testId = `test_pol_${Date.now()}_invalid`;
    await Policy.create({
      _id: testId,
      confirmedByUser: false,
      insurer: 'Test Insurer',
      policyType: 'private',
      sumInsured: 300000,
      roomLimit: { type: 'amount', value: 3000 },
      copay: 10,
      deductible: 0,
      proportionateDeduction: true
    });

    // Try updating with null sumInsured (Tier 1 field)
    const res = await request(app)
      .put(`/api/policy/${testId}`)
      .send({
        sumInsured: null
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TIER_1_REQUIRED_FIELDS_MISSING');
    expect(res.body.missingRequired).toContain('sumInsured');

    // Confirm that confirmedByUser is still false in the database
    const doc = await Policy.findById(testId);
    expect(doc?.confirmedByUser).toBe(false);
  });

  it('PUT /api/policy/:id sets confirmedByUser: true when all Tier 1 fields are present', async () => {
    const testId = `test_pol_${Date.now()}_valid`;
    await Policy.create({
      _id: testId,
      confirmedByUser: false,
      insurer: 'Star Health',
      policyType: 'private',
      sumInsured: 300000,
      roomLimit: { type: 'amount', value: 3000 },
      copay: 10,
      deductible: 0,
      proportionateDeduction: true
    });

    const res = await request(app)
      .put(`/api/policy/${testId}`)
      .send({
        insurer: 'Star Health and Allied Insurance',
        planName: 'Family Health Optima',
        copay: 10,
        deductible: 0,
        proportionateDeduction: true,
        sumInsured: 300000,
        roomLimit: { type: 'amount', value: 3000 }
      });

    expect(res.status).toBe(200);
    expect(res.body.confirmedByUser).toBe(true);

    const doc = await Policy.findById(testId);
    expect(doc?.confirmedByUser).toBe(true);
  });

  it('mocks the Gemini client and validates extraction flow without calling real API', async () => {
    // Create mock service
    const mockService = new GeminiService('dummy-test-key');

    // Mock internal getModel method
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            insurer: 'Star Health',
            planName: 'Family Health Optima',
            policyType: 'private',
            sumInsured: 300000,
            roomLimit: { type: 'amount', value: 3000 },
            copay: 10,
            deductible: 0,
            proportionateDeduction: true,
            sourceSnippets: {
              roomLimit: 'Room rent up to Rs.3,000 per day',
              copay: '10% co-pay applicable'
            },
            confidence: {
              roomLimit: 'high',
              copay: 'high'
            }
          })
      }
    });

    (mockService as any).getModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent
    });

    const dummyBuffer = Buffer.from('%PDF-1.4 dummy mock content');
    const result = await mockService.extractPolicy(dummyBuffer);

    expect(mockGenerateContent).toHaveBeenCalled();
    expect(result.data.insurer).toBe('Star Health');
    expect(result.data.roomLimit.value).toBe(3000);
    expect(result.data.copay).toBe(10);
    expect(result.data.proportionateDeduction).toBe(true);
  });

  it('DELETE /api/policy/:id deletes the policy from database', async () => {
    const testId = `test_del_${Date.now()}`;
    await Policy.create({
      _id: testId,
      insurer: 'Test Insurer to Delete',
      policyType: 'private',
      sumInsured: 500000
    });

    const res = await request(app).delete(`/api/policy/${testId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const doc = await Policy.findById(testId);
    expect(doc).toBeNull();
  });
});
