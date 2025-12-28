export type OrderStatus = 
  | 'ORDERED' 
  | 'REVIEWED' 
  | 'REVIEW_AWAITED' 
  | 'CORRECTED' 
  | 'REFUNDED' 
  | 'PAID' 
  | 'CANCELLED'
  | 'COMISSION_COLLECTED'
  | 'REVIEW_DELAYED'
  | 'REFUND_DELAYED'
  | 'SEND_TO_SELLER'
  |      'HOLD'
  |      'SENT'

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedBy: {
    username: string;
    role: 'admin' | 'user' | 'system';
  };
  changedAt: string;
}

export interface Order {
  id: string;
  orderName: string;
  amazonOrderNumber: string;
  buyerPaypal: string;
  buyerName: string;
  status: OrderStatus;
  comments?: string;
  screenshots: string[];
  createdBy: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
}

export interface CreateOrderData {
  orderName: string;
  amazonOrderNumber: string;
  buyerPaypal: string;
  comments?: string;
  screenshots: File[];
}

// Socket.IO event payload types
export interface OrderStatusPayload {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  changedBy?: {
    id: string;
    username: string;
    role: 'admin' | 'user';
  };
  role?: string;
  createdAt: string;
}

export interface AlertNotification {
  id: string;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  changedBy?: {
    id: string;
    username: string;
    role: 'admin' | 'user';
  };
  role?: string;
  createdAt: string;
  read: boolean;
}
