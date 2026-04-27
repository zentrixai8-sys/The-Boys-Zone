import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase">
              My Wishlist
            </h1>
            <p className="text-black/50 font-bold mt-2">
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} saved
            </p>
          </div>
          {wishlist.length > 0 && (
            <Link to="/products" className="group inline-flex items-center gap-2 text-black text-sm font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
              Continue Shopping <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border-2 border-dashed border-black/10"
          >
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-rose-300" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase tracking-wide mb-4">Your wishlist is empty</h2>
            <p className="text-black/60 mb-8 max-w-md">
              Save your favorite items here and they'll be waiting for you when you're ready to buy.
            </p>
            <Link 
              to="/products"
              className="bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-xl shadow-black/20"
            >
              Explore Collection
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
