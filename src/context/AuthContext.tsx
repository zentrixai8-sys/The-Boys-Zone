import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loginTime: number | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Instant Hydration from localStorage
  const getCachedUser = () => {
    try {
      const cached = localStorage.getItem('tbz_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loginTime, setLoginTime] = useState<number | null>(user ? Date.now() : null);
  // If we have a cached user, we can set loading to false immediately to show the UI
  const [loading, setLoading] = useState(!user);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // 2. Safety Timeout: Force finish loading after 3 seconds no matter what
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // 3. Single Source of Truth: onAuthStateChange handles INITIAL_SESSION + Dynamic changes
    const fetchProfile = async (sessionUser: any) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile missing, create it
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert([{
              id: sessionUser.id,
              name: sessionUser.user_metadata.name || 'User',
              email: sessionUser.email,
              phone: sessionUser.user_metadata.phone || '',
            }])
            .select()
            .single();
          
          if (newProfile) {
            updateUserState(newProfile);
          }
        } else if (profile) {
          updateUserState(profile);
        }
      } catch (e) {
        console.error('Profile fetch failed', e);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    const updateUserState = (profile: User) => {
      setUser(profile);
      setLoginTime(Date.now());
      localStorage.setItem('tbz_user_profile', JSON.stringify(profile));
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoginTime(null);
        localStorage.removeItem('tbz_user_profile');
        setLoading(false);
        clearTimeout(safetyTimer);
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session found on load
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const login = (userData: User) => {
    updateUserState(userData);
  };

  const updateUserState = (profile: User) => {
    setUser(profile);
    setLoginTime(Date.now());
    localStorage.setItem('tbz_user_profile', JSON.stringify(profile));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoginTime(null);
    localStorage.removeItem('tbz_user_profile');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    updateUserState(updatedUser);
  };

  const isAdmin = user?.role === 'admin';

  // Inactivity session logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let lastActivity = Date.now();
    const INACTIVITY_LIMIT = 30 * 60 * 1000;

    const checkInactivity = () => {
      const now = Date.now();
      if (user && (now - lastActivity >= INACTIVITY_LIMIT)) {
        logout();
        toast.error('Session expired due to inactivity.', { id: 'session-expired' });
      }
    };

    const resetTimer = () => { lastActivity = Date.now(); };

    if (user) {
      intervalId = setInterval(checkInactivity, 5000);
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
      return () => {
        clearInterval(intervalId);
        events.forEach(e => window.removeEventListener(e, resetTimer));
      };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loginTime, loading, login, logout, updateUser, isAdmin }}>
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
