// ============================================================
// d:\ABHAYA\backend\src\sockets\emergencySocket.ts
// Socket.IO event handlers for live emergency SOS sessions
// ============================================================

import { Namespace } from 'socket.io';
import { AuthenticatedSocket } from '../config/socket';

export function setupEmergencySocket(socket: AuthenticatedSocket, namespace: Namespace): void {
  const userId = socket.user.userId;

  // Join emergency session room
  socket.on('join-emergency', (data: { sessionId: string }) => {
    if (!data?.sessionId) return;
    const room = `emergency:${data.sessionId}`;
    socket.join(room);
    console.log(`🚨 [EmergencySocket] User ${userId} joined room ${room}`);
    socket.emit('joined-emergency', { sessionId: data.sessionId, status: 'active' });
  });

  // Leave emergency room
  socket.on('leave-emergency', (data: { sessionId: string }) => {
    if (!data?.sessionId) return;
    const room = `emergency:${data.sessionId}`;
    socket.leave(room);
  });

  // Real-time emergency location updates
  socket.on('emergency-location', (data: {
    sessionId: string;
    lat: number;
    lng: number;
    accuracy?: number;
    batteryLevel?: number;
    timestamp?: string;
  }) => {
    if (!data?.sessionId || data.lat === undefined || data.lng === undefined) return;
    const room = `emergency:${data.sessionId}`;
    socket.to(room).emit('emergency-location-updated', {
      ...data,
      userId,
      timestamp: data.timestamp || new Date().toISOString(),
    });
  });

  // Emergency session resolved
  socket.on('emergency-resolved', (data: { sessionId: string; notes?: string }) => {
    if (!data?.sessionId) return;
    const room = `emergency:${data.sessionId}`;
    socket.to(room).emit('emergency-status-changed', {
      sessionId: data.sessionId,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      notes: data.notes,
    });
  });
}
