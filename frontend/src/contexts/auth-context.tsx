'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  roles?: string[]; // Assuming backend returns roles as array of strings
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, redirectPath?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check for Development Mode Bypass
    if (process.env.NODE_ENV === 'development') {
      const path = window.location.pathname;
      let devUser: User | null = null;

      if (path.includes('/admin')) {
        devUser = {
          id: 'dev-admin',
          email: 'admin@ratevoice.com',
          fullName: 'Dev Admin',
          roles: ['SUPER_ADMIN'],
          mustChangePassword: false,
        };
      } else if (path.includes('/business')) {
        devUser = {
          id: 'dev-business',
          email: 'business@ratevoice.com',
          fullName: 'Dev Business Owner',
          roles: ['BUSINESS'],
          mustChangePassword: false,
        };
      } else {
        // Default dev user (fallback)
        devUser = {
          id: 'sandbox_establishment_owner',
          email: 'testhotel@ratevoice.ai',
          fullName: 'Test Hotel Owner',
          roles: ['BUSINESS'],
          mustChangePassword: false,
        };
      }
      
      if (devUser) {
        setUser(devUser);
        setToken('dev_mode_bypass_token');
        setIsLoading(false);
        
        // Auto-redirect if on public pages
        if (path === '/login' || path === '/' || path === '/register' || path === '/admin/login') {
          if (devUser.roles?.includes('SUPER_ADMIN')) {
             router.push('/admin/dashboard');
          } else {
             router.push('/business/dashboard');
          }
        }
        return;
      }
    }

    // 2. Normal Auth Flow
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, redirectPath = '/dashboard') => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    if (newUser.mustChangePassword) {
      router.push('/admin/change-password');
    } else {
      router.push(redirectPath);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
