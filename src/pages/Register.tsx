import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('register', formData);
      toast.success('Verification code sent to your email!');
      setStep('otp');
      setResendTimer(60);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await api.request('verifyOtp', { email: formData.email, token });
      toast.success('Email verified successfully! Welcome to The Boys Zone.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.request('register', formData);
      toast.success('New code sent!');
      setResendTimer(60);
    } catch (error: any) {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505] py-20 px-6">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 scale-105"
        style={{ backgroundImage: 'url("/login_bg.png")' }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black via-transparent to-indigo-900/20" />
      <div className="absolute inset-0 z-10 backdrop-blur-[2px]" />

      <div className="relative z-20 w-full max-w-[460px] perspective-2000">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-premium pt-6 pb-8 px-6 md:pt-8 md:pb-10 md:px-10 rounded-[32px] relative"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-indigo-500/20 shadow-3d-strong">
                  <User className="w-8 h-8 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-serif font-black text-white mb-2 tracking-tight uppercase">Join Us</h1>
                <p className="text-white/40 font-medium text-xs tracking-widest uppercase">Create your premium account</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="group/input relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center">
                    <User className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all text-sm font-medium"
                      placeholder="Full Name"
                    />
                  </div>
                </div>

                <div className="group/input relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all text-sm font-medium"
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                <div className="group/input relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center">
                    <Phone className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all text-sm font-medium"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>

                <div className="group/input relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all text-sm font-medium"
                      placeholder="Password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-indigo-400/60 hover:text-indigo-400 transition-all focus:outline-none"
                    >
                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-colors flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP Code <ArrowRight className="w-5 h-5" /></>}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[11px] text-white/30 font-bold uppercase tracking-[0.1em]">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors ml-1">
                    Sign In
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-premium pt-8 pb-10 px-6 md:pt-10 md:pb-12 md:px-12 rounded-[32px] relative text-center"
            >
              <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-indigo-500/20 shadow-glow-soft">
                <CheckCircle2 className="w-10 h-10 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-serif font-black text-white mb-3 tracking-tight uppercase">Verify OTP</h1>
              <p className="text-white/40 font-medium text-xs mb-8">
                Enter the 6-digit code sent to <br/>
                <span className="text-indigo-400 font-bold">{formData.email}</span>
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="flex justify-between gap-2 md:gap-3 mb-8">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 md:w-14 md:h-16 bg-white/[0.03] border border-white/10 rounded-xl text-center text-2xl font-black text-indigo-400 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
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
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Complete'}
                </motion.button>
              </form>

              <div className="mt-8">
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-indigo-400 disabled:hover:text-white/30 transition-colors"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>

              <button
                onClick={() => setStep('form')}
                className="mt-6 text-[10px] uppercase font-black tracking-[0.2em] text-white/20 hover:text-white transition-colors"
              >
                ← Back to registration
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
