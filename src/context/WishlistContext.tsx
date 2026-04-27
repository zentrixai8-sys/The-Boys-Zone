import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tbz_wishlist');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tbz_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.product_id === product.product_id);
      if (exists) {
        toast.success('Removed from Wishlist', {
          icon: '🗑️',
          style: { borderRadius: '14px', fontSans: 'Inter', fontWeight: 'bold', fontSize: '13px' }
        });
        return prev.filter(p => p.product_id !== product.product_id);
      } else {
        toast.success('Added to Wishlist!', {
          icon: '❤️',
          style: { borderRadius: '14px', fontSans: 'Inter', fontWeight: 'bold', fontSize: '13px' }
        });
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, wishlistCount: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
