import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Policy } from '../models/Policy.js';
import { User } from '../models/User.js';
import { geminiService } from '../services/geminiService.js';
import { applySchemeOverrides, applyTier2Defaults } from '../services/overrideService.js';
import { getMissingTier1Fields, getLowConfidenceFields } from '../schemas/policySchema.js';
import { DEMO_POLICIES } from '../utils/demoData.js';
import { normalizeExtractionPayload, normalizePartialPolicyUpdate } from '../services/normalizerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function uploadPolicy(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        error: {
          code: 'FILE_REQUIRED',
          message: 'Please provide a policy PDF file under field name "file".'
        }
      });
      return;
    }

    if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      res.status(415).json({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Only PDF documents are supported.'
        }
      });
      return;
    }

    const policyId = `pol_${Date.now()}_${uuidv4().substring(0, 6)}`;
    const savedPdfPath = path.join(uploadsDir, `${policyId}.pdf`);
    fs.writeFileSync(savedPdfPath, file.buffer);

    // AI Extraction
    const extraction = await geminiService.extractPolicy(file.buffer);
    const extractedData = extraction.data;

    // Apply Scheme Overrides (PM-JAY, ESI)
    applySchemeOverrides(extractedData);

    // Apply Tier 2 Defaults
    applyTier2Defaults(extractedData);

    extractedData.rawTextRef = `uploads/${policyId}.pdf`;

    const policyDoc = await Policy.create({
      _id: policyId,
      confirmedByUser: false,
      ...extractedData
    });

    const policyJson = policyDoc.toJSON();
    const missingRequired = getMissingTier1Fields(policyJson);
    const lowConfidence = getLowConfidenceFields(policyJson);

    if (extraction.isPartialFallback) {
      res.status(422).json({
        policy: policyJson,
        missingRequired,
        lowConfidence,
        warning: 'AI extraction had issues. Please review and fill in the missing details manually.',
        details: extraction.validationError
      });
      return;
    }

    res.status(200).json({
      policy: policyJson,
      missingRequired,
      lowConfidence
    });
  } catch (err: any) {
    console.error('[Upload Policy Error]:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An error occurred while analyzing your policy document.'
      }
    });
  }
}

export async function getDemoPolicies(_req: Request, res: Response): Promise<void> {
  try {
    const list = DEMO_POLICIES.map((d) => ({
      id: d.id,
      key: d.key,
      title: d.title,
      insurer: d.insurer,
      planName: d.planName,
      policyType: d.policyType,
      description: d.description,
      badge: d.badge
    }));

    res.status(200).json(list);
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message
      }
    });
  }
}

export async function createPolicyFromDemo(req: Request, res: Response): Promise<void> {
  try {
    const key = req.params.key;
    const demo = DEMO_POLICIES.find((d) => d.key === key || d.id === key);

    if (!demo) {
      res.status(404).json({
        error: {
          code: 'DEMO_NOT_FOUND',
          message: `Demo policy key "${key}" not found.`
        }
      });
      return;
    }

    // Create a new instance cloned from the demo data
    const newId = `pol_${Date.now()}_${uuidv4().substring(0, 6)}`;
    const clonedData = JSON.parse(JSON.stringify(demo.data));

    applySchemeOverrides(clonedData);
    applyTier2Defaults(clonedData);

    const doc = await Policy.create({
      _id: newId,
      confirmedByUser: false,
      ...clonedData
    });

    const policyJson = doc.toJSON();
    const missingRequired = getMissingTier1Fields(policyJson);
    const lowConfidence = getLowConfidenceFields(policyJson);

    res.status(200).json({
      policy: policyJson,
      missingRequired,
      lowConfidence
    });
  } catch (err: any) {
    console.error('[Create From Demo Error]:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message
      }
    });
  }
}

export async function getPolicyById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const policy = await Policy.findById(id);

    if (!policy) {
      res.status(404).json({
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy with id "${id}" was not found.`
        }
      });
      return;
    }

    res.status(200).json(policy.toJSON());
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message
      }
    });
  }
}

export async function updatePolicy(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const policy = await Policy.findById(id);

    if (!policy) {
      res.status(404).json({
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy with id "${id}" was not found.`
        }
      });
      return;
    }

    const updates = req.body;
    const normalized = normalizePartialPolicyUpdate(updates);

    // Merge updates
    const mergedData = {
      ...policy.toJSON(),
      ...normalized
    };

    // Apply scheme overrides if policyType was modified
    if (updates.policyType) {
      mergedData.policyType = updates.policyType;
      applySchemeOverrides(mergedData);
    }

    const missingRequired = getMissingTier1Fields(mergedData);

    if (missingRequired.length > 0) {
      res.status(400).json({
        error: {
          code: 'TIER_1_REQUIRED_FIELDS_MISSING',
          message: 'All required Tier 1 fields must be filled before confirming policy coverage.',
          details: missingRequired
        },
        missingRequired
      });
      return;
    }

    mergedData.confirmedByUser = true;

    // Update in database
    const updated = await Policy.findByIdAndUpdate(id, mergedData, { new: true });
    res.status(200).json(updated?.toJSON());
  } catch (err: any) {
    console.error('[Update Policy Error]:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message
      }
    });
  }
}

/**
 * P0.8: Controlled document retrieval endpoint.
 * Serves uploaded policy documents only for existing registered policies.
 */
export async function getPolicyDocument(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const policy = await Policy.findById(id);

    if (!policy || !policy.rawTextRef) {
      res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: `Document for policy "${id}" not found.`
        }
      });
      return;
    }

    const filePath = path.resolve(__dirname, '../../', policy.rawTextRef);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Document file not found on disk.'
        }
      });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to retrieve document.'
      }
    });
  }
}

/**
 * Delete a policy by ID, cleanup disk files, and unlink from users.
 */
export async function deletePolicy(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const policy = await Policy.findById(id);

    if (!policy) {
      res.status(404).json({
        error: {
          code: 'POLICY_NOT_FOUND',
          message: `Policy with id "${id}" not found.`
        }
      });
      return;
    }

    // Delete associated uploaded file if present
    if (policy.rawTextRef) {
      try {
        const filePath = path.resolve(__dirname, '../../', policy.rawTextRef);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn('[Delete Policy File Warning]:', fileErr);
      }
    }

    // Remove from Policy collection
    await Policy.findByIdAndDelete(id);

    // Remove from all users' savedPolicyIds
    try {
      await User.updateMany(
        { savedPolicyIds: id },
        { $pull: { savedPolicyIds: id } }
      );
    } catch (userErr) {
      console.warn('[User Unlink Warning]:', userErr);
    }

    res.status(200).json({ success: true, message: 'Policy deleted successfully.' });
  } catch (err: any) {
    console.error('[Delete Policy Error]:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to delete policy.'
      }
    });
  }
}
