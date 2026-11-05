// ============================================================
// d:\ABHAYA\backend\src\routes\admin.ts
// ============================================================

import { Router } from 'express';
import {
  getAdminReports,
  verifyReport,
  rejectReport,
  getSafetyHistory,
  getRoadSegments,
  getUsers,
  getSystemHealth,
} from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// In demo/dev mode, allow authenticated users to test admin moderation
router.get('/reports', authenticate, getAdminReports);
router.post('/reports/:id/verify', authenticate, verifyReport);
router.post('/reports/:id/reject', authenticate, rejectReport);
router.get('/safety-history', authenticate, getSafetyHistory);
router.get('/segments', authenticate, getRoadSegments);
router.get('/users', authenticate, getUsers);
router.get('/health', getSystemHealth);

export default router;
