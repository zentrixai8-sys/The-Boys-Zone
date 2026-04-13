import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { Star, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (!isWishlisted) {
      toast.success('Added to Wishlist!', {
        icon: '❤️',
        style: { borderRadius: '14px', fontSans: 'Inter', fontWeight: 'bold', fontSize: '13px' }
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white border border-black/5 hover:border-indigo-100 transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 overflow-hidden"
    >
      <Link to={`/product/${product.product_id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#f9f9f9] w-full">
        {product.discount_price && product.discount_price < product.price && (
          <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg shadow-emerald-500/20 uppercase tracking-tighter overflow-hidden">
            <span className="relative z-10">
              {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
            </span>
            {/* Shine Sweep Animation */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[25deg] animate-gold-shine" />
          </div>
        )}
        
        {/* Wishlist Heart Icon */}
        <button 
          onClick={toggleWishlist}
          className="absolute top-2 right-2 z-20 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 hover:bg-white transition-all transform hover:scale-110 active:scale-95 group/wish"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 group-hover/wish:text-rose-500'}`} 
          />
        </button>

        <img 
          src={product.image_url || 'https://picsum.photos/400/500'} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Quick look overlay on hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 translate-y-2 group-hover:translate-y-0 duration-300">
           <span className="bg-white text-black text-[10px] font-bold px-4 py-2 rounded-full shadow-lg">View Details</span>
        </div>
      </Link>
      
      <div className="p-3 md:p-4 flex-1 flex flex-col text-left">
        <p className="text-[9px] font-bold tracking-[0.15em] text-indigo-600 uppercase mb-1 line-clamp-1">
          {product.brand || 'The Boys Zone'}
        </p>
        <Link to={`/product/${product.product_id}`}>
          <h3 className="text-[13px] md:text-sm font-bold text-gray-800 mb-1.5 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[2.5rem] uppercase">
            {product.title}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mb-3">
            <div className="bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <span className="text-[10px] font-bold text-emerald-700">{product.rating || '4.5'}</span>
              <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
            </div>
            {product.reviewCount > 0 && (
              <span className="text-[10px] font-bold text-gray-400">({product.reviewCount})</span>
            )}
        </div>

        <div className="mt-auto flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
               <span className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                 {formatPrice(product.discount_price || product.price)}
               </span>
               {product.discount_price && product.discount_price < product.price && (
                  <span className="text-[11px] md:text-xs font-semibold text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
               )}
            </div>
            {product.discount_price && product.discount_price < product.price && (
              <span className="text-[10px] font-bold text-emerald-600">
                You save {formatPrice(product.price - product.discount_price)}
              </span>
            )}
        </div>
      </div>
    </motion.div>
  );
};
