'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface PjpUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  subscriptionTier: string;
  avatarUrl?: string;
  primaryBase?: string | null;
  profile?: ProfileRow;
}

interface AuthContextValue {
  user: PjpUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuestMode: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  refreshProfile: () => Promise<void>;
}

const SPECIMEN_GUEST_USER: PjpUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'captain.coursey@privatejetpilots.com',
  fullName: 'JEFF COURSEY',
  role: 'pilot',
  isVerified: true,
  subscriptionTier: 'pro',
  primaryBase: 'KTEB',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PjpUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(true);

  const fetchProfileForUser = useCallback(async (userId: string, email = ''): Promise<PjpUser> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AuthContext] Failed to load profile:', error.message);
      }

      const p = profile as ProfileRow | null;
      
      // Resolve user full name: profile.full_name -> auth user_metadata -> email username -> 'AIRMAN'
      const { data: authUserData } = await supabase.auth.getUser();
      const metaName = authUserData?.user?.user_metadata?.full_name || authUserData?.user?.user_metadata?.name;
      const emailPrefix = (email || p?.email || '').split('@')[0];
      const derivedName = p?.full_name || metaName || (emailPrefix ? emailPrefix.toUpperCase() : 'AIRMAN');

      return {
        id: userId,
        email: email || p?.email || '',
        fullName: derivedName,
        role: p?.role || authUserData?.user?.user_metadata?.role || 'pilot',
        isVerified: Boolean(p?.is_verified ?? true),
        subscriptionTier: p?.subscription_tier || 'pro',
        avatarUrl: p?.avatar_url || undefined,
        primaryBase: p?.primary_base || 'KTEB',
        profile: p || undefined,
      };
    } catch (e) {
      console.error('[AuthContext] Error in fetchProfileForUser:', e);
      return {
        ...SPECIMEN_GUEST_USER,
        id: userId,
        email,
      };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user || isGuestMode) return;
    const updated = await fetchProfileForUser(user.id, user.email);
    setUser(updated);
  }, [user, isGuestMode, fetchProfileForUser]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setUser(SPECIMEN_GUEST_USER);
          setIsGuestMode(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const loadedUser = await fetchProfileForUser(session.user.id, session.user.email);
          setUser(loadedUser);
          setIsGuestMode(false);
        } else if (mounted) {
          setUser(SPECIMEN_GUEST_USER);
          setIsGuestMode(true);
        }
      } catch (err) {
        console.error('[AuthContext] Initialization failed:', err);
        if (mounted) {
          setUser(SPECIMEN_GUEST_USER);
          setIsGuestMode(true);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void initAuth();

    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(SPECIMEN_GUEST_USER);
        setIsGuestMode(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        const loggedInUser = await fetchProfileForUser(session.user.id, session.user.email);
        setUser(loggedInUser);
        setIsGuestMode(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfileForUser]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase client is offline or missing credentials.') };
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { error };

      if (data.user) {
        const loaded = await fetchProfileForUser(data.user.id, data.user.email);
        setUser(loaded);
        setIsGuestMode(false);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfileForUser]);

  const signUpWithPassword = useCallback(async (email: string, password: string, fullName: string, role = 'pilot') => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase client is offline or missing credentials.') };
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });
      if (error) return { error };

      if (data.user) {
        const loaded = await fetchProfileForUser(data.user.id, data.user.email);
        setUser(loaded);
        setIsGuestMode(false);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfileForUser]);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      setUser(SPECIMEN_GUEST_USER);
      setIsGuestMode(true);
      // Clean up any remaining cached supabase auth keys in local storage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    setUser(SPECIMEN_GUEST_USER);
    setIsGuestMode(true);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !isGuestMode && Boolean(user),
    isLoading,
    isGuestMode,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    enterGuestMode,
    refreshProfile,
  }), [user, isGuestMode, isLoading, signInWithPassword, signUpWithPassword, signOut, enterGuestMode, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
