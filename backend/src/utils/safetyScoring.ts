// ============================================================
// d:\ABHAYA\backend\src\utils\safetyScoring.ts
// Eight-Factor Safety Intelligence & Data Confidence Scoring Engine
// Configurable Weights & Uncertainty Modeling
// ============================================================

import { SafetyZone } from '../types';

// ─── Configurable 8-Factor Weights (Must sum to 1.0) ──────────
export interface SafetyWeights {
  incident: number;        // 20% Incident-free record
  streetlight: number;     // 15% Streetlight illumination
  publicActivity: number;  // 15% Public activity and footfall
  cctv: number;            // 10% CCTV coverage
  police: number;          // 10% Police proximity and accessibility
  hospital: number;        // 5%  Hospital accessibility
  community: number;       // 10% Verified community reports
  mobileNetwork: number;   // 15% Mobile network & cellular availability
}

export const DEFAULT_WEIGHTS: SafetyWeights = {
  incident: 0.20,
  streetlight: 0.15,
  publicActivity: 0.15,
  cctv: 0.10,
  police: 0.10,
  hospital: 0.05,
  community: 0.10,
  mobileNetwork: 0.15,
};

// ─── Configurable Zone Thresholds ─────────────────────────────
export const ZONE_THRESHOLDS = {
  ZONE_A_MIN: 75, // 75–100: Safe (Zone A)
  ZONE_B_MIN: 45, // 45–74: Moderate Caution (Zone B)
  // 0–44: High Risk (Zone C)
};

export interface SafetyParams {
  incidentScore: number;
  streetlightScore: number;
  publicActivityScore: number;
  cctvScore: number;
  policeScore: number;
  hospitalScore: number;
  communityScore: number;
  mobileNetworkScore?: number | null; // 0–100 scale or null/undefined if unknown
}

export interface FactorDetail {
  score: number | null;
  weight: number;
  isKnown: boolean;
  label: string;
  reasons: string;
}

export interface SafetyEvaluation {
  score: number;
  dataConfidence: number; // 0–100%
  zone: SafetyZone;
  zoneLabel: string;
  zoneColor: string;
  unknownFactors: string[];
  breakdown: {
    incident: FactorDetail;
    streetlight: FactorDetail;
    publicActivity: FactorDetail;
    cctv: FactorDetail;
    police: FactorDetail;
    hospital: FactorDetail;
    community: FactorDetail;
    mobileNetwork: FactorDetail;
  };
}

/**
 * Evaluates road safety across the 8-factor model with uncertainty modeling.
 */
export function evaluateSafety(
  params: SafetyParams,
  weights: SafetyWeights = DEFAULT_WEIGHTS
): SafetyEvaluation {
  const unknownFactors: string[] = [];
  let totalKnownWeight = 0;
  let weightedScoreSum = 0;

  // 1. Incident Score (20%)
  const incidentScore = Math.max(0, Math.min(100, params.incidentScore ?? 75));
  weightedScoreSum += incidentScore * weights.incident;
  totalKnownWeight += weights.incident;

  // 2. Streetlight Illumination (15%)
  const streetlightScore = Math.max(0, Math.min(100, params.streetlightScore ?? 70));
  weightedScoreSum += streetlightScore * weights.streetlight;
  totalKnownWeight += weights.streetlight;

  // 3. Public Activity & Footfall (15%)
  const publicActivityScore = Math.max(0, Math.min(100, params.publicActivityScore ?? 70));
  weightedScoreSum += publicActivityScore * weights.publicActivity;
  totalKnownWeight += weights.publicActivity;

  // 4. CCTV Coverage (10%)
  const cctvScore = Math.max(0, Math.min(100, params.cctvScore ?? 65));
  weightedScoreSum += cctvScore * weights.cctv;
  totalKnownWeight += weights.cctv;

  // 5. Police Proximity & Patrols (10%)
  const policeScore = Math.max(0, Math.min(100, params.policeScore ?? 75));
  weightedScoreSum += policeScore * weights.police;
  totalKnownWeight += weights.police;

  // 6. Hospital & Medical Access (5%)
  const hospitalScore = Math.max(0, Math.min(100, params.hospitalScore ?? 70));
  weightedScoreSum += hospitalScore * weights.hospital;
  totalKnownWeight += weights.hospital;

  // 7. Verified Community Reports (10%)
  const communityScore = Math.max(0, Math.min(100, params.communityScore ?? 80));
  weightedScoreSum += communityScore * weights.community;
  totalKnownWeight += weights.community;

  // 8. Mobile Network Availability (15%)
  const isNetworkKnown = params.mobileNetworkScore !== null && params.mobileNetworkScore !== undefined;
  let networkScore: number | null = null;
  if (isNetworkKnown) {
    networkScore = Math.max(0, Math.min(100, params.mobileNetworkScore as number));
    weightedScoreSum += networkScore * weights.mobileNetwork;
    totalKnownWeight += weights.mobileNetwork;
  } else {
    unknownFactors.push('Mobile network availability');
  }

  // Calculate normalized score based on known data (does not award 100% or zero risk for unknown)
  const normalizedScore = totalKnownWeight > 0 ? weightedScoreSum / totalKnownWeight : 50;
  const finalScore = Math.round(normalizedScore * 10) / 10;

  // Data Confidence Calculation: proportion of known weights, with penalty for missing indicators
  const dataConfidence = Math.round(totalKnownWeight * 100);

  const zone = classifyZone(finalScore);

  return {
    score: finalScore,
    dataConfidence,
    zone,
    zoneLabel: getZoneLabel(zone),
    zoneColor: getZoneColor(zone),
    unknownFactors,
    breakdown: {
      incident: {
        score: incidentScore,
        weight: weights.incident,
        isKnown: true,
        label: 'Incident-Free Record',
        reasons: incidentScore >= 75 ? 'Low historical incident frequency' : 'Moderate incident history in vicinity',
      },
      streetlight: {
        score: streetlightScore,
        weight: weights.streetlight,
        isKnown: true,
        label: 'Streetlight Illumination',
        reasons: streetlightScore >= 75 ? 'Continuous municipal street lighting' : 'Intermittent or dim lighting patches reported',
      },
      publicActivity: {
        score: publicActivityScore,
        weight: weights.publicActivity,
        isKnown: true,
        label: 'Public Activity & Footfall',
        reasons: publicActivityScore >= 75 ? 'High footfall & open commercial establishments' : 'Low pedestrian density after late hours',
      },
      cctv: {
        score: cctvScore,
        weight: weights.cctv,
        isKnown: true,
        label: 'CCTV Surveillance',
        reasons: cctvScore >= 70 ? 'CCTV monitoring on main corridors' : 'Limited public CCTV cameras',
      },
      police: {
        score: policeScore,
        weight: weights.police,
        isKnown: true,
        label: 'Police Proximity',
        reasons: policeScore >= 75 ? 'Close to police station / Pink Booth patrol' : 'Moderate response radius for law enforcement',
      },
      hospital: {
        score: hospitalScore,
        weight: weights.hospital,
        isKnown: true,
        label: 'Hospital Accessibility',
        reasons: hospitalScore >= 70 ? 'Emergency care & hospital within 1.5 km' : 'Hospital facility further than 3 km',
      },
      community: {
        score: communityScore,
        weight: weights.community,
        isKnown: true,
        label: 'Verified Community Reports',
        reasons: communityScore >= 75 ? 'Positive community sentiment & verified reports' : 'Unresolved safety hazard reports flagged',
      },
      mobileNetwork: {
        score: networkScore,
        weight: weights.mobileNetwork,
        isKnown: isNetworkKnown,
        label: 'Mobile Network Availability',
        reasons: isNetworkKnown
          ? (networkScore! >= 75 ? 'Strong cellular & data signal (4G/5G)' : 'Weak cellular signal / spotty connectivity')
          : 'Cellular network coverage data unverified for this segment',
      },
    },
  };
}

