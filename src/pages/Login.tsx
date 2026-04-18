import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await api.request('login', { email, password });
      login(userData);
      toast.success(`Welcome back, ${userData.name}!`);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* Cinematic Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
        style={{ backgroundImage: 'url("/login_bg.png")' }}
      />
      
      {/* Background Overlays & Effects */}
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black via-transparent to-indigo-900/20" />
      <div className="absolute inset-0 z-10 backdrop-blur-[2px]" />

      {/* Floating Decorative Elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[15%] w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          y: [0, 30, 0],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[15%] w-80 h-80 bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" 
      />

      {/* Main Container */}
      <div 
        className="relative z-20 w-full max-w-[460px] perspective-2000 px-6 py-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-premium pt-5 pb-7 px-6 md:pt-6 md:pb-8 md:px-8 rounded-[32px] relative group"
        >
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-30 flex flex-col items-center">
            {/* Logo/Icon Section */}
            <motion.div 
              style={{ transform: "translateZ(50px)" }}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-3d-strong group-hover:bg-white/10 transition-colors"
            >
              <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
            </motion.div>

            <div className="text-center mb-5" style={{ transform: "translateZ(30px)" }}>
              <h1 className="text-3xl font-serif font-black text-white mb-2 tracking-tight uppercase">
                Login
              </h1>
              <p className="text-white/40 font-medium text-xs tracking-widest uppercase">
                Welcome back
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4" style={{ transform: "translateZ(40px)" }}>
              <div className="group/input relative">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-500" />
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-5 h-5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all text-[14px] font-medium tracking-wide"
                    placeholder="Email Address"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all text-[14px] font-medium tracking-wide"
                    placeholder="Password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-indigo-400/60 hover:text-indigo-400 transition-all duration-300 focus:outline-none z-40"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pr-1">
                <Link to="/forgot-password" title="Recover your password" id="forgot-password-link" className="text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading}
                className="w-full relative group/btn overflow-hidden rounded-xl py-3.5 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-indigo-600 group-hover:bg-indigo-500 transition-colors" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-45 animate-gold-shine" />
                </div>
                
                <span className="relative z-10 text-white text-[14px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" /></>}
                </span>
              </motion.button>
            </form>

            {/* Social Login Section */}
            <div className="w-full mt-5" style={{ transform: "translateZ(20px)" }}>
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative px-4 bg-transparent">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Or login with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all group/social">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                    <path fill="#ffffff" opacity="0.5" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.806L1.24 17.35A11.997 11.997 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                    <path fill="#ffffff" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.191 2.766-2.396 3.558L19.834 21z"/>
                    <path fill="#ffffff" opacity="0.2" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                  </svg>
                  <span className="text-[12px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Google</span>
                </button>
                <button className="flex items-center justify-center gap-3 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all group/social">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <span className="text-[12px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Github</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center" style={{ transform: "translateZ(10px)" }}>
              <p className="text-[11px] text-white/30 font-bold uppercase tracking-[0.1em]">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors ml-1">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>

          {/* Background Highlight Sphere */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-600/40 transition-all duration-1000" />
        </motion.div>
      </div>

      {/* Floating Sparkles in Background */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [0, -40, 0],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity,
              delay: Math.random() * 5 
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>
    </div>
  );
};
