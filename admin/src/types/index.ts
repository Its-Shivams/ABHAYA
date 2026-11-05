// TypeScript interfaces for ABHAYA Admin Panel

export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ReportStatus = 'pending' | 'under_verification' | 'verified' | 'rejected';
export type ReportCategory =
  | 'harassment'
  | 'poor_lighting'
  | 'unsafe_road'
  | 'suspicious_activity'
  | 'infrastructure'
  | 'other';
export type SafetyZone = 'A' | 'B' | 'C';
export type PostStatus = 'active' | 'removed' | 'flagged';
export type EmergencyStatus = 'active' | 'resolved' | 'false_alarm';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface User {
  id: string;
  abhayaId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  emergencyContacts?: number;
  totalReports?: number;
}

export interface Report {
  id: string;
  category: ReportCategory;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
    area?: string;
  };
  reporterAnonId: string;
  status: ReportStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  verifiedBy?: string;
  rejectionReason?: string;
  affectedSegmentId?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  area: string;
  authorAnonId: string;
  status: PostStatus;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  removedAt?: string;
  removalReason?: string;
  comments?: PostComment[];
}

export interface PostComment {
  id: string;
  content: string;
  authorAnonId: string;
  createdAt: string;
  status: PostStatus;
}

export interface SafetySegment {
  id: string;
  name: string;
  area: string;
  safetyScore: number;
  zone: SafetyZone;
  reportCount: number;
  lastUpdated: string;
  coordinates?: { lat: number; lng: number }[];
}

export interface SafetyHistoryEntry {
  id: string;
  segmentId: string;
  segmentName: string;
  oldScore: number;
  newScore: number;
  oldZone: SafetyZone;
  newZone: SafetyZone;
  reason: string;
  triggeredBy: string;
  createdAt: string;
}

export interface EmergencySession {
  id: string;
  userId: string;
  userName: string;
  userAnonId: string;
  status: EmergencyStatus;
  activatedAt: string;
  resolvedAt?: string;
  durationMinutes?: number;
  resolutionNotes?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  events?: EmergencyEvent[];
}

export interface EmergencyEvent {
  id: string;
  sessionId: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  totalUsers: number;
  activeJourneys: number;
  pendingReports: number;
  emergencySessionsToday: number;
  usersTrend: number;
  reportsTrend: number;
  recentReports: Report[];
  recentPosts: CommunityPost[];
}

export interface SystemStatus {
  demoMode: boolean;
  googleMapsConfigured: boolean;
  fcmConfigured: boolean;
  databaseConnected: boolean;
  apiVersion: string;
  uptime: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SafetyThresholds {
  zoneA: { min: number; max: number };
  zoneB: { min: number; max: number };
  zoneC: { min: number; max: number };
}
