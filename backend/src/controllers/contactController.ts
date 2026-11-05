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
      sendError(res, 'ABHAYA ID, email or phone is required', 400);
      return;
    }

    const query = String(targetAbhayaId).trim().toLowerCase();
    const cleanDigits = query.replace(/[^0-9]/g, '');

    let targetUser = null;
    for (const u of store.users.values()) {
      const uPhoneDigits = u.phone.replace(/[^0-9]/g, '');
      if (
        u.abhaya_id.toLowerCase() === query ||
        u.email.toLowerCase() === query ||
        (cleanDigits.length >= 10 && uPhoneDigits.endsWith(cleanDigits))
      ) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      sendError(res, 'User not found with provided ABHAYA ID, email or phone number', 404);
      return;
    }

    if (targetUser.id === authUser.userId) {
      sendError(res, 'You cannot add yourself as a trusted contact', 400);
      return;
    }

    // Check if link already exists
    for (const c of store.contacts.values()) {
      if (
        (c.requester_id === authUser.userId && c.contact_id === targetUser.id) ||
        (c.requester_id === targetUser.id && c.contact_id === authUser.userId)
      ) {
        sendError(res, 'This contact is already connected', 409);
        return;
      }
    }

    const newContactId = uuidv4();
    const contact: TrustedContact = {
      id: newContactId,
      requester_id: authUser.userId,
      contact_id: targetUser.id,
      status: 'accepted', // Auto-accept for immediate protection
      can_track_journey: true,
      can_receive_sos: true,
      can_view_location: true,
      nickname,
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.contacts.set(newContactId, contact);

    const targetProfile = store.profiles.get(targetUser.id);
    const resultPayload = {
      id: contact.id,
      contactUserId: targetUser.id,
      name: targetProfile?.full_name || targetUser.email,
      phone: targetUser.phone,
      email: targetUser.email,
      abhayaId: targetUser.abhaya_id,
      role: targetUser.role,
      nickname: contact.nickname,
      status: contact.status,
      canTrackJourney: contact.can_track_journey,
      canReceiveSos: contact.can_receive_sos,
      isRequester: true,
    };

    sendSuccess(res, resultPayload, 'Contact connected successfully', 201);
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
