// ============================================================
// d:\ABHAYA\backend\src\routes\users.ts
// ============================================================

import { Router } from 'express';
import { getProfile, updateProfile, getUserByAbhayaId } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/search/:abhayaId', authenticate, getUserByAbhayaId);

export default router;
