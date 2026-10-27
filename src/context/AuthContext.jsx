import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'admin' | null
  const [loading, setLoading] = useState(true);

  // Fetch user profile from public.profiles table
  const fetchUserProfile = useCallback(async (userId, userMetadata = {}) => {
    if (!isSupabaseConfigured || !userId) {
      setProfile(null);
      setRole(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[FindIt Auth] Error fetching profile:', error.message);
        // Fallback profile if table or row not yet ready
        const fallback = {
          id: userId,
          full_name: userMetadata.full_name || '',
          role: 'student',
        };
        setProfile(fallback);
        setRole('student');
        return fallback;
      }

      if (data) {
        setProfile(data);
        setRole(data.role || 'student');
        return data;
      } else {
        // Row not found (e.g. trigger didn't run): default to student role
        const fallback = {
          id: userId,
          full_name: userMetadata.full_name || '',
          role: 'student',
        };
        setProfile(fallback);
        setRole('student');
        return fallback;
      }
    } catch (err) {
      console.error('[FindIt Auth] Unexpected profile error:', err);
      setRole('student');
      return null;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.user_metadata);
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error('[FindIt Auth] Session check error:', err.message);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.user_metadata);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Sign In function
  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase is not configured. Please configure your .env file.'),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!error && data?.user) {
      setUser(data.user);
      await fetchUserProfile(data.user.id, data.user.user_metadata);
    }

    return { data, error };
  };

  // Sign Up function
  const register = async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase is not configured. Please configure your .env file.'),
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    return { data, error };
  };

  // Sign Out function
  const logout = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setProfile(null);
      setRole(null);
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    return { error };
  };

  // Refresh profile manually if role was updated
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id, user.user_metadata);
    }
  };

  const value = {
    user,
    profile,
    role,
    isAdmin: role === 'admin',
    isStudent: role === 'student',
    loading,
    isConfigured: isSupabaseConfigured,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
