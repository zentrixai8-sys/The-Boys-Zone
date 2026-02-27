import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cart } = useCart();
  const { user, loginTime, logout, isAdmin } = useAuth();
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
  ];

  if (!isAdmin) {
    navLinks.push({ name: 'About', path: '/about' });
    navLinks.push({ name: 'Contact', path: '/contact' });
  }

  if (user && !isAdmin) {
    navLinks.push({ name: 'My Orders', path: '/profile' });
  }

  return (
    <nav className="sticky top-0 z-[100] bg-white border-b border-black/5 transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">

          {/* Logo (Left) */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3">
            <img
              src="https://i.ibb.co/Pvj8V4T7/Whats-App-Image-2026-02-26-at-2-40-25-PM.jpg"
              alt="The Boys Zone Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-lg shadow-sm"
            />
            <span className="hidden lg:block text-xl font-serif font-black tracking-tight text-gray-900 uppercase">
              The Boys Zone
            </span>
          </Link>

          {/* Nav Links (Center) */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-[13px] font-semibold tracking-wide transition-colors ${isActive(link.path) ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-gray-600 hover:text-gray-900 transition-colors">
                  Admin
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white border border-gray-100 shadow-xl rounded-2xl w-48 py-2 flex flex-col overflow-hidden relative">
                    {/* Add a little invisible bridge to prevent hover loss */}
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
                    
                    <Link to="/admin" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/billing" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Billing
                    </Link>
                    <Link to="/admin/orders" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Orders
                    </Link>
                    <Link to="/admin/products" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Products
                    </Link>
                    <Link to="/admin/today-report" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Today Report
                    </Link>
                    <Link to="/admin/inventory" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Inventory
                    </Link>
                    <Link to="/admin/setting" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Setting
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center justify-end gap-2 sm:gap-6 flex-shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="relative hidden lg:block w-64 mr-2"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-[13px] font-medium text-gray-900 rounded-full pl-10 pr-4 py-2 border border-black/5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/10 transition-all placeholder:text-gray-400"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>


            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 pr-2 sm:pr-4 pl-1 sm:pl-1.5 py-1 sm:py-1.5 rounded-full border border-gray-100 hover:border-gray-300 transition-all shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100/50 overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-start pr-1">
                    <span className="text-[14px] font-bold text-gray-800 leading-tight">
                      {user.name.toUpperCase()}
                    </span>
                    {loginTime && (
                      <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">
                        Logged in • {new Date(loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white border border-gray-100 shadow-xl rounded-2xl w-60 py-2 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100/50 overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-indigo-700">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Signed in as</p>
                          <p className="text-[15px] font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-[12px] text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    {!isAdmin && (
                      <Link to="/profile" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center gap-3">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="px-5 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 text-left transition-colors flex items-center gap-3"
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
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-gray-900 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {cart.totalItems}
                </span>
              )}
            </Link>

            {user && (
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1.5 text-gray-600 hover:text-red-600 font-semibold text-[13px] ml-1 sm:ml-2 transition-colors"
              >
                <LogOut className="w-4 h-4 stroke-2" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            )}

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
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    setIsMenuOpen(false);
                  }
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none border border-black/5"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </form>
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
                <div className="flex flex-col gap-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Admin Menu</div>
                  <Link to="/admin" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Dashboard</Link>
                  <Link to="/billing" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Billing</Link>
                  <Link to="/admin/orders" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Orders</Link>
                  <Link to="/admin/products" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Products</Link>
                  <Link to="/admin/today-report" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Today Report</Link>
                  <Link to="/admin/inventory" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Inventory</Link>
                  <Link to="/admin/setting" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Setting</Link>
                </div>
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
