// ============================================================
// d:\ABHAYA\backend\src\utils\safetyScoring.ts
// Safety scoring engine — weighted multi-factor analysis
// ============================================================

import { RouteWithScore, SafetyZone } from '../types';

// ─── Weights (must sum to 1.0) ────────────────────────────────
const WEIGHTS = {
  incident: 0.25,
  streetlight: 0.20,
  community: 0.15,
  publicActivity: 0.15,
  cctv: 0.10,
  police: 0.10,
  hospital: 0.05,
} as const;

// ─── Zone thresholds ──────────────────────────────────────────
const ZONE_A_MIN = 75; // Green — very safe
const ZONE_B_MIN = 45; // Yellow — moderate
// Below ZONE_B_MIN      // Red — unsafe (Zone C)

export interface SafetyParams {
  /** Historical incident density score (0=many incidents, 100=none) */
  incidentScore: number;
  /** Streetlight coverage score (0=dark, 100=fully lit) */
  streetlightScore: number;
  /** Community-reported safety rating (0=unsafe, 100=safe) */
  communityScore: number;
  /** Public activity / footfall score (0=deserted, 100=bustling) */
  publicActivityScore: number;
  /** CCTV coverage score (0=none, 100=full coverage) */
  cctvScore: number;
  /** Proximity to police station score (0=far, 100=nearby) */
  policeScore: number;
  /** Proximity to hospital / emergency services score */
  hospitalScore: number;
}

/**
 * Calculate composite safety score (0-100).
 * Higher score = safer.
 */
export function calculateSafetyScore(params: SafetyParams): number {
  const raw =
    params.incidentScore * WEIGHTS.incident +
    params.streetlightScore * WEIGHTS.streetlight +
    params.communityScore * WEIGHTS.community +
    params.publicActivityScore * WEIGHTS.publicActivity +
    params.cctvScore * WEIGHTS.cctv +
    params.policeScore * WEIGHTS.police +
    params.hospitalScore * WEIGHTS.hospital;

  // Clamp to [0, 100] and round to 1dp
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
}

/**
 * Classify score into safety zone.
 * A = 75–100 (Green / Safe)
 * B = 45–74  (Yellow / Caution)
 * C = 0–44   (Red / Unsafe)
 */
export function classifyZone(score: number): SafetyZone {
  if (score >= ZONE_A_MIN) return 'A';
  if (score >= ZONE_B_MIN) return 'B';
  return 'C';
}

export function getZoneLabel(zone: string): string {
  const labels: Record<string, string> = {
    A: 'Safe',
    B: 'Moderate Risk',
    C: 'High Risk',
  };
  return labels[zone] ?? 'Unknown';
}

export function getZoneColor(zone: string): string {
  const colors: Record<string, string> = {
    A: '#22C55E', // green-500
    B: '#F59E0B', // amber-500
    C: '#EF4444', // red-500
  };
  return colors[zone] ?? '#6B7280';
}

/**
 * Combined score: 70% safety, 30% time efficiency (inverted normalised).
 * timeScore: 0–100 where 100 = fastest.
 */
export function calculateCombinedScore(
  safetyScore: number,
  timeScore: number
): number {
  return Math.round((safetyScore * 0.7 + timeScore * 0.3) * 10) / 10;
}

/**
 * Normalise route durations to 0-100 time scores.
 * Shortest route gets 100.
 */
export function normaliseTimeScores(durations: number[]): number[] {
  if (durations.length === 0) return [];
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const range = maxDuration - minDuration;
  if (range === 0) return durations.map(() => 100);
  return durations.map(d => Math.round(((maxDuration - d) / range) * 100));
}

/**
 * Select the recommended route from a list (highest combined score).
 */
export function generateRouteRecommendation(
  routes: RouteWithScore[]
): RouteWithScore {
  if (routes.length === 0) {
    throw new Error('No routes provided to generateRouteRecommendation');
  }
  return routes.reduce((best, route) =>
    route.combined_score > best.combined_score ? route : best
  );
}

/**
 * Generate human-readable route recommendation text.
 */
export function getRecommendationText(
  safetyScore: number,
  zone: SafetyZone,
  isRecommended: boolean
): string {
  if (isRecommended) {
    if (zone === 'A') return '✅ Recommended — Safest route available';
    if (zone === 'B') return '⚠️ Recommended — Best balance of safety and time';
    return '🔴 Use caution — All available routes have elevated risk';
  }
  if (zone === 'A') return 'Safe route — slightly longer travel time';
  if (zone === 'B') return 'Moderate risk — consider alternative';
  return 'High risk — avoid if possible';
}

/**
 * Generate safety breakdown explanation for display.
 */
export function getSafetyBreakdownText(params: SafetyParams): string[] {
  const insights: string[] = [];
  if (params.incidentScore < 40) insights.push('⚠️ High incident history in this area');
  if (params.streetlightScore < 40) insights.push('⚠️ Poor street lighting');
  if (params.communityScore < 40) insights.push('⚠️ Negative community feedback');
  if (params.publicActivityScore < 30) insights.push('⚠️ Low foot traffic — isolated area');
  if (params.cctvScore < 30) insights.push('⚠️ Limited CCTV coverage');
  if (params.policeScore >= 70) insights.push('✅ Police station nearby');
  if (params.hospitalScore >= 70) insights.push('✅ Hospital / emergency services nearby');
  if (params.streetlightScore >= 70) insights.push('✅ Well-lit route');
  if (params.publicActivityScore >= 70) insights.push('✅ Active public area');
  if (insights.length === 0) insights.push('✅ Generally safe route');
  return insights;
}
