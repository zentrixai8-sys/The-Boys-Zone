import React, { useEffect, useState } from 'react';
import { useHomeData } from '../hooks/useHomeData';
import { api } from '../services/api';
import { Product, Category, Offer } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, Instagram, ExternalLink, Tag, Star, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ToonhubHero } from '../components/ToonhubHero';
import { CategoryAccordion } from '../components/CategoryAccordion';

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

const AnimatedCounter = ({ end, duration = 2000, suffix = "+" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsInView(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
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

const AutoSlidingImage = ({ product, className }: { product: Product; className?: string }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const allImages = React.useMemo(() => {
    if (!product) return [];
    const imgs = new Set<string>();
    if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim().length > 0) {
      imgs.add(product.image_url.trim());
    }
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        if (img && typeof img === 'string' && img.trim().length > 0) imgs.add(img.trim());
      });
    }
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        if (v?.colorImage && typeof v.colorImage === 'string' && v.colorImage.trim().length > 0) {
          imgs.add(v.colorImage.trim());
        }
        if (v?.images && Array.isArray(v.images)) {
          v.images.forEach((img: any) => {
            if (img && typeof img === 'string' && img.trim().length > 0) imgs.add(img.trim());
          });
        }
      });
    }
    return Array.from(imgs);
  }, [product]);

  useEffect(() => {
    if (!allImages || allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allImages]);

  const fallbackImg = 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800';
  const currentSrc = (allImages && allImages.length > 0 && allImages[currentImgIndex])
    ? allImages[currentImgIndex]
    : (product?.image_url && typeof product.image_url === 'string' && product.image_url.trim().length > 0
      ? product.image_url.trim()
      : fallbackImg);

  return (
    <img
      src={currentSrc}
      alt={product?.title || 'Product'}
      key={currentSrc}
      loading="lazy"
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackImg) {
          target.src = fallbackImg;
        }
      }}
    />
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const { products, bestSellers, categories, offers, isLoading: loading } = useHomeData();

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-black selection:text-white pb-14 md:pb-0">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-50 origin-left"
        style={{ scaleX }}
      />

      {/* 1. TOONHUB Style 3D Figurines & Boys Fashion Hero Carousel */}
      <ToonhubHero />

      {/* 2. Premium Offers Auto-Slider Section (Luxury Light Theme - No Black Background) */}
      {offers && offers.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative py-4 sm:py-6 md:py-8 w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden border-y border-slate-200/70 z-20 group"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-500/4 rounded-full blur-[120px] -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-rose-500/4 rounded-full blur-[120px] -translate-y-1/2" />
          </div>

          <div className="relative flex items-center">
            <div 
              className="flex gap-3 sm:gap-4 md:gap-5 px-3 sm:px-6 md:px-8 animate-marquee hover:[animation-play-state:paused] w-max py-1.5"
            >
              {/* Seamless infinite marquee auto-scroll */}
              {[...(offers || []), ...(offers || []), ...(offers || [])].map((offer, index) => (
                <div 
                  key={`${offer.id}-${index}`}
                  onClick={() => {
                    if (!offer.link) return;
                    if (offer.link.startsWith('http')) {
                      window.open(offer.link, '_blank');
                    } else {
                      navigate(offer.link);
                    }
                  }}
                  className="relative shrink-0 w-[230px] sm:w-[320px] md:w-[440px] lg:w-[480px] h-[110px] sm:h-[155px] md:h-[210px] lg:h-[230px] rounded-xl sm:rounded-2xl md:rounded-[1.75rem] overflow-hidden group/card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.14)] transition-all duration-400 cursor-pointer border border-slate-200/80 hover:border-slate-300"
                >
                  <img
                    src={offer.image_url}
                    alt={offer.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Subtle Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Interactive Content */}
                  <div className="absolute inset-0 p-3 sm:p-4 md:p-6 flex flex-col justify-between opacity-0 group-hover/card:opacity-100 transition-all duration-300 z-10 pointer-events-none">
                    <div className="flex items-start justify-between">
                       <div className="bg-white/95 backdrop-blur-md px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-sm">
                         <span className="text-slate-900 text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Exclusive Drop</span>
                       </div>
                    </div>

                    <div className="flex items-end justify-between">
                       <div className="flex-1 pr-2.5 sm:pr-4">
                          <h3 className="text-white text-xs sm:text-base md:text-lg font-extrabold uppercase tracking-wide mb-0.5 line-clamp-1 drop-shadow-md">{offer.title}</h3>
                          <p className="text-white/90 text-[8px] sm:text-[10px] md:text-xs font-medium line-clamp-1 max-w-[160px] sm:max-w-[220px] md:max-w-xs drop-shadow">{offer.description || "Premium collection for The Boys Zone."}</p>
                       </div>
                       {offer.link && (
                          <div 
                            className="bg-white text-slate-900 h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md shrink-0 group-hover/card:scale-110"
                          >
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-900" />
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
      {!loading && (!offers || offers.length === 0) && (
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


      {/* 3. Shop by Category (Framer 3D Accordion Gallery Style) */}
      <section className="py-10 sm:py-14 md:py-20 bg-[#08080a] relative z-20 border-b border-white/10 text-white overflow-hidden">
        {/* Subtle Ambient Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px]" />
          <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 md:mb-10 gap-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-red-500 rounded-full" />
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-red-500">
                  Wardrobe Architecture
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                SHOP BY CATEGORY
              </h2>
            </div>
            <Link 
              to="/products" 
              className="group inline-flex items-center gap-2 text-white/80 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors w-fit"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>

          {/* 3D Framer Accordion Gallery */}
          <CategoryAccordion />
        </div>
      </section>

      {/* 4. Luxury Best Sellers */}
      <section className="py-12 md:py-24 bg-[#080808] relative z-20 overflow-hidden border-t-4 border-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,_rgba(220,38,38,0.08)_0%,_transparent_50%),_radial-gradient(circle_at_75%_65%,_rgba(67,56,202,0.08)_0%,_transparent_50%)] pointer-events-none" />
        
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
              <h2 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter">
                BESTSELLERS
              </h2>
            </div>
            <Link to="/products" className="group hidden md:flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">
              Explore All <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-10">
            {(bestSellers || []).slice(0, 4).map((product, index) => (
              <motion.div
                key={product.product_id || (product as any).id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "200px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onClick={() => navigate(`/product/${product.product_id || (product as any).id}`)}
                className="group relative cursor-pointer"
              >
                {/* Floating Rank */}
                <div className="absolute -top-6 -left-4 z-0 text-[100px] md:text-[140px] font-black text-white/[0.02] leading-none pointer-events-none italic">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="relative aspect-[3/4.5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-red-600/30 transition-all duration-700 shadow-2xl">
                  <AutoSlidingImage
                    product={product}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2.5s] ease-out"
                  />
                  
                  {/* Badge */}
                  <div className="absolute top-6 left-6 z-10">
                    <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10 overflow-hidden">
                       <span className="relative z-10">Most Wanted</span>
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[25deg] animate-[shimmer_3s_infinite]" />
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="absolute inset-x-0 bottom-0 p-3 md:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-white/10 shadow-2xl">
                       <div className="flex flex-col gap-1">
                          <span className="text-[8px] md:text-[9px] font-black tracking-[0.4em] text-red-500 uppercase mb-1">
                            Elite Choice
                          </span>
                          <h3 className="text-[11px] md:text-base font-black text-white uppercase tracking-tight line-clamp-1">
                            {product.title}
                          </h3>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                             <span className="text-xs md:text-lg font-bold text-white tracking-tighter">₹{product.price.toLocaleString()}</span>
                             <div className="bg-white text-black h-7 w-7 md:h-10 md:w-10 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-all duration-500">
                                <ArrowRight className="w-3 h-3 md:w-5 md:h-5" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. New Arrivals (Curated 4 Grid) */}
      <section className="py-12 md:py-24 bg-white relative z-20 border-b-4 border-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
          >
            <div>
              <h2 className="text-2xl md:text-5xl font-black text-black uppercase tracking-tighter">
                NEW DROPS
              </h2>
            </div>
            <Link to="/products?sort=newest" className="group inline-flex items-center gap-3 text-black text-sm font-bold uppercase tracking-widest hover:text-red-600 transition-colors">
              VIEW ALL <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
 
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-10">
            {(products || []).slice(0, 4).map((product, index) => (
              <motion.div
                key={product.product_id || (product as any).id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                onClick={() => navigate(`/product/${product.product_id || (product as any).id}`)}
                className="flex flex-col group cursor-pointer"
              >
                <div className="relative aspect-[3/4.5] bg-gray-50 mb-6 overflow-hidden border-[3px] border-transparent hover:border-black transition-all duration-500 rounded-[1.5rem] md:rounded-[2.2rem] shadow-sm hover:shadow-xl">
                  <AutoSlidingImage
                    product={product}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                  />
                  
                  <div className="absolute top-4 left-4 z-10 bg-black text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl">
                    NEW DROP
                  </div>

                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
 
                <div className="flex flex-col gap-1.5 px-2">
                   <h3 className="text-[12px] md:text-base font-black text-black uppercase tracking-tight group-hover:text-red-600 transition-colors line-clamp-1">{product.title}</h3>
                   <span className="text-[11px] md:text-base font-bold text-black/40 tracking-tight">₹{product.price.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Collaborations / Pop Culture Drops */}
      <section className="py-10 sm:py-14 md:py-16 bg-[#0a0a0c] relative z-20 overflow-hidden border-y border-white/10 text-white">
        {/* Subtle Ambient Glow Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-80 h-80 bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 sm:mb-8 gap-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-0.5 bg-red-500 rounded-full" />
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-red-500">
                  Exclusive Drops
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
                COLLABORATIONS
              </h2>
            </div>
            <Link 
              to="/products" 
              className="group inline-flex items-center gap-2 text-white/80 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors w-fit"
            >
              <span>View All Drops</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1: Anime Vol. 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate('/products?category=Anime')}
              className="group relative h-[210px] sm:h-[260px] md:h-[300px] rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-white/30 transition-all duration-400 cursor-pointer shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(239,68,68,0.2)]"
            >
              <img
                src="https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=1200&auto=format&fit=crop"
                alt="Anime Drop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
              />
              
              {/* Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-300" />
              
              {/* Subtle Edge Glow on Hover */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-red-500/40 rounded-2xl md:rounded-3xl transition-all duration-300 pointer-events-none" />

              {/* Card Badges and Info */}
              <div className="absolute inset-0 p-4 sm:p-6 md:p-7 flex flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>New Drop</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50 tracking-wider hidden sm:inline">CAPSULE 01</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-1 drop-shadow-md group-hover:text-red-400 transition-colors">
                    ANIME VOL. 2
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm font-medium line-clamp-1 mb-2.5 max-w-md">
                    Limited edition Japanese cyberpunk oversized streetwear.
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    <span>Shop Capsule</span>
                    <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Graphic Archive */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate('/products?category=Oversized+Tees')}
              className="group relative h-[210px] sm:h-[260px] md:h-[300px] rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-white/30 transition-all duration-400 cursor-pointer shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.2)]"
            >
              <img
                src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop"
                alt="Graphic Tees Drop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
              />
              
              {/* Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-300" />
              
              {/* Subtle Edge Glow on Hover */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-indigo-500/40 rounded-2xl md:rounded-3xl transition-all duration-300 pointer-events-none" />

              {/* Card Badges and Info */}
              <div className="absolute inset-0 p-4 sm:p-6 md:p-7 flex flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-md">
                    <span>Restocked</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50 tracking-wider hidden sm:inline">ARCHIVE 02</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-1 drop-shadow-md group-hover:text-indigo-400 transition-colors">
                    GRAPHIC ARCHIVE
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm font-medium line-clamp-1 mb-2.5 max-w-md">
                    Heavyweight 240 GSM vintage washed signature prints.
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    <span>Shop Edition</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5.5 Why Choose Us & Happy Customers */}
      <section className="py-20 md:py-32 bg-[#051F20] text-[#DAF1DE] relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[#DAF1DE]/5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Why Choose Us */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h4 className="text-[#8EB69B] tracking-[0.4em] uppercase text-xs font-bold mb-4">The TBZ Difference</h4>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 leading-tight">
                Why Choose <br /><span className="text-transparent border-text italic">The Boys Zone</span>
              </h2>
              
              <div className="space-y-6">
                {[
                  { title: "Premium Quality", desc: "Handpicked fabrics that offer unmatched comfort and durability." },
                  { title: "Fast Delivery", desc: "Express shipping directly to your doorstep with tracking." },
                  { title: "Easy Returns", desc: "Hassle-free 7-day return policy on all unworn items." },
                  { title: "Dedicated Support", desc: "Our team is always here to help you with your fashion needs." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-4"
                  >
                    <div className="w-12 h-12 bg-[#0B2B26] rounded-xl flex items-center justify-center shrink-0 border border-[#8EB69B]/30">
                      <Star className="w-6 h-6 text-[#8EB69B]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-wide mb-1">{item.title}</h3>
                      <p className="text-[#8EB69B] text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Happy Customers Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-[#0B2B26] rounded-[40px] p-10 md:p-16 border border-[#8EB69B]/20 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#8EB69B] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#DAF1DE] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
              
              <div className="mb-6 flex -space-x-4">
                {[
                  "https://i.pravatar.cc/100?img=11",
                  "https://i.pravatar.cc/100?img=12",
                  "https://i.pravatar.cc/100?img=15",
                  "https://i.pravatar.cc/100?img=33"
                ].map((img, i) => (
                  <img key={i} src={img} alt="Customer" className="w-16 h-16 rounded-full border-4 border-[#0B2B26] object-cover" />
                ))}
                <div className="w-16 h-16 rounded-full border-4 border-[#0B2B26] bg-[#8EB69B] flex items-center justify-center relative z-10 text-[#051F20]">
                  <Plus className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-6xl md:text-8xl font-black text-[#DAF1DE] tracking-tighter mb-4 tabular-nums">
                <AnimatedCounter end={10000} duration={2500} />
              </h3>
              <p className="text-xl md:text-2xl font-bold text-[#8EB69B] uppercase tracking-[0.2em]">
                Happy Customers
              </p>
              <p className="mt-6 text-sm text-[#DAF1DE]/60 max-w-sm font-medium">
                Join our community of satisfied fashion enthusiasts who trust us for their daily drip.
              </p>
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