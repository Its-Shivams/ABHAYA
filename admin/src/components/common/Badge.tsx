interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  under_verification: 'bg-blue-50 text-blue-700 border-blue-200',
  verified: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-orange-50 text-orange-700 border-orange-200',
  removed: 'bg-red-50 text-red-700 border-red-200',
  flagged: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  resolved: 'bg-blue-50 text-blue-700 border-blue-200',
  false_alarm: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusText: Record<string, string> = {
  pending: 'Pending',
  under_verification: 'Under Verification',
  verified: 'Verified',
  rejected: 'Rejected',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  removed: 'Removed',
  flagged: 'Flagged',
  resolved: 'Resolved',
  false_alarm: 'False Alarm',
};

export default function Badge({ status, size = 'sm' }: BadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const label = statusText[status] ?? status;
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${style}`}>
      {label}
    </span>
  );
}
