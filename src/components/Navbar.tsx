import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'About', path: '/#about' }, // Assuming these link to sections or pages
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-black/5 transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo (Left) */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <span className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
              Boys Zone
            </span>
          </Link>

          {/* Nav Links (Center) */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-[13px] font-semibold tracking-wide transition-colors ${
                  isActive(link.path) ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <>
                <Link to="/billing" className="text-[13px] font-semibold tracking-wide text-gray-600 hover:text-gray-900 transition-colors">
                  Billing
                </Link>
                <Link to="/admin" className="text-[13px] font-semibold tracking-wide text-gray-600 hover:text-gray-900 transition-colors">
                  Admin
                </Link>
              </>
            )}
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center justify-end gap-6 flex-shrink-0">
            <button className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>
            
            {user ? (
              <div className="relative group">
                <button className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                  <User className="w-5 h-5 stroke-[1.5]" />
                </button>
                <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white border border-gray-100 shadow-xl rounded-xl w-48 py-2 flex flex-col">
                     <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                     </div>
                     <Link to="/profile" className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">My Profile</Link>
                     <button 
                        onClick={() => { logout(); navigate('/'); }}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors flex items-center gap-2"
                     >
                        <LogOut className="w-4 h-4" /> Sign out
                     </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                <User className="w-5 h-5 stroke-[1.5]" />
              </Link>
            )}

            <Link to="/cart" className="text-gray-600 hover:text-gray-900 transition-colors relative">
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-gray-900 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {totalItems}
                </span>
              )}
            </Link>

            <button 
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
               {navLinks.map((link) => (
                  <Link 
                     key={link.name}
                     to={link.path} 
                     className={`text-lg font-serif font-medium ${isActive(link.path) ? 'text-indigo-600' : 'text-gray-900'}`}
                  >
                     {link.name}
                  </Link>
               ))}
               {isAdmin && (
                 <>
                   <Link to="/billing" className="text-lg font-serif font-medium text-gray-900">Billing</Link>
                   <Link to="/admin" className="text-lg font-serif font-medium text-gray-900">Admin Panel</Link>
                 </>
               )}
               <hr className="border-gray-100" />
               {!user ? (
                  <Link to="/login" className="text-lg font-serif font-medium text-gray-900">Sign In</Link>
               ) : (
                  <button onClick={() => { logout(); navigate('/'); }} className="text-lg font-serif font-medium text-red-600 text-left">
                     Sign Out
                  </button>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
