import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders } from '@/data/mockOrders';
import { StatsCard } from '@/components/StatsCard';
import { OrdersTable } from '@/components/OrdersTable';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  PlusCircle,
  X,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { CANCELLED } from 'dns';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch overall stats from API (preferred), fall back to local mock calculations
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['overall-orders'],
    queryFn: async () => {
      const res = await import('@/lib/api').then((m) => m.getOverallOrders());
      return res.data?.data ?? res.data;
    },
  });

  useEffect(() => {
    if (statsError) {
      toast({ title: 'Failed to load stats', description: (statsError as any)?.message || 'Unable to load stats', variant: 'destructive' });
    }
  }, [statsError, toast]);

  // Filter orders based on user role (local fallback)
  const visibleOrders = mockOrders;

  // Fetch recent orders (first page, 10 per page) to show live listing in Recent Orders
  const { data: recentData, isLoading: recentLoading, error: recentError } = useQuery({
    queryKey: ['orders', { page: 1, perPage: 10 }],
    queryFn: async () => {
      const res = await import('@/lib/api').then((m) => m.getOrders({ page: 1, perPage: 10 }));
      return res.data?.data ?? res.data;
    },
  });

  useEffect(() => {
    if (recentError) {
      toast({ title: 'Failed to load recent orders', description: (recentError as any)?.message || 'Unable to fetch orders', variant: 'destructive' });
    }
  }, [recentError, toast]);


  // Normalize and prefer server stats (handle multiple possible response shapes)
  const server = statsData ?? {};

  // Helper to safely convert to number
  const toNumber = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // Map of canonical buckets to statuses
  const PENDING_STATUSES = ['ORDERED', 'REVIEW_AWAITED'];
  const REVIEWED_STATUSES = ['REVIEWED', 'CORRECTED'];
  const COMPLETED_STATUSES = ['PAID', 'REFUNDED'];

  const humanizeStatus = (s: string) => {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Default computed values (from mock data)
 let totalOrders = visibleOrders.length;
let statusCounts: Record<string, number> = {};

// Case 1: Backend returns array [{ status, count }]
if (Array.isArray(server)) {
  statusCounts = server.reduce(
    (acc: Record<string, number>, item: any) => {
      const key = String(item.status ?? '').toUpperCase().trim();
      acc[key] = (acc[key] ?? 0) + toNumber(item.count ?? 0, 0);
      return acc;
    },
    {}
  );
}

// Case 2: Backend returns object-shaped response
else if ((server as any)?.statusCounts) {
  statusCounts = Object.entries(
    (server as any).statusCounts
  ).reduce((acc, [key, value]) => {
    acc[key.toUpperCase()] = toNumber(value, 0);
    return acc;
  }, {} as Record<string, number>);
}

const STATUS_META: Record<string, { icon: any; color: string }> = {
  ORDERED: { icon: Clock, color: 'text-status-review-awaited' },
  REVIEWED: { icon: CheckCircle, color: 'text-status-reviewed' },
  CORRECTED: { icon: CheckCircle, color: 'text-status-reviewed' },
  PAID: { icon: DollarSign, color: 'text-status-paid' },
  REFUNDED: { icon: DollarSign, color: 'text-status-paid' },
  REVIEW_AWAITED: { icon: Clock, color: 'text-status-review-awaited' },
  REFUND_DELAYED: { icon: Clock, color: 'text-status-review-awaited' },
  COMISSION_COLLECTED: { icon: Clock, color: 'text-status-review-awaited' },
  CANCELLED: { icon: X, color: 'text-status-cancelled' },
  REFUNDED : { icon: DollarSign, color: 'text-status-paid' },


};

  // Build readable subtitles that include the original status names (humanized)
  const pendingNames = ((statsData && (statsData.__pendingDisplay ?? PENDING_STATUSES)) || PENDING_STATUSES).map(humanizeStatus).join(', ');
  const reviewedNames = ((statsData && (statsData.__reviewedDisplay ?? REVIEWED_STATUSES)) || REVIEWED_STATUSES).map(humanizeStatus).join(', ');
  const completedNames = ((statsData && (statsData.__completedDisplay ?? COMPLETED_STATUSES)) || COMPLETED_STATUSES).map(humanizeStatus).join(', ');

  // Map API orders (if present) into the app's Order shape and pick first 10
  const mapApiOrder = (o: any) => ({
    id: o._id ?? o.id,
    orderName: o.orderName ?? o.title ?? 'Untitled',
    amazonOrderNumber: o.amazonOrderNo ?? o.amazonOrderNumber ?? '',
    buyerPaypal: o.buyerPaypal ?? '',
    status: o.status,
    comments: o.comments,
    screenshots: [o.OrderSS, o.AmazonProductSS].filter(Boolean),
    createdBy: {
      id: o.userId?._id ?? o.userId?.id ?? o.createdBy?.id,
      username: o.userId?.username ?? o.createdBy?.username ?? 'unknown',
      email: o.userId?.email ?? o.createdBy?.email ?? '',
    },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    statusHistory: o.statusHistory ?? [],
  });

  // Prefer API data for the Recent Orders listing; fall back to local mockOrders if absent
let recentOrders = visibleOrders.slice(0, 10);

const totalFromApi =
  Array.isArray(statsData)
    ? statsData.find((i) => i.status === 'TOTAL')?.count ?? 0
    : 0;

if (Array.isArray(recentData)) {
  const mapped = recentData.map(mapApiOrder);
  recentOrders = mapped.slice(0, 10);
}

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back, {user?.username}
            </p>
          </div>
          {!isAdmin && (
            <Button variant="hero" onClick={() => navigate('/orders/new')}>
              <PlusCircle className="w-4 h-4" />
              New Order
            </Button>
          )}
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Always show total */}
          <StatsCard
            title="Total Orders"
            value={totalFromApi}
            subtitle={'All orders'}
            icon={Package}
            // trend={{ value: 12, isPositive: true }}
            isLoading={statsLoading}
          />

          {/* If server returns an array of status counts, render each status as its own card */}
          {Array.isArray(statsData) ? (
            (() => {
              const entries = (statsData as any[])
                .filter((i) => !/total/i.test(String(i.status ?? '')))
                .map((i) => ({ key: String(i.status ?? '').toUpperCase().trim(), count: toNumber(i.count ?? 0, 0) }))
                .sort((a, b) => b.count - a.count);

              const iconFor = (statusKey: string) => {
                switch (statusKey) {
                  case 'ORDERED':
                    return Package;
                  case 'REVIEW_AWAITED':
                    return Clock;
                  case 'ORDERED_AWAITING':
                    return Clock;
                  case 'REVIEWED':
                  case 'CORRECTED':
                    return CheckCircle;
                  case 'PAID':
                  case 'REFUNDED':
                    return DollarSign;
                  case 'CANCELLED':
                    return XCircle;
                  case 'REFUND_DELAYED':
                    return Clock;
                  case 'COMISSION_COLLECTED' : 
                    return TrendingUp;
                  default:
                    return Package;
                }
              };

              const colorFor = (statusKey: string) => {
                switch (statusKey) {
                  case 'REVIEWED':
                    return 'text-status-reviewed';
                  case 'CORRECTED':
                    return 'text-status-reviewed';
                  case 'PAID':
                  case 'REFUNDED':
                    return 'text-status-paid';
                  case 'ORDERED':
                  case 'REVIEW_AWAITED':
                    return 'text-status-review-awaited';
                  case 'CANCELLED':
                    return 'text-status-cancelled';
                  case 'REFUND_DELAYED':
                    return 'text-status-refund-delayed';
                  case 'COMISSION_COLLECTED':
                    return 'text-status-comission-collected';
                  case 'REVIEW_DELAYED':
                    return 'text-status-review-delayed';
                  default:
                    return 'text-primary';
                }
              };

              return entries.map((e) => (
                <StatsCard
                  key={e.key}
                  title={humanizeStatus(e.key)}
                  value={e.count}
                  subtitle={humanizeStatus(e.key)}
                  icon={iconFor(e.key)}
                  colorClass={colorFor(e.key)}
                  isLoading={statsLoading}
                />
              ));
            })()
          ) : (
            // Fallback to existing grouped cards when server shape isn't the array
            <>
  {Object.entries(statusCounts).map(([status, count]) => {
    const meta = STATUS_META[status] ?? {
      icon: Package,
      color: 'text-primary',
    };

    return (
      <StatsCard
        key={status}
        title={humanizeStatus(status)}
        value={count}
        subtitle={humanizeStatus(status)}
        icon={meta.icon}
        colorClass={meta.color}
        isLoading={statsLoading}
      />
    );
  })}
</>

          )}
        </section>

        {/* Recent Orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
              View All
              <TrendingUp className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <OrdersTable orders={recentOrders} isAdmin={isAdmin} showFilters={false} />
        </section>
      </main>
    </div>
  );
}
