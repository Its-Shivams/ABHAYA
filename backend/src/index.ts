// ============================================================
// d:\ABHAYA\backend\src\index.ts
// Main Server Entry Point: Express + Socket.IO + REST APIs
// ============================================================

import http from 'http';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import apiRouter from './routes';
import { setupSockets } from './config/socket';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006'];

// ─── Middleware ───────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // In development allow localhost origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      if (CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev mode for seamless testing
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Root Route ───────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'ABHAYA — Women Safety & Smart Navigation Platform API',
    tagline: 'Your Safety, Your Journey, Your Control',
    status: 'operational',
    docs: '/api/ping',
    version: '1.0.0',
    demoAccounts: [
      { role: 'primary_user', email: 'priya@abhaya.demo', password: 'Priya@123' },
      { role: 'trusted_contact', email: 'rahul@abhaya.demo', password: 'Rahul@123' },
      { role: 'admin', email: 'admin@abhaya.demo', password: 'Admin@123' },
    ],
  });
});

// ─── REST API Routes ──────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Socket.IO Setup ──────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
setupSockets(io);

// ─── Start Server ─────────────────────────────────────────────
async function startServer(): Promise<void> {
  // Attempt optional connections (fail softly if local services not started)
  await connectDatabase().catch((e) => console.log('Notice: Postgres optional in demo mode:', e.message));
  await connectRedis().catch((e) => console.log('Notice: Redis optional in demo mode:', e.message));

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🛡️  ABHAYA Backend Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔌 WebSockets: Enabled (/journey and /emergency)`);
    console.log(`🧪 Demo Accounts: Priya Sharma (User) & Rahul (Contact)`);
    console.log(`======================================================\n`);
  });
}

startServer();

export { app, server, io };
