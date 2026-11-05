// ============================================================
// d:\ABHAYA\backend\src\utils\geoUtils.ts
// Geographic utility functions
// ============================================================

import { LatLng } from '../types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Haversine formula — returns distance in metres between two coordinates.
 */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Returns a PostGIS POINT geometry string.
 * WGS84 (SRID 4326): ST_GeomFromText('POINT(lon lat)', 4326)
 */
export function coordsToPoint(lat: number, lon: number): string {
  return `ST_GeomFromText('POINT(${lon} ${lat})', 4326)`;
}

/**
 * Returns a PostGIS POINT using ST_MakePoint for parameterised queries.
 * Use with: ST_SetSRID(ST_MakePoint($1, $2), 4326)
 */
export function makePointParams(lat: number, lon: number): [number, number] {
  return [lon, lat]; // PostGIS: X=longitude, Y=latitude
}

export function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100;
}

export function metersToMiles(meters: number): number {
  return Math.round((meters / 1609.34) * 100) / 100;
}

/**
 * Format distance for display (m or km).
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${metersToKm(meters)} km`;
}

/**
 * Format duration for display.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}

/**
 * Calculate the bounding box around a point within a radius.
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusMeters: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngDelta =
    (radiusMeters / (EARTH_RADIUS_METERS * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI);
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Parse "lat,lng" string into LatLng object.
 */
export function parseLatLng(str: string): LatLng | null {
  const parts = str.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Validate latitude and longitude values.
 */
export function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculate bearing from point A to point B in degrees.
 */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}
