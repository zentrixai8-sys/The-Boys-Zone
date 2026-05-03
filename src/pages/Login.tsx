import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [user, navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // --- Hardcoded Admin Bypass ---
    if (email.toLowerCase() === 'admin@test.com' && password === 'admin123') {
      console.warn('⚡ Admin Bypass Activated');
      const bypassUser = {
        id: 'tbz-hardcoded-admin-id',
        email: 'admin@test.com',
        name: 'The Boys Zone Admin',
        phone: '9617628157',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      
      // @ts-ignore
      login(bypassUser);
      toast.success('Admin Bypass Successful! Welcome back.');
      navigate('/admin');
      setLoading(false);
      return;
    }
    
    console.log('Attempting login for:', email);
    
    // Clear any stale logout flag so AuthContext doesn't block the new session
    sessionStorage.removeItem('tbz_force_logout');
    
    try {
      const rawUser = await api.request('login', { email, password });
      const role = rawUser.user_metadata?.role || 'user';
      const name = rawUser.user_metadata?.name || 'User';
      
      toast.success(`Welcome back, ${name}!`);
      
      if (role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      setPassword('');
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
             Elevate Your <br /> Everyday Style.
           </h2>
           <p className="text-[#8EB69B] font-bold flex items-center gap-3 uppercase tracking-[0.2em] text-sm">
             <span className="w-8 h-px bg-[#8EB69B]"></span>
             Premium E-Commerce
           </p>
         </motion.div>
      </div>

      {/* RIGHT SIDE: Login Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10">
        
        {/* Decorative ambient blurred circles behind the container for depth */}
        <div className="absolute top-1/4 -left-10 lg:left-0 w-[400px] h-[400px] bg-[#8EB69B]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 lg:right-1/4 w-[300px] h-[300px] bg-[#163832]/80 rounded-full blur-[80px] pointer-events-none" />

        {/* 3D Tilt Wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full max-w-[420px] relative z-20"
        >
          {/* Premium Compact Card with 3D Depth & Watermark Glass Effect */}
          <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[32px] p-8 md:p-10 shadow-[0_30px_60px_rgba(5,31,32,0.4)] relative overflow-hidden">
            
            {/* Subtle Watermark TBZ overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none select-none flex items-center justify-center mix-blend-overlay">
               <span className="font-serif font-black text-9xl tracking-tighter text-[#051F20] scale-[2] -rotate-12">TBZ</span>
            </div>

            <div style={{ transform: "translateZ(50px)" }} className="text-center mb-8 relative z-10">
              <h1 className="text-2xl font-black text-[#051F20] tracking-tight uppercase drop-shadow-sm">Welcome</h1>
              <p className="text-[11px] font-bold text-[#235347] uppercase tracking-[0.2em] mt-2">Sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" style={{ transform: "translateZ(40px)" }}>
              
              {/* Compact Email Input */}
              <div className="relative group/input drop-shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#235347] group-focus-within/input:text-[#051F20] transition-colors" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/70 border border-[#8EB69B]/30 rounded-2xl text-[#051F20] placeholder:text-[#235347]/60 focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all text-[13px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                  placeholder="Email address"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-white/70 border border-[#8EB69B]/30 rounded-2xl text-[#051F20] placeholder:text-[#235347]/60 focus:outline-none focus:bg-white focus:border-[#235347] focus:ring-1 focus:ring-[#235347] transition-all text-[13px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
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

              <div className="flex justify-end pt-1 pb-2">
                <Link to="/forgot-password" title="Recover your password" id="forgot-password-link" className="text-[11px] font-bold text-white hover:text-[#DAF1DE] transition-colors hover:underline drop-shadow-md">
                  Forgot password?
                </Link>
              </div>

              {/* Compact Sign In Button */}
              <motion.button 
                whileHover={{ scale: 1.02, translateZ: 10 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 rounded-2xl bg-[#0B2B26] text-[#DAF1DE] text-[13px] font-black uppercase tracking-widest hover:bg-[#051F20] transition-all shadow-xl shadow-[#051F20]/30 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </motion.button>

            </form>

            {/* Social / Divider */}
            <div className="mt-8 flex flex-col items-center gap-5" style={{ transform: "translateZ(30px)" }}>
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-px bg-[#8EB69B]/30"></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#8EB69B]">Or</span>
                <div className="flex-1 h-px bg-[#8EB69B]/30"></div>
              </div>

              <button onClick={() => navigate('/register')} className="text-[12px] font-bold text-white hover:text-[#DAF1DE] hover:underline transition-colors drop-shadow-md tracking-wide">
                Create an account
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
