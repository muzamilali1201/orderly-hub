import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { mockOrders } from '@/data/mockOrders';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { OrderStatus } from '@/types/order';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAKISTAN_TZ = 'Asia/Karachi';

const adminStatuses: OrderStatus[] = [
  'ORDERED',
  'REVIEWED',
  'REVIEW_AWAITED',
  'CORRECTED',
  'REFUNDED',
  'PAID',
  'CANCELLED',
];

const userStatuses: OrderStatus[] = ['REVIEWED', 'CORRECTED', 'CANCELLED'];

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const order = mockOrders.find((o) => o.id === id);

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
    if (!pendingStatus) return;
    
    setIsUpdating(true);
    setShowConfirm(false);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: 'Status updated',
      description: `Order status changed to ${pendingStatus.replace('_', ' ')}`,
    });
    
    setIsUpdating(false);
    setPendingStatus(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
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
                    <div
                      key={index}
                      className="aspect-video rounded-lg border border-border bg-muted overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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

                {isUpdating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating status...
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <StatusTimeline history={order.statusHistory} />
            </div>
          </div>
        </div>
      </main>

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
