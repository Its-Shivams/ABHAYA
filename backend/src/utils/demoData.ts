// ============================================================
// d:\ABHAYA\backend\src\utils\demoData.ts
// DEMO_DATA — Sample safety data for Uttam Nagar / Vikaspuri
// All entries are labelled DEMO_DATA and not real assessments.
// ============================================================

import { SafetyParams, RouteWithScore } from '../types';
import {
  calculateSafetyScore,
  classifyZone,
  getZoneLabel,
  getZoneColor,
  calculateCombinedScore,
  normaliseTimeScores,
  getRecommendationText,
} from './safetyScoring';
import { formatDistance, formatDuration } from './geoUtils';
import { v4 as uuidv4 } from 'uuid';

// ─── DEMO_DATA: Area safety profiles ─────────────────────────
export const DEMO_AREA_PROFILES: Record<string, SafetyParams & { areaName: string }> = {
  uttam_nagar_main: {
    areaName: 'Uttam Nagar Main Road',
    incidentScore: 55,
    streetlightScore: 70,
    communityScore: 60,
    publicActivityScore: 80,
    cctvScore: 50,
    policeScore: 65,
    hospitalScore: 60,
  },
  uttam_nagar_west: {
    areaName: 'Uttam Nagar West',
    incidentScore: 65,
    streetlightScore: 75,
    communityScore: 70,
    publicActivityScore: 75,
    cctvScore: 60,
    policeScore: 70,
    hospitalScore: 55,
  },
  vikaspuri_main: {
    areaName: 'Vikaspuri Main Road',
    incidentScore: 72,
    streetlightScore: 80,
    communityScore: 78,
    publicActivityScore: 85,
    cctvScore: 65,
    policeScore: 72,
    hospitalScore: 68,
  },
  vikaspuri_block: {
    areaName: 'Vikaspuri Block Area',
    incidentScore: 45,
    streetlightScore: 50,
    communityScore: 48,
    publicActivityScore: 55,
    cctvScore: 35,
    policeScore: 55,
    hospitalScore: 45,
  },
  janakpuri: {
    areaName: 'Janakpuri',
    incidentScore: 78,
    streetlightScore: 82,
    communityScore: 80,
    publicActivityScore: 88,
    cctvScore: 70,
    policeScore: 75,
    hospitalScore: 72,
  },
  dwarka: {
    areaName: 'Dwarka Sector 10',
    incidentScore: 80,
    streetlightScore: 85,
    communityScore: 82,
    publicActivityScore: 78,
    cctvScore: 72,
    policeScore: 78,
    hospitalScore: 75,
  },
  delhi_dark_zone: {
    areaName: 'Industrial Area (Night)',
    incidentScore: 25,
    streetlightScore: 20,
    communityScore: 22,
    publicActivityScore: 15,
    cctvScore: 18,
    policeScore: 30,
    hospitalScore: 25,
  },
};

// ─── DEMO_DATA: Pre-built route options ───────────────────────
interface DemoRouteTemplate {
  label: string;
  areaProfileKey: string;
  distanceMeters: number;
  durationSeconds: number;
  description: string;
}

const DEMO_ROUTE_TEMPLATES: DemoRouteTemplate[] = [
  {
    label: 'Main Road Route',
    areaProfileKey: 'vikaspuri_main',
    distanceMeters: 4200,
    durationSeconds: 900,
    description: 'Via Vikaspuri Main Road — well-lit, busy',
  },
  {
    label: 'Residential Route',
    areaProfileKey: 'uttam_nagar_west',
    distanceMeters: 3800,
    durationSeconds: 960,
    description: 'Via residential colony — quieter but shorter',
  },
  {
    label: 'Highway Route',
    areaProfileKey: 'janakpuri',
    distanceMeters: 5100,
    durationSeconds: 840,
    description: 'Via Janakpuri — fastest but longer distance',
  },
];

