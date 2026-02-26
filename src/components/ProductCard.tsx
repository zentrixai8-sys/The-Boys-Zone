import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
    >
      <Link to={`/product/${product.product_id}`} className="block relative aspect-4/5 overflow-hidden bg-gray-50 w-full">
        {product.discount_price && product.discount_price < product.price && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
          </div>
        )}
        <img 
          src={product.image_url || 'https://picsum.photos/400/500'} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </Link>
      
      <div className="p-5 flex-1 flex flex-col text-left">
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
          {product.category || 'Apparel'}
        </p>
        <Link to={`/product/${product.product_id}`}>
          <h3 className="text-[15px] font-bold text-gray-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        <div className="mt-auto pt-1 flex items-baseline gap-2">
           <span className="text-base font-bold text-indigo-600">
             {formatPrice(product.discount_price || product.price)}
           </span>
           {product.discount_price && product.discount_price < product.price && (
              <span className="text-sm font-medium text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
           )}
        </div>
      </div>
    </motion.div>
  );
};
