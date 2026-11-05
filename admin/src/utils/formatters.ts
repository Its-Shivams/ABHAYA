import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { ReportStatus, ReportCategory, SafetyZone, UserStatus, PostStatus } from '../types';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function statusLabel(status: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    pending: 'Pending',
    under_verification: 'Under Verification',
    verified: 'Verified',
    rejected: 'Rejected',
  };
  return map[status] ?? status;
}

export function userStatusLabel(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  };
  return map[status] ?? status;
}

export function postStatusLabel(status: PostStatus): string {
  const map: Record<PostStatus, string> = {
    active: 'Active',
    removed: 'Removed',
    flagged: 'Flagged',
  };
  return map[status] ?? status;
}

export function categoryLabel(cat: ReportCategory): string {
  const map: Record<ReportCategory, string> = {
    harassment: 'Harassment',
    poor_lighting: 'Poor Lighting',
    unsafe_road: 'Unsafe Road',
    suspicious_activity: 'Suspicious Activity',
    infrastructure: 'Infrastructure',
    other: 'Other',
  };
  return map[cat] ?? cat;
}

export function zoneColorClass(zone: SafetyZone): string {
  const map: Record<SafetyZone, string> = {
    A: 'text-zoneA bg-green-50 border-green-200',
    B: 'text-zoneB bg-yellow-50 border-yellow-200',
    C: 'text-zoneC bg-red-50 border-red-200',
  };
  return map[zone] ?? '';
}

export function zoneBgColor(zone: SafetyZone): string {
  const map: Record<SafetyZone, string> = {
    A: '#2E9D64',
    B: '#E5A000',
    C: '#D93636',
  };
  return map[zone] ?? '#888';
}

export function scoreToZone(score: number): SafetyZone {
  if (score >= 75) return 'A';
  if (score >= 45) return 'B';
  return 'C';
}

export function truncate(str: string, len = 60): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
