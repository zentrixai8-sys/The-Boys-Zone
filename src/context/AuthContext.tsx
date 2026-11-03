import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [loginTime, setLoginTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserState = (profile: User) => {
    setUser(profile);
    setLoginTime(Date.now());
  };

  useEffect(() => {
    // Safety Timeout: Force finish loading after 3 seconds if auth hangs
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const fetchProfile = async (sessionUser: any) => {
      try {
        // Use maybeSingle() instead of single() to prevent HTTP 406 error when profile row doesn't exist yet
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (error) {
          console.warn('Profile fetch warning:', error);
        }

        if (!profile) {
          // Verify if we are still supposed to be logged in before creating
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) return;

          const meta = sessionUser.user_metadata || {};
          const profilePayload = {
            id: sessionUser.id,
            name: meta.name || sessionUser.email?.split('@')[0] || 'User',
            email: sessionUser.email || '',
            phone: meta.phone || '',
            role: meta.role || 'user',
            avatar_url: meta.avatar_url || null,
          };

          // Auto-create missing profile with all required columns (including email) to prevent 400 Bad Request
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert([profilePayload])
            .select()
            .maybeSingle();

          if (upsertError) {
            console.error('Profile creation error:', upsertError);
          } else if (newProfile) {
            updateUserState(newProfile);
          }
        } else {
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
        const initialUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          phone: session.user.user_metadata?.phone || '',
          address: session.user.user_metadata?.address || '',
          district: session.user.user_metadata?.district || '',
          state: session.user.user_metadata?.state || '',
          pincode: session.user.user_metadata?.pincode || '',
          role: session.user.user_metadata?.role || 'user',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at
        };
        
        setUser(initialUser);
        setLoginTime(Date.now());

        // Background Sync with Profile Table
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoginTime(null);
        setLoading(false);
        clearTimeout(safetyTimer);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setUser(null);
        setLoginTime(null);
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
    setUser(null);
    setLoginTime(null);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase signOut error (ignored):', e);
    }

    toast.success('Logged out successfully');
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
