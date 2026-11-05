// ============================================================
// d:\ABHAYA\backend\src\controllers\facilityController.ts
// Smart Public Network & Nearby Help Facilities
// ============================================================

import { Request, Response } from 'express';
import store from '../services/store';
import { sendSuccess, sendError } from '../utils/response';
import { distanceMeters } from '../utils/geoUtils';

export async function getNearbyFacilities(req: Request, res: Response): Promise<void> {
  try {
    const { lat, lng, type, radius = 5000 } = req.query;

    const userLat = lat ? parseFloat(lat as string) : 28.6186;
    const userLng = lng ? parseFloat(lng as string) : 77.0545;
    const radiusMeters = parseFloat(radius as string) || 5000;

    let list = Array.from(store.facilities.values());

    if (type && type !== 'all') {
      list = list.filter((f) => f.facility_type === type);
    }

    // Calculate real distances
    const withDistance = list.map((f) => {
      const dist = Math.round(distanceMeters(userLat, userLng, f.lat, f.lng));
      return {
        ...f,
        distance_meters: dist,
        distance_km: (dist / 1000).toFixed(1),
      };
    });

    // Filter by radius & sort closest first
    const filtered = withDistance
      .filter((f) => f.distance_meters <= radiusMeters)
      .sort((a, b) => a.distance_meters - b.distance_meters);

    sendSuccess(res, filtered);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get nearby facilities: ${msg}`, 500);
  }
}
