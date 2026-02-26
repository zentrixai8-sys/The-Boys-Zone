import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion, useScroll, useTransform } from 'motion/react';
import { Play, ArrowRight, Instagram } from 'lucide-react';
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

export const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.request('getProducts', { limit: 12 }), // Fetch enough for both grids
          api.request('getCategories')
        ]);
        setProducts(productsRes.products || []);
        setCategories(categoriesRes.categories || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-[#111] min-h-screen font-sans selection:bg-white selection:text-black">

      {/* 1. Split-Screen Light/Dark Hero */}
      <section className="relative min-h-[100svh] w-full bg-white overflow-hidden flex flex-col md:flex-row">

        {/* Left Side: Typography & Content (White Background) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 md:py-0 relative z-20 min-h-[60svh] md:min-h-[100svh]">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <h4 className="text-black/50 tracking-[0.4em] uppercase text-xs font-bold mb-8 flex items-center gap-4">
              <span className="w-8 h-px bg-black/20" />
              Welcome To
            </h4>

            <h1 className="text-[5rem] sm:text-[6.5rem] lg:text-[8rem] xl:text-[9.5rem] leading-[0.85] tracking-tighter text-black mb-8 font-serif font-black uppercase text-3d">
              The <br />
              <span className="italic tracking-normal ml-0 md:ml-8 text-black">Boys</span><br />
              <span className="ml-0 md:ml-24">Zone.</span>
            </h1>
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
            <Link to="/products" className="group bg-black text-white px-10 py-5 rounded-full text-sm font-black tracking-widest uppercase hover:bg-gray-900 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-4 shadow-3d-strong border-b-4 border-black/80">
              Explore The Shop
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Full Height Image */}
        <div className="w-full md:w-1/2 relative min-h-[50svh] md:min-h-[100svh] overflow-hidden bg-[#f8f8f8] flex items-center justify-center">
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
            className="absolute bottom-8 right-8 md:bottom-16 md:right-16 bg-glass-3d p-6 rounded-3xl shadow-3d-strong float-3d"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              <span className="text-black text-xs font-bold uppercase tracking-widest">In Stock Now</span>
            </div>
            <p className="text-black/80 text-sm font-medium">Summer Edition '26</p>
          </motion.div>
        </div>

        {/* Scroll Indicator (Dark for light bg) */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute bottom-12 left-6 md:left-12 z-20 flex flex-col items-center gap-4 text-black/30 hidden md:flex"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold rotate-90 origin-left translate-y-8 absolute -left-2">Scroll</span>
          <div className="w-px h-24 bg-gradient-to-b from-black/20 to-transparent mt-16" />
        </motion.div>
      </section>

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
              className="relative rounded-[32px] overflow-hidden group h-[400px] md:h-full cursor-pointer image-3d border-4 border-white"
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
              className="relative rounded-[32px] overflow-hidden group h-[400px] md:h-full cursor-pointer image-3d border-4 border-white"
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
              className="relative rounded-[32px] overflow-hidden group h-[400px] md:h-full cursor-pointer image-3d border-4 border-white"
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
                  Most Wanted
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">
                Trending <span className="text-transparent border-text-dark italic pr-4">Now</span>
              </h2>
            </div>
            <Link to="/products" className="group hidden md:flex items-center gap-3 text-black text-sm font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
              Shop All Trends <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>

          {/* Horizontal scrollable container for products */}
          <div className="flex overflow-x-auto pb-12 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">
            {products.slice(0, 6).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="min-w-[280px] sm:min-w-[320px] pb-4 flex flex-col group snap-start"
              >
                <div className="relative aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden mb-4 image-3d border-4 border-white">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </Link>
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-glass-3d py-3 rounded-full flex justify-center gap-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-3d-soft">
                      {product.sizes.slice(0, 4).map(size => (
                        <span key={size} className="text-xs font-bold text-black uppercase">{size}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-2 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-bold text-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                    </Link>
                    <span className="font-mono font-bold text-black">₹{product.price.toLocaleString()}</span>
                  </div>
                  <p className="text-black/50 text-sm font-medium">{product.category}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. New Arrivals (Split Layout) */}
      <section className="py-24 bg-white relative z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Box */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-4 bg-[#111] p-12 md:p-16 rounded-[40px] text-white flex flex-col justify-center relative overflow-hidden group shadow-3d-strong"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h4 className="text-white/50 tracking-[0.3em] uppercase text-xs font-bold mb-6">Just Dropped</h4>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                New <span className="text-transparent border-text italic block mt-2">Arrivals.</span>
              </h2>
              <p className="text-white/70 font-medium leading-relaxed mb-12">
                Be the first to wear the latest additions to our collection. Fresh styles, premium fits, and modern essentials.
              </p>
              <Link to="/products?sort=newest" className="flex items-center gap-4 text-white text-sm font-bold tracking-widest uppercase hover:text-indigo-400 transition-colors w-fit border-b-2 border-transparent hover:border-indigo-400 pb-1">
                View Latest <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Right Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.slice(6, 10).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                  className="bg-[#f8f8f8] rounded-3xl p-4 flex gap-6 hover:shadow-3d-soft hover:-translate-y-1 hover:bg-white transition-all duration-300 border border-transparent hover:border-black/5 group cursor-pointer"
                >
                  <div className="w-1/3 aspect-[4/5] rounded-xl overflow-hidden bg-white image-3d border-2 border-white">
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="w-2/3 flex flex-col justify-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 mb-2">New</span>
                    <h3 className="text-lg font-bold text-black uppercase tracking-tight mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-black/50 text-xs font-medium uppercase mb-4">{product.category}</p>
                    <span className="font-mono font-bold text-lg text-black mt-auto">₹{product.price.toLocaleString()}</span>
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
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-0 md:flex-1 aspect-square relative group snap-start cursor-pointer origin-center rounded-[32px] overflow-hidden image-3d border-4 border-white mx-2 mb-12"
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