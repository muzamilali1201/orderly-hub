import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Wifi, WifiOff, History, ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';
import { OrderStatus, StatusHistoryEntry } from '@/types/order';
import { useQuery } from '@tanstack/react-query';
import { getAlertHistory } from '@/lib/api';

const PAKISTAN_TZ = 'Asia/Karachi';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  // Fetch alert history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['notification-alert-history'],
    queryFn: async () => {
      const res = await getAlertHistory({ page: 1, perPage: 20 });
      return res.data ?? res;
    },
    enabled: open && showHistory,
  });

  const historyRaw = Array.isArray(historyData) ? historyData : (historyData as any)?.data ?? [];
  const historyEntries: StatusHistoryEntry[] = historyRaw.map((e: any) => ({
    id: e._id ?? e.id,
    orderId: (e.orderId && (typeof e.orderId === 'object') ? (e.orderId._id ?? e.orderId.id) : (e.orderId ?? e.order_id ?? e.order)) as string,
    orderName: (e.orderId && typeof e.orderId === 'object' ? (e.orderId.orderName ?? e.orderId.title ?? e.orderId.name) : undefined) ?? undefined,
    amazonOrderNo: (e.orderId && typeof e.orderId === 'object' ? (e.orderId.amazonOrderNo) : undefined) ?? undefined,
    fromStatus: (e.previousStatus ?? e.previous_status ?? null) as any,
    toStatus: (e.newStatus ?? e.new_status ?? e.status ?? 'ORDERED') as any,
    changedBy: {
      id: e.changedBy?._id ?? e.changedBy?.id ?? e.changed_by?._id ?? e.changed_by?.id ?? '',
      username: e.changedBy?.username ?? e.changedBy?.name ?? e.changed_by?.username ?? 'unknown',
      role: e.role ?? e.changedBy?.role ?? 'user',
    },
    changedAt: e.createdAt ?? e.created_at ?? e.changedAt ?? new Date().toISOString(),
  }));

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    setOpen(false);
    navigate(`/orders/${notification.orderId}`);
  };

  const handleHistoryClick = (entry: StatusHistoryEntry) => {
    setOpen(false);
    // if (entry.orderId) {
    //   navigate(`/orders/${entry.orderId}`);
    // }
  };

  const formatDateTime = (d: string) => formatInTimeZone(new Date(d), PAKISTAN_TZ, 'MMM d, h:mm a');

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowHistory(false); }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {/* Connection indicator */}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background',
              isConnected ? 'bg-green-500' : 'bg-muted-foreground'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-80 p-0 z-[100]" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {showHistory && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-1"
                onClick={() => setShowHistory(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="font-semibold text-sm">{showHistory ? 'Alert History' : 'Notifications'}</h3>
            {!showHistory && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowHistory(true)}
                title="View history"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            {!showHistory && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {!showHistory && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearNotifications}
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {showHistory ? (
            // Alert History View
            historyLoading ? (
              <div className="flex items-center justify-center h-full py-8 text-muted-foreground">
                <p className="text-sm">Loading history...</p>
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                <History className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No alert history</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {historyEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleHistoryClick(entry)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          status={(entry.fromStatus ?? entry.previousStatus ?? 'ORDERED') as OrderStatus}
                          size="sm"
                        />
                        <span className="text-muted-foreground">→</span>
                        <StatusBadge
                          status={(entry.toStatus ?? entry.newStatus ?? 'ORDERED') as OrderStatus}
                          size="sm"
                        />
                      </div>
                      {(entry.orderName || entry.amazonOrderNo) && (
                        <p className="text-xs text-foreground font-medium truncate">
                          {entry.orderName ?? entry.amazonOrderNo}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {entry.changedBy.username}
                          <span className="ml-1 opacity-70">({entry.changedBy.role})</span>
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {formatDateTime(entry.changedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            // Live Notifications View
            notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                <Bell className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">Real-time alerts will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    // onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                      !notification.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-1 h-2 w-2 rounded-full shrink-0',
                          notification.read ? 'bg-transparent' : 'bg-primary'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        {notification.isNewOrder ? (
                          // New Order notification
                          <>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                                <Plus className="h-3 w-3" />
                                New Order
                              </span>
                            </div>
                            {notification.orderName && (
                              <p className="text-sm font-medium text-foreground mt-1 truncate">
                                {notification.orderName}
                              </p>
                            )}
                          </>
                        ) : (
                          // Status change notification
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge
                              status={notification.previousStatus as OrderStatus}
                              size="sm"
                            />
                            <span className="text-muted-foreground">→</span>
                            <StatusBadge
                              status={notification.newStatus as OrderStatus}
                              size="sm"
                            />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {notification.changedBy?.username ?? notification.role ?? 'System'}
                          {notification.changedBy?.role && (
                            <span className="ml-1 opacity-70">
                              ({notification.changedBy.role})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
