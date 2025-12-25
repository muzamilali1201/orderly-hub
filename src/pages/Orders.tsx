import { useAuth } from '@/contexts/AuthContext';
import { mockOrders } from '@/data/mockOrders';
import { OrdersTable } from '@/components/OrdersTable';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Filter orders based on user role
  const visibleOrders = isAdmin 
    ? mockOrders 
    : mockOrders.filter(order => order.createdBy.id === user?.id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? 'Manage all orders' : 'View and manage your orders'}
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

      <main className="p-6">
        <OrdersTable orders={visibleOrders} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
