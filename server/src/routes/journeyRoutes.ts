import { Router } from 'express';
import {
  getJourney,
  processJourneyEvent,
  saveJourney,
  resetJourney,
  resolveAlert
} from '../controllers/journeyController.js';

const router = Router();

router.get('/:id', getJourney);
router.post('/:id/event', processJourneyEvent);
router.put('/:id', saveJourney);
router.post('/:id/reset', resetJourney);
router.post('/:id/alerts/:alertId/resolve', resolveAlert);

export default router;
