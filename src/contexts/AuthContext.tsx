import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types/order';
import { registerUser, loginUser } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (email: string, password: string, username?: string, role?: UserRole) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@example.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@example.com',
      username: 'admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  },
  'user@example.com': {
    password: 'user123',
    user: {
      id: '2',
      email: 'user@example.com',
      username: 'john_doe',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Listen for auth logout events (from 401 interceptor)
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      // Redirect to login with session expired message
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true';
      }
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser({ email, password });
      const token = res.data?.token;
      const data = res.data?.data;

      if (!token || !data) {
        throw new Error('Invalid server response');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id ?? data.id ?? '',
        email: data.email,
        username: data.username,
        role: data.role,
        createdAt: data.createdAt,
      }));

      setUser({
        id: data._id ?? data.id ?? '',
        email: data.email,
        username: data.username,
        role: data.role,
        createdAt: data.createdAt,
      });

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const message = (err as any)?.response?.data?.message || (err as Error).message || 'Login failed';
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      await registerUser({ username: username ?? email.split('@')[0], email, password, role });

      // After successful registration, log in to get token and user data
      const res = await loginUser({ email, password });
      const token = res.data?.token;
      const data = res.data?.data;

      if (!token || !data) {
        throw new Error('Invalid server response');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id ?? data.id ?? '',
        email: data.email,
        username: data.username,
        role: data.role,
        createdAt: data.createdAt,
      }));

      setUser({
        id: data._id ?? data.id ?? '',
        email: data.email,
        username: data.username,
        role: data.role,
        createdAt: data.createdAt,
      });

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const message = (err as any)?.response?.data?.message || (err as Error).message || 'Registration failed';
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signUp,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
