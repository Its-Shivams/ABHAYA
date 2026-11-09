// ============================================================
// d:\ABHAYA\backend\src\routes\routes.ts
// ============================================================

import { Router } from 'express';
import {
  getSafeRoutes,
  getSegmentSafety,
  autocompletePlaces,
  reverseGeocodeLocation,
} from '../controllers/routeController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/autocomplete', autocompletePlaces);
router.get('/reverse-geocode', reverseGeocodeLocation);
router.post('/safe-route', optionalAuth, getSafeRoutes);
router.get('/segment/:id/safety', optionalAuth, getSegmentSafety);

export default router;
