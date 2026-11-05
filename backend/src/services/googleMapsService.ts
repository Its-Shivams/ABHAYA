// ============================================================
// d:\ABHAYA\backend\src\services\googleMapsService.ts
// Google Maps / Places API abstraction with demo fallback
// ============================================================

import axios from 'axios';
import { Route, LatLng, RouteStep } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface Place {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  rating?: number;
  is_24_hours: boolean;
  google_place_id: string;
}

export interface IMapProvider {
  getDirections(
    origin: LatLng,
    destination: LatLng,
    alternatives: number
  ): Promise<Route[]>;
  getPlaces(location: LatLng, radius: number, type: string): Promise<Place[]>;
  geocode(address: string): Promise<LatLng | null>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
}

// ─── Demo directions fallback ─────────────────────────────────
function buildDemoRoutes(origin: LatLng, destination: LatLng, count: number): Route[] {
  const routes: Route[] = [];
  const baseDist = Math.sqrt(
    Math.pow(destination.lat - origin.lat, 2) +
      Math.pow(destination.lng - origin.lng, 2)
  ) * 111000; // rough metres per degree

  for (let i = 0; i < count; i++) {
    const factor = 1 + i * 0.15;
    const distanceMeters = Math.round(baseDist * factor);
    const durationSeconds = Math.round((distanceMeters / 1000 / 25) * 3600); // 25 km/h avg
    routes.push({
      id: uuidv4(),
      origin,
      destination,
      polyline: `DEMO_POLYLINE_${i + 1}`,
      distance_meters: distanceMeters,
      duration_seconds: durationSeconds,
      steps: [
        {
          instruction: `Head towards destination (Demo Route ${i + 1})`,
          distance_meters: Math.floor(distanceMeters * 0.6),
          duration_seconds: Math.floor(durationSeconds * 0.6),
          start_lat: origin.lat,
          start_lng: origin.lng,
          end_lat: (origin.lat + destination.lat) / 2,
          end_lng: (origin.lng + destination.lng) / 2,
        },
        {
          instruction: `Continue to destination`,
          distance_meters: Math.floor(distanceMeters * 0.4),
          duration_seconds: Math.floor(durationSeconds * 0.4),
          start_lat: (origin.lat + destination.lat) / 2,
          start_lng: (origin.lng + destination.lng) / 2,
          end_lat: destination.lat,
          end_lng: destination.lng,
        },
      ],
      bounds: {
        northeast: {
          lat: Math.max(origin.lat, destination.lat) + 0.01,
          lng: Math.max(origin.lng, destination.lng) + 0.01,
        },
        southwest: {
          lat: Math.min(origin.lat, destination.lat) - 0.01,
          lng: Math.min(origin.lng, destination.lng) - 0.01,
        },
      },
    });
  }
  return routes;
}

// ─── Parse Google Directions step ─────────────────────────────
function parseStep(step: Record<string, unknown>): RouteStep {
  const startLocation = step.start_location as { lat: number; lng: number };
  const endLocation = step.end_location as { lat: number; lng: number };
  const distance = step.distance as { value: number };
  const duration = step.duration as { value: number };
  const htmlInstructions = step.html_instructions as string;
  return {
    instruction: htmlInstructions.replace(/<[^>]+>/g, ''),
    distance_meters: distance?.value ?? 0,
    duration_seconds: duration?.value ?? 0,
    start_lat: startLocation?.lat ?? 0,
    start_lng: startLocation?.lng ?? 0,
    end_lat: endLocation?.lat ?? 0,
    end_lng: endLocation?.lng ?? 0,
  };
}

