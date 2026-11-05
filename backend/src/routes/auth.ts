// ============================================================
// d:\ABHAYA\backend\src\routes\auth.ts
// ============================================================

import { Router } from 'express';
import { register, login, demoLogin, getMe, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
