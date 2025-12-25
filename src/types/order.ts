export type OrderStatus = 
  | 'ORDERED' 
  | 'REVIEWED' 
  | 'REVIEW_AWAITED' 
  | 'CORRECTED' 
  | 'REFUNDED' 
  | 'PAID' 
  | 'CANCELLED';

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
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: {
    id: string;
    username: string;
    role: UserRole;
  };
  changedAt: string;
}

export interface Order {
  id: string;
  orderName: string;
  amazonOrderNumber: string;
  buyerPaypal: string;
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
