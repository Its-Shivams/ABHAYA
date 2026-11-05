// ============================================================
// d:\ABHAYA\web\src\types\index.ts
// Frontend TypeScript Types
// ============================================================

export type UserRole = 'primary_user' | 'trusted_contact' | 'admin';
export type SafetyZone = 'A' | 'B' | 'C';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  bio: string | null;
  preferred_language: 'en' | 'hi';
  profile_picture_url: string | null;
  emergency_message: string;
}

export interface User {
  id: string;
  abhayaId: string;
  email: string;
  phone: string;
  role: UserRole;
  profile: UserProfile | null;
}

export interface SafetyParameters {
  incidentScore: number;
  streetlightScore: number;
  communityScore: number;
  publicActivityScore: number;
  cctvScore: number;
  policeScore: number;
  hospitalScore: number;
}

export interface RouteSegment {
  name: string;
  score: number;
  zone: SafetyZone;
  status: string;
}

export interface RouteOption {
  id: string;
  name: string;
  via: string;
  isRecommended: boolean;
  safetyScore: number;
  zone: SafetyZone;
  zoneColor: string;
  zoneLabel: string;
  distanceKm: number;
  durationMinutes: number;
  confidencePercent: number;
  reason: string;
  parameters: SafetyParameters;
  segments: RouteSegment[];
  coordinates: [number, number][];
}

export interface NearbyFacility {
  id: string;
  name: string;
  facility_type: 'police' | 'hospital' | 'pharmacy' | 'metro' | 'bus_stop' | 'taxi';
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
  emergency_phone?: string | null;
  distance_meters: number;
  distance_km: string;
  is_verified: boolean;
  is_24_hours: boolean;
}

export interface CommunityReport {
  id: string;
  user_id: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  road_segment_id: string | null;
  description: string;
  image_urls: string[];
  status: 'pending' | 'under_verification' | 'verified' | 'rejected' | 'expired';
  verification_notes?: string | null;
  created_at: string;
  reporterName?: string;
  segmentName?: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  author_display_name: string;
  is_anonymous: boolean;
  title: string;
  content: string;
  category: string;
  lat: number;
  lng: number;
  area_name: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
}

export interface EmergencySession {
  id: string;
  user_id: string;
  status: 'active' | 'resolved';
  trigger_type: string;
  lat: number;
  lng: number;
  address: string;
  battery_level: number;
  contacts_alerted: string[];
  activated_at: string;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

export interface SafetyHistoryItem {
  id: string;
  segmentId: string;
  segmentName: string;
  oldScore: number;
  newScore: number;
  oldZone: SafetyZone;
  newZone: SafetyZone;
  reason: string;
  changedBy: string;
  changedAt: string;
}
