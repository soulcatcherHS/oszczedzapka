'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User } from '@/app/types';
import { authApi } from '@/app/lib/api';
import { LoginCredentials, SignupCredentials } from '@/app/lib/validation';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = Cookies.get('token');
    if (token) {
      // In a real app, you'd validate the token with the server
      // For now, we'll just check if it exists
      try {
        // Decode JWT to get user info (in production, validate with server)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          _id: payload.userId,
          email: payload.email,
          username: payload.username,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        Cookies.remove('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        setUser(response.data.user);
        toast.success('Zalogowano pomyślnie!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Błąd logowania';
      toast.error(message);
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      const response = await authApi.signup(credentials);
      if (response.success && response.data) {
        setUser(response.data.user);
        toast.success('Konto utworzone pomyślnie!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Błąd rejestracji';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    toast.success('Wylogowano pomyślnie!');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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