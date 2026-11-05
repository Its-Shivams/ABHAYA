// ============================================================
// d:\ABHAYA\backend\src\types\index.ts
// Global TypeScript types and Express augmentation
// ============================================================

import { Request } from 'express';

// ─── Primitives ───────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

// ─── JWT ──────────────────────────────────────────────────────
export interface JWTPayload {
  userId: string;
  email: string;
  phone: string;
  role: UserRole;
  abhayaId: string;
  iat?: number;
  exp?: number;
}

// ─── User ─────────────────────────────────────────────────────
export type UserRole = 'primary_user' | 'trusted_contact' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface User {
  id: string;
  abhaya_id: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  fcm_token: string | null;
  last_active_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  date_of_birth: Date | null;
  gender: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  preferred_language: string;
  home_location: LatLng | null;
  work_location: LatLng | null;
  emergency_message: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithProfile extends User {
  profile: UserProfile;
  trusted_contacts_count?: number;
}

// ─── Contacts ─────────────────────────────────────────────────
export type ContactStatus = 'pending' | 'accepted' | 'rejected' | 'revoked';

export interface TrustedContact {
  id: string;
  requester_id: string;
  contact_id: string;
  status: ContactStatus;
  can_track_journey: boolean;
  can_receive_sos: boolean;
  can_view_location: boolean;
  nickname: string | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Journey ──────────────────────────────────────────────────
export type JourneyStatus = 'active' | 'completed' | 'cancelled' | 'emergency';

export interface Journey {
  id: string;
  user_id: string;
  title: string | null;
  origin_lat: number;
  origin_lng: number;
  origin_address: string | null;
  destination_lat: number;
  destination_lng: number;
  destination_address: string | null;
  route_id: string | null;
  status: JourneyStatus;
  safety_score: number | null;
  started_at: Date;
  completed_at: Date | null;
  estimated_arrival: Date | null;
  total_distance_meters: number | null;
  sharing_contacts: string[];
  created_at: Date;
  updated_at: Date;
}

// ─── Live Location ────────────────────────────────────────────
export interface LiveLocation {
  id: string;
  user_id: string;
  journey_id: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  battery_level: number | null;
  recorded_at: Date;
  created_at?: Date;
}

// ─── Safety ───────────────────────────────────────────────────
export type SafetyZone = 'A' | 'B' | 'C';

export interface SafetyParams {
  incidentScore: number;
  streetlightScore: number;
  communityScore: number;
  publicActivityScore: number;
  cctvScore: number;
  policeScore: number;
  hospitalScore: number;
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
  is_verified: boolean;
  is_24_hours: boolean;
  source?: string;
  distance_meters: number;
}

export interface SafetyScore {
  id: string;
  segment_id: string;
  score: number;
  zone: SafetyZone;
  incident_score: number;
  streetlight_score: number;
  community_score: number;
  public_activity_score: number;
  cctv_score: number;
  police_score: number;
  hospital_score: number;
  computed_at: Date;
  valid_until: Date | null;
  created_at: Date;
}

export interface SafetyScoreHistory {
  id: string;
  segment_id: string;
  score: number;
  zone: SafetyZone;
  change_reason: string | null;
  computed_at: Date;
}

// ─── Community ────────────────────────────────────────────────
export type ReportStatus = 'pending' | 'under_verification' | 'verified' | 'rejected' | 'resolved' | 'expired';
export type ReportCategory =
  | 'harassment'
  | 'poor_lighting'
  | 'streetlight'
  | 'unsafe_road'
  | 'isolation'
  | 'cctv'
  | 'suspicious_activity'
  | 'road_closure'
  | 'infrastructure'
  | 'assault'
  | 'theft'
  | 'other';

export interface CommunityReport {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  address: string | null;
  road_segment_id?: string | null;
  category: ReportCategory | string;
  title?: string;
  description: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  status: ReportStatus;
  is_anonymous?: boolean;
  evidence_urls?: string[];
  image_urls?: string[];
  admin_notes?: string | null;
  verification_notes?: string | null;
  verified_by: string | null;
  verified_at: Date | null;
  expires_at?: Date | null;
  incident_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export type PostStatus = 'active' | 'flagged' | 'removed';

export interface CommunityPost {
  id: string;
  user_id: string;
  author_display_name?: string;
  is_anonymous?: boolean;
  title: string;
  content: string;
  category?: string;
  lat: number | null;
  lng: number | null;
  area_name: string | null;
  tags?: string[];
  like_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  is_pinned?: boolean;
  status?: PostStatus;
  created_at: Date;
  updated_at: Date;
}

// ─── Emergency ────────────────────────────────────────────────
export type EmergencyStatus = 'active' | 'resolved' | 'false_alarm';
export type EmergencyType = 'sos' | 'sos_button' | 'fall_detected' | 'unsafe_area' | 'manual';

export interface EmergencySession {
  id: string;
  user_id: string;
  journey_id?: string | null;
  type?: EmergencyType;
  trigger_type?: string;
  status: EmergencyStatus;
  lat: number;
  lng: number;
  address: string | null;
  battery_level: number | null;
  notified_contacts?: string[];
  contacts_alerted?: string[];
  police_notified?: boolean;
  activated_at?: Date;
  resolved_at: Date | null;
  resolved_by?: string | null;
  resolution_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EmergencyEvent {
  id: string;
  session_id: string;
  event_type: string;
  lat: number | null;
  lng: number | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// ─── Notifications ────────────────────────────────────────────
export type NotificationType =
  | 'journey_start'
  | 'journey_end'
  | 'sos_alert'
  | 'contact_request'
  | 'report_verified'
  | 'area_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  sent_via_fcm: boolean;
  created_at: Date;
}

// ─── Facilities ───────────────────────────────────────────────
export type FacilityType =
  | 'police_station'
  | 'hospital'
  | 'fire_station'
  | 'pharmacy'
  | 'atm'
  | 'bus_stop'
  | 'metro_station'
  | 'women_helpdesk';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  address: string | null;
  phone: string | null;
  is_24_hours: boolean;
  rating: number | null;
  google_place_id: string | null;
  distance_meters?: number;
  created_at: Date;
  updated_at: Date;
}

// ─── Routes ───────────────────────────────────────────────────
export interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
}

export interface Route {
  id: string;
  origin: LatLng;
  destination: LatLng;
  polyline: string;
  distance_meters: number;
  duration_seconds: number;
  steps: RouteStep[];
  bounds: { northeast: LatLng; southwest: LatLng };
}

export interface RouteWithScore extends Route {
  safety_score: number;
  safety_zone: SafetyZone;
  safety_zone_label: string;
  safety_zone_color: string;
  combined_score: number;
  recommendation: string;
  safety_breakdown: {
    incident_score: number;
    streetlight_score: number;
    community_score: number;
    public_activity_score: number;
    cctv_score: number;
    police_score: number;
    hospital_score: number;
  };
}

// ─── Express augmentation ─────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
}
