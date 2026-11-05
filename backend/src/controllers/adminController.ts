// ============================================================
// d:\ABHAYA\backend\src\controllers\adminController.ts
// Admin & Moderation Panel Controller
// Includes Dynamic Safety Score Recalculation Trigger
// ============================================================

import { Request, Response } from 'express';
import store from '../services/store';
import { JWTPayload } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getAdminReports(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    let list = Array.from(store.reports.values());

    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    // Enrich with reporter details
    const enriched = list.map((r) => {
      const user = store.users.get(r.user_id);
      const profile = store.profiles.get(r.user_id);
      const segment = r.road_segment_id ? store.segments.get(r.road_segment_id) : null;
      return {
        ...r,
        reporterName: profile?.full_name || 'Anonymous User',
        reporterAbhayaId: user?.abhaya_id || '',
        segmentName: segment?.name || 'Unassigned Road Segment',
        currentSegmentScore: segment?.score || null,
        currentSegmentZone: segment?.zone || null,
      };
    });

    sendSuccess(res, enriched);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get admin reports: ${msg}`, 500);
  }
}

export async function verifyReport(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { notes } = req.body;

    const report = store.reports.get(id);
    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    // Trigger dynamic recalculation
    const updatedSegment = store.processReportVerification(id, 'verify', authUser.userId, notes);

    sendSuccess(
      res,
      {
        report,
        updatedSegment,
        message: 'Report verified! Road segment safety score dynamically recalculated and zone updated.',
      },
      'Report verified successfully'
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to verify report: ${msg}`, 500);
  }
}

export async function rejectReport(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { notes = 'Insufficient evidence / duplicate report' } = req.body;

    const report = store.reports.get(id);
    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    store.processReportVerification(id, 'reject', authUser.userId, notes);
    sendSuccess(res, { report }, 'Report rejected');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to reject report: ${msg}`, 500);
  }
}

export async function getSafetyHistory(req: Request, res: Response): Promise<void> {
  try {
    sendSuccess(res, store.safetyHistory);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to fetch safety history: ${msg}`, 500);
  }
}

export async function getRoadSegments(req: Request, res: Response): Promise<void> {
  try {
    const list = Array.from(store.segments.values());
    sendSuccess(res, list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to fetch road segments: ${msg}`, 500);
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const list = Array.from(store.users.values()).map((u) => {
      const p = store.profiles.get(u.id);
      return {
        id: u.id,
        abhayaId: u.abhaya_id,
        name: p?.full_name || 'User',
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        registeredAt: u.created_at,
      };
    });
    sendSuccess(res, list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to fetch users: ${msg}`, 500);
  }
}

export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    const stats = {
      uptimeSeconds: Math.round(process.uptime()),
      totalUsers: store.users.size,
      activeJourneys: Array.from(store.journeys.values()).filter((j) => j.status === 'active').length,
      activeEmergencySessions: Array.from(store.emergencySessions.values()).filter((s) => s.status === 'active').length,
      totalReports: store.reports.size,
      pendingReports: Array.from(store.reports.values()).filter((r) => r.status === 'pending').length,
      monitoredRoadSegments: store.segments.size,
      googleMapsConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY),
      mode: 'production-ready with demo fallback',
    };
    sendSuccess(res, stats);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to fetch system health: ${msg}`, 500);
  }
}
