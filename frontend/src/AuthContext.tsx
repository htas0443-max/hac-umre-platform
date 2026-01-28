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
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token); // Save to localStorage
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token); // Save to localStorage
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token'); // Clear localStorage
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

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(translateError(error.message));

      if (data.session && data.user) {
        setSession(data.session);
        setToken(data.session.access_token);

        // Save to localStorage for API calls
        localStorage.setItem('token', data.session.access_token);

        // Use metadata for faster login - avoid extra DB query
        const metadata = data.user.user_metadata;
        if (metadata && metadata.user_role) {
          setUser({
            email: data.user.email || email,
            role: metadata.user_role,
            company_name: metadata.company_name,
            created_at: data.user.created_at
          });
        } else {
          // Fallback to profile load only if metadata missing
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
          // Sync error should not block login
          console.error('Favorites sync error:', syncError);
        }
      }
    } catch (error: any) {
      throw new Error(translateError(error.message) || 'Giriş başarısız');
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

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, resetPassword, updatePassword, loading }}>
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
