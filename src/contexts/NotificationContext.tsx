import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertNotification, OrderStatusPayload, NewOrderPayload } from '@/types/order';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationContextType {
  notifications: AlertNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleOrderStatusChanged = useCallback((data: OrderStatusPayload) => {
    const notification: AlertNotification = {
      id: `${data.orderId}-${Date.now()}`,
      orderId: data.orderId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      changedBy: data.changedBy,
      role: data.role,
      createdAt: data.createdAt,
      read: false,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50

    // Show toast notification
    const actor = data.changedBy?.username ?? data.role ?? 'System';
    toast({
      title: 'Order Status Updated',
      description: `${actor} changed order status from ${data.previousStatus} to ${data.newStatus}`,
    });

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['overall-orders'] });
  }, [toast, queryClient]);

  const handleNewOrder = useCallback((data: NewOrderPayload) => {
    const notification: AlertNotification = {
      id: `new-${data._id}-${Date.now()}`,
      orderId: data._id,
      previousStatus: '',
      newStatus: 'ORDERED',
      role: 'system',
      createdAt: data.createdAt,
      read: false,
      orderName: data.orderName,
      isNewOrder: true,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 50));

    // Show toast notification
    toast({
      title: 'New Order Created',
      description: `New order "${data.orderName}" has been created`,
    });

    // Invalidate queries to refresh order lists
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['overall-orders'] });
  }, [toast, queryClient]);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  useSocket({
    onOrderStatusChanged: handleOrderStatusChanged,
    onNewOrder: handleNewOrder,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
