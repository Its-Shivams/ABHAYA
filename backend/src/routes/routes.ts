// ============================================================
// d:\ABHAYA\backend\src\routes\routes.ts
// ============================================================

import { Router } from 'express';
import { getSafeRoutes, getSegmentSafety } from '../controllers/routeController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/safe-route', optionalAuth, getSafeRoutes);
router.get('/segment/:id/safety', optionalAuth, getSegmentSafety);

export default router;
