import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, Category, Offer } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, Instagram, ExternalLink, Tag, Star, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const charVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
  }
};

const AnimatedTitle = ({ text, className }: { text: string; className?: string }) => {
  return (
    <motion.h1
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: { transition: { staggerChildren: 0.05 } }
      }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={charVariants}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetching each independently so one failure doesn't block others
      const fetchProducts = async () => {
        try {
          const res = await api.request('getProducts', { limit: 12 });
          setProducts(res.products || []);
        } catch (e) {
          console.error('Products fetch failed:', e);
        }
      };

      const fetchBestSellers = async () => {
        try {
          const res = await api.request('getBestSellers');
          setBestSellers(res || []);
        } catch (e) {
          console.error('Best Sellers fetch failed:', e);
        }
      };

      const fetchCategories = async () => {
        try {
          const res = await api.request('getCategories');
          setCategories(res.categories || []);
        } catch (e) {
          console.error('Categories fetch failed:', e);
        }
      };

      const fetchOffers = async () => {
        try {
          const res = await api.request('getOffers');
          setOffers(res || []);
        } catch (e) {
          console.warn('Offers table might not exist yet:', e);
          setOffers([]);
        }
      };

      await Promise.allSettled([fetchProducts(), fetchBestSellers(), fetchCategories(), fetchOffers()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="bg-[#111] min-h-screen font-sans selection:bg-white selection:text-black">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-50 origin-left"
        style={{ scaleX }}
      />

      {/* 1. Split-Screen Light/Dark Hero */}
      <section className="relative min-h-svh w-full bg-white overflow-hidden flex flex-col md:flex-row">

        {/* Left Side: Typography & Content (White Background) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 md:py-0 relative z-20 min-h-[60svh] md:min-h-svh">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <h4 className="text-black/50 tracking-[0.4em] uppercase text-xs font-bold mb-8 flex items-center gap-4">
              <motion.span 
                initial={{ width: 0 }}
                whileInView={{ width: 32 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-px bg-black/20" 
              />
              Welcome To
            </h4>

            <AnimatedTitle 
              text="THE" 
              className="text-[5rem] sm:text-[6.5rem] lg:text-[8rem] xl:text-[9.5rem] leading-[0.85] tracking-tighter text-black font-serif font-black uppercase text-3d" 
            />
            <AnimatedTitle 
              text="BOYS" 
              className="text-[5rem] sm:text-[6.5rem] lg:text-[8rem] xl:text-[9.5rem] leading-[0.85] tracking-tighter text-black font-serif font-black uppercase italic ml-0 md:ml-8 text-3d" 
            />
            <AnimatedTitle 
              text="ZONE." 
              className="text-[5rem] sm:text-[6.5rem] lg:text-[8rem] xl:text-[9.5rem] leading-[0.85] tracking-tighter text-black font-serif font-black uppercase ml-0 md:ml-24 text-3d" 
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="text-lg text-black/60 max-w-md font-medium leading-relaxed mb-12"
          >
            The premium destination for men's fashion and apparel in Suhela. Discover curated looks for the modern gentleman.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <Link 
              to="/products" 
              className="group bg-black text-white px-10 py-5 rounded-full text-sm font-black tracking-widest uppercase hover:bg-gray-900 transition-all duration-300 flex items-center gap-4 shadow-3d-strong border-b-4 border-black/80 relative overflow-hidden"
            >
              <motion.span
                className="relative z-10 flex items-center gap-4"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Explore The Shop
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </motion.span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Full Height Image */}
        <div className="w-full md:w-1/2 relative min-h-[50svh] md:min-h-svh overflow-hidden bg-[#f8f8f8] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-[80%] h-[70%] max-w-[500px] mt-24 md:mt-0 relative"
          >
            <div className="w-full h-full rounded-[40px] overflow-hidden image-3d border-8 border-white bg-white">
              <img
                src="https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1200&auto=format&fit=crop"
                alt="Premium Menswear"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </motion.div>

          {/* Floating badge over image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 1 }}
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
            className="absolute bottom-8 right-8 md:bottom-16 md:right-16 bg-glass-3d p-6 rounded-3xl shadow-3d-strong float-3d cursor-default"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]" />
              <span className="text-black text-xs font-bold uppercase tracking-widest">In Stock Now</span>
            </div>
            <p className="text-black/80 text-sm font-medium">Summer Edition '26</p>
          </motion.div>
        </div>

        {/* Floating Background Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-200/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />

        {/* Scroll Indicator (Dark for light bg) */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute bottom-12 left-6 md:left-12 z-20 flex flex-col items-center gap-4 text-black/30 hidden md:flex"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold rotate-90 origin-left translate-y-8 absolute -left-2">Scroll</span>
          <div className="w-px h-24 bg-linear-to-b from-black/20 to-transparent mt-16" />
        </motion.div>
      </section>

      {/* 2. Premium Offers Auto-Slider Section */}
      {offers.length > 0 && (
        <section className="relative h-[250px] md:h-[320px] w-full bg-[#050505] overflow-hidden border-y border-white/5 z-20 group">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[120px]" />
          </div>

          <div className="flex h-full items-center">
            <div 
              className="flex gap-6 px-4 animate-marquee hover:[animation-play-state:paused] w-max"
            >
              {/* Creating 2 sets for perfect seamless infinite scroll with CSS animation */}
              {[...offers, ...offers, ...offers].map((offer, index) => (
                <div 
                  key={`${offer.id}-${index}`}
                  className="relative shrink-0 w-[400px] md:w-[650px] h-[200px] md:h-[260px] rounded-[24px] overflow-hidden group/card shadow-3d-strong transition-all duration-700 image-3d cursor-pointer"
                >
                  <img 
                    src={offer.image_url} 
                    alt={offer.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-105" 
                  />
                  
                  {/* Minimal Bottom Glass Bar */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-linear-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between transition-all duration-500 group-hover/card:pb-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1"
                    >
                      <p className="text-white/80 text-[10px] md:text-sm font-black uppercase tracking-widest mb-1">
                        {offer.title}
                      </p>
                      <p className="text-white/60 text-[8px] md:text-xs font-medium max-w-[200px] md:max-w-xs line-clamp-1">
                        {offer.description || "Premium collection for the modern man."}
                      </p>
                    </motion.div>
                    
                    {offer.link && (
                      <Link 
                        to={offer.link}
                        className="bg-white text-black h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-xl shrink-0"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full">
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Exclusive Offer</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fallback when no offers are available - Only for Debug/Visual confirmation */}
      {!loading && offers.length === 0 && (
        <section className="h-[300px] w-full bg-white flex flex-col items-center justify-center border-y border-black/5 z-20">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center animate-pulse">
               <Tag className="w-5 h-5 text-black/20" />
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-widest">New Offers Coming Soon</h3>
              <p className="text-black/40 text-xs font-bold uppercase tracking-widest mt-2">We are curating something special for you</p>
            </div>
            <Link to="/admin" className="mt-4 px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-gray-800 transition-all">
              Add Your First Offer
            </Link>
          </div>
        </section>
      )}

      {/* 2. Why Choose Us (Features) */}
      <section className="bg-[#111] text-white py-16 border-y border-white/10 relative z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center pt-8 md:pt-0"
            >
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-3 text-white">Free Shipping</h3>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide max-w-[200px]">On all orders over ₹999 within India.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-center pt-8 md:pt-0"
            >
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6 bg-white text-black">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-3 text-white">Premium Quality</h3>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide max-w-[200px]">Curated fabrics and enduring craftsmanship.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col items-center pt-8 md:pt-0"
            >
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-3 text-white">Easy Returns</h3>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide max-w-[200px]">14-day hassle-free exchange policy.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories (Suits | Casual | Accessories) */}
      <section className="py-20 md:py-32 bg-white relative z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-24"
          >
            <div className="flex flex-col items-center gap-4 mb-6">
              <span className="text-xs font-bold tracking-[0.4em] text-black/40 uppercase">Curated</span>
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="w-24 h-1 bg-black origin-center" 
              />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter mb-4">
              Featured <span className="text-transparent border-text-dark italic pr-4">Collections</span>
            </h2>
            <p className="text-black/60 font-medium max-w-2xl mx-auto">Curated edits for every occasion. Upgrade your wardrobe with our meticulously selected categories.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
            {/* Category 1: Suits */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ y: -10, rotateX: -5, rotateY: 5 }}
              className="relative rounded-[32px] overflow-hidden group h-[400px] md:h-full cursor-pointer image-3d border-4 border-white shadow-xl perspective-1000"
            >
              <img
                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop"
                alt="Tailored Suits"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full z-10 flex flex-col justify-end h-full">
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">Bespoke Elegance</span>
                <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Tailored<br />Suits</h3>
                <Link to="/products?category=Suits" className="w-fit flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest hover:text-white/70 transition-colors group/link mt-auto inline-block border-b-2 border-transparent hover:border-white pb-1">
                  Shop Suits <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-2 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Category 2: Casual */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ y: -10, rotateX: 5, rotateY: -5 }}
              className="relative rounded-[32px] overflow-hidden group h-[400px] md:h-full cursor-pointer image-3d border-4 border-white shadow-xl perspective-1000"
            >
              <img
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop"
                alt="Smart Casuals"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full z-10 flex flex-col justify-end h-full">
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">Everyday Staples</span>
                <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Smart<br />Casuals</h3>
                <Link to="/products?category=Shirts" className="w-fit flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest hover:text-white/70 transition-colors group/link mt-auto inline-block border-b-2 border-transparent hover:border-white pb-1">
                  Shop Casuals <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-2 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Category 3: Accessories */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
              className="relative rounded-[32px] overflow-hidden group h-[400px] md:h-full cursor-pointer image-3d border-4 border-white shadow-xl perspective-1000"
            >
              <img
                src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop"
                alt="Premium Accessories"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full z-10 flex flex-col justify-end h-full">
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">The Final Touch</span>
                <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Premium<br />Accents</h3>
                <Link to="/products?category=Watches" className="w-fit flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest hover:text-white/70 transition-colors group/link mt-auto inline-block border-b-2 border-transparent hover:border-white pb-1">
                  Shop Accents <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-2 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Trending Products */}
      <section className="py-24 bg-[#f8f8f8] relative z-20 overflow-hidden border-t border-black/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-px bg-indigo-600" />
                <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
                  Top Ranked
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">
                Best <span className="text-transparent border-text-dark italic pr-4">Sellers</span>
              </h2>
            </div>
            <Link to="/products" className="group hidden md:flex items-center gap-3 text-black text-sm font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
              Shop All Best Sellers <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>

          {/* Horizontal scrollable container for products */}
          <div className="flex overflow-x-auto pb-12 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">
            {bestSellers.map((product, index) => (
              <motion.div
                key={product.product_id || (product as any).id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => window.location.href = `/product/${product.product_id || (product as any).id}`}
                className="min-w-[280px] sm:min-w-[320px] pb-4 flex flex-col group snap-start cursor-pointer relative"
              >
                {/* Product Rank Number (Subtle background) */}
                <div className="absolute -top-6 -left-2 text-8xl font-black text-black/5 select-none pointer-events-none group-hover:text-black/[0.08] transition-colors duration-700">
                   #{index + 1}
                </div>

                <div className="relative aspect-4/5 bg-gray-50 rounded-[32px] mb-6 overflow-hidden group/card shadow-sm hover:shadow-2xl transition-all duration-700 border-4 border-white">
                  <motion.img
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    src={product.images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80'}
                    alt={product.title}
                    className="w-full h-full object-cover object-center"
                  />
                  
                  {/* Premium Gold Best Seller Tag */}
                  <div className="absolute top-5 left-5 z-10">
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#D4AF37] px-4 py-1.5 rounded-full shadow-[0_4px_15px_rgba(212,175,55,0.4)] border border-white/30 group/tag">
                      {/* Shine Effect Overlay */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-[25deg] animate-gold-shine" />
                      
                      <div className="relative flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-black fill-black" />
                        <span className="text-[10px] font-black text-black uppercase tracking-[0.15em]">Best Seller</span>
                      </div>
                    </div>
                  </div>

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] bg-white/90 backdrop-blur-md py-3.5 rounded-2xl flex justify-center gap-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl border border-white">
                      {product.sizes.slice(0, 4).map(size => (
                        <span key={size} className="text-[11px] font-bold text-black uppercase tracking-tighter">{size}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-3 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                       <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{product.category}</p>
                       <h3 className="text-xl font-bold text-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{product.title}</h3>
                       <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${star <= Math.round(product.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                              />
                            ))}
                          </div>
                          {product.reviewCount > 0 && (
                            <span className="text-[10px] font-bold text-gray-400 tracking-wider">({product.reviewCount})</span>
                          )}
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-xl font-black text-black tracking-tighter">₹{product.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. New Arrivals (Split Layout) */}
      <section className="py-32 bg-white relative z-20 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">

            {/* Left Box: Premium Identity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-4 bg-[#0a0a0a] p-12 md:p-20 rounded-[48px] text-white flex flex-col justify-center relative overflow-hidden group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]"
            >
              {/* Radial Glow Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10">
                <h4 className="text-white/40 tracking-[0.4em] uppercase text-[10px] font-black mb-8 flex items-center gap-4">
                  <span className="w-8 h-px bg-white/20" />
                  Season '26
                </h4>
                <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.85]">
                  Latest <span className="text-transparent border-text italic block mt-3 font-serif lowercase tracking-normal bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text">Arrivals.</span>
                </h2>
                <p className="text-white/50 font-medium leading-relaxed mb-12 text-sm max-w-xs">
                  Experience the intersection of haute couture and street-level edge. Our newest drop is here.
                </p>
                <Link to="/products?sort=newest" className="group/btn relative inline-flex items-center gap-6 px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-500 hover:pr-14 hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)]">
                  <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10 transition-colors group-hover/btn:text-white">Discover All</span>
                  <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                  <ArrowRight className="w-5 h-5 relative z-10 transition-all group-hover/btn:translate-x-2 group-hover/btn:text-white" />
                </Link>
              </div>

              {/* Decorative Number */}
              <div className="absolute -bottom-10 -right-10 text-[12rem] font-black text-white/[0.03] select-none pointer-events-none italic">01</div>
            </motion.div>

            {/* Right Grid: Premium Product Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
              {products.slice(6, 10).map((product, index) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 * index }}
                  onClick={() => window.location.href = `/product/${product.product_id}`}
                  className="bg-gray-50/50 rounded-[40px] p-6 flex gap-6 md:gap-8 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 hover:bg-white transition-all duration-700 border border-gray-100 group cursor-pointer relative"
                >
                  {/* Thumbnail */}
                  <div className="w-[120px] md:w-[140px] aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-sm group-hover:shadow-xl transition-all duration-700 border-2 border-white">
                    <img
                      src={product.images?.[0] || product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center py-2">
                    {/* Glassmorphic Badge */}
                    <div className="w-fit mb-3 bg-indigo-600/5 text-indigo-600 border border-indigo-600/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                       NEW
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-bold text-black uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                    
                    {/* Stars & Social Proof */}
                    <div className="flex items-center gap-2 mb-4">
                       <div className="flex gap-0.5">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star key={star} className={`w-3 h-3 ${star <= Math.round(product.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                         ))}
                       </div>
                       <span className="text-[10px] font-bold text-gray-400 tracking-wider">({product.reviewCount || 245})</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                       <span className="text-xl font-black text-black tracking-tighter">₹{product.price.toLocaleString()}</span>
                       <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-500 hover:bg-indigo-600">
                          <Plus className="w-4 h-4" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 6. The Editorial (Replacing Trending Apparel) */}
      <section className="bg-[#f8f8f8] py-32 rounded-t-[60px] md:rounded-t-[100px] border-t border-black/5 shadow-[0_-30px_60px_rgba(0,0,0,0.5)] relative z-20 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Image Stack */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative h-[500px] md:h-[800px] w-full rounded-[40px] overflow-hidden group image-3d border-8 border-white"
            >
              <img
                src="https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=1200&auto=format&fit=crop"
                alt="Editorial Fashion"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />

              {/* Floating element */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-8 right-8 md:bottom-12 md:right-12 bg-glass-3d p-6 rounded-2xl shadow-3d-soft float-3d max-w-[200px]"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-black mb-2">Editor's Pick</p>
                <div className="w-12 h-px bg-black mb-3" />
                <p className="text-sm font-medium text-black/70">The Signature Look. Uncompromising quality.</p>
              </motion.div>
            </motion.div>

            {/* Right Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="px-4 md:px-12"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-px bg-black" />
                <span className="text-xs font-bold tracking-[0.3em] text-black uppercase">
                  The Editorial
                </span>
              </div>

              <h2 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter mb-8 leading-[0.9]">
                Redefining <br />
                <span className="text-transparent border-text-dark italic pr-4">Modern</span> <br />
                Menswear.
              </h2>

              <p className="text-lg text-black/60 font-medium leading-relaxed mb-12 max-w-lg">
                We believe that style is a reflection of character. Our collections are meticulously curated to bring you timeless pieces that blend contemporary design with enduring quality. Every stitch, every fabric, chosen for the modern gentleman.
              </p>

              <div className="grid grid-cols-2 gap-8 mb-12 border-y border-black/10 py-8">
                <div>
                  <h4 className="text-3xl font-black text-black mb-2">100%</h4>
                  <p className="text-xs font-bold text-black/50 uppercase tracking-widest">Premium Materials</p>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-black mb-2">No. 1</h4>
                  <p className="text-xs font-bold text-black/50 uppercase tracking-widest">In Menswear</p>
                </div>
              </div>

              <Link to="/products" className="group inline-flex items-center gap-4 border-b-2 border-black pb-2 text-black font-black uppercase tracking-widest hover:text-black/60 hover:border-black/60 transition-colors">
                Shop The Collection <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Instagram Style Gallery */}
      <section className="bg-white relative z-20 overflow-hidden">
        <div className="py-20 text-center">
          <h4 className="text-black/50 tracking-[0.4em] uppercase text-xs font-bold mb-4">Follow Us</h4>
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter flex items-center justify-center gap-4">
            @TheBoys<span className="text-transparent border-text-dark italic">Zone</span>
          </h2>
        </div>

        <div className="flex w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory">
          {[
            "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop",
          ].map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              whileHover={{ y: -15 }}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-0 md:flex-1 aspect-3/4 relative group snap-start cursor-pointer origin-center rounded-[32px] overflow-hidden image-3d border-4 border-white mx-3 mb-16 shadow-2xl transition-all duration-500"
            >
              <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Instagram className="w-10 h-10 text-white transform scale-50 group-hover:scale-100 transition-transform duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Add border-text utility for outline fonts */}
      <style>{`
        .border-text {
          color: transparent;
          -webkit-text-stroke: 2px rgba(255, 255, 255, 0.8);
        }
        .border-text-dark {
          color: transparent;
          -webkit-text-stroke: 2px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};