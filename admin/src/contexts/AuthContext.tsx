import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AdminUser } from '../types';
import api from '../services/api';

interface AuthContextValue {
  adminUser: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('abhaya_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('abhaya_admin_token')
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/admin/login', { email, password });
      const { token: newToken, admin } = data;

      // Validate admin role
      if (admin.role !== 'admin' && admin.role !== 'superadmin') {
        throw new Error('Access denied: insufficient privileges');
      }

      localStorage.setItem('abhaya_admin_token', newToken);
      localStorage.setItem('abhaya_admin_user', JSON.stringify(admin));
      setToken(newToken);
      setAdminUser(admin);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('abhaya_admin_token');
    localStorage.removeItem('abhaya_admin_user');
    setToken(null);
    setAdminUser(null);
  }, []);

  // Keep token in sync if changed externally (e.g. 401 handler)
  useEffect(() => {
    const stored = localStorage.getItem('abhaya_admin_token');
    if (!stored) {
      setToken(null);
      setAdminUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!adminUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
