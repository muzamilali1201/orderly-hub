import axios from 'axios';

// Base URL: prefer Vite env var, fallback to localhost
const baseURL = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL,
  withCredentials: false,
});

// Attach token from localStorage on each request as x-auth-token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      // server expects token in x-auth-token header
      config.headers['x-auth-token'] = token;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor to handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || 'Your session has expired. Please log in again.';
      
      // Clear auth data
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        // ignore storage errors
      }

      // Create custom error with clear message
      const authError = new Error(message);
      (authError as any).isAuthError = true;
      (authError as any).status = 401;

      // Redirect to login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Dispatch custom event for auth context to handle
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { message } }));
      }

      return Promise.reject(authError);
    }
    return Promise.reject(error);
  }
);

// --- Auth endpoints ---
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  return api.post('/user/register', payload);
}

export async function loginUser(payload: LoginPayload) {
  return api.post('/user/login', payload);
}

// --- Orders endpoints ---
export interface CreateOrderPayload extends FormData {}

export async function createOrder(payload: CreateOrderPayload, config?: any) {
  // Pass FormData directly; axios will set the multipart boundary
  return api.post('/order/create', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(config || {}),
  });
}

export async function getOrders(params?: { page?: number; perPage?: number; search?: string; filterBy?: string }) {
  return api.get('/order', { params });
}

export async function getOrder(orderId: string) {
  return api.get(`/order/${orderId}`);
}

export async function getOverallOrders() {
  return api.get('/order/overall-orders');
}

export async function getStatusHistory(params?: { page?: number; perPage?: number; limit?: number; orderId?: string; userId?: string; status?: string }) {
  // Legacy endpoint - keep for backward compatibility
  return api.get('/order/status-history', { params });
}

// New alerts/history endpoint as provided
export async function getAlertHistory(params?: { page?: number; perPage?: number; limit?: number; orderId?: string; status?: string }) {
  return api.get('/alert/history', { params });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return api.put(`/order/${orderId}`, { status });
}

export default api;
