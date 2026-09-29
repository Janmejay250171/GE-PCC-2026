import { Router } from 'express';
import {
  signup,
  login,
  getProfile,
  toggleSaveHospital,
  linkPolicyToUser
} from '../controllers/authController.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', getProfile);
router.get('/me', getProfile);
router.post('/saved-hospitals', toggleSaveHospital);
router.post('/link-policy', linkPolicyToUser);

export default router;
