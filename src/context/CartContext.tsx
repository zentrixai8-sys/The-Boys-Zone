import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Background sync with localStorage on change & cross-tab sync
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    // When adding, use the size from the product structure directly 
    // since we mutated `product.size` with `selectedSize` in ProductDetail
    const productSize = product.size;
    const productColor = product.color;

    const existing = cart.find(item => 
      item.product_id === product.product_id && 
      item.selectedSize === productSize && 
      item.selectedColor === productColor
    );
    
    if (existing) {
      setCart(prev => prev.map(item => 
        (item.product_id === product.product_id && 
         item.selectedSize === productSize && 
         item.selectedColor === productColor)
          ? { ...item, quantity: item.quantity + quantity } 
          : item
      ));
      toast.success(`Updated ${product.title} quantity`);
    } else {
      setCart(prev => [...prev, { 
        product_id: product.product_id, 
        quantity, 
        selectedSize: productSize, 
        selectedColor: productColor,
        product 
      }]);
      toast.success(`Added ${product.title} to cart`);
    }
  };

  const removeFromCart = (productId: string, selectedSize?: string, selectedColor?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.product_id === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor)
    ));
    toast.error('Removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      (item.product_id === productId && 
       item.selectedSize === selectedSize && 
       item.selectedColor === selectedColor) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const price = item.product?.discount_price || item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
