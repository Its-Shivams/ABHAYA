// ============================================================
// d:\ABHAYA\backend\src\routes\facilities.ts
// ============================================================

import { Router } from 'express';
import { getNearbyFacilities } from '../controllers/facilityController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/nearby', optionalAuth, getNearbyFacilities);

export default router;
