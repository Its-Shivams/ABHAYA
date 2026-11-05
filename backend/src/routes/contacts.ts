// ============================================================
// d:\ABHAYA\backend\src\routes\contacts.ts
// ============================================================

import { Router } from 'express';
import { getContacts, sendRequest, removeContact } from '../controllers/contactController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getContacts);
router.post('/request', authenticate, sendRequest);
router.delete('/:id', authenticate, removeContact);

export default router;
