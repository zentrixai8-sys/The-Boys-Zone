import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Percent, Store, Mail, Lock, CheckCircle2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const Setting = () => {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5);

  // Load settings on mount
  useEffect(() => {
    const savedGstEnabled = localStorage.getItem('gstEnabled') === 'true';
    const savedGstPercent = localStorage.getItem('gstPercentage');
    
    setGstEnabled(savedGstEnabled);
    if (savedGstPercent) setGstPercentage(Number(savedGstPercent));
  }, []);

  const handleSaveGst = () => {
    localStorage.setItem('gstEnabled', String(gstEnabled));
    localStorage.setItem('gstPercentage', String(gstPercentage));
    toast.success('GST Settings Saved Successfully', {
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4 mb-2">
           <div className="p-3 bg-black text-white rounded-2xl shadow-lg">
             <Settings className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-4xl font-black tracking-tight text-slate-900">Settings</h1>
             <p className="text-slate-500 font-medium">Manage your luxury store configuration and preferences</p>
           </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-8"
      >
        {/* GST Configuration */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <Percent className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">GST Configuration</h2>
                  <p className="text-sm font-medium text-slate-400">Set your tax rules for automated billing</p>
                </div>
              </div>
              <button 
                onClick={handleSaveGst}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-700">Enable GST Calculation</p>
                  <p className="text-xs font-bold text-slate-400">Automatically add tax to invoices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[21px] after:w-[21px] after:transition-all peer-checked:bg-emerald-500 border-2 border-transparent peer-hover:border-emerald-200"></div>
                </label>
              </div>
              
              <div className="flex items-center gap-6 md:border-l border-slate-200 md:pl-8">
                <div className="flex-1">
                  <p className="font-black text-slate-700">GST Percentage (%)</p>
                  <p className="text-xs font-bold text-slate-400">Current active tax rate</p>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Number(e.target.value))}
                    disabled={!gstEnabled}
                    className="w-24 px-4 py-3 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-black text-base font-black text-center disabled:opacity-40 disabled:bg-slate-100 transition-all shadow-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Settings */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Store className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Store Info</h2>
                <p className="text-sm font-medium text-slate-400">Public identity of your shop</p>
              </div>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Official Store Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input type="text" defaultValue="The Boys Zone" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-black text-slate-800 transition-all outline-none" />
                </div>
              </div>
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input type="email" defaultValue="support@theboyszone.com" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-black text-slate-800 transition-all outline-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <Shield className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security</h2>
                <p className="text-sm font-medium text-slate-400">Account protection & access</p>
              </div>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 group hover:border-violet-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="px-3 py-1 bg-slate-200 text-[10px] font-black rounded-full uppercase text-slate-600">Inactive</span>
                </div>
                <h3 className="font-black text-slate-800 mb-1">Two-Factor Authentication</h3>
                <p className="text-xs font-bold text-slate-400 mb-4">Add a layer of security to every login attempt.</p>
                <button className="w-full py-3 bg-white border border-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm">Setup 2FA</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 mb-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Notification Center</h2>
              <p className="text-sm font-medium text-slate-400">Stay updated on your business activity</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { id: 'orders', title: 'Real-time Order Alerts', desc: 'Instant desktop popups for new billings', icon: CheckCircle2 },
              { id: 'stock', title: 'Low Stock Warnings', desc: 'Critical alert when stock falls below 10 units', icon: Bell }
            ].map((noti) => (
              <label key={noti.id} className="relative flex items-center p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 cursor-pointer hover:border-amber-200 hover:bg-white transition-all group">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-amber-200">
                    <noti.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{noti.title}</p>
                    <p className="text-[11px] font-bold text-slate-400">{noti.desc}</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all">
                  <CheckCircle2 className="w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform" />
                </div>
              </label>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
