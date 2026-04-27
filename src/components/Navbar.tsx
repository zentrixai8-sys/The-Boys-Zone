import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Search, Camera, Eye, Loader2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cart, totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, loginTime, logout, isAdmin, updateUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isViewingDP, setIsViewingDP] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 5MB limit check
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await api.request('uploadFile', { file });
      await api.request('updateProfile', { id: user.id, avatar_url: imageUrl });
      updateUser({ avatar_url: imageUrl });
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to update photo');
    } finally {
      setIsUploading(false);
    }
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
    <nav className="sticky top-0 z-100 bg-white border-b border-black/5 transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">

          {/* Logo (Left) */}
          <Link to="/" className="shrink-0 flex items-center gap-3">
            <img
              src="https://i.ibb.co/Pvj8V4T7/Whats-App-Image-2026-02-26-at-2-40-25-PM.jpg"
              alt="The Boys Zone Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-lg shadow-sm"
            />
            <span className="hidden lg:block text-xl font-serif font-black tracking-tight uppercase animate-premium-shine">
              The Boys Zone
            </span>
          </Link>

          {/* Brand Name next to logo on mobile */}
          <div className="flex-1 md:hidden flex justify-start px-2">
            <span className="text-[11px] font-serif font-black tracking-[0.15em] uppercase whitespace-nowrap animate-premium-shine">
              The Boys Zone
            </span>
          </div>

          {/* Nav Links (Center) */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative group py-1 text-[13px] font-semibold tracking-wide transition-colors ${isActive(link.path) ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 transform origin-left transition-transform duration-300 ease-out ${isActive(link.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </Link>
            ))}
            {isAdmin && (
              <div className="relative group">
                <button className="relative py-1 flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-gray-600 hover:text-gray-900 transition-colors">
                  Admin
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 transform origin-left transition-transform duration-300 ease-out scale-x-0 group-hover:scale-x-100" />
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
                    <Link to="/admin/master" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                      Master DB
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
          <div className="flex items-center justify-end gap-3.5 md:gap-6 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="relative hidden lg:block w-48 mr-2 group"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f8f8] text-[12px] font-bold tracking-wide text-[#051F20] rounded-full pl-10 pr-4 py-2 border border-transparent focus:bg-white focus:outline-none focus:border-[#8EB69B] focus:ring-2 focus:ring-[#8EB69B]/20 transition-all placeholder:text-gray-400 group-hover:bg-[#f0f0f0]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#051F20] transition-colors" />
            </form>


            {user ? (
              <div className="relative group">
                <div className="flex items-center gap-2 md:pr-4 md:pl-1.5 py-1.5 rounded-full transition-all cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100/50 overflow-hidden shrink-0 shadow-sm">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-700">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start pr-1">
                    <span className="text-[13px] font-bold text-[#051F20] leading-tight tracking-wide">
                      {(user.name || 'User').toUpperCase()}
                    </span>
                    {loginTime && (
                      <span className="text-[9px] font-bold text-[#8EB69B] tracking-widest uppercase mt-0.5">
                        Logged in
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white border border-gray-100 shadow-xl rounded-2xl w-60 py-2 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100/50 overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-indigo-700">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Signed in as</p>
                          <p className="text-[15px] font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-[12px] text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsViewingDP(true)}
                      className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center gap-3 w-full"
                    >
                      <Eye className="w-4 h-4" /> View Profile Photo
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center gap-3 w-full border-b border-gray-50"
                    >
                      <Camera className="w-4 h-4" /> Change Profile Pic
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <Link to="/profile?edit=true" className="px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center gap-3">
                      <User className="w-4 h-4" /> Account Settings
                    </Link>
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

            <Link to="/wishlist" className="relative group/wishlist flex items-center justify-center w-10 h-10 rounded-full hover:bg-rose-50 transition-colors">
              <Heart className={`w-5 h-5 stroke-[1.5] transition-all ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover/wishlist:text-rose-500 group-hover/wishlist:fill-rose-50'}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1 shadow-sm border-2 border-white ring-1 ring-rose-500/20">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative group/cart flex items-center justify-center w-10 h-10 rounded-full hover:bg-indigo-50 transition-colors">
              <ShoppingCart className="w-5 h-5 stroke-[1.5] text-gray-600 group-hover/cart:text-indigo-600 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#051F20] text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1 shadow-sm border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {user && (
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="hidden lg:flex items-center gap-1.5 text-gray-400 hover:text-red-600 font-bold tracking-widest uppercase text-[11px] ml-2 px-3 py-2 rounded-full hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 stroke-[2]" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              className="md:hidden text-gray-800 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Flipkart Style (Hidden on Auth Pages) */}
      {!['/login', '/register', '/forgot-password'].includes(location.pathname) && (
        <div className="md:hidden px-4 pb-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            className="relative"
          >
            <input
              type="text"
              placeholder="Search for products, brands and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f0f2f5] text-[13px] font-medium text-gray-900 rounded-lg pl-10 pr-4 py-2.5 border-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-gray-500"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>
        </div>
      )}

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
              {!['/login', '/register', '/forgot-password'].includes(location.pathname) && (
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
              )}
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
                  <Link to="/admin/master" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Master DB</Link>
                  <Link to="/admin/setting" className="text-lg font-serif font-medium text-gray-900 pl-4 border-l-2 border-indigo-100">Setting</Link>
                </div>
              )}
              <hr className="border-gray-100" />
              {user && (
                <Link
                  to="/profile?edit=true"
                  className="flex items-center gap-3 text-lg font-serif font-medium text-indigo-600"
                >
                  <Camera className="w-5 h-5" /> Edit Profile
                </Link>
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
      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isViewingDP && user?.avatar_url && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setIsViewingDP(false)}
          >
            <button 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              onClick={() => setIsViewingDP(false)}
            >
              <X className="w-8 h-8" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full aspect-square rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={user.avatar_url} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 p-6 pt-12">
                 <p className="text-xl font-bold text-white">{user.name}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
