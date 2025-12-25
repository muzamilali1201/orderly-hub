import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorClass = 'text-primary',
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-status-paid' : 'text-status-refunded'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}% from last week
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
            'bg-gradient-to-br from-primary/10 to-primary/5'
          )}
        >
          <Icon className={cn('w-6 h-6', colorClass)} />
        </div>
      </div>
    </div>
  );
}
