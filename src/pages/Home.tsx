import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.request('getProducts', { limit: 4 }),
          api.request('getCategories')
        ]);
        setFeaturedProducts(productsRes.products ? productsRes.products.slice(0, 4) : []);
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
    <div className="bg-white min-h-screen">
      
      {/* 1. Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="max-w-xl py-12 lg:py-0 relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-px bg-indigo-200" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase">
                  Established 2024
                </span>
              </div>
              
              <h1 className="text-[4rem] md:text-[5.5rem] lg:text-[6rem] leading-[1.05] tracking-tight text-gray-900 mb-8 font-serif">
                Refining <br />
                <span className="text-gray-400 italic font-serif">Modern</span> <br />
                Masculinity
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg text-gray-500 mb-12 max-w-md font-sans leading-relaxed font-medium"
            >
              A curated collection of contemporary essentials designed for the ambitious young man.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex items-center gap-8"
            >
              <Link to="/products" className="bg-[#0f172a] text-white px-8 py-4 rounded-full font-semibold hover:bg-black transition-colors">
                Shop Collection
              </Link>
              <button className="flex items-center gap-3 text-sm font-semibold text-gray-900 group">
                <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-400 transition-colors">
                  <Play className="w-4 h-4 ml-1" />
                </div>
                Our Film
              </button>
            </motion.div>
          </div>
          
          {/* Right Image Content - Soft Gradient Blend */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none">
             <div className="absolute inset-0 bg-linear-to-r from-white via-white/50 to-transparent z-10" />
             {/* Using a placeholder male model image to mimic the screenshot */}
             <img 
               src="https://images.unsplash.com/photo-1594938298593-c53f8d161829?q=80&w=2600&auto=format&fit=crop" 
               alt="Modern Masculinity" 
               className="w-full h-full object-cover object-top" 
             />
             <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-30">
                <span className="text-[10px] uppercase tracking-widest font-bold">Explore</span>
                <div className="w-px h-8 bg-black/50" />
             </div>
          </div>
        </div>
      </section>

      {/* 2. Features Grid */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
               { icon: "🚚", title: "Complimentary Shipping", desc: "On all orders over $150" },
               { icon: "🛡️", title: "Lifetime Guarantee", desc: "Quality that endures" },
               { icon: "⭐", title: "Curated Selection", desc: "Only the finest materials" },
               { icon: "⚡", title: "Immediate Dispatch", desc: "Worldwide tracking" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="text-xl opacity-60 grayscale">{feature.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-[13px] font-medium text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Collections (Crafted for Movement) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase mb-4">Collections</h4>
            <h2 className="text-5xl font-serif text-gray-900 font-bold tracking-tight">Crafted for Movement</h2>
          </div>
          <Link to="/categories" className="text-sm font-bold text-gray-900 border-b border-gray-900 pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors">
            View All Series
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/products?category=Jackets" className="relative h-[600px] rounded-[32px] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1400&auto=format&fit=crop" 
              alt="Jackets" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-12 left-12">
               <h3 className="text-white font-serif text-3xl font-bold mb-2">Outerwear Essentials</h3>
               <p className="text-white/80 text-sm">Protection meets style</p>
            </div>
          </Link>
          
          <div className="grid grid-rows-2 gap-8 h-[600px]">
             <Link to="/products?category=T-Shirts" className="relative rounded-[32px] overflow-hidden group">
               <img 
                 src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop" 
                 alt="Essential Basics" 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
               />
               <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
               <div className="absolute bottom-8 left-8">
                  <h3 className="text-white font-serif text-2xl font-bold mb-1">Essential Basics</h3>
                  <p className="text-white/80 text-sm">Comfort in simplicity</p>
               </div>
             </Link>
             <div className="grid grid-cols-2 gap-8">
                <Link to="/products?category=Jeans" className="relative rounded-[32px] overflow-hidden group">
                  <img 
                    src="https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?q=80&w=800&auto=format&fit=crop" 
                    alt="Jeans" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                </Link>
                <Link to="/products?category=Accessories" className="relative rounded-[32px] overflow-hidden group">
                  <img 
                    src="https://images.unsplash.com/photo-1551028719-01c1eb562141?q=80&w=800&auto=format&fit=crop" 
                    alt="Accessories" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                </Link>
             </div>
          </div>
        </div>
      </section>

      {/* 4. Seasonal Favorites (Product Grid) */}
      <section className="bg-gray-50/50 py-32 border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-gray-900 font-bold tracking-tight mb-4">Seasonal Favorites</h2>
            <p className="text-gray-500 font-medium font-sans">Items that define our signature aesthetic</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-4/5 bg-gray-100 rounded-[32px] animate-pulse" />
              ))
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. Quote & Gallery */}
      <section className="py-32 bg-white max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
         <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 leading-[1.2] mb-10">
               "We create for the boy who knows that true style isn't about being noticed, it's about being remembered."
            </h2>
            <div className="flex items-center justify-center gap-4">
               <div className="w-12 h-px bg-gray-300" />
               <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-900 uppercase">The Boys Zone Founder</h4>
            </div>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="aspect-square rounded-[32px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 cursor-crosshair">
               <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Gallery 1" />
            </div>
            <div className="aspect-square rounded-[32px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 cursor-crosshair">
               <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Gallery 2" />
            </div>
            <div className="aspect-square rounded-[32px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 cursor-crosshair">
               <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Gallery 3" />
            </div>
            <div className="aspect-square rounded-[32px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 cursor-crosshair">
               <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Gallery 4" />
            </div>
         </div>
      </section>

    </div>
  );
};