/**
 * Backward compatibility helper
 */
export function calculateSafetyScore(params: SafetyParams): number {
  return evaluateSafety(params).score;
}

export function classifyZone(score: number): SafetyZone {
  if (score >= ZONE_THRESHOLDS.ZONE_A_MIN) return 'A';
  if (score >= ZONE_THRESHOLDS.ZONE_B_MIN) return 'B';
  return 'C';
}

export function getZoneLabel(zone: string): string {
  const labels: Record<string, string> = {
    A: 'Safe Corridor (Zone A)',
    B: 'Moderate Caution (Zone B)',
    C: 'Elevated Risk (Zone C)',
  };
  return labels[zone] ?? 'Evaluated Corridor';
}

export function getZoneColor(zone: string): string {
  const colors: Record<string, string> = {
    A: '#16A34A', // safe green
    B: '#F59E0B', // warning amber
    C: '#DC2626', // emergency red
  };
  return colors[zone] ?? '#8B5CF6';
}

/**
 * Balanced route cost function:
 * cost = (1 - safety) * 0.6 + (timeNormalized) * 0.3 + (1 - confidence) * 0.1
 */
export function calculateRouteCost(
  safetyScore: number,
  durationMinutes: number,
  confidencePercent: number
): number {
  const safetyPenalty = (100 - safetyScore) / 100;
  const timePenalty = Math.min(1, durationMinutes / 60);
  const uncertaintyPenalty = (100 - confidencePercent) / 100;

  return Math.round((safetyPenalty * 0.6 + timePenalty * 0.3 + uncertaintyPenalty * 0.1) * 100) / 100;
}

export function calculateCombinedScore(safetyScore: number, timeScore: number): number {
  return Math.round((safetyScore * 0.7 + timeScore * 0.3) * 10) / 10;
}

export function normaliseTimeScores(durationsSeconds: number[]): number[] {
  if (durationsSeconds.length === 0) return [];
  const minDur = Math.min(...durationsSeconds);
  const maxDur = Math.max(...durationsSeconds);
  if (minDur === maxDur) return durationsSeconds.map(() => 80);
  return durationsSeconds.map((d) => Math.round((1 - (d - minDur) / (maxDur - minDur)) * 60 + 40));
}

export function getRecommendationText(
  safetyScoreOrZone: number | SafetyZone,
  zoneOrIsRecommended?: SafetyZone | boolean,
  isRecommendedFlag?: boolean
): string {
  const zone = typeof safetyScoreOrZone === 'string' ? safetyScoreOrZone : ((typeof zoneOrIsRecommended === 'string' ? zoneOrIsRecommended : 'B') as SafetyZone);
  const isRecommended = typeof zoneOrIsRecommended === 'boolean' ? zoneOrIsRecommended : (isRecommendedFlag ?? false);

  if (isRecommended && zone === 'A') {
    return 'Recommended safer route based on available data with strong lighting, high footfall and active patrols.';
  }
  if (zone === 'B') {
    return 'Faster option with moderate risk; caution advised in less illuminated stretches.';
  }
  return 'Higher risk corridor; avoid during late night hours.';
}

