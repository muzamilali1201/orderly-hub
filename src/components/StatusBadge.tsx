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
    colorClass: 'text-status-ordered text-white',
    bgClass: 'bg-status-ordered/80 border-status-ordered/30',
    icon: Package,
  },
  REVIEWED: {
    label: 'Reviewed',
    colorClass: 'text-status-reviewed text-white',
    bgClass: 'bg-status-review-awaited/80 border-status-reviewed/30',
    icon: CheckCircle,
  },
  REVIEW_AWAITED: {
    label: 'Review Awaited',
    colorClass: 'text-status-review-awaited text-white',
    bgClass: 'bg-status-review-awaited/80 border-status-review-awaited/30',
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
    colorClass: 'text-status-refunded text-white',
    bgClass: 'bg-status-refunded/80 border-status-refunded/30',
    icon: RefreshCcw,
  },
  PAID: {
    label: 'Paid',
    colorClass: 'text-status-paid text-white',
    bgClass: 'bg-status-paid/80 border-status-paid/30',
    icon: DollarSign,
  },
  CANCELLED: {
    label: 'Cancelled',
    colorClass: 'text-status-cancelled text-white',
    bgClass: 'bg-status-cancelled/80 border-status-cancelled/30',
    icon: XCircle,
  },
  COMMISSION_COLLECTED: {
    label: 'Commission Collected',
    colorClass: 'text-status-paid text-white',
    bgClass: 'bg-status-paid/80 border-status-paid/30',
    icon: Coins,
  },
  REVIEW_DELAYED: {
    label: 'Review Delayed',
    colorClass: 'text-status-review-awaited',
    bgClass: 'bg-status-review-awaited/80 border-status-review-awaited/30',
    icon: AlertTriangle,
  },
  REFUND_DELAYED: {
    label: 'Refund Delayed',
    colorClass: 'text-white',
    bgClass: 'bg-status-refund-delayed/100 border-status-refund-delayed/30',
    icon: AlertTriangle,
  },
  SENT: {
    label: 'Sent',
    colorClass: 'text-status-sent text-white',
    bgClass: 'bg-status-sent/80 border-status-sent/30',
    icon: RefreshCcw,
  },
  SEND_TO_SELLER: {
    label: 'Send to Seller',
    colorClass: 'text-status-send-to-seller text-white',
    bgClass: 'bg-status-send-to-seller/80 border-status-send-to-seller/30',
    icon: RefreshCcw,
  },
  HOLD: {
    label: 'On Hold',
    colorClass: 'text-status-hold text-white',
    bgClass: 'bg-status-on-hold/80 border-status-on-hold/30',
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
