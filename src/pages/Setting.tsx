import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Percent, Store, Mail, Lock, CheckCircle2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const Setting = () => {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      // 1. Try local storage first for instant load
      const savedGstEnabled = localStorage.getItem('gstEnabled') === 'true';
      const savedGstPercent = localStorage.getItem('gstPercentage');
      
      setGstEnabled(savedGstEnabled);
      if (savedGstPercent) setGstPercentage(Number(savedGstPercent));

      // 2. Fetch from Supabase Auth metadata for cross-device sync
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        if (user.user_metadata.gstEnabled !== undefined) {
          setGstEnabled(user.user_metadata.gstEnabled);
          localStorage.setItem('gstEnabled', String(user.user_metadata.gstEnabled));
        }
        if (user.user_metadata.gstPercentage !== undefined) {
          setGstPercentage(user.user_metadata.gstPercentage);
          localStorage.setItem('gstPercentage', String(user.user_metadata.gstPercentage));
        }
      }
    };
    loadSettings();
  }, []);

  const handleSaveGst = async () => {
    setIsSaving(true);
    // Save locally
    localStorage.setItem('gstEnabled', String(gstEnabled));
    localStorage.setItem('gstPercentage', String(gstPercentage));
    
    // Save to Supabase (Syncs across mobile and laptop)
    await supabase.auth.updateUser({
      data: { gstEnabled, gstPercentage }
    });
    
    setIsSaving(false);
    toast.success('GST Settings Synced Across Devices', {
      icon: '✅',
      style: {
        borderRadius: '16px',
        background: '#065f46',
        color: '#fff',
        fontWeight: 'bold'
      },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Header - Mobile Responsive */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8 md:mb-10"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-black text-white rounded-2xl shadow-lg">
               <Settings className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">Settings</h1>
               <p className="text-[11px] md:text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest">Global Shop Configuration</p>
             </div>
           </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 md:gap-8"
      >
        {/* GST Configuration - Mobile Stacked */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
          <div className="p-5 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shrink-0">
                  <Percent className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">GST Configuration</h2>
                  <p className="text-[10px] md:text-sm font-medium text-slate-400 uppercase tracking-wider">Tax Management</p>
                </div>
              </div>
              <button 
                onClick={handleSaveGst}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                {isSaving ? 'Syncing...' : 'Save Settings'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-700">Enable GST</p>
                  <p className="text-[10px] font-bold text-slate-400">Automated tax billing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group shrink-0">
                  <input 
                    type="checkbox" 
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-emerald-500 border-2 border-transparent"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between md:justify-start gap-6 md:border-l border-slate-200 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0">
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-700">Rate (%)</p>
                  <p className="text-[10px] font-bold text-slate-400">Current tax percentage</p>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Number(e.target.value))}
                    disabled={!gstEnabled}
                    className="w-20 px-3 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-black text-sm font-black text-center disabled:opacity-40 transition-all shadow-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* General Settings */}
          <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shrink-0">
                <Store className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Store Info</h2>
                <p className="text-[10px] md:text-sm font-medium text-slate-400 uppercase tracking-wider">Identity</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" defaultValue="The Boys Zone" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" defaultValue="support@theboyszone.com" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 outline-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 shrink-0">
                <Shield className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Security</h2>
                <p className="text-[10px] md:text-sm font-medium text-slate-400 uppercase tracking-wider">Access</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-[8px] font-black rounded-full uppercase text-slate-600">Off</span>
                </div>
                <h3 className="text-sm font-black text-slate-800 mb-1">Two-Factor Auth</h3>
                <p className="text-[10px] font-bold text-slate-400 mb-4">Secure your admin account.</p>
                <button className="w-full py-3 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest active:bg-slate-50">Setup</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 shrink-0">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Notifications</h2>
              <p className="text-[10px] md:text-sm font-medium text-slate-400 uppercase tracking-wider">Alerts</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'orders', title: 'Order Alerts', desc: 'Real-time billing popups', icon: CheckCircle2 },
              { id: 'stock', title: 'Stock Warnings', desc: 'Low inventory alerts', icon: Bell }
            ].map((noti) => (
              <label key={noti.id} className="relative flex items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200 cursor-pointer active:bg-white transition-all group">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <noti.icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-xs">{noti.title}</p>
                    <p className="text-[10px] font-bold text-slate-400">{noti.desc}</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-lg border-2 border-slate-300 flex items-center justify-center peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all">
                  <CheckCircle2 className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                </div>
              </label>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