export function getDemoRoutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  count = 3
): RouteWithScore[] {
  const templates = DEMO_ROUTE_TEMPLATES.slice(0, Math.min(count, DEMO_ROUTE_TEMPLATES.length));
  const durations = templates.map(t => t.durationSeconds);
  const timeScores = normaliseTimeScores(durations);

  const routes: RouteWithScore[] = templates.map((tmpl, idx) => {
    const profile = DEMO_AREA_PROFILES[tmpl.areaProfileKey];
    const safetyScore = calculateSafetyScore(profile);
    const zone = classifyZone(safetyScore);
    const timeScore = timeScores[idx];
    const combinedScore = calculateCombinedScore(safetyScore, timeScore);

    return {
      // DEMO_DATA: IDs are not real database IDs
      id: `DEMO_ROUTE_${uuidv4()}`,
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      polyline: `DEMO_POLYLINE_${idx + 1}`, // placeholder — real Google polyline not available in demo
      distance_meters: tmpl.distanceMeters,
      duration_seconds: tmpl.durationSeconds,
      steps: [
        {
          instruction: `Start from origin`,
          distance_meters: Math.floor(tmpl.distanceMeters * 0.3),
          duration_seconds: Math.floor(tmpl.durationSeconds * 0.3),
          start_lat: originLat,
          start_lng: originLng,
          end_lat: (originLat + destLat) / 2,
          end_lng: (originLng + destLng) / 2,
        },
        {
          instruction: `${tmpl.description}`,
          distance_meters: Math.floor(tmpl.distanceMeters * 0.5),
          duration_seconds: Math.floor(tmpl.durationSeconds * 0.5),
          start_lat: (originLat + destLat) / 2,
          start_lng: (originLng + destLng) / 2,
          end_lat: destLat,
          end_lng: destLng,
        },
        {
          instruction: `Arrive at destination`,
          distance_meters: Math.floor(tmpl.distanceMeters * 0.2),
          duration_seconds: Math.floor(tmpl.durationSeconds * 0.2),
          start_lat: destLat,
          start_lng: destLng,
          end_lat: destLat,
          end_lng: destLng,
        },
      ],
      bounds: {
        northeast: { lat: Math.max(originLat, destLat) + 0.005, lng: Math.max(originLng, destLng) + 0.005 },
        southwest: { lat: Math.min(originLat, destLat) - 0.005, lng: Math.min(originLng, destLng) - 0.005 },
      },
      safety_score: safetyScore,
      safety_zone: zone,
      safety_zone_label: getZoneLabel(zone),
      safety_zone_color: getZoneColor(zone),
      combined_score: combinedScore,
      recommendation: getRecommendationText(safetyScore, zone, false),
      safety_breakdown: {
        incident_score: profile.incidentScore,
        streetlight_score: profile.streetlightScore,
        community_score: profile.communityScore,
        public_activity_score: profile.publicActivityScore,
        cctv_score: profile.cctvScore,
        police_score: profile.policeScore,
        hospital_score: profile.hospitalScore,
      },
      // DEMO metadata
      _isDemoData: true,
      _demoLabel: tmpl.label,
      _demoArea: profile.areaName,
      _displayDistance: formatDistance(tmpl.distanceMeters),
      _displayDuration: formatDuration(tmpl.durationSeconds),
    } as RouteWithScore & Record<string, unknown>;
  });

  // Sort by combined score descending
  routes.sort((a, b) => b.combined_score - a.combined_score);

  // Mark top route as recommended
  if (routes.length > 0) {
    routes[0].recommendation = getRecommendationText(
      routes[0].safety_score,
      routes[0].safety_zone,
      true
    );
  }

  return routes;
}

