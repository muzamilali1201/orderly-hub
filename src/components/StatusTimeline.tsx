import { formatInTimeZone } from 'date-fns-tz';
import { StatusHistoryEntry, OrderStatus } from '@/types/order';
import { StatusBadge, statusConfig } from './StatusBadge';
import { cn } from '@/lib/utils';
import { ArrowRight, User, Shield } from 'lucide-react';

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

const PAKISTAN_TZ = 'Asia/Karachi';

export function StatusTimeline({ history }: StatusTimelineProps) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  const formatDate = (dateString: string) => {
    return formatInTimeZone(new Date(dateString), PAKISTAN_TZ, 'MMM d, yyyy');
  };

  const formatTime = (dateString: string) => {
    return formatInTimeZone(new Date(dateString), PAKISTAN_TZ, 'h:mm a');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-[hsl(250_70%_60%)]" />
        Status History
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-border to-border" />

        <div className="space-y-6">
          {sortedHistory.map((entry, index) => {
            const StatusIcon = statusConfig[entry.toStatus].icon;
            const isFirst = index === 0;

            return (
              <div
                key={entry.id}
                className={cn(
                  'relative flex gap-4 animate-slide-up',
                  isFirst && 'opacity-100'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    'relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300',
                    isFirst
                      ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20'
                      : 'bg-card border-border'
                  )}
                >
                  <StatusIcon
                    className={cn(
                      'w-5 h-5',
                      isFirst ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'flex-1 rounded-xl p-4 transition-all duration-200',
                    isFirst
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-card border border-border hover:border-primary/30'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {entry.fromStatus && (
                      <>
                        <StatusBadge status={entry.fromStatus} size="sm" />
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </>
                    )}
                    <StatusBadge status={entry.toStatus} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {entry.changedBy.role === 'admin' ? (
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      <span className="font-medium text-foreground">
                        {entry.changedBy.username}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-xs capitalize',
                          entry.changedBy.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {entry.changedBy.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatDate(entry.changedAt)}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{formatTime(entry.changedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
