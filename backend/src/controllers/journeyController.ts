// ============================================================
// d:\ABHAYA\backend\src\controllers\journeyController.ts
// Live Journey Sharing and Real-time Tracking
// ============================================================

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../services/store';
import { JWTPayload, Journey, LiveLocation } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function startJourney(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const {
      originLat,
      originLng,
      originAddress,
      destinationLat,
      destinationLng,
      destinationAddress,
      routeId,
      sharingContacts = [],
    } = req.body;

    const journeyId = uuidv4();
    const newJourney: Journey = {
      id: journeyId,
      user_id: authUser.userId,
      title: `Journey to ${destinationAddress || 'Destination'}`,
      origin_lat: originLat || 28.6186,
      origin_lng: originLng || 77.0545,
      origin_address: originAddress || 'Current Location',
      destination_lat: destinationLat || 28.6289,
      destination_lng: destinationLng || 77.0789,
      destination_address: destinationAddress || 'Janakpuri West',
      route_id: routeId || 'route-safe-01',
      status: 'active',
      safety_score: 85,
      started_at: new Date(),
      completed_at: null,
      estimated_arrival: new Date(Date.now() + 15 * 60000), // +15 mins
      total_distance_meters: 4600,
      sharing_contacts: sharingContacts.length > 0 ? sharingContacts : ['usr-rahul-002'],
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.journeys.set(journeyId, newJourney);

    // Initial location
    const initialLoc: LiveLocation = {
      id: uuidv4(),
      user_id: authUser.userId,
      journey_id: journeyId,
      lat: newJourney.origin_lat,
      lng: newJourney.origin_lng,
      accuracy: 5,
      speed: 0,
      heading: 0,
      altitude: null,
      battery_level: 85,
      recorded_at: new Date(),
    };
    store.locations.set(journeyId, [initialLoc]);

    sendSuccess(res, { journey: newJourney, initialLocation: initialLoc }, 'Journey started', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to start journey: ${msg}`, 500);
  }
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { lat, lng, speed = 12, batteryLevel = 84, accuracy = 4 } = req.body;

    const journey = store.journeys.get(id);
    if (!journey) {
      sendError(res, 'Journey not found', 404);
      return;
    }

    if (journey.user_id !== authUser.userId) {
      sendError(res, 'Unauthorized to update this journey', 403);
      return;
    }

    const loc: LiveLocation = {
      id: uuidv4(),
      user_id: authUser.userId,
      journey_id: id,
      lat,
      lng,
      accuracy,
      speed,
      heading: 45,
      altitude: null,
      battery_level: batteryLevel,
      recorded_at: new Date(),
    };

    const locList = store.locations.get(id) || [];
    locList.push(loc);
    // Keep max 100 historical points for privacy & memory efficiency
    if (locList.length > 100) locList.shift();
    store.locations.set(id, locList);

    journey.updated_at = new Date();

    sendSuccess(res, loc, 'Location updated');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to update location: ${msg}`, 500);
  }
}

export async function getJourney(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;

    const journey = store.journeys.get(id);
    if (!journey) {
      sendError(res, 'Journey not found', 404);
      return;
    }

    // Authorization check: owner or in sharing_contacts
    const isOwner = journey.user_id === authUser.userId;
    const isContact = journey.sharing_contacts.includes(authUser.userId);

    if (!isOwner && !isContact && authUser.role !== 'admin') {
      sendError(res, 'You are not authorized to view this journey', 403);
      return;
    }

    const locList = store.locations.get(id) || [];
    const latestLocation = locList.length > 0 ? locList[locList.length - 1] : null;
    const userProfile = store.profiles.get(journey.user_id);

    sendSuccess(res, {
      journey,
      latestLocation,
      locationHistory: locList,
      traveler: {
        id: journey.user_id,
        name: userProfile?.full_name || 'Traveler',
        phone: store.users.get(journey.user_id)?.phone || '',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get journey: ${msg}`, 500);
  }
}

export async function getActiveJourney(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    let activeJourney: Journey | null = null;

    if (authUser.role === 'trusted_contact') {
      // Find active journey shared with this contact
      for (const j of store.journeys.values()) {
        if (j.status === 'active' && j.sharing_contacts.includes(authUser.userId)) {
          activeJourney = j;
          break;
        }
      }
    } else {
      // Find user's own active journey
      for (const j of store.journeys.values()) {
        if (j.status === 'active' && j.user_id === authUser.userId) {
          activeJourney = j;
          break;
        }
      }
    }

    if (!activeJourney) {
      sendSuccess(res, null);
      return;
    }

    const locList = store.locations.get(activeJourney.id) || [];
    const latestLocation = locList.length > 0 ? locList[locList.length - 1] : null;
    const userProfile = store.profiles.get(activeJourney.user_id);

    sendSuccess(res, {
      journey: activeJourney,
      latestLocation,
      traveler: {
        id: activeJourney.user_id,
        name: userProfile?.full_name || 'Priya Sharma',
        phone: store.users.get(activeJourney.user_id)?.phone || '',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get active journey: ${msg}`, 500);
  }
}

export async function stopJourney(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { id } = req.params;

    const journey = store.journeys.get(id);
    if (!journey) {
      sendError(res, 'Journey not found', 404);
      return;
    }

    if (journey.user_id !== authUser.userId) {
      sendError(res, 'Unauthorized', 403);
      return;
    }

    journey.status = 'completed';
    journey.completed_at = new Date();
    journey.updated_at = new Date();

    sendSuccess(res, journey, 'Journey stopped safely');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to stop journey: ${msg}`, 500);
  }
}