// ─── Parse Google Directions response ────────────────────────
function parseGoogleRoute(route: Record<string, unknown>): Route {
  const legs = (route.legs as Record<string, unknown>[]) ?? [];
  const firstLeg = legs[0] ?? {};
  const lastLeg = legs[legs.length - 1] ?? {};

  const totalDistance = legs.reduce((sum: number, leg) => {
    const dist = leg.distance as { value: number };
    return sum + (dist?.value ?? 0);
  }, 0);

  const totalDuration = legs.reduce((sum: number, leg) => {
    const dur = leg.duration as { value: number };
    return sum + (dur?.value ?? 0);
  }, 0);

  const steps: RouteStep[] = legs.flatMap(leg =>
    ((leg.steps as Record<string, unknown>[]) ?? []).map(parseStep)
  );

  const startLocation = (firstLeg.start_location as { lat: number; lng: number }) ?? {
    lat: 0,
    lng: 0,
  };
  const endLocation = (lastLeg.end_location as { lat: number; lng: number }) ?? {
    lat: 0,
    lng: 0,
  };

  const overviewPolyline = route.overview_polyline as { points: string };
  const bounds = route.bounds as {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };

  return {
    id: uuidv4(),
    origin: { lat: startLocation.lat, lng: startLocation.lng },
    destination: { lat: endLocation.lat, lng: endLocation.lng },
    polyline: overviewPolyline?.points ?? '',
    distance_meters: totalDistance,
    duration_seconds: totalDuration,
    steps,
    bounds: bounds ?? {
      northeast: { lat: 0, lng: 0 },
      southwest: { lat: 0, lng: 0 },
    },
  };
}

// ─── Google Maps Service ─────────────────────────────────────
export class GoogleMapsService implements IMapProvider {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY ?? '';
  }

  private get hasApiKey(): boolean {
    return this.apiKey.length > 0 && this.apiKey !== 'your_google_maps_api_key';
  }

  async getDirections(
    origin: LatLng,
    destination: LatLng,
    alternatives = 3
  ): Promise<Route[]> {
    if (!this.hasApiKey) {
      console.log('[Maps] No API key — returning demo directions');
      return buildDemoRoutes(origin, destination, alternatives);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          alternatives: true,
          mode: 'driving',
          key: this.apiKey,
        },
        timeout: 8000,
      });

      const data = response.data as {
        status: string;
        routes: Record<string, unknown>[];
      };

      if (data.status !== 'OK') {
        console.warn(`[Maps] Directions API status: ${data.status} — using demo`);
        return buildDemoRoutes(origin, destination, alternatives);
      }

      return data.routes
        .slice(0, alternatives)
        .map(r => parseGoogleRoute(r));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Maps] Directions API error: ${msg} — using demo`);
      return buildDemoRoutes(origin, destination, alternatives);
    }
  }

  async getPlaces(
    location: LatLng,
    radius: number,
    type: string
  ): Promise<Place[]> {
    if (!this.hasApiKey) {
      console.log('[Maps] No API key — returning demo places');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${location.lat},${location.lng}`,
          radius,
          type,
          key: this.apiKey,
        },
        timeout: 8000,
      });

      const data = response.data as {
        status: string;
        results: Record<string, unknown>[];
      };

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`[Maps] Places API status: ${data.status}`);
        return [];
      }

      return (data.results ?? []).map(place => {
        const geometry = place.geometry as { location: { lat: number; lng: number } };
        const photos = place.photos as { photo_reference: string }[] | undefined;
        const openingHours = place.opening_hours as { open_now?: boolean } | undefined;

        return {
          id: uuidv4(),
          name: place.name as string,
          type,
          lat: geometry?.location?.lat ?? 0,
          lng: geometry?.location?.lng ?? 0,
          address: (place.vicinity as string) ?? '',
          rating: place.rating as number | undefined,
          is_24_hours: openingHours?.open_now !== false,
          google_place_id: (place.place_id as string) ?? '',
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Maps] Places API error: ${msg}`);
      return [];
    }
  }

  async geocode(address: string): Promise<LatLng | null> {
    if (!this.hasApiKey) return null;
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: { address, key: this.apiKey },
        timeout: 5000,
      });
      const data = response.data as {
        status: string;
        results: { geometry: { location: { lat: number; lng: number } } }[];
      };
      if (data.status === 'OK' && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
      return null;
    } catch {
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.hasApiKey) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: { latlng: `${lat},${lng}`, key: this.apiKey },
        timeout: 5000,
      });
      const data = response.data as {
        status: string;
        results: { formatted_address: string }[];
      };
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
}

export const mapsService = new GoogleMapsService();
