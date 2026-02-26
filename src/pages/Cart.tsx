import React from 'react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-10 font-medium">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="bg-gray-900 text-white px-10 py-4 rounded-full text-[13px] font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg shadow-black/10">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-gray-900 mb-12">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.product_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex flex-col sm:flex-row gap-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm sm:items-center"
              >
                <div className="w-full sm:w-24 aspect-square sm:aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={item.product?.image_url || 'https://picsum.photos/300/400'}
                    alt={item.product?.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 flex justify-between items-center h-full">
                  <div className="flex flex-col gap-1 items-start justify-center">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">{item.product?.title}</h3>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">SIZE: {item.product?.size || 'M'}</p>

                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 w-fit mt-3">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[13px] font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 h-full justify-between">
                    <p className="font-sans font-bold text-lg text-gray-900 mt-1">
                      {formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest flex items-center gap-1.5 mb-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-32 mb-6">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 font-medium items-center">
                <span>Shipping</span>
                <span className="text-emerald-500 font-bold uppercase text-[11px] tracking-wider">Free</span>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex justify-between text-lg font-bold text-gray-900 mb-6 items-center">
                <span>Total</span>
                <span className="text-[22px] text-indigo-600">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20"
            >
              Go to Checkout
            </Link>
          </div>

          <div className="bg-indigo-50/80 p-6 rounded-2xl border border-indigo-100 w-full flex flex-col items-start text-left">
            <p className="text-[10px] uppercase font-bold text-indigo-900 tracking-widest mb-2">Member Special</p>
            <p className="text-xs text-indigo-700 font-medium mb-4 leading-relaxed">
              Log in to your account and get an extra 5% off on your first order.
            </p>
            <Link to="/login" className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-4 decoration-indigo-600/30">
              Login / Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
