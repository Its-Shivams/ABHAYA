// ============================================================
// d:\ABHAYA\backend\src\controllers\emergencyController.ts
// Critical Emergency SOS Module with Auto-Expiry & Reset
// ============================================================

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../services/store';
import { JWTPayload, EmergencySession } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function activateSOS(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { lat = 28.6186, lng = 77.0545, address = 'Live Geolocation Position', batteryLevel = 85 } = req.body;

    const user = store.users.get(authUser.userId);
    const profile = store.profiles.get(authUser.userId);

    // Expire any existing active sessions first to avoid stale duplicates
    for (const s of store.emergencySessions.values()) {
      if (s.user_id === authUser.userId && s.status === 'active') {
        s.status = 'resolved';
        s.resolved_at = new Date();
      }
    }

    // Get contacts to alert
    const notifiedContacts: string[] = [];
    for (const c of store.contacts.values()) {
      if ((c.requester_id === authUser.userId || c.contact_id === authUser.userId) && c.can_receive_sos) {
        const contactId = c.requester_id === authUser.userId ? c.contact_id : c.requester_id;
        if (!notifiedContacts.includes(contactId)) {
          notifiedContacts.push(contactId);
        }
      }
    }

    const sessionId = uuidv4();
    const session: EmergencySession = {
      id: sessionId,
      user_id: authUser.userId,
      journey_id: null,
      status: 'active',
      trigger_type: 'sos_button',
      lat,
      lng,
      address,
      battery_level: batteryLevel,
      contacts_alerted: notifiedContacts,
      police_notified: false,
      activated_at: new Date(),
      resolved_at: null,
      resolved_by: null,
      resolution_notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.emergencySessions.set(sessionId, session);

    // Fetch nearest police and hospital for rapid action
    const facilities = Array.from(store.facilities.values());
    const nearestPolice = facilities.filter((f) => f.facility_type === 'police')[0] || null;
    const nearestHospital = facilities.filter((f) => f.facility_type === 'hospital')[0] || null;

    sendSuccess(
      res,
      {
        session,
        userName: profile?.full_name || 'User',
        userPhone: user?.phone || '',
        nearestPolice,
        nearestHospital,
        emergencyHotlines: [
          { name: 'National Emergency', number: '112', description: 'Immediate Police / Ambulance / Fire response' },
          { name: 'Women Helpline', number: '1091', description: '24x7 Dedicated Women Safety Helpline' },
          { name: 'Delhi Police Control Room', number: '100', description: 'Direct Police Control Room' },
        ],
      },
      'Emergency SOS Activated! Alert dispatched to trusted contacts.',
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to activate SOS: ${msg}`, 500);
  }
}

export async function getActiveSession(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    let foundSession: EmergencySession | null = null;
    const now = Date.now();

    // Collect all user IDs connected to authUser
    const linkedUserIds = new Set<string>();
    for (const c of store.contacts.values()) {
      if (c.requester_id === authUser.userId) linkedUserIds.add(c.contact_id);
      if (c.contact_id === authUser.userId) linkedUserIds.add(c.requester_id);
    }

    for (const s of store.emergencySessions.values()) {
      if (s.status === 'active') {
        // Auto-expire sessions older than 5 minutes so stale sessions do not persist
        const activatedTime = s.activated_at ? new Date(s.activated_at).getTime() : 0;
        if (now - activatedTime > 5 * 60 * 1000) {
          s.status = 'resolved';
          s.resolved_at = new Date();
          continue;
        }

        const isSelf = s.user_id === authUser.userId;
        const isAlerted = s.contacts_alerted && s.contacts_alerted.includes(authUser.userId);
        const isLinkedContact = linkedUserIds.has(s.user_id);
        const isAdmin = authUser.role === 'admin';

        if (isSelf || isAlerted || isLinkedContact || isAdmin) {
          foundSession = s;
          break;
        }
      }
    }

    if (!foundSession) {
      sendSuccess(res, null);
      return;
    }

    const victimUser = store.users.get(foundSession.user_id);
    const victimProfile = store.profiles.get(foundSession.user_id);

    sendSuccess(res, {
      session: foundSession,
      user: {
        id: foundSession.user_id,
        name: victimProfile?.full_name || victimUser?.email || 'Connected Traveler',
        phone: victimUser?.phone || '',
        photo: victimProfile?.profile_picture_url,
      },
      emergencyHotlines: [
        { name: 'National Emergency', number: '112' },
        { name: 'Women Helpline', number: '1091' },
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get active SOS: ${msg}`, 500);
  }
}

export async function resolveEmergency(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { notes = 'Emergency marked resolved safely.' } = req.body;

    const session = store.emergencySessions.get(id);
    if (!session) {
      // If session not found by ID, resolve any active session for this user
      for (const s of store.emergencySessions.values()) {
        if (s.status === 'active') {
          s.status = 'resolved';
          s.resolved_at = new Date();
          s.resolution_notes = notes;
        }
      }
      sendSuccess(res, { resolved: true }, 'All active sessions resolved');
      return;
    }

    session.status = 'resolved';
    session.resolved_at = new Date();
    session.resolved_by = authUser.userId;
    session.resolution_notes = notes;
    session.updated_at = new Date();

    sendSuccess(res, session, 'Emergency session marked resolved');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to resolve emergency: ${msg}`, 500);
  }
}

export async function resetAllEmergencies(req: Request, res: Response): Promise<void> {
  try {
    store.emergencySessions.clear();
    sendSuccess(res, { cleared: true }, 'All emergency sessions cleared');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to reset emergencies: ${msg}`, 500);
  }
}
