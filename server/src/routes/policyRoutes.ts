import { Router } from 'express';
import multer from 'multer';
import {
  uploadPolicy,
  getDemoPolicies,
  createPolicyFromDemo,
  getPolicyById,
  updatePolicy,
  getPolicyDocument,
  deletePolicy
} from '../controllers/policyController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  }
});

// Upload Policy PDF
router.post('/upload', upload.single('file'), uploadPolicy);

// Get Demo Policies list
router.get('/demo', getDemoPolicies);

// Create Policy from Demo key
router.post('/demo/:key', createPolicyFromDemo);

// Get Policy by ID
router.get('/:id', getPolicyById);

// Controlled Policy Document retrieval (P0.8)
router.get('/:id/document', getPolicyDocument);

// Update Policy & Confirm (Sets confirmedByUser: true if Tier 1 complete)
router.put('/:id', updatePolicy);

// Delete Policy (and unlink from users)
router.delete('/:id', deletePolicy);

export default router;
