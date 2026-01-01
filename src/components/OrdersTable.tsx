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
  Image as ImageIcon
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
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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

const statuses: (OrderStatus | 'ALL')[] = [
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

const ITEMS_PER_PAGE = 10;

export function OrdersTable({ orders, isAdmin, showFilters = true, serverPaginated = false, currentPage: currentPageProp = 1, totalPages: totalPagesProp, onPageChange, isLoading = false, hasMore = false }: OrdersTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Screenshot preview/lightbox state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Filter orders (client-side filtering still applies to the current page of orders)
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderName.toLowerCase().includes(search.toLowerCase()) ||
      order.amazonOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.buyerPaypal.toLowerCase().includes(search.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      order.createdBy.email.toLowerCase().includes(search.toLowerCase()) ||
      order.createdBy.username.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search);

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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, Amazon #, PayPal, email..."
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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Amazon #
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Buyer Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Buyer PayPal
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Updated
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No orders found</p>
                      <p className="text-sm text-muted-foreground/70">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={cn(
                      'group hover:bg-accent/50 transition-colors duration-150 cursor-pointer',
                      'animate-slide-up'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                    // onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {order.screenshots && order.screenshots.length > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewSrc(order.screenshots[1]); setPreviewOpen(true); }}
                            className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center hover:scale-105 transition-transform"
                            title="View screenshot"
                          >
                            <img src={order.screenshots[1]} alt={`Screenshot for ${order.orderName}`} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}

                        <div className="flex flex-col">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {order.orderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            by {order.createdBy.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {order.amazonOrderNumber}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {order.buyerName}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {order.buyerPaypal}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(order.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {((typeof totalPages !== 'undefined' && totalPages > 1) || (isServer && (hasMore || (currentPageProp > 1)))) && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            {!isServer ? (
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min((currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE, filteredOrders.length)} of{' '}
                {filteredOrders.length} orders
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Page {currentPageProp}{typeof totalPages !== 'undefined' ? ` of ${totalPages}` : ''}
              </p>
            )}

            <div className="flex items-center gap-2">
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

              {/* Page numbers when we know totalPages */}
              {typeof totalPages !== 'undefined' ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                      className="w-8 h-8 p-0"
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
          <div>
            <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 ${previewOpen ? 'block' : 'hidden'}`} onClick={() => setPreviewOpen(false)}>
              <div className="max-w-4xl max-h-[80vh] p-4">
                <img src={previewSrc} alt="Screenshot preview" className="max-h-[80vh] w-auto max-w-full object-contain rounded" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
