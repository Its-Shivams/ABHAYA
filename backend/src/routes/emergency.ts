// ============================================================
// d:\ABHAYA\backend\src\routes\emergency.ts
// ============================================================

import { Router } from 'express';
import { activateSOS, getActiveSession, resolveEmergency, resetAllEmergencies } from '../controllers/emergencyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/activate', authenticate, activateSOS);
router.get('/active', authenticate, getActiveSession);
router.post('/reset', resetAllEmergencies);
router.post('/:id/resolve', authenticate, resolveEmergency);

export default router;
