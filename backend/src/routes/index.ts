// ============================================================
// d:\ABHAYA\backend\src\routes\index.ts
// Aggregated API Route Registry
// ============================================================

import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import contactRoutes from './contacts';
import routeRoutes from './routes';
import journeyRoutes from './journeys';
import emergencyRoutes from './emergency';
import communityRoutes from './community';
import facilityRoutes from './facilities';
import adminRoutes from './admin';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/routes', routeRoutes);
apiRouter.use('/journeys', journeyRoutes);
apiRouter.use('/emergency', emergencyRoutes);
apiRouter.use('/community', communityRoutes);
apiRouter.use('/facilities', facilityRoutes);
apiRouter.use('/admin', adminRoutes);

// Health check ping
apiRouter.get('/ping', (_req, res) => {
  res.json({
    app: 'ABHAYA Safety API',
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default apiRouter;
