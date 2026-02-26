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
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
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

    if (paymentMethod === 'cod') {
      try {
        await api.request('createOrder', {
          user_id: user?.id,
          products: JSON.stringify(cart),
          total_amount: totalPrice,
          payment_id: 'COD_' + Date.now(),
          payment_status: 'Pending (COD)',
          address: address
        });
        toast.success('Order placed successfully via Cash on Delivery!');
        clearCart();
        navigate('/order-success');
      } catch (error) {
        toast.error('Failed to save order');
      } finally {
        setLoading(false);
      }
      return;
    }

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
          navigate('/order-success');
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-gray-900 mb-12 border-b border-gray-100 pb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-10">
          <div className="bg-white p-6 md:p-10 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-serif font-bold mb-8 flex items-center gap-3 text-gray-900">
              <ShieldCheck className="w-5 h-5 text-gray-400" /> Shipping Details
            </h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user.name}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[20px] text-[13px] font-medium text-gray-400 focus:outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Shipping Address</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address with pincode"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[24px] text-[13px] font-medium focus:outline-none focus:border-gray-900 focus:ring-0 min-h-[140px] placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-serif font-bold mb-8 flex items-center gap-3 text-gray-900">
              <CreditCard className="w-5 h-5 text-gray-400" /> Payment Method
            </h2>
            <div className="space-y-4">
              <div
                onClick={() => setPaymentMethod('online')}
                className={`p-6 border rounded-[24px] flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-all ${paymentMethod === 'online' ? 'border-gray-900 bg-gray-50/50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold tracking-widest">RAZORPAY</span>
                  </div>
                  <span className="font-bold text-[13px] text-gray-900">Razorpay Secure</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-[5px] ${paymentMethod === 'online' ? 'border-gray-900' : 'border-gray-300'}`} />
              </div>

              {totalPrice < 400 && (
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-6 border rounded-[24px] flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-all ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-50/50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
                      <span className="text-[10px] text-green-700 font-bold tracking-widest">COD</span>
                    </div>
                    <div>
                      <span className="font-bold text-[13px] text-gray-900 block">Cash on Delivery</span>
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mt-1">Available for orders under ₹400</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-[5px] ${paymentMethod === 'cod' ? 'border-gray-900' : 'border-gray-300'}`} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-gray-50 p-6 md:p-10 rounded-[32px] border border-gray-100 sticky top-32">
            <h2 className="text-xl font-serif font-bold mb-8 text-gray-900">Order Summary</h2>
            <div className="space-y-5 mb-8 max-h-80 overflow-y-auto pr-4 scrollbar-hide">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between items-center pb-5 border-b border-gray-200/50 last:border-0 last:pb-0">
                  <span className="text-gray-600 text-[13px] font-medium leading-relaxed max-w-[70%]">{item.product?.title} <span className="text-gray-400 font-bold ml-1">x {item.quantity}</span></span>
                  <span className="font-bold text-[13px] text-gray-900">{formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-2xl font-sans font-bold text-gray-900">
                <span>Total Amount</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full text-white py-5 rounded-full text-[13px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 mt-10 disabled:opacity-50 shadow-lg shadow-black/10 ${paymentMethod === 'cod' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-black'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ${formatPrice(totalPrice)}`}</>}
            </button>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Secure Payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