// ─── DEMO_DATA: Nearby facilities ────────────────────────────
export const DEMO_FACILITIES = [
  {
    id: 'DEMO_FAC_001',
    name: 'Uttam Nagar Police Station',
    type: 'police_station',
    lat: 28.6210,
    lng: 77.0540,
    address: 'Uttam Nagar East, New Delhi - 110059',
    phone: '011-25374111',
    is_24_hours: true,
    rating: 3.8,
    google_place_id: null,
    _isDemoData: true,
  },
  {
    id: 'DEMO_FAC_002',
    name: 'Deen Dayal Upadhyay Hospital',
    type: 'hospital',
    lat: 28.6273,
    lng: 77.0617,
    address: 'Hari Nagar, New Delhi - 110064',
    phone: '011-25454343',
    is_24_hours: true,
    rating: 3.5,
    google_place_id: null,
    _isDemoData: true,
  },
  {
    id: 'DEMO_FAC_003',
    name: 'Vikaspuri Police Post',
    type: 'police_station',
    lat: 28.6391,
    lng: 77.0524,
    address: 'Vikaspuri, New Delhi - 110018',
    phone: '011-25554700',
    is_24_hours: true,
    rating: 3.6,
    google_place_id: null,
    _isDemoData: true,
  },
  {
    id: 'DEMO_FAC_004',
    name: 'Manipal Hospital Dwarka',
    type: 'hospital',
    lat: 28.5921,
    lng: 77.0460,
    address: 'Sector 6, Dwarka, New Delhi - 110075',
    phone: '011-25454343',
    is_24_hours: true,
    rating: 4.1,
    google_place_id: null,
    _isDemoData: true,
  },
  {
    id: 'DEMO_FAC_005',
    name: 'Janakpuri Fire Station',
    type: 'fire_station',
    lat: 28.6219,
    lng: 77.0824,
    address: 'Janakpuri, New Delhi - 110058',
    phone: '101',
    is_24_hours: true,
    rating: null,
    google_place_id: null,
    _isDemoData: true,
  },
  {
    id: 'DEMO_FAC_006',
    name: 'Uttam Nagar Metro Station',
    type: 'metro_station',
    lat: 28.6180,
    lng: 77.0536,
    address: 'Uttam Nagar East Metro, New Delhi',
    phone: null,
    is_24_hours: false,
    rating: 4.2,
    google_place_id: null,
    _isDemoData: true,
  },
  {
    id: 'DEMO_FAC_007',
    name: "Women's Helpdesk — Vikaspuri",
    type: 'women_helpdesk',
    lat: 28.6392,
    lng: 77.0520,
    address: 'Vikaspuri Police Station Premises, New Delhi',
    phone: '1091',
    is_24_hours: true,
    rating: 4.0,
    google_place_id: null,
    _isDemoData: true,
  },
];

export function getDemoFacilitiesNear(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  typeFilter?: string
) {
  const { distanceMeters } = require('./geoUtils');
  return DEMO_FACILITIES
    .filter(f => !typeFilter || f.type === typeFilter)
    .map(f => ({
      ...f,
      distance_meters: Math.round(distanceMeters(lat, lng, f.lat, f.lng)),
    }))
    .filter(f => f.distance_meters <= radiusMeters)
    .sort((a, b) => a.distance_meters - b.distance_meters);
}

// ─── DEMO_DATA: Demo user accounts ───────────────────────────
export const DEMO_USERS = {
  primary_user: {
    id: 'DEMO_USER_001',
    abhaya_id: 'ABHAYA-USER-0001',
    email: 'demo.user@abhaya.app',
    phone: '+919876543210',
    role: 'primary_user',
    full_name: 'Priya Sharma (Demo)',
    _isDemoData: true,
  },
  trusted_contact: {
    id: 'DEMO_USER_002',
    abhaya_id: 'ABHAYA-USER-0002',
    email: 'demo.contact@abhaya.app',
    phone: '+919876543211',
    role: 'trusted_contact',
    full_name: 'Ravi Sharma (Demo)',
    _isDemoData: true,
  },
};
