// ============================================================
// d:\ABHAYA\web\src\services\liveSync.ts
// Real-Time Cross-Tab & Backend Synchronization Hub
// Auto-clears stale alerts to prevent phantom SOS triggers
// ============================================================

import { apiClient } from './api';

export interface LiveSOSData {
  sessionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  lat: number;
  lng: number;
  address: string;
  batteryLevel: number;
  activatedAt: string;
  status: 'active' | 'resolved';
}

export interface LiveLocationData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: string;
  batteryLevel: number;
  isRealGPS: boolean;
}

const BROADCAST_CHANNEL_NAME = 'abhaya_emergency_channel';
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported in this environment');
  }
}

// ─── Clean up any stale sessions on initialization ─────────────
export function clearStaleSession(): void {
  const stored = localStorage.getItem('abhaya_active_sos');
  if (stored) {
    try {
      const parsed: LiveSOSData = JSON.parse(stored);
      const ageMs = Date.now() - new Date(parsed.activatedAt).getTime();
      // If older than 5 minutes, auto-clear
      if (isNaN(ageMs) || ageMs > 5 * 60 * 1000) {
        localStorage.removeItem('abhaya_active_sos');
      }
    } catch {
      localStorage.removeItem('abhaya_active_sos');
    }
  }
}
clearStaleSession();

// ─── SOS Dispatcher (Only triggers when user explicitly clicks/holds) ─
export async function triggerEmergencySOS(location: {
  lat: number;
  lng: number;
  address?: string;
  batteryLevel?: number;
}): Promise<LiveSOSData> {
  const now = new Date();
  const sosData: LiveSOSData = {
    sessionId: `sos-${Date.now()}`,
    userId: 'usr-priya-001',
    userName: 'Priya Sharma',
    userPhone: '+91 9000000001',
    lat: location.lat,
    lng: location.lng,
    address: location.address || `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`,
    batteryLevel: location.batteryLevel || 84,
    activatedAt: now.toISOString(),
    status: 'active',
  };

  // 1. Save fresh alert to LocalStorage
  localStorage.setItem('abhaya_active_sos', JSON.stringify(sosData));
  localStorage.setItem('abhaya_sos_timestamp', String(Date.now()));

  // 2. Broadcast via BroadcastChannel
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'SOS_ACTIVATED', data: sosData });
  }

  // 3. Post to backend
  try {
    const res = await apiClient.post('/emergency/activate', {
      lat: location.lat,
      lng: location.lng,
      address: sosData.address,
      batteryLevel: sosData.batteryLevel,
    });
    if (res.data?.success && res.data?.data?.session) {
      sosData.sessionId = res.data.data.session.id;
      localStorage.setItem('abhaya_active_sos', JSON.stringify(sosData));
    }
  } catch (err) {
    console.warn('Backend SOS fallback to local broadcast');
  }

  return sosData;
}

export async function resolveEmergencySOS(sessionId?: string): Promise<void> {
  // Clear local storage immediately
  localStorage.removeItem('abhaya_active_sos');
  localStorage.setItem('abhaya_sos_resolved', String(Date.now()));

  // Broadcast resolution to all tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'SOS_RESOLVED', sessionId });
  }

  // Clear on backend
  try {
    if (sessionId) {
      await apiClient.post(`/emergency/${sessionId}/resolve`, {
        notes: 'Emergency marked resolved.',
      });
    } else {
      await apiClient.post('/emergency/reset');
    }
  } catch (err) {
    console.warn('Backend resolve notice error');
  }
}

// ─── SOS Subscriber (For Rahul / Trusted Contact) ─────────────
export function subscribeToEmergencyAlerts(onAlert: (data: LiveSOSData | null) => void): () => void {
  // Helper to validate and dispatch alert
  const checkStoredAlert = () => {
    const stored = localStorage.getItem('abhaya_active_sos');
    if (stored) {
      try {
        const parsed: LiveSOSData = JSON.parse(stored);
        const ageMs = Date.now() - new Date(parsed.activatedAt).getTime();
        // If older than 5 minutes, auto-expire
        if (isNaN(ageMs) || ageMs > 5 * 60 * 1000) {
          localStorage.removeItem('abhaya_active_sos');
          onAlert(null);
          return false;
        }

        if (parsed.status === 'active') {
          onAlert(parsed);
          return true;
        }
      } catch {
        localStorage.removeItem('abhaya_active_sos');
      }
    }
    onAlert(null);
    return false;
  };

  // Check on mount
  checkStoredAlert();

  // 1. BroadcastChannel Listener (Instant zero-latency across tabs)
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'SOS_ACTIVATED') {
      onAlert(event.data.data);
    } else if (event.data?.type === 'SOS_RESOLVED') {
      onAlert(null);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Storage Event Listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'abhaya_active_sos') {
      if (event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          const ageMs = Date.now() - new Date(parsed.activatedAt).getTime();
          if (ageMs <= 5 * 60 * 1000) {
            onAlert(parsed);
          } else {
            onAlert(null);
          }
        } catch {
          onAlert(null);
        }
      } else {
        onAlert(null);
      }
    } else if (event.key === 'abhaya_sos_resolved') {
      onAlert(null);
    }
  };

  window.addEventListener('storage', handleStorage);

  // 3. Regular Backend Polling (Every 2.5s)
  const pollInterval = setInterval(async () => {
    try {
      const res = await apiClient.get('/emergency/active');
      if (res.data?.success && res.data?.data) {
        const remote = res.data.data;
        const activatedTime = new Date(remote.session.activated_at).getTime();
        const ageMs = Date.now() - activatedTime;

        // Ignore sessions older than 5 minutes
        if (ageMs <= 5 * 60 * 1000 && remote.session.status === 'active') {
          const mapped: LiveSOSData = {
            sessionId: remote.session.id,
            userId: remote.user.id,
            userName: remote.user.name,
            userPhone: remote.user.phone,
            lat: remote.session.lat,
            lng: remote.session.lng,
            address: remote.session.address || 'Active SOS Location',
            batteryLevel: remote.session.battery_level || 80,
            activatedAt: remote.session.activated_at,
            status: 'active',
          };
          onAlert(mapped);
        } else {
          onAlert(null);
        }
      } else {
        // Backend says no active session
        const stored = localStorage.getItem('abhaya_active_sos');
        if (!stored) {
          onAlert(null);
        }
      }
    } catch {
      checkStoredAlert();
    }
  }, 2500);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(pollInterval);
  };
}

// ─── Real Live Location Streaming (GPS) ────────────────────────
export function broadcastLiveCoordinates(location: LiveLocationData): void {
  localStorage.setItem('abhaya_live_gps', JSON.stringify(location));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'LIVE_LOCATION_UPDATE', data: location });
  }

  apiClient.post('/journeys/active-location', location).catch(() => {});
}

export function subscribeToLiveLocation(onLocation: (loc: LiveLocationData) => void): () => void {
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'LIVE_LOCATION_UPDATE') {
      onLocation(event.data.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'abhaya_live_gps' && event.newValue) {
      try {
        onLocation(JSON.parse(event.newValue));
      } catch {}
    }
  };

  window.addEventListener('storage', handleStorage);

  const stored = localStorage.getItem('abhaya_live_gps');
  if (stored) {
    try {
      onLocation(JSON.parse(stored));
    } catch {}
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
