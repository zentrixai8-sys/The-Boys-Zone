import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Mail, Lock, User, Phone, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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

  // --- 3D Animation Logic ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-gradient-to-b from-[#DAF1DE] via-[#235347] to-[#051F20] selection:bg-[#8EB69B]/30 perspective-[2000px]">
      
      {/* LEFT SIDE: Promotional Image (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-end p-16 overflow-hidden">
         {/* Subtle overlay blending into the background */}
         <div className="absolute inset-0 bg-[#051F20]/20 z-10 mix-blend-multiply" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#051F20] via-transparent to-[#DAF1DE]/20 z-10" />
         
         <img 
           src="/login_fashion_model.png" 
           alt="Premium Streetwear" 
           className="absolute inset-0 w-full h-full object-cover object-center scale-105"
         />
         
         {/* Marketing Copy overlapping the image */}
         <motion.div 
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.5, duration: 0.8 }}
           className="relative z-20 max-w-lg drop-shadow-2xl"
           style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}
         >
           <h2 className="text-5xl font-black text-[#DAF1DE] tracking-tighter leading-tight mb-4 text-shadow-xl">
             Join The <br /> Community.
           </h2>
           <p className="text-[#8EB69B] font-bold flex items-center gap-3 uppercase tracking-[0.2em] text-sm">
             <span className="w-8 h-px bg-[#8EB69B]"></span>
             Exclusive Access
           </p>
         </motion.div>
      </div>

      {/* RIGHT SIDE: Register Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10">
        
        {/* Decorative ambient blurred circles behind the container for depth */}
        <div className="absolute top-1/4 -left-10 lg:left-0 w-[400px] h-[400px] bg-[#8EB69B]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 lg:right-1/4 w-[300px] h-[300px] bg-[#163832]/80 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-20">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full relative"
              >
                {/* Premium Compact Card with 3D Depth & Watermark Glass Effect */}
                <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[32px] p-8 md:p-10 shadow-[0_30px_60px_rgba(5,31,32,0.4)] relative overflow-hidden">
                  
                  {/* Subtle Watermark TBZ overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none select-none flex items-center justify-center mix-blend-overlay">
                    <span className="font-serif font-black text-9xl tracking-tighter text-[#051F20] scale-[2] -rotate-12">TBZ</span>
                  </div>

                  <div style={{ transform: "translateZ(50px)" }} className="text-center mb-8 relative z-10">
                    <h1 className="text-2xl font-black text-[#051F20] tracking-tight uppercase drop-shadow-sm">Sign Up</h1>
                    <p className="text-[11px] font-bold text-[#235347] uppercase tracking-[0.2em] mt-2">Create your premium account</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4 relative z-10" style={{ transform: "translateZ(40px)" }}>
                    
                    {/* Compact Name Input */}
                    <div className="relative group/input drop-shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-[#235347] group-focus-within/input:text-[#051F20] transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white/70 border border-[#8EB69B]/30 rounded-2xl text-[#051F20] placeholder:text-[#235347]/60 focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all text-[13px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                        placeholder="Full Name"
                      />
                    </div>

                    {/* Compact Email Input */}
                    <div className="relative group/input drop-shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-[#235347] group-focus-within/input:text-[#051F20] transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white/70 border border-[#8EB69B]/30 rounded-2xl text-[#051F20] placeholder:text-[#235347]/60 focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all text-[13px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                        placeholder="Email Address"
                      />
                    </div>

                    {/* Compact Phone Input */}
                    <div className="relative group/input drop-shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-[#235347] group-focus-within/input:text-[#051F20] transition-colors" />
                      </div>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white/70 border border-[#8EB69B]/30 rounded-2xl text-[#051F20] placeholder:text-[#235347]/60 focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all text-[13px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                        placeholder="Phone Number"
                      />
                    </div>

                    {/* Compact Password Input */}
                    <div className="relative group/input drop-shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-[#235347] group-focus-within/input:text-[#051F20] transition-colors" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-11 pr-11 py-3 bg-white/70 border border-[#8EB69B]/30 rounded-2xl text-[#051F20] placeholder:text-[#235347]/60 focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all text-[13px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                        placeholder="Password"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#235347] hover:text-[#051F20] transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Sign Up Button */}
                    <motion.button 
                      whileHover={{ scale: 1.02, translateZ: 10 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 py-3.5 rounded-2xl bg-[#0B2B26] text-[#DAF1DE] text-[13px] font-black uppercase tracking-widest hover:bg-[#051F20] transition-all shadow-xl shadow-[#051F20]/30 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </motion.button>

                  </form>

                  {/* Footer Link */}
                  <div className="mt-8 flex flex-col items-center gap-5 relative z-10" style={{ transform: "translateZ(30px)" }}>
                    <div className="w-full flex items-center gap-3">
                      <div className="flex-1 h-px bg-[#8EB69B]/30"></div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#8EB69B]">Or</span>
                      <div className="flex-1 h-px bg-[#8EB69B]/30"></div>
                    </div>

                    <button onClick={() => navigate('/login')} className="text-[12px] font-bold text-white hover:text-[#DAF1DE] hover:underline transition-colors tracking-wide drop-shadow-md">
                      Already have an account? Sign in
                    </button>
                  </div>

                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-verification"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full relative"
              >
                {/* Premium Compact Card with 3D Depth & Watermark Glass Effect */}
                <div className="bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[32px] p-8 md:p-10 shadow-[0_30px_60px_rgba(5,31,32,0.4)] relative overflow-hidden text-center">
                  
                  {/* Subtle Watermark Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none select-none flex items-center justify-center mix-blend-overlay">
                    <span className="font-serif font-black text-9xl tracking-tighter text-[#051F20] scale-[2] -rotate-12">TBZ</span>
                  </div>

                  <div className="w-16 h-16 bg-[#0B2B26] rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl shadow-[#051F20]/30 relative z-10">
                    <CheckCircle2 className="w-8 h-8 text-[#DAF1DE]" />
                  </div>
                  
                  <h1 className="text-2xl font-black text-[#051F20] mb-2 tracking-tight uppercase relative z-10 drop-shadow-sm">Verify OTP</h1>
                  <p className="text-[#235347] font-bold text-[11px] mb-8 uppercase tracking-widest relative z-10 drop-shadow-sm">
                    Code sent to <span className="text-[#051F20]">{formData.email}</span>
                  </p>

                  <form onSubmit={handleVerifyOtp} className="relative z-10">
                    <div className="flex justify-between gap-2 mb-8">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-10 h-12 md:w-12 md:h-14 bg-white/70 border border-[#8EB69B]/30 rounded-xl text-center text-xl font-black text-[#051F20] focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                        />
                      ))}
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-[#0B2B26] text-[#DAF1DE] text-[13px] font-black uppercase tracking-widest hover:bg-[#051F20] transition-all shadow-xl shadow-[#051F20]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Complete'}
                    </motion.button>
                  </form>

                  <div className="mt-6 flex flex-col gap-4 relative z-10">
                    <button
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-[#DAF1DE] disabled:hover:text-white transition-colors drop-shadow-md"
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                    </button>
                    <button
                      onClick={() => setStep('form')}
                      className="text-[10px] uppercase font-black tracking-[0.2em] text-white hover:text-[#DAF1DE] transition-colors drop-shadow-md"
                    >
                      ← Back to details
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
