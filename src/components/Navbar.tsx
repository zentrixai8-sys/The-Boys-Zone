import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black tracking-tighter text-black flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-red-500 via-orange-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">BZ</span>
              </div>
              BOY'S ZONE
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/products" className="text-sm font-medium text-black/60 hover:text-black transition-colors">
                Shop All
              </Link>
              <Link to="/categories" className="text-sm font-medium text-black/60 hover:text-black transition-colors">
                Categories
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-black/5 rounded-full px-3 py-1.5">
              <Search className="w-4 h-4 text-black/40" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-32 lg:w-48"
              />
            </div>
            
            <Link to="/cart" className="relative p-2 text-black/60 hover:text-black transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center overflow-hidden border border-black/5 group-hover:border-black transition-all">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden lg:block text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-black transition-colors">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="p-2 text-black/60 hover:text-black transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-black/90 transition-colors"
              >
                Login
              </Link>
            )}

            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="md:hidden bg-white border-b border-black/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/products" className="block px-3 py-2 text-base font-medium text-black/60" onClick={() => setIsMenuOpen(false)}>Shop All</Link>
              <Link to="/categories" className="block px-3 py-2 text-base font-medium text-black/60" onClick={() => setIsMenuOpen(false)}>Categories</Link>
              {isAdmin && <Link to="/admin" className="block px-3 py-2 text-base font-medium text-indigo-600" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>}
              {!user && <Link to="/login" className="block px-3 py-2 text-base font-medium text-black" onClick={() => setIsMenuOpen(false)}>Login</Link>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
