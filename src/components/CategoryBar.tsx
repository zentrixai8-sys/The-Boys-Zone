import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Category } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export const CategoryBar = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.request('getCategories');
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const currentCategory = new URLSearchParams(location.search).get('category');

  if (loading && categories.length === 0) return null;

  return (
    <div className="relative bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-[1800px] mx-auto px-4 relative group">
        {/* Navigation Arrows (Desktop) */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 border border-gray-100 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-indigo-50 hover:text-indigo-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 border border-gray-100 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-indigo-50 hover:text-indigo-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Categories Container */}
        <div 
          ref={scrollRef}
          className="flex items-start md:justify-center justify-start gap-5 sm:gap-12 py-4 px-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {/* "All" Category */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/products')}
            className={`flex flex-col items-center gap-2 cursor-pointer min-w-[70px] sm:min-w-[80px] snap-center group/item transition-all ${!currentCategory ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative overflow-hidden ${!currentCategory ? 'border-indigo-600 bg-indigo-50 shadow-indigo-100 shadow-lg' : 'border-gray-100 bg-gray-50 group-hover/item:border-indigo-300'}`}>
               <span className="text-[10px] font-black text-indigo-700 tracking-[0.2em] uppercase">All</span>
               {/* Shine Overlay */}
               <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[25deg] animate-gold-shine" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-center animate-premium-shine ${!currentCategory ? 'opacity-100' : ''}`}>
              For You
            </span>
          </motion.div>

          {categories.map((cat, index) => (
            <motion.div
              key={cat.category_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(cat.category_name)}
              className={`flex flex-col items-center gap-2 cursor-pointer min-w-[70px] sm:min-w-[80px] snap-center group/item transition-all ${currentCategory === cat.category_name ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 transition-all duration-300 relative ${currentCategory === cat.category_name ? 'border-indigo-600 bg-indigo-50 shadow-indigo-100 shadow-lg' : 'border-gray-50 bg-gray-50 group-hover/item:border-indigo-300 shadow-sm'}`}>
                <img 
                  src={cat.image_url} 
                  alt={cat.category_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                />
                {/* Shine Overlay */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[25deg] animate-gold-shine" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-center line-clamp-1 max-w-full animate-premium-shine ${currentCategory === cat.category_name ? 'opacity-100' : ''}`}>
                {cat.category_name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
