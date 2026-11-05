// ============================================================
// d:\ABHAYA\backend\src\services\store.ts
// In-Memory Data Store & Persistence Manager for ABHAYA
// Provides seeded demo data and persistent runtime state
// ============================================================

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserProfile,
  TrustedContact,
  Journey,
  LiveLocation,
  EmergencySession,
  CommunityReport,
  CommunityPost,
  NearbyFacility,
  SafetyParams,
  SafetyZone,
} from '../types';
import { calculateSafetyScore, classifyZone } from '../utils/safetyScoring';

export interface RoadSegmentData {
  id: string;
  name: string;
  city: string;
  district: string;
  coordinates: [number, number][]; // [lat, lng] points
  indicators: SafetyParams;
  score: number;
  zone: SafetyZone;
  updatedAt: Date;
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
  changedAt: Date;
}

class Store {
  public users: Map<string, User> = new Map();
  public profiles: Map<string, UserProfile> = new Map();
  public contacts: Map<string, TrustedContact> = new Map();
  public journeys: Map<string, Journey> = new Map();
  public locations: Map<string, LiveLocation[]> = new Map(); // journeyId -> locations
  public emergencySessions: Map<string, EmergencySession> = new Map();
  public reports: Map<string, CommunityReport> = new Map();
  public posts: Map<string, CommunityPost> = new Map();
  public facilities: Map<string, NearbyFacility> = new Map();
  public segments: Map<string, RoadSegmentData> = new Map();
  public safetyHistory: SafetyHistoryItem[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const salt = bcrypt.genSaltSync(10);

    // 1. Primary User: Priya Sharma
    const priyaId = 'usr-priya-001';
    const priyaUser: User = {
      id: priyaId,
      abhaya_id: 'ABHAYA-USER-1001',
      email: 'priya@abhaya.demo',
      phone: '+919000000001',
      password_hash: bcrypt.hashSync('Priya@123', salt),
      role: 'primary_user',
      status: 'active',
      email_verified: true,
      phone_verified: true,
      fcm_token: null,
      last_active_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    const priyaProfile: UserProfile = {
      id: 'prof-priya-001',
      user_id: priyaId,
      full_name: 'Priya Sharma',
      display_name: 'Priya',
      date_of_birth: new Date('1998-05-15'),
      gender: 'Female',
      profile_picture_url: null,
      bio: 'Software engineer living in Uttam Nagar, New Delhi.',
      preferred_language: 'en',
      home_location: { lat: 28.6186, lng: 77.0545 }, // Uttam Nagar
      work_location: { lat: 28.6289, lng: 77.0789 }, // Janakpuri
      emergency_message: 'Please help! I have activated emergency SOS via ABHAYA.',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(priyaId, priyaUser);
    this.profiles.set(priyaId, priyaProfile);

    // 2. Trusted Contact: Rahul Sharma
    const rahulId = 'usr-rahul-002';
    const rahulUser: User = {
      id: rahulId,
      abhaya_id: 'ABHAYA-USER-1002',
      email: 'rahul@abhaya.demo',
      phone: '+919000000002',
      password_hash: bcrypt.hashSync('Rahul@123', salt),
      role: 'trusted_contact',
      status: 'active',
      email_verified: true,
      phone_verified: true,
      fcm_token: null,
      last_active_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    const rahulProfile: UserProfile = {
      id: 'prof-rahul-002',
      user_id: rahulId,
      full_name: 'Rahul Sharma',
      display_name: 'Rahul',
      date_of_birth: new Date('1995-09-20'),
      gender: 'Male',
      profile_picture_url: null,
      bio: 'Brother and trusted contact for Priya Sharma.',
      preferred_language: 'en',
      home_location: { lat: 28.6186, lng: 77.0545 },
      work_location: null,
      emergency_message: '',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(rahulId, rahulUser);
    this.profiles.set(rahulId, rahulProfile);

    // 3. Admin Moderator
    const adminId = 'usr-admin-003';
    const adminUser: User = {
      id: adminId,
      abhaya_id: 'ABHAYA-ADMIN-0001',
      email: 'admin@abhaya.demo',
      phone: '+919000000003',
      password_hash: bcrypt.hashSync('Admin@123', salt),
      role: 'admin',
      status: 'active',
      email_verified: true,
      phone_verified: true,
      fcm_token: null,
      last_active_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    const adminProfile: UserProfile = {
      id: 'prof-admin-003',
      user_id: adminId,
      full_name: 'ABHAYA Safety Moderator',
      display_name: 'Moderator',
      date_of_birth: null,
      gender: null,
      profile_picture_url: null,
      bio: 'Safety administrator and community report auditor.',
      preferred_language: 'en',
      home_location: null,
      work_location: null,
      emergency_message: '',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(adminId, adminUser);
    this.profiles.set(adminId, adminProfile);

    // Pre-approved link: Rahul is Priya's trusted contact
    const contactId = 'tc-link-001';
    this.contacts.set(contactId, {
      id: contactId,
      requester_id: priyaId,
      contact_id: rahulId,
      status: 'accepted',
      can_track_journey: true,
      can_receive_sos: true,
      can_view_location: true,
      nickname: 'Brother (Rahul)',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Seed Road Segments around West Delhi (Uttam Nagar - Vikaspuri - Janakpuri)
    const seg1Params: SafetyParams = {
      incidentScore: 78,
      streetlightScore: 85,
      communityScore: 82,
      publicActivityScore: 88,
      cctvScore: 75,
      policeScore: 80,
      hospitalScore: 75,
    };
    const seg1Score = calculateSafetyScore(seg1Params);
    this.segments.set('seg-001', {
      id: 'seg-001',
      name: 'Najafgarh Road (Uttam Nagar East to Janakpuri West)',
      city: 'New Delhi',
      district: 'West Delhi',
      coordinates: [
        [28.6186, 77.0545],
        [28.6225, 77.068],
        [28.6289, 77.0789],
      ],
      indicators: seg1Params,
      score: seg1Score,
      zone: classifyZone(seg1Score), // Zone A
      updatedAt: new Date(),
    });

    const seg2Params: SafetyParams = {
      incidentScore: 50,
      streetlightScore: 60,
      communityScore: 55,
      publicActivityScore: 65,
      cctvScore: 40,
      policeScore: 55,
      hospitalScore: 50,
    };
    const seg2Score = calculateSafetyScore(seg2Params);
    this.segments.set('seg-002', {
      id: 'seg-002',
      name: 'Pankha Road (Connecting Uttam Nagar & Vikaspuri)',
      city: 'New Delhi',
      district: 'West Delhi',
      coordinates: [
        [28.6186, 77.0545],
        [28.626, 77.065],
        [28.638, 77.072],
      ],
      indicators: seg2Params,
      score: seg2Score,
      zone: classifyZone(seg2Score), // Zone B
      updatedAt: new Date(),
    });

    const seg3Params: SafetyParams = {
      incidentScore: 28,
      streetlightScore: 30,
      communityScore: 35,
      publicActivityScore: 25,
      cctvScore: 20,
      policeScore: 40,
      hospitalScore: 30,
    };
    const seg3Score = calculateSafetyScore(seg3Params);
    this.segments.set('seg-003', {
      id: 'seg-003',
      name: 'Hastsal Drain Road (Isolated stretch)',
      city: 'New Delhi',
      district: 'West Delhi',
      coordinates: [
        [28.615, 77.048],
        [28.621, 77.042],
        [28.629, 77.039],
      ],
      indicators: seg3Params,
      score: seg3Score,
      zone: classifyZone(seg3Score), // Zone C
      updatedAt: new Date(),
    });

    const seg4Params: SafetyParams = {
      incidentScore: 82,
      streetlightScore: 90,
      communityScore: 85,
      publicActivityScore: 92,
      cctvScore: 85,
      policeScore: 88,
      hospitalScore: 85,
    };
    const seg4Score = calculateSafetyScore(seg4Params);
    this.segments.set('seg-004', {
      id: 'seg-004',
      name: 'Outer Ring Road (Vikaspuri Flyover Corridor)',
      city: 'New Delhi',
      district: 'West Delhi',
      coordinates: [
        [28.635, 77.075],
        [28.642, 77.082],
        [28.651, 77.091],
      ],
      indicators: seg4Params,
      score: seg4Score,
      zone: classifyZone(seg4Score), // Zone A
      updatedAt: new Date(),
    });

    // 5. Seed Nearby Facilities (Police, Hospitals, Pharmacies, Metro)
    const facilitiesList: NearbyFacility[] = [
      {
        id: 'fac-001',
        name: 'Uttam Nagar Police Station',
        facility_type: 'police',
        lat: 28.6195,
        lng: 77.0562,
        address: 'Main Najafgarh Road, Uttam Nagar, New Delhi 110059',
        phone: '+91 11 2533 5555',
        emergency_phone: '112',
        is_verified: true,
        is_24_hours: true,
        source: 'verified_directory',
        distance_meters: 350,
      },
      {
        id: 'fac-002',
        name: 'Vikaspuri Police Station',
        facility_type: 'police',
        lat: 28.6385,
        lng: 77.0715,
        address: 'H-Block, Vikaspuri, New Delhi 110018',
        phone: '+91 11 2555 1234',
        emergency_phone: '112',
        is_verified: true,
        is_24_hours: true,
        source: 'verified_directory',
        distance_meters: 1400,
      },
      {
        id: 'fac-003',
        name: 'Mata Chanan Devi Hospital',
        facility_type: 'hospital',
        lat: 28.6255,
        lng: 77.0845,
        address: 'C-1, Janakpuri, New Delhi 110058',
        phone: '+91 11 4558 2000',
        emergency_phone: '102',
        is_verified: true,
        is_24_hours: true,
        source: 'verified_directory',
        distance_meters: 1800,
      },
      {
        id: 'fac-004',
        name: 'Janakpuri West Metro Station (Interchange & Safe Haven)',
        facility_type: 'metro',
        lat: 28.6294,
        lng: 77.0778,
        address: 'Blue & Magenta Line Interchange, Janakpuri, New Delhi',
        phone: '+91 11 155370',
        emergency_phone: '112',
        is_verified: true,
        is_24_hours: false,
        source: 'verified_directory',
        distance_meters: 1200,
      },
      {
        id: 'fac-005',
        name: 'Apollo 24/7 Pharmacy Janakpuri',
        facility_type: 'pharmacy',
        lat: 28.6241,
        lng: 77.0799,
        address: 'Block B1, Janakpuri, New Delhi 110058',
        phone: '+91 11 2550 4422',
        emergency_phone: null,
        is_verified: true,
        is_24_hours: true,
        source: 'verified_directory',
        distance_meters: 1600,
      },
    ];

    facilitiesList.forEach((f) => this.facilities.set(f.id, f));

    // 6. Seed Community Reports
    const rep1: CommunityReport = {
      id: 'rep-001',
      user_id: priyaId,
      category: 'streetlight',
      lat: 28.626,
      lng: 77.065,
      address: 'Pankha Road crossing towards Vikaspuri',
      road_segment_id: 'seg-002',
      description: 'Multiple streetlights have been non-functional for 3 consecutive nights. Road is completely dark between 8 PM and 6 AM.',
      image_urls: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'],
      status: 'verified',
      verification_notes: 'Verified by MCD inspection team. Streetlight repair initiated.',
      verified_by: adminId,
      verified_at: new Date(Date.now() - 3600000 * 4),
      expires_at: new Date(Date.now() + 86400000 * 7),
      created_at: new Date(Date.now() - 3600000 * 24),
      updated_at: new Date(Date.now() - 3600000 * 4),
    };

    const rep2: CommunityReport = {
      id: 'rep-002',
      user_id: priyaId,
      category: 'isolation',
      lat: 28.619,
      lng: 77.045,
      address: 'Near Hastsal village service lane',
      road_segment_id: 'seg-003',
      description: 'Suspicious gathering near the culvert with no police PCR presence after 9 PM. Better to take the main road.',
      image_urls: [],
      status: 'pending',
      verification_notes: null,
      verified_by: null,
      verified_at: null,
      expires_at: new Date(Date.now() + 86400000 * 7),
      created_at: new Date(Date.now() - 3600000 * 2),
      updated_at: new Date(Date.now() - 3600000 * 2),
    };

    this.reports.set(rep1.id, rep1);
    this.reports.set(rep2.id, rep2);

    // 7. Seed Community Feed Posts
    const post1: CommunityPost = {
      id: 'post-001',
      user_id: priyaId,
      author_display_name: 'Priya S.',
      is_anonymous: false,
      title: 'Lighting restored near Uttam Nagar East Metro Pillar 650',
      content: 'Good news for commuters: MCD teams repaired 6 high-beam LED streetlights along the pavement leading to the metro gate today.',
      category: 'general_safety',
      lat: 28.621,
      lng: 77.061,
      area_name: 'Uttam Nagar East',
      likes_count: 24,
      comments_count: 5,
      is_pinned: true,
      created_at: new Date(Date.now() - 3600000 * 6),
      updated_at: new Date(Date.now() - 3600000 * 6),
    };

    const post2: CommunityPost = {
      id: 'post-002',
      user_id: rahulId,
      author_display_name: 'Rahul S.',
      is_anonymous: false,
      title: 'Police Pink Booth operational at District Centre Janakpuri',
      content: 'Delhi Police has active women officers deployed at the Pink Booth near Janakpuri West Gate 2 from 8 AM to 11 PM daily.',
      category: 'police_presence',
      lat: 28.6289,
      lng: 77.0789,
      area_name: 'Janakpuri West',
      likes_count: 42,
      comments_count: 8,
      is_pinned: false,
      created_at: new Date(Date.now() - 3600000 * 18),
      updated_at: new Date(Date.now() - 3600000 * 18),
    };

    this.posts.set(post1.id, post1);
    this.posts.set(post2.id, post2);

    // Initial audit history
    this.safetyHistory.push({
      id: 'hist-001',
      segmentId: 'seg-002',
      segmentName: 'Pankha Road',
      oldScore: 68.5,
      newScore: seg2Score,
      oldZone: 'B',
      newZone: 'B',
      reason: 'Verified community report rep-001 on non-functional streetlights',
      changedBy: 'Admin Moderator',
      changedAt: new Date(Date.now() - 3600000 * 4),
    });
  }

  // ─── Dynamic Score Recalculation Engine ───────────────────────
  public processReportVerification(reportId: string, action: 'verify' | 'reject', adminId: string, notes?: string): RoadSegmentData | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.status = action === 'verify' ? 'verified' : 'rejected';
    report.verified_by = adminId;
    report.verified_at = new Date();
    report.verification_notes = notes || (action === 'verify' ? 'Report verified by safety moderator.' : 'Report marked as unverified.');
    report.updated_at = new Date();

    if (action === 'verify' && report.road_segment_id) {
      const seg = this.segments.get(report.road_segment_id);
      if (seg) {
        const oldScore = seg.score;
        const oldZone = seg.zone;

        // Apply impact based on report category
        if (report.category === 'streetlight') {
          seg.indicators.streetlightScore = Math.max(10, seg.indicators.streetlightScore - 20);
        } else if (report.category === 'harassment' || report.category === 'isolation') {
          seg.indicators.incidentScore = Math.max(10, seg.indicators.incidentScore - 25);
          seg.indicators.communityScore = Math.max(10, seg.indicators.communityScore - 15);
        } else if (report.category === 'cctv') {
          seg.indicators.cctvScore = Math.max(10, seg.indicators.cctvScore - 20);
        }

        const newScore = calculateSafetyScore(seg.indicators);
        const newZone = classifyZone(newScore);

        seg.score = newScore;
        seg.zone = newZone;
        seg.updatedAt = new Date();

        this.safetyHistory.unshift({
          id: uuidv4(),
          segmentId: seg.id,
          segmentName: seg.name,
          oldScore,
          newScore,
          oldZone,
          newZone,
          reason: `Verified Report #${report.id.slice(0, 8)} (${report.category}): ${report.description.slice(0, 50)}...`,
          changedBy: 'Admin Moderator',
          changedAt: new Date(),
        });

        return seg;
      }
    }
    return null;
  }
}

export const store = new Store();
export default store;
