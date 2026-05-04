import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: totalItems },
    { icon: User, label: user ? 'Account' : 'Login', path: user ? '/profile' : '/login' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-[56px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors ${
                active ? 'text-[#2874f0]' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <item.icon
                  className={`w-[20px] h-[20px] ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#ff6161] text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
