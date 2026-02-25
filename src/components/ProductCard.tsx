import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-black/5 hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/product/${product.product_id}`} className="block aspect-[4/5] overflow-hidden bg-black/5">
        <img 
          src={product.image_url || 'https://picsum.photos/400/500'} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-semibold text-black/40 uppercase tracking-wider">{product.brand}</p>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">4.5</span>
          </div>
        </div>
        
        <Link to={`/product/${product.product_id}`}>
          <h3 className="text-sm font-medium text-black mb-2 line-clamp-1 group-hover:text-black/70 transition-colors">
            {product.title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-black">
              {formatPrice(product.discount_price || product.price)}
            </span>
            {product.discount_price && product.discount_price < product.price && (
              <span className="text-xs text-black/40 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="p-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
