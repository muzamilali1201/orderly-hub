import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  MoreHorizontal,
  Image as ImageIcon,
  Trash2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { deleteOrder, updateOrderStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface OrdersTableProps {
  orders: Order[];
  isAdmin: boolean;
  /** Show the search and status filter UI (defaults to true) */
  showFilters?: boolean;
  /** When true, server-side pagination is used; the table will render current page items and use external pagination controls */
  serverPaginated?: boolean;
  /** Current page (required when serverPaginated is true) */
  currentPage?: number;
  /** Total number of pages (optional) */
  totalPages?: number;
  /** Called when the page is changed (required when serverPaginated is true) */
  onPageChange?: (page: number) => void;
  /** Whether the server data is currently loading (optional) */
  isLoading?: boolean;
  /** When server doesn't return a total, indicates there may be a next page */
  hasMore?: boolean;
}

const PAKISTAN_TZ = 'Asia/Karachi';

const ALL_STATUSES: OrderStatus[] = [
  "ORDERED",
  "REVIEWED",
  "SEND_TO_SELLER",
  "ON HOLD",
  "REVIEW_AWAITED",
  "REFUND_DELAYED",
  "REFUNDED",
  "CORRECTED",
  "CANCELLED",
  "COMMISSION_COLLECTED",
  "PAID",
  "SENT"
];

const statuses: (OrderStatus | 'ALL')[] = ['ALL', ...ALL_STATUSES];

const ITEMS_PER_PAGE = 10;

export function OrdersTable({ orders, isAdmin, showFilters = true, serverPaginated = false, currentPage: currentPageProp = 1, totalPages: totalPagesProp, onPageChange, isLoading = false, hasMore = false }: OrdersTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Screenshot preview/lightbox state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status change state
  const [changingStatusOrderId, setChangingStatusOrderId] = useState<string | null>(null);

  // Filter orders (client-side filtering still applies to the current page of orders)
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderName.toLowerCase().includes(search.toLowerCase()) ||
      order.amazonOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.buyerPaypal.toLowerCase().includes(search.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      order.createdBy.email.toLowerCase().includes(search.toLowerCase()) ||
      order.createdBy.username.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search)

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination (client or server)
  const clientTotalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const isServer = serverPaginated;
  const totalPages = isServer ? (typeof totalPagesProp === 'number' ? totalPagesProp : undefined) : clientTotalPages;

  // When serverPaginated, the `orders` prop is assumed to be the current page's items
  const paginatedOrders = isServer ? filteredOrders : filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const formatDate = (dateString: string) => {
    return formatInTimeZone(new Date(dateString), PAKISTAN_TZ, 'd MMM, yyyy h:mm a');
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setChangingStatusOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Status updated',
        description: `Order status changed to ${newStatus.replace('_', ' ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['overall-orders'] });
    } catch (err) {
      const message = (err as any)?.response?.data?.message || (err as Error).message || 'Failed to update status';
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setChangingStatusOrderId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as OrderStatus | 'ALL');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'ALL' ? 'All Statuses' : status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3 sm:space-y-4">
        {paginatedOrders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 sm:p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No orders found</p>
              <p className="text-sm text-muted-foreground/70 text-center">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        ) : (
          paginatedOrders.map((order, index) => (
            <div
              key={order.id}
              className={cn(
                'rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150 animate-slide-up'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-muted/30 border-b border-border gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm sm:text-base">ORD# {order.id}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger disabled={changingStatusOrderId === order.id}>
                          {changingStatusOrderId === order.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Change Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                            {ALL_STATUSES.filter(s => s !== order.status).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order.id, status);
                                }}
                              >
                                {status.replace('_', ' ')}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      {
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(order);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Order
                          </DropdownMenuItem>
                        </>
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content Row */}
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 self-center sm:self-start">
                  {order.screenshots && order.screenshots.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewSrc(order.screenshots[1]); setPreviewOpen(true); }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center hover:scale-105 transition-transform"
                      title="View screenshot"
                    >
                      <img src={order.screenshots[1]} alt={`Screenshot for ${order.orderName}`} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                  )}
                </div>

                {/* Two Column Info Grid */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 sm:gap-y-2">
                  {/* Left Column */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-muted-foreground">AMZ Order #:</span>
                      <code className="text-xs sm:text-sm bg-muted px-1.5 sm:px-2 py-0.5 rounded font-mono text-foreground break-all">
                        {order.amazonOrderNumber}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-muted-foreground">Buyer PP:</span>
                      <span className="text-xs sm:text-sm text-foreground break-all">{order.buyerPaypal}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-muted-foreground">Buyer Name:</span>
                      <span className="text-xs sm:text-sm text-foreground">{order.buyerName}</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Manager:</span>
                      <span className="text-xs sm:text-sm text-foreground">{order.createdBy.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Commission:</span>
                      <span className="text-xs sm:text-sm text-foreground">{order.commission ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-muted-foreground">Screenshots:</span>
                      <div className="flex items-center gap-1">
                        {order.screenshots && order.screenshots.length > 0 ? (
                          order.screenshots.slice(0, 3).map((ss, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPreviewSrc(ss); setPreviewOpen(true); }}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded overflow-hidden bg-muted hover:ring-2 ring-primary transition-all"
                              title="View screenshot"
                            >
                              <img src={ss} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))
                        ) : (
                          <span className="text-xs sm:text-sm text-muted-foreground">None</span>
                        )}
                        {order.screenshots && order.screenshots.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{order.screenshots.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Pagination */}
        {((typeof totalPages !== 'undefined' && totalPages > 1) || (isServer && (hasMore || (currentPageProp > 1)))) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 sm:py-4 rounded-xl border border-border bg-card">
            {!isServer ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min((currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE, filteredOrders.length)} of{' '}
                {filteredOrders.length} orders
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Page {currentPageProp}{typeof totalPages !== 'undefined' ? ` of ${totalPages}` : ''}
              </p>
            )}

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isServer) {
                    onPageChange?.(Math.max(1, (currentPageProp || 1) - 1));
                  } else {
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }
                }}
                disabled={isServer ? (currentPageProp === 1) : (currentPage === 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {typeof totalPages !== 'undefined' ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = totalPages <= 5 ? i + 1 : 
                      (isServer ? currentPageProp : currentPage) <= 3 ? i + 1 :
                      (isServer ? currentPageProp : currentPage) >= totalPages - 2 ? totalPages - 4 + i :
                      (isServer ? currentPageProp : currentPage) - 2 + i;
                    return pageNum;
                  }).map((page) => (
                    <Button
                      key={page}
                      variant={(isServer ? currentPageProp : currentPage) === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (isServer) {
                          onPageChange?.(page);
                        } else {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isServer) {
                    onPageChange?.(typeof totalPages !== 'undefined' ? Math.min(totalPages, (currentPageProp || 1) + 1) : (currentPageProp || 1) + 1);
                  } else {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }
                }}
                disabled={isServer ? (!hasMore && (typeof totalPages === 'undefined')) || (typeof totalPages !== 'undefined' && currentPageProp === totalPages) : (currentPage === totalPages)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Screenshot preview dialog */}
        {previewSrc && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 ${previewOpen ? 'block' : 'hidden'}`} onClick={() => setPreviewOpen(false)}>
            <div className="max-w-4xl max-h-[90vh]">
              <img src={previewSrc} alt="Screenshot preview" className="max-h-[85vh] w-auto max-w-full object-contain rounded" />
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order "{orderToDelete?.orderName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!orderToDelete) return;
                setIsDeleting(true);
                try {
                  await deleteOrder(orderToDelete.id);
                  toast({
                    title: 'Order deleted',
                    description: `Order "${orderToDelete.orderName}" has been deleted.`,
                  });
                  queryClient.invalidateQueries({ queryKey: ['orders'] });
                  setDeleteDialogOpen(false);
                  setOrderToDelete(null);
                } catch (err) {
                  const message = (err as any)?.response?.data?.message || (err as Error).message || 'Failed to delete order';
                  toast({
                    title: 'Delete failed',
                    description: message,
                    variant: 'destructive',
                  });
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
