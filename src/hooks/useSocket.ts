import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { OrderStatusPayload, NewOrderPayload } from '@/types/order';

// Get socket URL from environment or default to localhost
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string)?.replace('/api/v1', '') ?? 'http://localhost:3000';

// Singleton socket instance
let socketInstance: Socket | null = null;

const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
};

interface UseSocketOptions {
  onOrderStatusChanged?: (data: OrderStatusPayload) => void;
  onNewOrder?: (data: NewOrderPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { onOrderStatusChanged, onNewOrder, onConnect, onDisconnect } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
      onConnect?.();
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      onDisconnect?.();
    };

    const handleOrderStatusChanged = (data: OrderStatusPayload) => {
      console.log('Order status changed:', data);
      onOrderStatusChanged?.(data);
    };

    const handleNewOrder = (data: NewOrderPayload) => {
      console.log('New order received:', data);
      onNewOrder?.(data);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('order-status-changed', handleOrderStatusChanged);
    socket.on('newOrder', handleNewOrder);

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('order-status-changed', handleOrderStatusChanged);
      socket.off('newOrder', handleNewOrder);
    };
  }, [onOrderStatusChanged, onNewOrder, onConnect, onDisconnect]);

  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

export { getSocket };
