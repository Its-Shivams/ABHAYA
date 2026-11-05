import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-50',
  trend,
  trendLabel,
  loading,
}: StatCardProps) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg mb-1" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {trendLabel && <p className="text-xs text-gray-400 mt-0.5">{trendLabel}</p>}
      </div>
    </div>
  );
}
