// ============================================================
// d:\ABHAYA\backend\src\services\safetyService.ts
// Safety score calculation, recalculation, and area queries
// ============================================================

import { query, withTransaction } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import {
  calculateSafetyScore,
  classifyZone,
  SafetyParams,
} from '../utils/safetyScoring';
import { DEMO_AREA_PROFILES } from '../utils/demoData';
import { v4 as uuidv4 } from 'uuid';

// ─── Recalculate safety score for a road segment ─────────────
export async function recalculateSegmentScore(segmentId: string): Promise<number | null> {
  try {
    // Fetch current indicators for segment
    const result = await query<{
      incident_score: number;
      streetlight_score: number;
      community_score: number;
      public_activity_score: number;
      cctv_score: number;
      police_score: number;
      hospital_score: number;
    }>(
      `SELECT
         COALESCE(incident_score, 50)       AS incident_score,
         COALESCE(streetlight_score, 50)    AS streetlight_score,
         COALESCE(community_score, 50)      AS community_score,
         COALESCE(public_activity_score, 50) AS public_activity_score,
         COALESCE(cctv_score, 50)           AS cctv_score,
         COALESCE(police_score, 50)         AS police_score,
         COALESCE(hospital_score, 50)       AS hospital_score
       FROM road_segments
       WHERE id = $1`,
      [segmentId]
    );

    if (result.rows.length === 0) {
      console.warn(`[Safety] Segment ${segmentId} not found`);
      return null;
    }

    const params: SafetyParams = {
      incidentScore: result.rows[0].incident_score,
      streetlightScore: result.rows[0].streetlight_score,
      communityScore: result.rows[0].community_score,
      publicActivityScore: result.rows[0].public_activity_score,
      cctvScore: result.rows[0].cctv_score,
      policeScore: result.rows[0].police_score,
      hospitalScore: result.rows[0].hospital_score,
    };

    const score = calculateSafetyScore(params);
    const zone = classifyZone(score);

    await withTransaction(async (client) => {
      // Upsert safety score
      await client.query(
        `INSERT INTO safety_scores
           (id, segment_id, score, zone, incident_score, streetlight_score,
            community_score, public_activity_score, cctv_score, police_score,
            hospital_score, computed_at, valid_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW() + INTERVAL '24 hours')
         ON CONFLICT (segment_id) DO UPDATE SET
           score = EXCLUDED.score,
           zone = EXCLUDED.zone,
           incident_score = EXCLUDED.incident_score,
           streetlight_score = EXCLUDED.streetlight_score,
           community_score = EXCLUDED.community_score,
           public_activity_score = EXCLUDED.public_activity_score,
           cctv_score = EXCLUDED.cctv_score,
           police_score = EXCLUDED.police_score,
           hospital_score = EXCLUDED.hospital_score,
           computed_at = NOW(),
           valid_until = NOW() + INTERVAL '24 hours'`,
        [
          uuidv4(), segmentId, score, zone,
          params.incidentScore, params.streetlightScore,
          params.communityScore, params.publicActivityScore,
          params.cctvScore, params.policeScore, params.hospitalScore,
        ]
      );

      // Append to history
      await client.query(
        `INSERT INTO safety_score_history
           (id, segment_id, score, zone, change_reason, computed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), segmentId, score, zone, 'recalculation']
      );
    });

    // Invalidate cache
    await cacheSet(`safety:segment:${segmentId}`, JSON.stringify({ score, zone }), 3600);

    console.log(`✅ [Safety] Segment ${segmentId} score updated: ${score} (Zone ${zone})`);
    return score;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [Safety] recalculateSegmentScore failed: ${msg}`);
    return null;
  }
}

// ─── Process a verified community report ─────────────────────
export async function processVerifiedReport(reportId: string): Promise<void> {
  try {
    const result = await query<{
      lat: number;
      lng: number;
      category: string;
      severity: number;
    }>(
      `SELECT lat, lng, category, severity FROM community_reports WHERE id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) return;

    const { lat, lng, category, severity } = result.rows[0];

    // Find nearby segment within 200m
    const segResult = await query<{ id: string }>(
      `SELECT id FROM road_segments
       WHERE ST_DWithin(
         geom,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         200
       )
       ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
       LIMIT 1`,
      [lng, lat]
    );

    if (segResult.rows.length === 0) {
      console.warn(`[Safety] No road segment found near report ${reportId}`);
      return;
    }

    const segmentId = segResult.rows[0].id;

    // Adjust incident score based on report category and severity
    const impactMap: Record<string, number> = {
      harassment: -15,
      assault: -25,
      poor_lighting: -10,
      unsafe_road: -8,
      suspicious_activity: -12,
      theft: -20,
      other: -5,
    };

    const impact = (impactMap[category] ?? -5) * (severity / 3);

    await query(
      `UPDATE road_segments
       SET incident_score = GREATEST(0, LEAST(100, incident_score + $1)),
           updated_at = NOW()
       WHERE id = $2`,
      [impact, segmentId]
    );

    await recalculateSegmentScore(segmentId);

    console.log(
      `✅ [Safety] Processed report ${reportId} → segment ${segmentId} adjusted by ${impact}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [Safety] processVerifiedReport failed: ${msg}`);
  }
}

// ─── Get area safety level ────────────────────────────────────
export async function getAreaSafetyLevel(
  lat: number,
  lng: number,
  radiusMeters = 500
): Promise<{ score: number; zone: string; segmentCount: number } | null> {
  try {
    // Check cache
    const cacheKey = `safety:area:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMeters}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await query<{ avg_score: number; count: number }>(
      `SELECT
         AVG(ss.score)::numeric(5,2) AS avg_score,
         COUNT(*) AS count
       FROM safety_scores ss
       JOIN road_segments rs ON rs.id = ss.segment_id
       WHERE ST_DWithin(
         rs.geom,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3
       )`,
      [lng, lat, radiusMeters]
    );

    if (result.rows.length === 0 || result.rows[0].count === 0) {
      // Use demo data
      return getDemoAreaSafety(lat, lng);
    }

    const score = Number(result.rows[0].avg_score);
    const zone = classifyZone(score);
    const data = { score, zone, segmentCount: Number(result.rows[0].count) };

    await cacheSet(cacheKey, JSON.stringify(data), 1800);
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Safety] getAreaSafetyLevel failed: ${msg}`);
    return getDemoAreaSafety(lat, lng);
  }
}

// ─── Demo safety assessment ───────────────────────────────────
function getDemoAreaSafety(
  _lat: number,
  _lng: number
): { score: number; zone: string; segmentCount: number } {
  // Pick random demo profile for demonstration
  const profiles = Object.values(DEMO_AREA_PROFILES);
  const profile = profiles[Math.floor(Math.random() * profiles.length)];
  const score = calculateSafetyScore({
    incidentScore: profile.incidentScore,
    streetlightScore: profile.streetlightScore,
    communityScore: profile.communityScore,
    publicActivityScore: profile.publicActivityScore,
    cctvScore: profile.cctvScore,
    policeScore: profile.policeScore,
    hospitalScore: profile.hospitalScore,
  });
  return { score, zone: classifyZone(score), segmentCount: 0 };
}

export async function getDemoSafetyForRoute(
  _routePolyline: string
): Promise<SafetyParams> {
  // Return a moderate demo safety profile
  const profile = DEMO_AREA_PROFILES['vikaspuri_main'];
  return {
    incidentScore: profile.incidentScore,
    streetlightScore: profile.streetlightScore,
    communityScore: profile.communityScore,
    publicActivityScore: profile.publicActivityScore,
    cctvScore: profile.cctvScore,
    policeScore: profile.policeScore,
    hospitalScore: profile.hospitalScore,
  };
}

// ─── Get segment safety score (with cache) ───────────────────
export async function getSegmentSafety(segmentId: string): Promise<{
  score: number;
  zone: string;
  breakdown: Partial<SafetyParams>;
} | null> {
  const cacheKey = `safety:segment:${segmentId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const result = await query<{
      score: number;
      zone: string;
      incident_score: number;
      streetlight_score: number;
      community_score: number;
      public_activity_score: number;
      cctv_score: number;
      police_score: number;
      hospital_score: number;
    }>(
      `SELECT score, zone, incident_score, streetlight_score, community_score,
              public_activity_score, cctv_score, police_score, hospital_score
       FROM safety_scores WHERE segment_id = $1
       ORDER BY computed_at DESC LIMIT 1`,
      [segmentId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const data = {
      score: row.score,
      zone: row.zone,
      breakdown: {
        incidentScore: row.incident_score,
        streetlightScore: row.streetlight_score,
        communityScore: row.community_score,
        publicActivityScore: row.public_activity_score,
        cctvScore: row.cctv_score,
        policeScore: row.police_score,
        hospitalScore: row.hospital_score,
      },
    };

    await cacheSet(cacheKey, JSON.stringify(data), 3600);
    return data;
  } catch {
    return null;
  }
}
