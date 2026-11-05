// ============================================================
// d:\ABHAYA\backend\src\routes\journeys.ts
// ============================================================

import { Router } from 'express';
import { startJourney, updateLocation, getJourney, getActiveJourney, stopJourney } from '../controllers/journeyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/start', authenticate, startJourney);
router.get('/active', authenticate, getActiveJourney);
router.get('/:id', authenticate, getJourney);
router.post('/:id/location', authenticate, updateLocation);
router.post('/:id/stop', authenticate, stopJourney);

export default router;
