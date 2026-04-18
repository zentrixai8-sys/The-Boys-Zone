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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [user, navigate]);

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
      const rawUser = await api.request('login', { email, password });
      
      const role = rawUser.user_metadata?.role || 'user';
      const name = rawUser.user_metadata?.name || 'User';
      
      toast.success(`Welcome back, ${name}!`);
      
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      setPassword(''); // Auto-clear password on failure
      setLoading(false); // Only unset loading on error, let redirect handle success
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50 font-sans">
      {/* Dynamic Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 bg-[#e2e8f0]">
        {/* Soft floating orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-200 blur-[100px] opacity-70 pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-blue-200 via-cyan-200 to-teal-100 blur-[120px] opacity-70 pointer-events-none" 
        />
      </div>

      {/* Grid Pattern Overlay for Texture */}
      <div className="absolute inset-0 z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] opacity-60 pointer-events-none" />
      
      {/* 3D Floating Container Wrapper */}
      <div 
        className="relative z-20 w-full max-w-[480px] perspective-2000 px-6 py-12"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
           style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="relative group drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)]"
        >
          {/* Animated Gradient Border using a pseudo-element behind the card */}
          <div className="absolute -inset-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] opacity-40 group-hover:opacity-70 blur-md transition-opacity duration-500" />
          
          <div className="relative bg-white/80 backdrop-blur-3xl rounded-[32px] border-2 border-white/90 p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden" style={{ transform: "translateZ(10px)" }}>
            
            {/* Glossy Reflection line inside the card */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            
            <div className="relative z-30 flex flex-col items-center">
              
              {/* Premium Icon with multi-layer shadow */}
              <motion.div 
                style={{ transform: "translateZ(40px)" }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-20" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-50 to-white rounded-2xl flex items-center justify-center border border-indigo-100 shadow-md">
                  <ShieldCheck className="w-8 h-8 text-indigo-600" />
                </div>
              </motion.div>

              {/* Enhanced Typography */}
              <div className="text-center mb-8" style={{ transform: "translateZ(30px)" }}>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight mb-2">
                  Welcome Back
                </h1>
                <p className="text-slate-400 font-bold text-[11px] tracking-[0.2em] uppercase">
                  Sign in to your account
                </p>
              </div>

              {/* Form styling with premium floating inputs */}
              <form onSubmit={handleSubmit} className="w-full space-y-5" style={{ transform: "translateZ(20px)" }}>
                
                <div className="space-y-4">
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors z-10" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 hover:bg-white rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold shadow-sm"
                      placeholder="Email address"
                    />
                  </div>

                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors z-10" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border-2 border-slate-100 hover:bg-white rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold shadow-sm"
                      placeholder="Password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none z-10"
                    >
                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" title="Recover your password" id="forgot-password-link" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors group-hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-slate-900 hover:bg-black text-white rounded-2xl py-4 flex items-center justify-center gap-3 disabled:opacity-70 transition-all shadow-xl shadow-slate-900/20 group/btn"
                >
                  <span className="relative z-10 text-[13px] font-bold uppercase tracking-[0.1em] flex items-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Log In <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" /></>}
                  </span>
                  {/* Sweep highlight */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                </motion.button>
              </form>

              {/* Elegant Divider */}
              <div className="w-full mt-8 mb-6 relative flex items-center justify-center" style={{ transform: "translateZ(10px)" }}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative px-4 bg-[#fcfdfe]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm">Continue with</span>
                </div>
              </div>

              {/* Social Login Section */}
              <div className="grid grid-cols-2 gap-4 w-full" style={{ transform: "translateZ(10px)" }}>
                <button className="flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-xs font-bold text-slate-700">Google</span>
                </button>
                <button className="flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <span className="text-xs font-bold text-slate-700">Github</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
        
        {/* Footer Link outside the card */}
        <div className="mt-8 text-center" style={{ transform: "translateZ(10px)" }}>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            New to The Boys Zone?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors ml-1 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
