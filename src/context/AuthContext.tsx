import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loginTime: number | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
    }
    return null;
  });

  const [loginTime, setLoginTime] = useState<number | null>(() => {
    try {
      const savedLoginTime = localStorage.getItem('loginTime');
      if (savedLoginTime) {
        return parseInt(savedLoginTime, 10);
      }
    } catch (e) {
      console.error('Failed to parse loginTime from localStorage', e);
    }
    return null;
  });

  const login = (userData: User) => {
    const time = Date.now();
    setUser(userData);
    setLoginTime(time);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginTime', time.toString());
  };

  const logout = () => {
    setUser(null);
    setLoginTime(null);
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    let lastActivity = Date.now();
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const checkInactivity = () => {
      const now = Date.now();
      if (user && (now - lastActivity >= INACTIVITY_LIMIT)) {
        logout();
        toast.error('Session expired due to inactivity. Please login again.', {
          id: 'session-expired',
          duration: 5000,
        });
      }
    };

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    if (user) {
      // Check for inactivity every second
      intervalId = setInterval(checkInactivity, 1000);
      
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      
      events.forEach((event) => {
        window.addEventListener(event, resetTimer, { passive: true });
      });

      return () => {
        clearInterval(intervalId);
        events.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loginTime, login, logout, updateUser, isAdmin }}>
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
