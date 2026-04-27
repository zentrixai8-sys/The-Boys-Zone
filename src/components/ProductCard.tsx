import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { Star, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.product_id);
  const [currentImgIndex, setCurrentImgIndex] = React.useState(0);

  // Collect all unique images from main gallery and variants
  const allImages = React.useMemo(() => {
    const imgs = new Set<string>();
    if (product.image_url) imgs.add(product.image_url);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => imgs.add(img));
    }
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        if (v.colorImage) imgs.add(v.colorImage);
        if (v.images && Array.isArray(v.images)) {
          v.images.forEach(img => imgs.add(img));
        }
      });
    }
    return Array.from(imgs);
  }, [product]);

  // Auto-slide effect
  React.useEffect(() => {
    if (allImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % allImages.length);
    }, 3000); // Change image every 3 seconds
    
    return () => clearInterval(interval);
  }, [allImages]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white border border-black/[0.03] hover:border-indigo-100 rounded-2xl transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 overflow-hidden"
    >
      <Link to={`/product/${product.product_id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#f9f9f9] w-full">
        {product.discount_price && product.discount_price < product.price && (
          <div className="absolute top-2 left-2 z-20 bg-black text-white text-[9px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest overflow-hidden">
            <span className="relative z-10">
              SALE {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
            </span>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-[25deg] animate-[shimmer_1.5s_infinite]" />
          </div>
        )}
        
        {/* Wishlist Heart Icon */}
        <button 
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 z-20 p-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all transform hover:scale-110 active:scale-95 group/wish"
        >
          <Heart 
            className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover/wish:text-rose-500'}`} 
          />
        </button>

        <img 
          src={allImages[currentImgIndex] || product.image_url} 
          alt={product.title}
          key={allImages[currentImgIndex]}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover Action Button */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="bg-white/90 backdrop-blur text-center text-slate-900 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl shadow-lg hover:bg-black hover:text-white transition-colors">
            View Details
          </div>
        </div>
      </Link>
      
      {/* Details Section - Compact & Premium */}
      <div className="p-3.5 flex flex-col gap-1.5 bg-white">
        {/* Top Row: Brand & Rating */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase truncate pr-2">
            {product.brand || 'The Boys Zone'}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-bold text-slate-600">{product.rating || '4.8'}</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/product/${product.product_id}`} className="block">
          <h3 className="text-[12px] md:text-[13px] font-black text-slate-900 truncate uppercase mt-0.5 group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-0.5">
           <span className="text-[14px] md:text-[15px] font-black text-indigo-600 tracking-tight">
             {formatPrice(product.discount_price || product.price)}
           </span>
           {product.discount_price && product.discount_price < product.price && (
              <span className="text-[10px] font-bold text-red-500 line-through">
                {formatPrice(product.price)}
              </span>
           )}
        </div>
      </div>
    </motion.div>
  );
};
