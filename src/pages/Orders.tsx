import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrdersTable } from '@/components/OrdersTable';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Orders() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Server-side pagination state
  const [page, setPage] = useState(1);
  // Per-page selection (user configurable)
  const [perPage, setPerPage] = useState(10);

  // Fetch orders from API (server paginated)
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', { page, perPage }],
    queryFn: async () => {
      const res = await getOrders({ page, perPage });
      return res.data ?? res;
    },
    keepPreviousData: true,
  });

  // Show error toast once
  useEffect(() => {
    if (error) {
      toast({ title: 'Failed to fetch orders', description: (error as any)?.message || 'Unable to fetch orders', variant: 'destructive' });
    }
  }, [error]);

  // data may be an array or an object with { data: [...], total }
  const rawOrders = Array.isArray(data) ? data : data?.data ?? [];

  // Prefer explicit page count from the server when provided (e.g., `totalPages`)
  // Fall back to a total-count (total, totalCount, total_count, meta.total) if present
  const totalPagesCandidate = data?.totalPages ?? data?.total_pages ?? undefined;
  const totalCountCandidate = data?.total ?? data?.count ?? data?.total_count ?? data?.meta?.total ?? data?.totalCount;

  let totalPages: number | undefined;
  if (totalPagesCandidate != null) {
    const tp = Number(totalPagesCandidate);
    totalPages = Number.isFinite(tp) ? Math.max(1, Math.ceil(tp)) : undefined;
  } else if (totalCountCandidate != null) {
    const tc = Number(totalCountCandidate);
    totalPages = Number.isFinite(tc) ? Math.max(1, Math.ceil(tc / perPage)) : undefined;
  } else {
    totalPages = undefined;
  }

  // If backend doesn't report a total, infer hasMore when the returned page is full
  const hasMore = typeof totalPages === 'undefined' ? rawOrders.length === perPage : undefined;

  // Map server order shape to local Order type if necessary
  const mapOrder = (o: any) => ({
    id: o._id ?? o.id,
    orderName: o.orderName,
    amazonOrderNumber: o.amazonOrderNo ?? o.amazonOrderNumber,
    buyerPaypal: o.buyerPaypal,
    status: o.status,
    comments: o.comments,
    screenshots: [o.OrderSS, o.AmazonProductSS].filter(Boolean),
    createdBy: {
      id: o.userId?._id ?? o.userId?.id ?? o.createdBy?.id,
      username: o.userId?.username ?? o.createdBy?.username,
      email: o.userId?.email ?? o.createdBy?.email,
    },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    statusHistory: o.statusHistory ?? [],
  });

  const serverOrders = Array.isArray(rawOrders) ? rawOrders.map(mapOrder) : [];

  // Show all orders to all users (regular users can view others' orders as well)
  const visibleOrders = serverOrders;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? 'Manage all orders' : 'View all orders'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue placeholder={`${perPage} per page`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 / page</SelectItem>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="hero" onClick={() => navigate('/orders/new')}>
              <PlusCircle className="w-4 h-4" />
              New Order
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        ) : (
          <OrdersTable
            orders={visibleOrders}
            isAdmin={isAdmin}
            serverPaginated
            currentPage={page}
            totalPages={totalPages}
            hasMore={hasMore}
            onPageChange={(p) => setPage(p)}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
