import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Receipt, ShoppingBag, Package, 
  BarChart3, Inbox, Database, Settings, X, Menu,
  ChevronRight, LogOut, Store, Eye, Camera, Loader2, AlarmClock, Bell
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
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { user, logout, isAdmin, updateUser } = useAuth();

  const notifications = [
    { id: 1, title: 'New Order Received', time: '2 mins ago', icon: ShoppingBag, color: 'text-indigo-400' },
    { id: 2, title: 'Low Stock Alert', time: '1 hour ago', icon: Package, color: 'text-amber-400' },
    { id: 3, title: 'Payment Confirmed', time: '3 hours ago', icon: Receipt, color: 'text-emerald-400' },
  ];

  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false);
    setIsNotificationsOpen(false);
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

    // 15MB limit check
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`Image size is too large (${sizeMB}MB). Max allowed is 15MB.`);
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
    <div className={`h-full flex flex-col ${mobile ? 'bg-[#0f1629]' : 'bg-[#0f1629]'} text-white border-r border-white/5 shadow-2xl`}>
      
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        {(!isCollapsed || mobile) && (
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight uppercase text-white">Admin Portal</span>
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.18em]">The Boys Zone</span>
          </div>
        )}
      </div>

      {/* Profile Card */}
      {(!isCollapsed || mobile) && (
        <div className="px-4 pb-3 relative">
          {/* File input must be outside AnimatePresence so it stays in DOM */}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          <div
            className="relative cursor-pointer rounded-2xl p-3 flex items-center gap-3 bg-white/5 border border-white/8 hover:bg-white/8 transition-all group/card"
            onClick={() => setShowProfileActions(!showProfileActions)}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-700/60 flex items-center justify-center border border-indigo-500/40 overflow-hidden flex-shrink-0">
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">{user?.name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{user?.name}</p>
              <p className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Super Admin</p>
            </div>
            <Camera className="w-3.5 h-3.5 text-white/20 group-hover/card:text-indigo-400 transition-colors" />

            {/* Profile Actions Popover */}
            <AnimatePresence>
              {showProfileActions && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-10"
                    onClick={(e) => { e.stopPropagation(); setShowProfileActions(false); }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-20 py-1.5 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => { setIsViewingDP(true); setShowProfileActions(false); }}
                      className="w-full px-4 py-2 text-xs font-bold flex items-center gap-3 hover:bg-white/5 text-slate-300 transition-colors">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Photo
                    </button>
                    <button onClick={() => { fileInputRef.current?.click(); setShowProfileActions(false); }}
                      className="w-full px-4 py-2 text-xs font-bold flex items-center gap-3 hover:bg-white/5 text-slate-300 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" /> Change Photo
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 mb-2 border-t border-white/5" />

      {/* Navigation */}
      <div
        className="flex-1 px-3 space-y-0.5 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
        onScroll={(e) => { e.currentTarget.scrollTop = 0; }}
      >
        {menuItems.map((item, idx) => {
          const active = isActive(item.path);
          const showDivider = idx === menuItems.length - 2;
          return (
            <React.Fragment key={item.name}>
              {showDivider && (!isCollapsed || mobile) && (
                <div className="mx-1 my-1.5 border-t border-white/5" />
              )}
              <Link
                to={item.path}
                preventScrollReset={true}
                onClick={() => { window.scrollTo(0, 0); }}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                  active 
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/50' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-200'}`} />
                {(!isCollapsed || mobile) && (
                  <span className={`text-[13px] font-semibold tracking-tight truncate ${ active ? 'text-white' : '' }`}>
                    {item.name}
                  </span>
                )}
                {active && !isCollapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/90" />
                )}
                {isCollapsed && !mobile && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                    {item.name}
                  </div>
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 pt-2 pb-4 border-t border-white/5 space-y-0.5 mt-2">
        {!mobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all text-[13px] font-semibold"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
              <><X className="w-4 h-4 rotate-45" /><span>Collapse Sidebar</span></>
            )}
          </button>
        )}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all text-[13px] font-semibold"
        >
          <LogOut className="w-4 h-4" />
          {(!isCollapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Header (Optimized with Menu) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[150] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-colors active:scale-90"
          >
            <Menu className="w-6 h-6 stroke-[2.5px]" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Store className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-0.5">THE BOYS ZONE</span>
              <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none">ADMIN PORTAL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
          </button>
          
          <button 
            onClick={() => setIsViewingDP(true)}
            className="w-8 h-8 rounded-full border-2 border-indigo-500/30 overflow-hidden shadow-sm active:scale-95 transition-transform"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                {user?.name?.charAt(0)}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Premium Mobile Bottom Navigation Bar (Primary Links Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white/80 backdrop-blur-2xl border-t border-slate-200 px-6 pt-3 pb-6 flex items-center justify-between shadow-[0_-15px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
        {[menuItems[0], menuItems[1], menuItems[5], menuItems[3]].map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex-1 flex flex-col items-center gap-1.5 transition-all relative ${
                active ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative p-2 rounded-2xl transition-colors ${active ? 'bg-indigo-50' : 'bg-transparent'}`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {active && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-indigo-600/5 rounded-2xl border border-indigo-100 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-all ${active ? 'text-indigo-700' : 'text-slate-500'}`}>
                {item.name === 'Today Report' ? 'Today' : item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Static Notification Panel */}
      <AnimatePresence mode="wait">
        {isNotificationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[160]"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="md:hidden fixed top-16 right-4 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[170] overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Notifications</h4>
                <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-xl bg-white/5 ${n.color}`}>
                      <n.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{n.title}</p>
                      <p className="text-[9px] text-slate-500 font-medium">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-colors border-t border-white/5">
                View All Notifications
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay (Menu) - Now Slides from Left */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] z-[210]"
            >
              <SidebarContent mobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className="hidden md:block fixed top-0 left-0 bottom-0 z-[110]"
      >
        <SidebarContent />
      </motion.aside>

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
