'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/types';
import { userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: any, options?: { redirect?: string | null; message?: string | null }) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const normalizeUser = (data: any): User => {
    // If the data is already flat, return it
    if (data.firstName) return data;
    
    // Otherwise, flatten it from profile/address structure
    return {
      id: data._id || data.id,
      email: data.email,
      firstName: data.profile?.firstName || '',
      lastName: data.profile?.lastName || '',
      role: data.role || 'learner',
      phone: data.profile?.phone,
      dateOfBirth: data.profile?.dateOfBirth,
      street: data.address?.street,
      city: data.address?.city,
      state: data.address?.state,
      country: data.address?.country,
      zipCode: data.address?.zipCode,
    };
  };

  const login = (token: string, userData: any, options?: { redirect?: string | null; message?: string | null }) => {
    Cookies.set('auth_token', token, { expires: 7 }); // 7 days
    setUser(normalizeUser(userData));
    
    // Use undefined/null check to allow skipping (explicit null)
    if (options?.message !== null) {
      toast.success(options?.message || 'Successfully logged in!');
    }
    
    if (options?.redirect !== null) {
      router.push(options?.redirect || '/courses');
    }
  };

  const logout = () => {
    Cookies.remove('auth_token');
    setUser(null);
    toast.info('Logged out');
    router.push('/login');
  };

  const checkAuth = async () => {
    const token = Cookies.get('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await userApi.get('/me');
      // The backend returns { status: "success", data: userObject }
      const userData = response.data.data || response.data;
      setUser(normalizeUser(userData));
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
