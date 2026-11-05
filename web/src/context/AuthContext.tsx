// ============================================================
// d:\ABHAYA\web\src\context\AuthContext.tsx
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrPhone: string, pass: string) => Promise<boolean>;
  demoLogin: (role: UserRole) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('abhaya_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session or default to Priya Sharma for seamless demo testing
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('abhaya_token');
      const storedUser = localStorage.getItem('abhaya_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          localStorage.removeItem('abhaya_user');
          localStorage.removeItem('abhaya_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (emailOrPhone: string, pass: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/login', { emailOrPhone, password: pass });
      if (res.data?.success && res.data?.data) {
        const { token: jwt, user: u } = res.data.data;
        setUser(u);
        setToken(jwt);
        localStorage.setItem('abhaya_token', jwt);
        localStorage.setItem('abhaya_user', JSON.stringify(u));
        return true;
      }
    } catch {
      // Direct mock fallback for development demo credentials
      if (emailOrPhone.includes('priya') || pass === 'Priya@123') {
        return demoLogin('primary_user');
      }
      if (emailOrPhone.includes('rahul') || pass === 'Rahul@123') {
        return demoLogin('trusted_contact');
      }
    }
    return false;
  };

  const demoLogin = async (role: UserRole): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/demo-login', { role });
      if (res.data?.success && res.data?.data) {
        const { token: jwt, user: u } = res.data.data;
        setUser(u);
        setToken(jwt);
        localStorage.setItem('abhaya_token', jwt);
        localStorage.setItem('abhaya_user', JSON.stringify(u));
        return true;
      }
    } catch {
      console.warn('Backend unavailable, using client demo session.');
    }

    // Client mock demo user
    let mockUser: User;
    if (role === 'primary_user') {
      mockUser = {
        id: 'usr-priya-001',
        abhayaId: 'ABHAYA-USER-1001',
        email: 'priya@abhaya.demo',
        phone: '+919000000001',
        role: 'primary_user',
        profile: {
          id: 'prof-priya-001',
          user_id: 'usr-priya-001',
          full_name: 'Priya Sharma',
          display_name: 'Priya',
          bio: 'Software engineer living in Uttam Nagar, New Delhi.',
          preferred_language: 'en',
          profile_picture_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
          emergency_message: 'Please help! I have activated emergency SOS via ABHAYA.',
        },
      };
    } else if (role === 'trusted_contact') {
      mockUser = {
        id: 'usr-rahul-002',
        abhayaId: 'ABHAYA-USER-1002',
        email: 'rahul@abhaya.demo',
        phone: '+919000000002',
        role: 'trusted_contact',
        profile: {
          id: 'prof-rahul-002',
          user_id: 'usr-rahul-002',
          full_name: 'Rahul Sharma',
          display_name: 'Rahul',
          bio: 'Brother and trusted contact for Priya Sharma.',
          preferred_language: 'en',
          profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
          emergency_message: '',
        },
      };
    } else {
      mockUser = {
        id: 'usr-admin-003',
        abhayaId: 'ABHAYA-ADMIN-0001',
        email: 'admin@abhaya.demo',
        phone: '+919000000003',
        role: 'admin',
        profile: {
          id: 'prof-admin-003',
          user_id: 'usr-admin-003',
          full_name: 'ABHAYA Safety Moderator',
          display_name: 'Moderator',
          bio: 'Auditor & safety operations administrator.',
          preferred_language: 'en',
          profile_picture_url: null,
          emergency_message: '',
        },
      };
    }

    const mockToken = `demo_jwt_token_${role}_${Date.now()}`;
    setUser(mockUser);
    setToken(mockToken);
    localStorage.setItem('abhaya_token', mockToken);
    localStorage.setItem('abhaya_user', JSON.stringify(mockUser));
    return true;
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res.data?.success && res.data?.data) {
        const { token: jwt, user: u } = res.data.data;
        setUser(u);
        setToken(jwt);
        localStorage.setItem('abhaya_token', jwt);
        localStorage.setItem('abhaya_user', JSON.stringify(u));
        return true;
      }
    } catch {
      // Fallback register
      const mockUser: User = {
        id: `usr-${Date.now()}`,
        abhayaId: `ABHAYA-USER-${Math.floor(1000 + Math.random() * 9000)}`,
        email: data.email,
        phone: data.phone,
        role: data.role || 'primary_user',
        profile: {
          id: `prof-${Date.now()}`,
          user_id: `usr-${Date.now()}`,
          full_name: data.full_name,
          display_name: data.full_name.split(' ')[0],
          bio: '',
          preferred_language: data.preferred_language || 'en',
          profile_picture_url: null,
          emergency_message: 'Emergency SOS activated via ABHAYA.',
        },
      };
      const mockToken = `jwt_${Date.now()}`;
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('abhaya_token', mockToken);
      localStorage.setItem('abhaya_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('abhaya_token');
    localStorage.removeItem('abhaya_user');
    localStorage.removeItem('abhaya_active_sos');
    localStorage.removeItem('abhaya_sos_timestamp');
    localStorage.removeItem('abhaya_live_loc');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
