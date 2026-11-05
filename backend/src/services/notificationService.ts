// ============================================================
// d:\ABHAYA\backend\src\services\notificationService.ts
// FCM push notifications, SMS, and bulk contact notification
// ============================================================

import { query } from '../config/database';

let firebaseAdmin: typeof import('firebase-admin') | null = null;

async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  try {
    const admin = await import('firebase-admin');
    const fs = await import('fs');
    const path = await import('path');

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_PATH not set — FCM disabled');
      return null;
    }

    const resolvedPath = path.resolve(serviceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`[FCM] Service account file not found: ${resolvedPath} — FCM disabled`);
      return null;
    }

    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    firebaseAdmin = admin;
    console.log('✅ [FCM] Firebase Admin initialized');
    return admin;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  [FCM] Firebase Admin init failed: ${msg} — FCM disabled`);
    return null;
  }
}

/**
 * Send FCM push notification to a user (by userId → lookup fcm_token).
 */
export async function sendFCM(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<boolean> {
  try {
    // Get user's FCM token from DB
    const result = await query<{ fcm_token: string | null }>(
      'SELECT fcm_token FROM users WHERE id = $1 AND status = $2',
      [userId, 'active']
    );

    const fcmToken = result.rows[0]?.fcm_token;
    if (!fcmToken) {
      console.log(`[FCM] No FCM token for user ${userId}`);
      return false;
    }

    const admin = await getFirebaseAdmin();
    if (!admin) {
      console.log(`[FCM] DEMO: Would send to user ${userId} — "${title}": ${body}`);
      return false;
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'abhaya_alerts',
          priority: 'max',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    console.log(`✅ [FCM] Sent to user ${userId}: "${title}"`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [FCM] Failed to send to user ${userId}: ${msg}`);
    return false;
  }
}

/**
 * Send SMS to a phone number.
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  const provider = process.env.SMS_PROVIDER ?? 'demo';

  if (provider === 'demo') {
    console.log(`📱 [SMS/DEMO] To ${phone}: ${message}`);
    return true;
  }

  // Add real provider integrations here (Twilio, MSG91, etc.)
  console.warn(`[SMS] Unknown provider: ${provider} — message dropped`);
  return false;
}

/**
 * Notify all accepted trusted contacts of a user.
 */
export async function notifyTrustedContacts(
  userId: string,
  eventTitle: string,
  eventBody: string,
  data: Record<string, string> = {}
): Promise<{ notified: number; failed: number }> {
  try {
    // Get all accepted contacts for this user
    const result = await query<{ contact_id: string; can_receive_sos: boolean }>(
      `SELECT tc.contact_id, tc.can_receive_sos
       FROM trusted_contacts tc
       WHERE tc.requester_id = $1
         AND tc.status = 'accepted'`,
      [userId]
    );

    const contacts = result.rows;
    let notified = 0;
    let failed = 0;

    const promises = contacts.map(async (c) => {
      const sent = await sendFCM(c.contact_id, eventTitle, eventBody, data);
      if (sent) notified++;
      else failed++;
    });

    await Promise.allSettled(promises);

    console.log(
      `[Notify] User ${userId} → ${contacts.length} contacts: ${notified} sent, ${failed} failed`
    );
    return { notified, failed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Notify] Error notifying contacts for user ${userId}: ${msg}`);
    return { notified: 0, failed: 0 };
  }
}

/**
 * Save notification record to DB (non-blocking best-effort).
 */
export async function saveNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  sentViaFcm = false
): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data, sent_via_fcm)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, body, JSON.stringify(data), sentViaFcm]
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Notify] Failed to save notification: ${msg}`);
  }
}
