import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { authApi, setAuthToken } from './api';

export interface User {
  id: string;
  email?: string;
  role?: string;
  company_name?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, turnstile_token?: string) => Promise<{ requiresOTP: boolean; email?: string; user?: User }>;
  register: (email: string, password: string, role?: string, company_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to translate Supabase errors
const translateError = (message: string) => {
  if (message.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı';
  if (message.includes('User already registered')) return 'Bu e-posta adresi zaten kayıtlı';
  if (message.includes('Password should be at least')) return 'Şifre en az 6 karakter olmalıdır';
  if (message.includes('Rate limit exceeded')) return 'Çok fazla deneme yaptınız. Lütfen bekleyin.';
  return message;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to refresh session from HttpOnly cookie on mount
    const initAuth = async () => {
      try {
        const data = await authApi.refresh();
        if (data.token) {
          setToken(data.token);
          setAuthToken(data.token);
          setUser(data.user);
        }
      } catch (error) {
        // Not logged in or expired
        setToken(null);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for OAuth redirects (Supabase handles the URL parsing)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Logic for OAuth login or other client-side auth events
      if (event === 'SIGNED_IN' && session) {
        try {
          // Sync session to backend HttpOnly cookies
          await authApi.sync({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user
          });

          setToken(session.access_token);
          setAuthToken(session.access_token);

          // Fetch full user profile with roles (from backend)
          try {
            const me = await authApi.me();
            setUser(me);
          } catch (e) {
            console.error("Failed to fetch user profile", e);
            // Fallback to session user
            setUser({
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || 'user',
              company_name: session.user.user_metadata?.company_name
            });
          }
        } catch (e) {
          console.error("Session sync failed", e);
        }
      } else if (event === 'SIGNED_OUT') {
        // This might be triggered by our own logout logic or Supabase
        setToken(null);
        setAuthToken(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, turnstile_token?: string): Promise<{ requiresOTP: boolean; email?: string }> => {
    try {
      const data = await authApi.login(email, password, turnstile_token);
      // Backend returns { token, user } — check role for 2FA requirement
      const userRole = data.user?.role;

      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'operator') {
        // Critical role detected: don't set token/user yet.
        // Sign out the just-created backend session, then send OTP.
        try { await authApi.logout(); } catch (_) { /* ignore logout errors */ }
        await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        return { requiresOTP: true, email };
      }

      // Normal user — set session directly
      setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
      return { requiresOTP: false, user: data.user };
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Giriş yapılamadı';
      throw new Error(translateError(msg));
    }
  };

  const register = async (email: string, password: string, role: string = 'user', company_name?: string) => {
    try {
      const data = await authApi.register(email, password, role, company_name);
      // Backend returns { token, user } (and signs in automatically)
      setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Kayıt yapılamadı';
      throw new Error(translateError(msg));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      setToken(null);
      setAuthToken(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(translateError(error.message));
    } catch (error: any) {
      throw new Error(translateError(error.message || 'Şifre sıfırlama e-postası gönderilemedi'));
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw new Error(translateError(error.message));
    } catch (error: any) {
      throw new Error(translateError(error.message || 'Şifre güncellenemedi'));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
        }
      });
      if (error) throw new Error(translateError(error.message));
    } catch (error: any) {
      throw new Error(translateError(error.message || 'Google ile giriş başarısız'));
    }
  };

  const sendEmailOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(translateError(error.message || 'OTP gönderilemedi'));
    }
  };

  const verifyEmailOTP = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (error) throw error;
      if (data.session) {
        await authApi.sync({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user: data.user
        });
        setToken(data.session.access_token);
        setAuthToken(data.session.access_token);
        // Fetch full profile
        try {
          const me = await authApi.me();
          setUser(me);
        } catch (e) {
          setUser({
            id: data.user!.id,
            email: data.user!.email,
            role: 'user', // default
            company_name: null
          });
        }
      }
    } catch (error: any) {
      throw new Error(translateError(error.message || 'OTP doğrulanamadı'));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, resetPassword, updatePassword, sendEmailOTP, verifyEmailOTP, signInWithGoogle, loading }}>
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
