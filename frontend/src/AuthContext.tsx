import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from './lib/supabase';
import { translateError } from './lib/errorTranslations';
import { favoritesApi } from './api';
import type { User, AuthContextType } from './types';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [_session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Check if there's a pending 2FA verification
        const pending2FA = localStorage.getItem('pending_2fa_email');
        if (pending2FA) {
          // Don't load profile yet, 2FA is pending
          setLoading(false);
          return;
        }
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        // Check if this is from OAuth (SIGNED_IN event) and user is admin/operator
        const metadata = session.user.user_metadata;
        const userRole = metadata?.user_role;

        // If admin/operator signing in via OAuth, require 2FA
        if (event === 'SIGNED_IN' && (userRole === 'admin' || userRole === 'super_admin' || userRole === 'operator')) {
          const email = session.user.email;
          if (email && !localStorage.getItem('pending_2fa_email')) {
            // Sign out and require OTP
            localStorage.setItem('pending_2fa_email', email);
            await supabase.auth.signOut();
            // Send OTP
            await supabase.auth.signInWithOtp({
              email,
              options: { shouldCreateUser: false }
            });
            setLoading(false);
            return;
          }
        }

        // Check if there's a pending 2FA verification
        const pending2FA = localStorage.getItem('pending_2fa_email');
        if (pending2FA) {
          setLoading(false);
          return;
        }

        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        email: data.email,
        role: data.user_role,
        company_name: data.company_name,
        created_at: data.created_at
      });
    } catch (error: any) {
      console.error('Kullanıcı profili yüklenemedi:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ requiresOTP: boolean; email?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(translateError(error.message));

      if (data.session && data.user) {
        // Check if user is admin or operator - require 2FA
        const metadata = data.user.user_metadata;
        const userRole = metadata?.user_role;

        if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'operator') {
          // Admin/Operator needs 2FA - sign out and require OTP
          await supabase.auth.signOut();
          // Send OTP to email
          await sendEmailOTP(email);
          return { requiresOTP: true, email };
        }

        // Non-admin users - complete login normally
        setSession(data.session);
        setToken(data.session.access_token);
        localStorage.setItem('token', data.session.access_token);

        if (metadata && metadata.user_role) {
          setUser({
            email: data.user.email || email,
            role: metadata.user_role,
            company_name: metadata.company_name,
            created_at: data.user.created_at
          });
        } else {
          await loadUserProfile(data.user.id);
        }

        // Sync localStorage favorites to database after login
        try {
          const localFavorites = localStorage.getItem('hac_umre_favorites');
          if (localFavorites) {
            const tourIds = JSON.parse(localFavorites);
            if (Array.isArray(tourIds) && tourIds.length > 0) {
              await favoritesApi.sync(tourIds);
              localStorage.removeItem('hac_umre_favorites');
            }
          }
        } catch (syncError) {
          console.error('Favorites sync error:', syncError);
        }

        return { requiresOTP: false };
      }

      return { requiresOTP: false };
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Giriş başarısız');
    }
  };

  const sendEmailOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      if (error) throw new Error(translateError(error.message));
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Doğrulama kodu gönderilemedi');
    }
  };

  const verifyEmailOTP = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw new Error(translateError(error.message));

      if (data.session && data.user) {
        setSession(data.session);
        setToken(data.session.access_token);
        localStorage.setItem('token', data.session.access_token);

        const metadata = data.user.user_metadata;
        if (metadata && metadata.user_role) {
          setUser({
            email: data.user.email || email,
            role: metadata.user_role,
            company_name: metadata.company_name,
            created_at: data.user.created_at
          });
        } else {
          await loadUserProfile(data.user.id);
        }
      }
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Doğrulama başarısız');
    }
  };

  const register = async (email: string, password: string, company_name?: string) => {
    try {
      const user_role = company_name ? 'operator' : 'user';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_role,
            company_name,
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error.message, error);
        throw new Error(translateError(error.message));
      }

      if (data.session && data.user) {
        setSession(data.session);
        setToken(data.session.access_token);

        // Save to localStorage for API calls
        localStorage.setItem('token', data.session.access_token);

        // Use metadata directly instead of extra DB query - FASTER!
        setUser({
          email: data.user.email || email,
          role: user_role,
          company_name: company_name,
          created_at: data.user.created_at
        });
      }
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Kayıt başarısız');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(translateError(error.message));
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Şifre sıfırlama e-postası gönderilemedi');
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw new Error(translateError(error.message));
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Şifre güncellenemedi');
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
      throw new Error(translateError(error.message) || 'Google ile giriş başarısız');
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
