// ============================================================
// d:\ABHAYA\backend\src\config\socket.ts
// Socket.IO server configuration with namespaces + JWT auth
// ============================================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { setupJourneySocket } from '../sockets/journeySocket';
import { setupEmergencySocket } from '../sockets/emergencySocket';

export interface AuthenticatedSocket extends Socket {
  user: JWTPayload;
}

function validateSocketToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, secret) as JWTPayload;
}

export function setupSockets(io: SocketIOServer): void {
  // ─── Journey namespace ───────────────────────────────────────
  const journeyNS = io.of('/journey');

  journeyNS.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.query.token as string) ||
        (socket.handshake.auth?.token as string);
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const decoded = validateSocketToken(token);
      (socket as AuthenticatedSocket).user = decoded;
      next();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid token';
      next(new Error(`Authentication failed: ${msg}`));
    }
  });

  journeyNS.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`🔌 [Socket/journey] User ${authSocket.user.userId} connected`);
    setupJourneySocket(authSocket, journeyNS);

    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 [Socket/journey] User ${authSocket.user.userId} disconnected: ${reason}`);
    });
  });

  // ─── Emergency namespace ─────────────────────────────────────
  const emergencyNS = io.of('/emergency');

  emergencyNS.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.query.token as string) ||
        (socket.handshake.auth?.token as string);
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const decoded = validateSocketToken(token);
      (socket as AuthenticatedSocket).user = decoded;
      next();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid token';
      next(new Error(`Authentication failed: ${msg}`));
    }
  });

  emergencyNS.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`🚨 [Socket/emergency] User ${authSocket.user.userId} connected`);
    setupEmergencySocket(authSocket, emergencyNS);

    socket.on('disconnect', (reason: string) => {
      console.log(
        `🚨 [Socket/emergency] User ${authSocket.user.userId} disconnected: ${reason}`
      );
    });
  });

  // ─── Default namespace (optional ping/pong) ──────────────────
  io.on('connection', (socket: Socket) => {
    socket.on('ping', () => socket.emit('pong', { time: new Date().toISOString() }));
    socket.on('disconnect', () => {/* no-op */});
  });

  console.log('✅ [Socket] Namespaces /journey and /emergency registered');
}
