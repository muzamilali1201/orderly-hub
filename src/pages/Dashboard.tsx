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
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Filter orders based on user role
  const visibleOrders = isAdmin 
    ? mockOrders 
    : mockOrders.filter(order => order.createdBy.id === user?.id);

  // Calculate stats
  const totalOrders = visibleOrders.length;
  const pendingOrders = visibleOrders.filter(o => 
    ['ORDERED', 'REVIEW_AWAITED'].includes(o.status)
  ).length;
  const completedOrders = visibleOrders.filter(o => 
    ['PAID', 'REFUNDED'].includes(o.status)
  ).length;
  const reviewedOrders = visibleOrders.filter(o => 
    ['REVIEWED', 'CORRECTED'].includes(o.status)
  ).length;

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
          <StatsCard
            title="Total Orders"
            value={totalOrders}
            subtitle={isAdmin ? "All orders" : "Your orders"}
            icon={Package}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Pending"
            value={pendingOrders}
            subtitle="Awaiting action"
            icon={Clock}
            colorClass="text-status-review-awaited"
          />
          <StatsCard
            title="Reviewed"
            value={reviewedOrders}
            subtitle="Ready for processing"
            icon={CheckCircle}
            colorClass="text-status-reviewed"
          />
          <StatsCard
            title="Completed"
            value={completedOrders}
            subtitle="Paid & refunded"
            icon={DollarSign}
            colorClass="text-status-paid"
          />
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
          <OrdersTable orders={visibleOrders} isAdmin={isAdmin} />
        </section>
      </main>
    </div>
  );
}
