// ============================================================
// d:\ABHAYA\backend\src\sockets\journeySocket.ts
// Socket.IO event handlers for live journey tracking
// ============================================================

import { Namespace } from 'socket.io';
import { AuthenticatedSocket } from '../config/socket';

export function setupJourneySocket(socket: AuthenticatedSocket, namespace: Namespace): void {
  const userId = socket.user.userId;

  // Join a journey tracking room
  socket.on('join-journey', (data: { journeyId: string }) => {
    if (!data?.journeyId) return;
    const room = `journey:${data.journeyId}`;
    socket.join(room);
    console.log(`📍 [JourneySocket] User ${userId} joined ${room}`);
    socket.emit('joined-journey', { journeyId: data.journeyId, status: 'joined' });
  });

  // Leave a journey tracking room
  socket.on('leave-journey', (data: { journeyId: string }) => {
    if (!data?.journeyId) return;
    const room = `journey:${data.journeyId}`;
    socket.leave(room);
    console.log(`📍 [JourneySocket] User ${userId} left ${room}`);
  });

  // Broadcast location update to observers in this journey
  socket.on('location-update', (data: {
    journeyId: string;
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    batteryLevel?: number;
    timestamp?: string;
  }) => {
    if (!data?.journeyId || data.lat === undefined || data.lng === undefined) return;
    const room = `journey:${data.journeyId}`;
    const payload = {
      ...data,
      userId,
      timestamp: data.timestamp || new Date().toISOString(),
    };
    // Broadcast to everyone else in this journey room
    socket.to(room).emit('journey-location-updated', payload);
  });

  // Journey completed
  socket.on('journey-completed', (data: { journeyId: string }) => {
    if (!data?.journeyId) return;
    const room = `journey:${data.journeyId}`;
    socket.to(room).emit('journey-status-changed', {
      journeyId: data.journeyId,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  });
}
