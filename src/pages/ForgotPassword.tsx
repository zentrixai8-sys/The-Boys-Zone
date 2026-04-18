import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('forgotPassword', { email });
      toast.success('Verification code sent to your email!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP Only
  const handleVerifyOtpOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await api.request('verifyRecoveryOtp', { email, token });
      toast.success('Code verified! Now set your new password.');
      setStep('password');
    } catch (error: any) {
      toast.error(error.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.request('resetPassword', { password: newPassword });
      toast.success('Password updated successfully! Welcome back.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505] py-20 px-6">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
        style={{ backgroundImage: 'url("/login_bg.png")' }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black via-transparent to-indigo-900/20" />
      <div className="absolute inset-0 z-10 backdrop-blur-[2px]" />

      <div className="relative z-20 w-full max-w-[460px] perspective-2000">
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-premium pt-10 pb-12 px-8 rounded-[32px] relative text-center"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-3d-strong">
                <KeyRound className="w-8 h-8 text-white animate-pulse" />
              </div>

              <h1 className="text-3xl font-serif font-black text-white mb-2 tracking-tight uppercase">
                Forgot Password
              </h1>
              <p className="text-white/40 font-medium text-xs tracking-widest uppercase mb-8">
                Request a recovery code
              </p>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="group/input relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-[14px] font-medium"
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full relative group/btn overflow-hidden rounded-xl py-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-indigo-600 group-hover:bg-indigo-500 transition-colors" />
                  <span className="relative z-10 text-white text-[14px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Recovery Code <ArrowRight className="w-5 h-5" /></>}
                  </span>
                </motion.button>
              </form>

              <div className="mt-10 pt-8 border-t border-white/5 text-center">
                <Link to="/login" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">
                  ← Back to Login
                </Link>
              </div>
            </motion.div>
          ) : step === 'otp' ? (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-premium pt-8 pb-10 px-6 md:pt-10 md:pb-12 md:px-12 rounded-[32px] relative text-center"
            >
              <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-indigo-500/20 shadow-glow-soft">
                <CheckCircle2 className="w-8 h-8 text-indigo-400" />
              </div>
              
              <h1 className="text-3xl font-serif font-black text-white mb-2 tracking-tight uppercase">Verify Code</h1>
              <p className="text-white/40 font-medium text-xs mb-8">
                Enter 6-digit code sent to <br/>
                <span className="text-indigo-400 font-bold">{email}</span>
              </p>

              <form onSubmit={handleVerifyOtpOnly} className="space-y-8">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-14 md:w-12 md:h-16 bg-white/[0.03] border border-white/10 rounded-xl text-center text-xl font-black text-indigo-400 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                    />
                  ))}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                </motion.button>
              </form>

              <button
                onClick={() => setStep('email')}
                className="mt-8 text-[10px] uppercase font-black tracking-[0.2em] text-white/20 hover:text-white transition-colors"
              >
                ← Change Email
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="password-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-premium pt-10 pb-12 px-8 rounded-[32px] relative text-center"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-3d-strong">
                <ShieldCheck className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>

              <h1 className="text-3xl font-serif font-black text-white mb-2 tracking-tight uppercase">
                New Password
              </h1>
              <p className="text-white/40 font-medium text-xs tracking-widest uppercase mb-8">
                Set your new secure access code
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="group/input relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-[14px] font-medium"
                      placeholder="Enter New Password"
                      autoFocus
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

                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full relative group/btn overflow-hidden rounded-xl py-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-indigo-600 group-hover:bg-indigo-500 transition-colors" />
                  <span className="relative z-10 text-white text-[14px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Password & Login <CheckCircle2 className="w-5 h-5" /></>}
                  </span>
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
