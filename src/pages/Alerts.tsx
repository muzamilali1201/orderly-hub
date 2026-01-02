import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAlertHistory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { StatusHistoryEntry } from '@/types/order';
import { StatusBadge } from '@/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';

const PAKISTAN_TZ = 'Asia/Karachi';

export default function Alerts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { notifications, isConnected } = useNotifications();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [orderFilter, setOrderFilter] = useState('');
  // Use 'ALL' as the sentinel for no-status filter (Select requires non-empty values)
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['alert-history', { page, perPage, orderFilter, statusFilter }],
    queryFn: async () => {
      // Use the new /alert/history API
      const res = await getAlertHistory({ page, perPage, limit: perPage, orderId: orderFilter || undefined, status: statusFilter === 'ALL' ? undefined : statusFilter });
      return res.data ?? res;
    },
  });

  // Refetch when new notifications arrive (real-time update)
  useEffect(() => {
    if (notifications.length > 0) {
      refetch();
    }
  }, [notifications.length, refetch]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Failed to load alerts', description: (error as any)?.message || 'Unable to fetch alerts', variant: 'destructive' });
    }
  }, [error, toast]);

  const raw = Array.isArray(data) ? data : (data as any)?.data ?? [];
  const totalCountRaw = (data as any)?.totalCount ?? (data as any)?.count ?? (data as any)?.total ?? (data as any)?.meta?.total ?? (data as any)?.totalCount;
  const totalCountNum = typeof totalCountRaw !== 'undefined' ? Number(totalCountRaw) : undefined;
  const totalPages = typeof totalCountNum === 'number' && Number.isFinite(totalCountNum)
    ? Math.max(1, Math.ceil(totalCountNum / perPage))
    : (data as any)?.totalPages ?? undefined;

  const formatDateTime = (d: string) => formatInTimeZone(new Date(d), PAKISTAN_TZ, 'MMM d, yyyy h:mm a');

  // Map /alert/history response shape to StatusHistoryEntry
  const entries: StatusHistoryEntry[] = (raw as any[]).map((e) => ({
    id: e._id ?? e.id,
    orderId: (e.orderId && (typeof e.orderId === 'object') ? (e.orderId._id ?? e.orderId.id) : (e.orderId ?? e.order_id ?? e.order)) as string,
    // prefer orderName/title if server provides it; fallback to amazonOrderNo for display
    orderName: (e.orderId && typeof e.orderId === 'object' ? (e.orderId.orderName ?? e.orderId.title ?? e.orderId.name) : undefined) ?? undefined,
    amazonOrderNo: (e.orderId && typeof e.orderId === 'object' ? (e.orderId.amazonOrderNo ?? e.orderId.amazonOrderNo) : undefined) ?? undefined,
    fromStatus: (e.previousStatus ?? e.previous_status ?? null) as any,
    toStatus: (e.newStatus ?? e.new_status ?? e.status ?? 'ORDERED') as any,
    changedBy: {
      id: e.changedBy?._id ?? e.changedBy?.id ?? e.changed_by?._id ?? e.changed_by?.id ?? '',
      username: e.changedBy?.username ?? e.changedBy?.name ?? e.changed_by?.username ?? 'unknown',
      role: e.role ?? e.changedBy?.role ?? 'user',
    },
    changedAt: e.createdAt ?? e.created_at ?? e.changedAt ?? new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 pl-10 md:pl-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Alerts</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Recent status changes</p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24 sm:w-28">
                <SelectValue placeholder={`${perPage}/page`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
              </SelectContent>
            </Select>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Changed By</th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center">{isLoading ? 'Loading...' : 'No alerts found'}</td></tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => e.orderId && navigate(`/orders/${e.orderId}`)}>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="font-medium text-foreground text-sm">{e.orderName ?? e.amazonOrderNo ?? ''}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4"><StatusBadge status={(e.fromStatus ?? e.previousStatus ?? 'ORDERED') as any} size="sm" /></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4"><StatusBadge status={(e.toStatus ?? e.newStatus ?? 'ORDERED') as any} size="sm" /></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{e.changedBy.username} <span className="text-xs text-muted-foreground/70">({e.changedBy.role})</span></td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{formatDateTime(e.changedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {entries.length === 0 ? (
              <div className="px-4 py-12 text-center text-muted-foreground">
                {isLoading ? 'Loading...' : 'No alerts found'}
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => e.orderId && navigate(`/orders/${e.orderId}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">{e.orderName ?? e.amazonOrderNo ?? ''}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(e.changedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={(e.fromStatus ?? e.previousStatus ?? 'ORDERED') as any} size="sm" />
                    <span className="text-muted-foreground">→</span>
                    <StatusBadge status={(e.toStatus ?? e.newStatus ?? 'ORDERED') as any} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Changed by {e.changedBy.username} ({e.changedBy.role})
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {(typeof totalPages !== 'undefined' ? totalPages > 1 : entries.length > 0) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground">Page {page}{totalPages ? ` of ${totalPages}` : ''}</p>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {totalPages ? Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={p === page ? 'default' : 'ghost'} size="sm" onClick={() => setPage(p)} className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm">{p}</Button>
                )) : null}
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={typeof totalPages !== 'undefined' && page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
