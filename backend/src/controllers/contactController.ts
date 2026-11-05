// ============================================================
// d:\ABHAYA\backend\src\controllers\contactController.ts
// ============================================================

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../services/store';
import { JWTPayload, TrustedContact } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getContacts(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const result: any[] = [];

    for (const c of store.contacts.values()) {
      if (c.requester_id === authUser.userId || c.contact_id === authUser.userId) {
        const otherUserId = c.requester_id === authUser.userId ? c.contact_id : c.requester_id;
        const otherUser = store.users.get(otherUserId);
        const otherProfile = store.profiles.get(otherUserId);

        result.push({
          id: c.id,
          contactUserId: otherUserId,
          name: otherProfile?.full_name || 'Contact',
          phone: otherUser?.phone || '',
          email: otherUser?.email || '',
          abhayaId: otherUser?.abhaya_id || '',
          role: otherUser?.role || '',
          nickname: c.nickname,
          status: c.status,
          canTrackJourney: c.can_track_journey,
          canReceiveSos: c.can_receive_sos,
          isRequester: c.requester_id === authUser.userId,
        });
      }
    }

    sendSuccess(res, result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get contacts: ${msg}`, 500);
  }
}

export async function sendRequest(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { targetAbhayaId, nickname = 'Trusted Contact' } = req.body;

    if (!targetAbhayaId) {
      sendError(res, 'ABHAYA ID is required', 400);
      return;
    }

    let targetUser = null;
    for (const u of store.users.values()) {
      if (u.abhaya_id.toLowerCase() === targetAbhayaId.toLowerCase()) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      sendError(res, 'User not found with provided ABHAYA ID', 404);
      return;
    }

    if (targetUser.id === authUser.userId) {
      sendError(res, 'You cannot add yourself as a trusted contact', 400);
      return;
    }

    const newContactId = uuidv4();
    const contact: TrustedContact = {
      id: newContactId,
      requester_id: authUser.userId,
      contact_id: targetUser.id,
      status: 'accepted', // Auto-accept in demo mode for frictionless experience
      can_track_journey: true,
      can_receive_sos: true,
      can_view_location: true,
      nickname,
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.contacts.set(newContactId, contact);

    sendSuccess(res, contact, 'Contact connected successfully', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to send request: ${msg}`, 500);
  }
}

export async function removeContact(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;

    const contact = store.contacts.get(id);
    if (!contact) {
      sendError(res, 'Contact connection not found', 404);
      return;
    }

    if (contact.requester_id !== authUser.userId && contact.contact_id !== authUser.userId) {
      sendError(res, 'Unauthorized to remove this contact', 403);
      return;
    }

    store.contacts.delete(id);
    sendSuccess(res, { deleted: true }, 'Trusted contact removed');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to remove contact: ${msg}`, 500);
  }
}
