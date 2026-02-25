import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { formatPrice } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, CreditCard } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Checkout = () => {
  const { user } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!address) {
      toast.error('Please enter your shipping address');
      return;
    }

    setLoading(true);
    const res = await loadRazorpay();

    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    // In a real app, you'd create an order on your backend first
    // For this GAS implementation, we'll simulate the Razorpay options
    const options = {
      key: 'rzp_test_your_key_here', // Replace with your actual key
      amount: totalPrice * 100, // Amount in paise
      currency: 'INR',
      name: 'The Boys Zone',
      description: 'Order Payment',
      image: 'https://picsum.photos/200',
      handler: async function (response: any) {
        try {
          // Send order to GAS
          await api.request('createOrder', {
            user_id: user?.id,
            products: JSON.stringify(cart),
            total_amount: totalPrice,
            payment_id: response.razorpay_payment_id,
            payment_status: 'Paid',
            address: address
          });

          toast.success('Order placed successfully!');
          clearCart();
          navigate('/profile');
        } catch (error) {
          toast.error('Failed to save order');
        }
      },
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phone
      },
      theme: {
        color: '#000000'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setLoading(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight text-black mb-10">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Shipping Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black/60">Full Name</label>
                <input 
                  type="text" 
                  disabled 
                  value={user.name}
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl text-black/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black/60">Shipping Address</label>
                <textarea 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address with pincode"
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black min-h-[120px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment Method
            </h2>
            <div className="p-4 border-2 border-black rounded-2xl bg-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">RAZORPAY</span>
                </div>
                <span className="font-bold">Razorpay Secure</span>
              </div>
              <div className="w-4 h-4 rounded-full border-4 border-black" />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-black/60">{item.product?.title} x {item.quantity}</span>
                  <span className="font-medium">{formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-black/5">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ${formatPrice(totalPrice)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
