import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  ArrowLeft, 
  Package, 
  Mail, 
  Calendar, 
  User,
  Image,
  MessageSquare,
  Loader2,
  Upload
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { OrderStatus } from '@/types/order';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/FileUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAKISTAN_TZ = 'Asia/Karachi';

const adminStatuses: OrderStatus[] = [
        "ORDERED",
        "REVIEWED",
        "REVIEW_AWAITED",
        "REFUND_DELAYED",
        "REFUNDED",
        "CORRECTED",
        "CANCELLED",
        "COMISSION_COLLECTED",
        "PAID",
        "SEND_TO_SELLER",
        "HOLD",
        "SENT"
      ];

const userStatuses: OrderStatus[] = ['REVIEWED', 'ORDERED', 'CANCELLED',"REFUND_DELAYED"];

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [refundScreenshot, setRefundScreenshot] = useState<File | null>(null);

  // Lightbox state for viewing screenshots
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await import('@/lib/api').then((m) => m.getOrder(id));
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
  });

  // const queryClient = ( import('@tanstack/react-query')).QueryClient ? null : null; // placeholder to lazily import queryClient in confirm


  if (error) {
    toast({ title: 'Failed to fetch order', description: (error as any)?.message || 'Unable to fetch order', variant: 'destructive' });
  }

  const mapOrder = (o: any) => ({
    id: o._id ?? o.id,
    orderName: o.orderName,
    amazonOrderNumber: o.amazonOrderNo ?? o.amazonOrderNumber,
    buyerPaypal: o.buyerPaypal,
    buyerName: o.buyerName,
    status: o.status,
    comments: o.comments,
    screenshots: [
    { url: o.OrderSS, name: "Order" },
    { url: o.AmazonProductSS, name: "Amazon Product" },
    { url: o.RefundSS, name: "Refund" },
  ].filter((s) => Boolean(s.url)),
    createdBy: {
      id: o.userId?._id ?? o.userId?.id ?? o.createdBy?.id,
      username: o.userId?.username ?? o.createdBy?.username,
      email: o.userId?.email ?? o.createdBy?.email,
    },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    statusHistory: o.statusHistory ?? [],
  });

  const order = data ? mapOrder(data) : null;
  console.log(order)

  const queryClient = useQueryClient();

  // Keyboard navigation for lightbox (moved up so hooks are called consistently)
  useEffect(() => {
    if (!lightboxOpen || !order?.screenshots?.length) return;
    const len = order.screenshots.length;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + len) % len);
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % len);
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, order?.screenshots?.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Order not found</p>
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mt-4">
            Go back to orders
          </Button>
        </div>
      </div>
    );
  }

  const availableStatuses = isAdmin ? adminStatuses : userStatuses;

  const formatDate = (dateString: string) => {
    return formatInTimeZone(new Date(dateString), PAKISTAN_TZ, 'MMMM d, yyyy');
  };

  const formatTime = (dateString: string) => {
    return formatInTimeZone(new Date(dateString), PAKISTAN_TZ, 'h:mm a');
  };

  const handleStatusChange = (status: OrderStatus) => {
    if (status === order.status) return;
    setPendingStatus(status);
    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !order) return;

    setIsUpdating(true);
    setShowConfirm(false);

    try {
      await import('@/lib/api').then((m) => m.updateOrderStatus(order.id, pendingStatus, refundScreenshot ?? undefined));

      toast({
        title: 'Status updated',
        description: `Order status changed to ${pendingStatus.replace('_', ' ')}`,
      });

      // Reset refund screenshot
      setRefundScreenshot(null);

      // Refresh both single order and orders list
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      const message = (err as any)?.response?.data?.message || (err as Error).message || 'Failed to update status';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
    }
  };


  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <NotificationBell />
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">{order.orderName}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Order ID: {order.id}
          </p>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up">
            {/* Order Information Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
                  <p className="text-sm text-muted-foreground">Order information and metadata</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amazon Order #</p>
                  <code className="text-sm bg-muted px-3 py-1.5 rounded-lg font-mono inline-block">
                    {order.amazonOrderNumber}
                  </code>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Buyer PayPal
                  </p>
                  <p className="text-foreground">{order.buyerPaypal}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Created By
                  </p>
                  <p className="text-foreground">
                    {order.createdBy.username}
                    <span className="text-muted-foreground ml-1">({order.createdBy.email})</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Buyer Name
                  </p>
                  <p className="text-foreground">
                    {order.buyerName}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Created At
                  </p>
                  <p className="text-foreground">
                    {formatDate(order.createdAt)}
                    <span className="text-muted-foreground ml-1">{formatTime(order.createdAt)}</span>
                  </p>
                </div>
              </div>

              {order.comments && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </div>
                  <p className="text-foreground bg-muted/50 rounded-lg p-3">
                    {order.comments}
                  </p>
                </div>
              )}
            </div>

            {/* Screenshots Card */}
            {order.screenshots.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Screenshots</h2>
                    <p className="text-sm text-muted-foreground">
                      {order.screenshots.length} image{order.screenshots.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {order.screenshots.map((screenshot, index) => (
  <div key={index} className="space-y-1">
    <button
      type="button"
      onClick={() => {
        setActiveIndex(index);
        setLightboxOpen(true);
      }}
      className="aspect-video w-full rounded-lg border border-border bg-muted 
                 overflow-hidden group cursor-pointer hover:border-primary/50 
                 transition-colors p-0"
    >
      <img
        src={screenshot.url}
        alt={screenshot.name || `Screenshot ${index + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 
                   transition-transform duration-300"
      />
    </button>

    {/* Screenshot name */}
    <p className="text-xs text-muted-foreground truncate">
      {screenshot.name}
    </p>
  </div>
))}

                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6" style={{ animationDelay: '100ms' }}>
            {/* Status Update Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground">Update Status</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Current Status</p>
                <StatusBadge status={order.status} size="lg" />
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-sm text-muted-foreground">Change Status</p>
                <Select
                  value={order.status}
                  onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Refund Screenshot Upload - Admin Only */}
                {isAdmin && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Refund Screenshot (optional)
                    </Label>
                    <FileUpload
                      files={refundScreenshot ? [refundScreenshot] : []}
                      onFilesChange={(files) => setRefundScreenshot(files[0] ?? null)}
                      maxFiles={1}
                    />
                    {/* {order.refundScreenshot && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Current Refund Screenshot:</p>
                        <button
                          type="button"
                          onClick={() => { setActiveIndex(order.screenshots.length); setLightboxOpen(true); }}
                          className="w-20 h-14 rounded border border-border overflow-hidden hover:border-primary/50 transition-colors"
                        >
                          <img
                            src={order.refundScreenshot}
                            alt="Refund Screenshot"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </div>
                    )} */}
                  </div>
                )}

                {isUpdating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating status...
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div
  className="rounded-xl border border-border bg-card p-6 animate-slide-up
             max-h-[420px] overflow-y-auto"
  style={{ animationDelay: '200ms' }}
>
  <StatusTimeline history={order.statusHistory} />
</div>
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="w-full max-w-5xl p-0 bg-transparent shadow-none">
          <div className="relative flex items-center justify-center bg-black/80 p-4">
            <img
              src={order.screenshots[activeIndex]?.url}
              alt={`Screenshot ${activeIndex + 1}`}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />

            {order.screenshots.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i - 1 + order.screenshots.length) % order.screenshots.length); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i + 1) % order.screenshots.length); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the order status from{' '}
              <span className="font-medium text-foreground">{order.status.replace('_', ' ')}</span> to{' '}
              <span className="font-medium text-foreground">{pendingStatus?.replace('_', ' ')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
}
