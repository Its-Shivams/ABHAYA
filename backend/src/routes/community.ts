// ============================================================
// d:\ABHAYA\backend\src\routes\community.ts
// ============================================================

import { Router } from 'express';
import { submitReport, getReports, getPosts, createPost, likePost } from '../controllers/communityController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/reports', authenticate, submitReport);
router.get('/reports', optionalAuth, getReports);
router.get('/posts', optionalAuth, getPosts);
router.post('/posts', authenticate, createPost);
router.post('/posts/:id/like', optionalAuth, likePost);

export default router;
