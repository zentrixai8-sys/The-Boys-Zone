import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.request('resetPassword', { password });
      toast.success('Password updated successfully! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
        style={{ backgroundImage: 'url("/login_bg.png")' }}
      />
      
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black via-transparent to-indigo-900/20" />
      <div className="absolute inset-0 z-10 backdrop-blur-[2px]" />

      <div className="relative z-20 w-full max-w-[460px] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-premium pt-10 pb-12 px-8 rounded-[32px] relative"
        >
          <div className="relative z-30">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-3d-strong">
              <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif font-black text-white mb-2 tracking-tight uppercase">
                New Password
              </h1>
              <p className="text-white/40 font-medium text-xs tracking-widest uppercase">
                Set your new secure access code
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group/input relative">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-[14px] font-medium"
                    placeholder="New Password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-white/20 hover:text-white transition-colors"
                  >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="group/input relative">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-[14px] font-medium"
                    placeholder="Confirm New Password"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading}
                className="w-full relative group/btn overflow-hidden rounded-xl py-4 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              >
                <div className="absolute inset-0 bg-indigo-600 group-hover:bg-indigo-500 transition-colors" />
                <span className="relative z-10 text-white text-[14px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Password <CheckCircle2 className="w-5 h-5" /></>}
                </span>
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
