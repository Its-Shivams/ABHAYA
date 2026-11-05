// src/types/index.ts
// All TypeScript interfaces for ABHAYA mobile app

export type UserRole = 'primary_user' | 'trusted_contact';
export type ZoneType = 'A' | 'B' | 'C';
export type FacilityType = 'police' | 'hospital' | 'pharmacy' | 'metro' | 'bus';
export type JourneyStatus = 'active' | 'completed' | 'cancelled' | 'emergency';
export type EmergencyStatus = 'active' | 'resolved' | 'cancelled';
export type PostCategory =
  | 'unsafe_area'
  | 'harassment'
  | 'street_light'
  | 'general'
  | 'discussion'
  | 'alert';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formatted?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  abhayaId: string;
  profilePicture?: string;
  bio?: string;
  preferredLanguage: 'en' | 'hi';
  trustedContacts: TrustedContact[];
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  totalJourneys: number;
  totalReports: number;
  memberSince: string;
}

export interface TrustedContact {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  isOnline: boolean;
  lastSeen?: string;
  connectionStatus: 'pending' | 'connected' | 'blocked';
}

export interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface SafetyScore {
  overall: number;
  zone: ZoneType;
  parameters: {
    incidentCount: number;
    streetLightCoverage: number;
    cctvCoverage: number;
    policeProximity: number;
    crowdDensity: number;
    communityReports: number;
  };
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export interface RouteSegment {
  coordinates: Coordinates[];
  zone: ZoneType;
  safetyScore: number;
  distance: number;
  instruction?: string;
}

export interface Route {
  _id: string;
  name: string;
  origin: Coordinates;
  destination: Coordinates;
  originAddress?: string;
  destinationAddress?: string;
  distance: number; // km
  duration: number; // minutes
  safetyScore: SafetyScore;
  segments: RouteSegment[];
  polyline: Coordinates[];
  isRecommended: boolean;
  isDemoData?: boolean;
  calculatedAt: string;
}

export interface Journey {
  _id: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  origin: Coordinates;
  destination: Coordinates;
  originAddress?: string;
  destinationAddress?: string;
  route?: Route;
  status: JourneyStatus;
  startedAt: string;
  endedAt?: string;
  currentLocation?: Coordinates;
  lastUpdated?: string;
  eta?: string;
  sharedWith: string[];
  batteryLevel?: number;
  isLive: boolean;
}

export interface Facility {
  _id: string;
  name: string;
  type: FacilityType;
  coordinates: Coordinates;
  address: string;
  phone?: string;
  distance?: number; // km
  isOpen?: boolean;
  rating?: number;
}

export interface CommunityPost {
  _id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  category: PostCategory;
  title?: string;
  description: string;
  location: Coordinates;
  area: string;
  images?: string[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
}

export interface EmergencySession {
  _id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  currentLocation: Coordinates;
  startedAt: string;
  resolvedAt?: string;
  status: EmergencyStatus;
  notifiedContacts: string[];
  lastUpdated: string;
}

export interface ActivityItem {
  _id: string;
  type: 'journey' | 'report' | 'alert' | 'contact';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color?: string;
}

export interface Notification {
  _id: string;
  type: 'journey' | 'emergency' | 'community' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  preferredLanguage?: 'en' | 'hi';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LocationState {
  coords: Coordinates;
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

export interface VoiceCommand {
  action:
    | 'find_route'
    | 'share_journey'
    | 'nearby_police'
    | 'nearby_hospital'
    | 'open_community'
    | 'activate_sos'
    | 'show_contacts'
    | 'unknown';
  params?: Record<string, string>;
  rawText: string;
}
