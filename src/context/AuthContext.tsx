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
      // If a logout was triggered, NEVER restore from cache — block auto-login on refresh
      if (sessionStorage.getItem('tbz_force_logout') === '1') return null;
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

  const updateUserState = (profile: User) => {
    setUser(profile);
    setLoginTime(Date.now());
    localStorage.setItem('tbz_user_profile', JSON.stringify(profile));
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
        // If force-logout flag is set, refuse to restore session — sign out and stop
        if (sessionStorage.getItem('tbz_force_logout') === '1') {
          await supabase.auth.signOut({ scope: 'local' });
          setLoading(false);
          return;
        }
        // Clear any stale logout flag — user is actively logging in
        sessionStorage.removeItem('tbz_force_logout');
        
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

  const logout = async () => {
    // 1. Set force-logout flag FIRST — this blocks getCachedUser on any future refresh
    sessionStorage.setItem('tbz_force_logout', '1');
    
    // 2. Instantly clear UI state
    setUser(null);
    setLoginTime(null);
    localStorage.removeItem('tbz_user_profile');
    sessionStorage.removeItem('tbz_active_session');
    
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('Supabase signOut error (ignored):', e);
    }
    
    toast.success('Logged out successfully');
    
    // 3. Hard redirect immediately — no setTimeout to avoid race conditions
    window.location.href = '/login';
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
