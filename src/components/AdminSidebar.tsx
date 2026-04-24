import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Receipt, ShoppingBag, Package, 
  BarChart3, Inbox, Database, Settings, X, Menu,
  ChevronRight, LogOut, Store, Eye, Camera, Loader2, AlarmClock
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [isViewingDP, setIsViewingDP] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { user, logout, isAdmin, updateUser } = useAuth();

  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!isAdmin) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Billing', path: '/billing', icon: Receipt },
    { name: 'Payment Follow-up', path: '/billing/pending-payments', icon: AlarmClock },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Today Report', path: '/admin/today-report', icon: BarChart3 },
    { name: 'Inventory', path: '/admin/inventory', icon: Inbox },
    { name: 'Master DB', path: '/admin/master', icon: Database },
    { name: 'Setting', path: '/admin/setting', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

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
    setShowProfileActions(false);
    
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

  const sidebarVariants = {
    expanded: { width: '260px' },
    collapsed: { width: '80px' }
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className={`h-full flex flex-col ${mobile ? 'bg-slate-900' : 'bg-slate-900/95 backdrop-blur-xl'} text-white border-r border-white/10 shadow-2xl transition-all duration-300`}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Store className="w-6 h-6 text-white" />
          </div>
          {(!isCollapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-base font-black tracking-tighter uppercase whitespace-nowrap text-white">Admin Portal</span>
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-[0.2em]">The Boys Zone</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Profile Summary (Only if not collapsed) */}
      {/* Profile Summary (Only if not collapsed) */}
      {(!isCollapsed || mobile) && (
        <div className="px-6 py-4 mb-4 relative">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 shadow-inner group/card relative">
            <div className="flex items-center gap-3">
              {/* DP Container */}
              <div 
                className="relative cursor-pointer group/avatar"
                onClick={() => setShowProfileActions(!showProfileActions)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-indigo-500/50 overflow-hidden shadow-lg transition-transform group-hover/avatar:scale-105 active:scale-95">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{user?.name?.charAt(0)}</span>
                  )}
                </div>
                {/* Visual indicator for clickability */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-slate-900 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                   <Camera className="w-2 h-2 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate text-white">{user?.name}</p>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest truncate">Super Admin</p>
              </div>
            </div>

            {/* Profile Actions Popover */}
            <AnimatePresence>
              {showProfileActions && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileActions(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden"
                  >
                    <button 
                      onClick={() => { setIsViewingDP(true); setShowProfileActions(false); }}
                      className="w-full px-4 py-2.5 text-xs font-bold flex items-center gap-3 hover:bg-white/5 text-slate-200 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-indigo-400" /> View Photo
                    </button>
                    <button 
                      onClick={() => { fileInputRef.current?.click(); }}
                      className="w-full px-4 py-2.5 text-xs font-bold flex items-center gap-3 hover:bg-white/5 text-slate-200 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" /> Change Photo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 relative ${
                active 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
              {(!isCollapsed || mobile) && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-bold tracking-tight"
                >
                  {item.name}
                </motion.span>
              )}
              {active && !isCollapsed && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute right-2 w-1 h-5 bg-white rounded-full" 
                />
              )}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && !mobile && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 space-y-2">
        {!mobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
              <>
                <X className="w-5 h-5 rotate-45" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={() => { logout(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-bold"
        >
          <LogOut className="w-5 h-5" />
          {(!isCollapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-120">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-transform border-4 border-white"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className="hidden md:block fixed top-0 left-0 bottom-0 z-110"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-110"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] z-120"
            >
              <SidebarContent mobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isViewingDP && user?.avatar_url && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setIsViewingDP(false)}
          >
            <motion.button 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              onClick={() => setIsViewingDP(false)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={user.avatar_url} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 p-8 pt-20">
                 <p className="text-2xl font-black text-white">{user.name || 'User'}</p>
                 <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px]">Current Profile Picture</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
