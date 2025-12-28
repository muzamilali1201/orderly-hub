import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/order';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Edit, 
  RefreshCcw, 
  DollarSign, 
  XCircle,
  Coins,
  AlertTriangle
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<OrderStatus, { 
  label: string; 
  colorClass: string; 
  bgClass: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  ORDERED: {
    label: 'Ordered',
    colorClass: 'text-status-ordered',
    bgClass: 'bg-status-ordered/15 border-status-ordered/30',
    icon: Package,
  },
  REVIEWED: {
    label: 'Reviewed',
    colorClass: 'text-status-reviewed',
    bgClass: 'bg-status-reviewed/15 border-status-reviewed/30',
    icon: CheckCircle,
  },
  REVIEW_AWAITED: {
    label: 'Review Awaited',
    colorClass: 'text-status-review-awaited',
    bgClass: 'bg-status-review-awaited/15 border-status-review-awaited/30',
    icon: Clock,
  },
  CORRECTED: {
    label: 'Corrected',
    colorClass: 'text-status-corrected',
    bgClass: 'bg-status-corrected/15 border-status-corrected/30',
    icon: Edit,
  },
  REFUNDED: {
    label: 'Refunded',
    colorClass: 'text-status-refunded',
    bgClass: 'bg-status-refunded/15 border-status-refunded/30',
    icon: RefreshCcw,
  },
  PAID: {
    label: 'Paid',
    colorClass: 'text-status-paid',
    bgClass: 'bg-status-paid/15 border-status-paid/30',
    icon: DollarSign,
  },
  CANCELLED: {
    label: 'Cancelled',
    colorClass: 'text-status-cancelled',
    bgClass: 'bg-status-cancelled/15 border-status-cancelled/30',
    icon: XCircle,
  },
  COMISSION_COLLECTED: {
    label: 'Commission Collected',
    colorClass: 'text-status-paid',
    bgClass: 'bg-status-paid/15 border-status-paid/30',
    icon: Coins,
  },
  REVIEW_DELAYED: {
    label: 'Review Delayed',
    colorClass: 'text-status-review-awaited',
    bgClass: 'bg-status-review-awaited/15 border-status-review-awaited/30',
    icon: AlertTriangle,
  },
  REFUND_DELAYED: {
    label: 'Refund Delayed',
    colorClass: 'text-status-refunded',
    bgClass: 'bg-status-refunded/15 border-status-refunded/30',
    icon: AlertTriangle,
  },
  SENT: {
    label: 'Sent',
    colorClass: 'text-status-sent',
    bgClass: 'bg-status-sent/15 border-status-sent/30',
    icon: RefreshCcw,
  },
  SEND_TO_SELLER: {
    label: 'Send to Seller',
    colorClass: 'text-status-send-to-seller',
    bgClass: 'bg-status-refunded/15 border-status-send-to-seller/30',
    icon: RefreshCcw,
  },
  HOLD: {
    label: 'Hold',
    colorClass: 'text-status-hold',
    bgClass: 'bg-status-review-awaited/15 border-status-hold/30',
    icon: AlertTriangle,
  }
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/15 border-muted/30',
    icon: Package,
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        config.colorClass,
        config.bgClass,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}

export { statusConfig };
