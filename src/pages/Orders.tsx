import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrdersTable } from '@/components/OrdersTable';
import { NotificationBell } from '@/components/NotificationBell';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrdersResponse {
  data?: any[];
  totalPages?: number;
  total_pages?: number;
  total?: number;
  count?: number;
  total_count?: number;
  totalCount?: number;
  meta?: { total?: number };
}

export default function Orders() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Server-side pagination state
  const [page, setPage] = useState(1);
  // Per-page selection (user configurable)
  const [perPage, setPerPage] = useState(25);
  // Server-side search and filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch orders from API (server paginated with search & filter)
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<OrdersResponse | any[]>({
    queryKey: ['orders', { page, perPage, search, statusFilter }],
    queryFn: async () => {
      const params: { page: number; perPage: number; search?: string; filterBy?: string } = { page, perPage };
      if (search.trim()) params.search = search.trim();
      if (statusFilter && statusFilter !== 'ALL') params.filterBy = statusFilter;
      const res = await getOrders(params);
      return res.data ?? res;
    },
    placeholderData: (previousData) => previousData,
  });

  // Show error toast once
  useEffect(() => {
    if (error) {
      toast({ title: 'Failed to fetch orders', description: (error as any)?.message || 'Unable to fetch orders', variant: 'destructive' });
    }
  }, [error]);

  // data may be an array or an object with { data: [...], total }
  const rawOrders = Array.isArray(data) ? data : (data as OrdersResponse)?.data ?? [];

  // Prefer explicit page count from the server when provided (e.g., `totalPages`)
  // Fall back to a total-count (total, totalCount, total_count, meta.total) if present
  const dataObj = data as OrdersResponse | undefined;
  const totalPagesCandidate = dataObj?.totalPages ?? dataObj?.total_pages ?? undefined;
  const totalCountCandidate = dataObj?.total ?? dataObj?.count ?? dataObj?.total_count ?? dataObj?.meta?.total ?? dataObj?.totalCount;

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
    buyerName : o.buyerName,
    status: o.status,
    comments: o.comments,
    commission : o.commission,
    sheetName : o.sheet?.name,
    screenshots: [o.OrderSS,o.AmazonProductSS, o.RefundSS, o.ReviewedSS].filter(Boolean),
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
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="pl-10 md:pl-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? 'Manage all orders' : 'View all orders'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <NotificationBell />
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24 sm:w-28 h-9">
                <SelectValue placeholder={`${perPage} per page`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 / page</SelectItem>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="hero" size="sm" onClick={() => navigate('/orders/new')}>
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Order</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <OrdersTable
          orders={visibleOrders}
          isAdmin={isAdmin}
          serverPaginated
          currentPage={page}
          totalPages={totalPages}
          hasMore={hasMore}
          onPageChange={(p) => setPage(p)}
          isLoading={isLoading}
          // Server-side search/filter
          serverSearch={search}
          onSearchChange={(s) => { setSearch(s); setPage(1); }}
          serverStatusFilter={statusFilter}
          onStatusFilterChange={(f) => { setStatusFilter(f); setPage(1); }}
        />
      </main>
    </div>
  );
}
