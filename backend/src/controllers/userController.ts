// ============================================================
// d:\ABHAYA\backend\src\controllers\userController.ts
// ============================================================

import { Request, Response } from 'express';
import store from '../services/store';
import { JWTPayload } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const user = store.users.get(authUser.userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const profile = store.profiles.get(authUser.userId);

    // Count trusted contacts
    let contactsCount = 0;
    for (const c of store.contacts.values()) {
      if ((c.requester_id === user.id || c.contact_id === user.id) && c.status === 'accepted') {
        contactsCount++;
      }
    }

    sendSuccess(res, {
      id: user.id,
      abhayaId: user.abhaya_id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile,
      trustedContactsCount: contactsCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get profile: ${msg}`, 500);
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const profile = store.profiles.get(authUser.userId);
    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    const { full_name, bio, preferred_language, emergency_message, home_location, work_location } = req.body;

    if (full_name !== undefined) profile.full_name = full_name;
    if (bio !== undefined) profile.bio = bio;
    if (preferred_language !== undefined) profile.preferred_language = preferred_language;
    if (emergency_message !== undefined) profile.emergency_message = emergency_message;
    if (home_location !== undefined) profile.home_location = home_location;
    if (work_location !== undefined) profile.work_location = work_location;
    profile.updated_at = new Date();

    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to update profile: ${msg}`, 500);
  }
}

export async function getUserByAbhayaId(req: Request, res: Response): Promise<void> {
  try {
    const { abhayaId } = req.params;
    let foundUser: any = null;

    for (const u of store.users.values()) {
      if (u.abhaya_id.toLowerCase() === abhayaId.toLowerCase()) {
        const prof = store.profiles.get(u.id);
        foundUser = {
          id: u.id,
          abhayaId: u.abhaya_id,
          role: u.role,
          name: prof ? prof.full_name : 'User',
        };
        break;
      }
    }

    if (!foundUser) {
      sendError(res, 'No user found with this ABHAYA ID', 404);
      return;
    }

    sendSuccess(res, foundUser);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to search user: ${msg}`, 500);
  }
}
