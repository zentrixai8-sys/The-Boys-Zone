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
  // 1. Instant Hydration from sessionStorage
  const getCachedUser = () => {
    try {
      const cached = sessionStorage.getItem('tbz_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loginTime, setLoginTime] = useState<number | null>(user ? Date.now() : null);
  // If we have a cached user, we can set loading to false immediately to show the UI
  const [loading, setLoading] = useState(!user);

  const updateUserState = (profile: User) => {
    setUser(profile);
    setLoginTime(Date.now());
    sessionStorage.setItem('tbz_user_profile', JSON.stringify(profile));
  };

  useEffect(() => {
    // 2. Safety Timeout: Force finish loading after 3 seconds no matter what
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const fetchProfile = async (sessionUser: any) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Verify if we are still supposed to be logged in before creating/updating
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) return;

          // Profile missing, create it
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert([{
              id: sessionUser.id,
              name: sessionUser.user_metadata.name || 'User',
              email: sessionUser.email,
              phone: sessionUser.user_metadata.phone || '',
              password: 'auto_generated'
            }])
            .select()
            .single();
          
          if (newProfile) {
            updateUserState(newProfile);
          } else if (upsertError) {
            await supabase.from('categories').insert([{ category_name: 'DEBUG_PROFILE', image_url: JSON.stringify(upsertError) }]);
          }
        } else if (profile) {
          // Verify if we are still supposed to be logged in before updating state
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) return;
          
          updateUserState(profile);
        }
      } catch (e) {
        console.error('Profile fetch failed', e);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // 1. Instant Hydration from metadata (So the name appears immediately)
        const initialUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || 'User',
          phone: session.user.user_metadata.phone || '',
          address: session.user.user_metadata.address || '',
          district: session.user.user_metadata.district || '',
          state: session.user.user_metadata.state || '',
          pincode: session.user.user_metadata.pincode || '',
          role: session.user.user_metadata.role || 'user',
          avatar_url: session.user.user_metadata.avatar_url,
          created_at: session.user.created_at
        };
        
        setUser(initialUser);
        setLoginTime(Date.now());

        // 2. Background Sync with Profile Table (Detailed data)
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoginTime(null);
        sessionStorage.removeItem('tbz_user_profile');
        setLoading(false);
        clearTimeout(safetyTimer);
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session found on load
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    // 3. Single Session Enforcer: Prevent simultaneous logins for the same user ID
    const sessionValidator = setInterval(async () => {
      const currentToken = sessionStorage.getItem('tbz_active_session');
      if (!currentToken) return; // Not fully logged in or bypassed

      const { data } = await supabase.auth.getUser();
      const remoteToken = data?.user?.user_metadata?.session_id;

      if (remoteToken && remoteToken !== currentToken) {
        toast.error('Session expired: You logged into this account from another location.', { duration: 5000 });
        // Trigger manual cleanup because another session took over
        setUser(null);
        setLoginTime(null);
        sessionStorage.removeItem('tbz_user_profile');
        sessionStorage.clear();
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }, 15000); // Check every 15 seconds

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
      clearInterval(sessionValidator);
    };
  }, []);

  const login = (userData: User) => {
    updateUserState(userData);
  };

  const logout = async () => {
    try {
      // 1. Force clear state immediately for instant UI response
      setUser(null);
      setLoginTime(null);
      
      // 2. Wipe Profile Cache
      sessionStorage.removeItem('tbz_user_profile');
      
      // 3. Trigger Supabase SignOut (This handles dynamic storage key automatically)
      await supabase.auth.signOut();
      
      // 4. Forcefully clear ALL session storage to absolutely guarantee local logout
      sessionStorage.clear();
      
      toast.success('Logged out successfully');
      
      // 5. Hard redirect to clear any React memory state, SWR caches, and URL hash fragments
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (e) {
      console.error('Logout error', e);
      // Fallback: forcefully clear all session storage to guarantee local logout
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    updateUserState(updatedUser);
  };

  const isAdmin = user?.role === 'admin';

  // Inactivity session logic (30 minutes)
  useEffect(() => {
    let intervalId: any;
    const INACTIVITY_LIMIT = 30 * 60 * 1000;
    const ACTIVITY_KEY = 'tbz_last_activity';

    const checkInactivity = () => {
      const lastActivity = parseInt(sessionStorage.getItem(ACTIVITY_KEY) || Date.now().toString());
      const now = Date.now();
      
      if (user && (now - lastActivity >= INACTIVITY_LIMIT)) {
        logout();
        toast.error('Session expired due to inactivity.', { id: 'session-expired' });
      }
    };

    const resetTimer = () => { 
      sessionStorage.setItem(ACTIVITY_KEY, Date.now().toString()); 
    };

    if (user) {
      // Set initial activity time if not present
      if (!sessionStorage.getItem(ACTIVITY_KEY)) {
        resetTimer();
      }

      intervalId = setInterval(checkInactivity, 10000); // Check every 10 seconds
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
      
      return () => {
        clearInterval(intervalId);
        events.forEach(e => window.removeEventListener(e, resetTimer));
      };
    } else {
      sessionStorage.removeItem(ACTIVITY_KEY);
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
