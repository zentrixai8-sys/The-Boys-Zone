import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

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
  const [user, setUser] = useState<User | null>(null);
  const [loginTime, setLoginTime] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedLoginTime = localStorage.getItem('loginTime');
    if (savedUser && savedUser !== 'undefined') {
      try {
        setUser(JSON.parse(savedUser));
        if (savedLoginTime) {
          setLoginTime(parseInt(savedLoginTime, 10));
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
      }
    }
  }, []);

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
