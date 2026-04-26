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
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroDir, setHeroDir] = useState(1);

  const heroImages = [
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=95&w=3840&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?q=95&w=3840&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=95&w=3840&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=95&w=3840&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=95&w=3840&auto=format&fit=crop",
  ];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const goToSlide = (index: number) => {
    setHeroDir(index > heroSlide ? 1 : -1);
    setHeroSlide(index);
  };

  // Auto-slide hero images every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroDir(1);
      setHeroSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
          const allProds = res.products || [];
          // Media-based filtering: Show only if it has an image or video
          const onlineProds = allProds.filter((p: any) => {
            const hasMedia = p.image_url || p.video_url || 
                             (p.variants && p.variants.some((v: any) => v.colorImage || (v.images && v.images.length > 0)));
            return !!hasMedia;
          });
          setProducts(onlineProds);
        } catch (e) {
          console.error('Products fetch failed:', e);
        }
      };

      const fetchBestSellers = async () => {
        try {
          const res = await api.request('getBestSellers');
          const allBS = res || [];
          // Media-based filtering: Show only if it has an image or video
          const onlineBS = allBS.filter((p: any) => {
            const hasMedia = p.image_url || p.video_url || 
                             (p.variants && p.variants.some((v: any) => v.colorImage || (v.images && v.images.length > 0)));
            return !!hasMedia;
          });
          setBestSellers(onlineBS);
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
    <div className="bg-white min-h-screen font-sans selection:bg-black selection:text-white">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-50 origin-left"
        style={{ scaleX }}
      />

      {/* 1. Urban Threads Style Hero Banner */}
      <section className="relative w-full h-screen bg-black overflow-hidden">
        {/* Horizontal Sliding Background Images */}
        <AnimatePresence mode="sync" custom={heroDir}>
          <motion.div
            key={heroSlide}
            custom={heroDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[heroSlide]}
              alt={`Boys Fashion ${heroSlide + 1}`}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content - Left Aligned */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col justify-end md:justify-center h-full px-6 md:px-16 pb-32 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${heroSlide}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col items-start max-w-2xl"
            >
              <span className="text-[11px] md:text-[13px] font-semibold tracking-[0.5em] uppercase text-white/50 mb-4 md:mb-5">The Boys Zone — 2026</span>
              <h1 className="text-[11vw] md:text-[5.5vw] lg:text-[5vw] leading-[0.9] tracking-tight text-white font-black uppercase italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                STYLE
              </h1>
              <p className="text-[4vw] md:text-[2vw] lg:text-[1.6vw] tracking-[0.15em] text-white/80 font-semibold uppercase mt-1">
                IS A REFLECTION OF YOUR ATTITUDE
              </p>
              <p className="mt-4 md:mt-5 text-white/50 text-[10px] md:text-xs leading-relaxed tracking-[0.2em] uppercase">
                Dress Confidently. Live Fearlessly.
              </p>
              <Link
                to="/products"
                className="mt-7 md:mt-9 inline-flex items-center gap-3 bg-transparent text-white px-7 md:px-9 py-3 md:py-3.5 text-[11px] md:text-xs font-bold tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-400 border border-white/50 hover:border-white"
              >
                SHOP NOW <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Slide Progress Indicators */}
          <div className="flex items-center gap-3 mt-10 md:mt-14">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className="flex flex-col items-start gap-1.5 group"
              >
                <span className={`text-[10px] font-bold tracking-widest transition-colors duration-300 ${i === heroSlide ? 'text-white' : 'text-white/25 group-hover:text-white/50'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="w-10 md:w-12 h-[2px] bg-white/20 overflow-hidden rounded-full">
                  {i === heroSlide && (
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 5, ease: 'linear' }}
                    />
                  )}
                  {i !== heroSlide && (
                    <div className={`h-full rounded-full transition-all duration-300 ${i < heroSlide ? 'bg-white/60 w-full' : 'w-0'}`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Premium Offers Auto-Slider Section */}
      {offers.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative py-12 md:py-24 w-full bg-[#030303] overflow-hidden border-y border-white/10 z-20 group"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[150px] -translate-y-1/2" />
          </div>

          <div className="relative flex items-center">
            <div 
              className="flex gap-6 md:gap-10 px-4 md:px-10 animate-marquee hover:[animation-play-state:paused] w-max"
            >
              {/* Creating 2 sets for perfect seamless infinite scroll with CSS animation */}
              {[...offers, ...offers, ...offers].map((offer, index) => (
                <div 
                  key={`${offer.id}-${index}`}
                  onClick={() => offer.link && (window.location.href = offer.link)}
                  className="relative shrink-0 w-[280px] sm:w-[450px] md:w-[750px] h-[160px] sm:h-[240px] md:h-[350px] rounded-[20px] md:rounded-[40px] overflow-hidden group/card shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] transition-all duration-700 cursor-pointer border border-white/10 hover:border-white/20"
                >
                  <img 
                    src={offer.image_url} 
                    alt={offer.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover/card:scale-105" 
                  />
                  
                  {/* Premium Hover Glass Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 backdrop-blur-[4px] pointer-events-none" />
                  
                  {/* Interactive Content */}
                  <div className="absolute inset-0 p-5 md:p-10 flex flex-col justify-between opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-10 pointer-events-none">
                    <div className="flex items-start justify-between translate-y-[-10px] md:translate-y-[-20px] group-hover/card:translate-y-0 transition-transform duration-700 ease-out">
                       <div className="bg-white/10 backdrop-blur-md border border-white/30 px-4 md:px-6 py-1.5 md:py-2.5 rounded-full shadow-lg">
                         <span className="text-white text-[8px] md:text-xs font-black uppercase tracking-[0.3em]">Exclusive Edition</span>
                       </div>
                    </div>

                    <div className="flex items-end justify-between translate-y-[10px] md:translate-y-[20px] group-hover/card:translate-y-0 transition-transform duration-700 ease-out">
                       <div className="flex-1 pr-4 md:pr-6">
                          <h3 className="text-white text-lg md:text-4xl font-black uppercase tracking-widest mb-1 md:mb-2 line-clamp-1 drop-shadow-lg">{offer.title}</h3>
                          <p className="text-white/90 text-[10px] md:text-sm font-medium line-clamp-2 max-w-[200px] md:max-w-md drop-shadow-md">{offer.description || "Premium collection for the modern man."}</p>
                       </div>
                       {offer.link && (
                          <div 
                            className="bg-white text-black h-8 w-8 md:h-16 md:w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.3)] shrink-0 group/btn"
                          >
                            <ArrowRight className="w-4 h-4 md:w-6 md:h-6 group-hover/btn:translate-x-1 transition-transform" />
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
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

      {/* 2. Features Marquee */}
      <section className="bg-red-600 text-white py-4 border-y-4 border-black relative z-20 overflow-hidden whitespace-nowrap flex items-center">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-8 md:gap-12 text-xs md:text-sm font-black uppercase tracking-widest min-w-max items-center"
        >
          {[...Array(6)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> FREE SHIPPING OVER ₹999</span>
              <span>•</span>
              <span className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> 14 DAY EASY RETURNS</span>
              <span>•</span>
              <span className="flex items-center gap-2"><Star className="w-5 h-5 fill-white" /> PREMIUM STREETWEAR</span>
              <span>•</span>
            </React.Fragment>
          ))}
        </motion.div>
      </section>

      {/* 3. Shop by Category (Bonkers Style) */}
      <section className="py-16 md:py-24 bg-white relative z-20 border-b-4 border-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-10"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">
              SHOP BY CATEGORY
            </h2>
          </motion.div>

          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 md:gap-12 snap-x snap-mandatory hide-scrollbar">
            {[
              { title: "Oversized Tees", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400&auto=format&fit=crop" },
              { title: "Cargos", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=400&auto=format&fit=crop" },
              { title: "Anime", img: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=400&auto=format&fit=crop" },
              { title: "Hoodies", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400&auto=format&fit=crop" },
              { title: "Basics", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop" },
              { title: "Co-Ords", img: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=400&auto=format&fit=crop" }
            ].map((cat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onClick={() => window.location.href = `/products?category=${cat.title.replace(' ', '+')}`}
                className="flex flex-col items-center gap-4 snap-center cursor-pointer group shrink-0"
              >
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-[3px] border-black group-hover:scale-105 transition-transform duration-300 relative shadow-md">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
                <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-black group-hover:text-red-600 transition-colors">{cat.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Trending Products */}
      <section className="py-24 bg-[#050505] relative z-20 overflow-hidden border-t-4 border-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-[#050505] to-[#050505] pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="w-12 h-px bg-red-600" />
                <span className="text-red-500/80 text-[10px] font-black tracking-[0.3em] uppercase">Premium Selection</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                BESTSELLERS
              </h2>
            </div>
            <Link to="/products" className="group hidden md:flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">
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
                <div className="relative aspect-[3/4] bg-zinc-900 mb-5 overflow-hidden group/card border border-white/10 hover:border-red-600/50 transition-all duration-500 rounded-sm">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    src={product.images?.[0] || product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover object-center opacity-90 group-hover/card:opacity-100 transition-opacity"
                  />
                  
                  {/* Clean Premium Tag */}
                  <div className="absolute top-4 left-4 z-10 bg-red-600 text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_4px_10px_rgba(220,38,38,0.3)]">
                    Most Wanted
                  </div>

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 opacity-0 transform translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-500 ease-out">
                      {product.sizes.slice(0, 4).map(size => (
                        <span key={size} className="w-8 h-8 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase hover:bg-red-600 hover:border-red-600 transition-colors rounded-sm">{size}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 px-1">
                   <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight group-hover:text-red-500 transition-colors line-clamp-1">{product.title}</h3>
                   <span className="text-sm md:text-base font-bold text-white/50 tracking-widest">₹{product.price.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. New Arrivals */}
      <section className="py-20 md:py-32 bg-white relative z-20 border-b-4 border-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">
                NEW DROPS
              </h2>
            </div>
            <Link to="/products?sort=newest" className="group inline-flex items-center gap-3 text-black text-sm font-bold uppercase tracking-widest hover:text-red-600 transition-colors">
              VIEW ALL <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {products.slice(6, 10).map((product, index) => (
              <motion.div
                key={product.product_id || (product as any).id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                onClick={() => window.location.href = `/product/${product.product_id || (product as any).id}`}
                className="flex flex-col group cursor-pointer"
              >
                <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden border-2 border-transparent hover:border-black transition-colors duration-300">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    src={product.images?.[0] || product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute top-3 left-3 z-10 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-md">
                    NEW
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-1">
                   <h3 className="text-sm md:text-base font-black text-black uppercase tracking-tight group-hover:text-red-600 transition-colors line-clamp-1">{product.title}</h3>
                   <span className="text-sm md:text-base font-bold text-black/60 tracking-tight">₹{product.price.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Collaborations / Pop Culture Drops */}
      <section className="py-16 md:py-24 bg-black relative z-20 overflow-hidden border-y-4 border-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                COLLABORATIONS
              </h2>
            </div>
            <Link to="/products" className="group inline-flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">
              VIEW ALL DROPS <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 0.98 }}
              className="relative aspect-video md:aspect-[4/3] bg-zinc-900 overflow-hidden group cursor-pointer border-4 border-white"
            >
              <img
                src="https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=1200&auto=format&fit=crop"
                alt="Anime Drop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest w-fit mb-3">NEW DROP</div>
                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">ANIME VOL. 2</h3>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 0.98 }}
              className="relative aspect-video md:aspect-[4/3] bg-zinc-900 overflow-hidden group cursor-pointer border-4 border-white"
            >
              <img
                src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop"
                alt="Streetwear Drop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <div className="bg-white text-black text-[10px] font-black px-3 py-1 uppercase tracking-widest w-fit mb-3">RESTOCKED</div>
                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">GRAPHIC TEES</h3>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Instagram Style Gallery */}
      <section className="bg-white relative z-20 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-20 text-center"
        >
          <h4 className="text-black/50 tracking-[0.4em] uppercase text-xs font-bold mb-4">@THEBOYSZONE</h4>
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter flex items-center justify-center gap-4">
            JOIN THE <span className="text-transparent border-text-dark italic">CULT</span>
          </h2>
        </motion.div>

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