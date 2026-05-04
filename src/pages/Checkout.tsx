declare global { interface Window { Razorpay: any; } }
import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { formatPrice } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, ShieldCheck, CreditCard, ShoppingBag, 
  MapPin, ChevronRight, Lock, CheckCircle2, ChevronDown
} from 'lucide-react';
import { indianStates } from '../data/indian_states';
import { supabase } from '../lib/supabase';

export const Checkout = () => {
  const { user, updateUser } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const [addressParts, setAddressParts] = useState({
    house: user?.address?.split(' | ')[0] || '',
    city: user?.address?.split(' | ')[1] || '',
    dist: user?.district || user?.address?.split(' | ')[2] || '',
    state: user?.state || user?.address?.split(' | ')[3] || '',
    pincode: user?.pincode || user?.address?.split(' | ')[4] || ''
  });

  // Auto-refresh data when profile finishes loading asynchronously
  React.useEffect(() => {
    if (user && !addressParts.house && !addressParts.city) {
      setAddressParts({
        house: user.address?.split(' | ')[0] || '',
        city: user.address?.split(' | ')[1] || '',
        dist: user.district || user.address?.split(' | ')[2] || '',
        state: user.state || user.address?.split(' | ')[3] || '',
        pincode: user.pincode || user.address?.split(' | ')[4] || ''
      });
    }
  }, [user]);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const navigate = useNavigate();

  // Clean up any stale recovery tokens from previous buggy versions
  React.useEffect(() => {
    localStorage.removeItem('tbz_order_recovery');
  }, []);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        if (data.address) {
          const addr = data.address;
          setAddressParts(prev => ({
            ...prev,
            house: addr.suburb || addr.neighbourhood || addr.road || prev.house,
            city: addr.city || addr.town || addr.village || prev.city,
            dist: addr.state_district || addr.county || prev.dist,
            state: addr.state || prev.state,
            pincode: addr.postcode || prev.pincode
          }));
          toast.success('Location fetched successfully!');
        }
      } catch (err) {
        console.error('Reverse geocode failed:', err);
        toast.error('Failed to fetch address from location');
      } finally {
        setFetchingLocation(false);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      toast.error('Location permission denied or unavailable');
      setFetchingLocation(false);
    });
  };

  React.useEffect(() => {
    if (totalPrice > 300 && paymentMethod === 'cod') {
      setPaymentMethod('online');
    }
  }, [totalPrice, paymentMethod]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  React.useEffect(() => {
    // Pre-load Razorpay script for faster mobile experience
    loadRazorpay();
  }, [user]);

  const handlePayment = useCallback(async () => {
    if (!addressParts.house || !addressParts.city || !addressParts.pincode) {
      toast.error('Please fill all mandatory address fields (House, City, Pincode)');
      return;
    }

    setLoading(true);

    const fullAddress = [
      addressParts.house,
      addressParts.city,
      addressParts.dist,
      addressParts.state,
      addressParts.pincode
    ].filter(Boolean).join(' | ');

    if (saveToProfile && user) {
      try {
        const updateData = {
          address: fullAddress,
          district: addressParts.dist,
          state: addressParts.state,
          pincode: addressParts.pincode
        };
        await api.request('updateProfile', {
          id: user.id,
          ...updateData
        });
        updateUser(updateData);
      } catch (err) {
        console.error('Failed to update profile address');
      }
    }

    if (paymentMethod === 'cod') {
      try {
        await api.request('createOrder', {
          user_id: user?.id,
          products: JSON.stringify(cart),
          total_amount: totalPrice,
          payment_id: 'COD_' + Date.now(),
          payment_status: 'Pending (COD)',
          address: fullAddress
        });
        toast.success('Order placed successfully via Cash on Delivery!');
        clearCart();
        window.location.href = '/order-success';
      } catch (error: any) {
        try {
          await supabase.from('categories').insert([{ 
            category_name: 'DEBUG_COD_FAIL', 
            image_url: JSON.stringify({ error: error.message || String(error) }) 
          }]);
        } catch (e) {}
        toast.error(`Order failed: ${error.message || 'Database error'}`);
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

    // Capture values in closure BEFORE Razorpay opens
    const capturedCart = JSON.stringify(cart);
    const capturedTotal = totalPrice;
    const capturedUserId = user?.id;
    const capturedName = user?.name || 'Online Customer';

    // CRITICAL FOR MOBILE: Capture auth session NOW, before Razorpay redirects to UPI app.
    // On mobile, sessionStorage gets wiped when the browser tab is suspended.
    // We'll restore it inside the handler when the user returns.
    const { data: sessionData } = await supabase.auth.getSession();
    const capturedAccessToken = sessionData?.session?.access_token || '';
    const capturedRefreshToken = sessionData?.session?.refresh_token || '';

    // Chunk cart into Razorpay notes for webhook fallback
    const cartChunks: Record<string, string> = {};
    for (let i = 0; i < capturedCart.length; i += 250) {
      cartChunks[`c${Math.floor(i / 250)}`] = capturedCart.substring(i, i + 250);
    }

    // Helper: Direct REST insert (bypasses Supabase JS client auth issues on mobile)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const directInsert = async (table: string, body: any, token: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Prefer': 'return=minimal'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Insert to ${table} failed: ${res.status} - ${errText}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const directSelect = async (table: string, query: string, token: string) => {
      const headers: Record<string, string> = {
        'apikey': supabaseAnonKey,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
          method: 'GET',
          headers,
          signal: controller.signal
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (err) {
        console.error(`Select from ${table} failed:`, err);
        return [];
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: capturedTotal * 100,
      currency: 'INR',
      name: 'The Boys Zone',
      description: 'Order Payment',
      image: 'https://picsum.photos/200',
      notes: {
        userId: capturedUserId,
        address: fullAddress.substring(0, 250),
        customerName: capturedName.substring(0, 250),
        ...cartChunks
      },
      handler: async function (response: any) {
        setLoading(true);
        const paymentId = response.razorpay_payment_id;

        // MOBILE FIX: Use the captured token exclusively. 
        // Do NOT call supabase.auth.getSession() here because when returning from a UPI app,
        // the browser tab wakes up and the Supabase JS client's internal LockManager can deadlock,
        // causing it to hang forever.
        let activeToken = capturedAccessToken;

        try {
          // Retry mechanism: try up to 3 times
          let success = false;
          let lastError = null;

          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              // GUARD: Check if this payment was already processed (prevent duplicates)
              const existingOrders = await directSelect('orders', `payment_id=eq.${paymentId}&select=order_id&limit=1`, activeToken);
              if (existingOrders && existingOrders.length > 0) {
                clearCart();
                toast.success('Order already placed!');
                window.location.href = '/order-success';
                return;
              }

              // PRE-FLIGHT: Ensure user profile exists (FK constraint)
              const profiles = await directSelect('profiles', `id=eq.${capturedUserId}&select=id&limit=1`, activeToken);
              if (!profiles || profiles.length === 0) {
                try {
                  await directInsert('profiles', {
                    id: capturedUserId,
                    name: capturedName,
                    email: `customer_${Date.now()}@temp.com`,
                    password: 'auto_generated'
                  }, activeToken);
                } catch (_profileErr) {
                  // Profile may already exist due to race condition — safe to ignore
                }
              }

              // STEP 1: Payment Log FIRST (strict tracking)
              await directInsert('payment_logs', {
                customer_name: capturedName,
                amount_paid: capturedTotal,
                payment_method: 'Online Payment (Razorpay)',
                note: `Order Payment: ${paymentId}`,
                paid_at: new Date().toISOString()
              }, activeToken);

              // STEP 2: Create Order
              await directInsert('orders', {
                user_id: capturedUserId,
                products: capturedCart,
                total_amount: capturedTotal,
                payment_id: paymentId,
                payment_status: 'Paid',
                order_status: 'Processing',
                address: fullAddress,
                date: new Date().toISOString()
              }, activeToken);

              // STEP 3: Stock deduction (non-blocking, don't throw)
              try {
                const items = JSON.parse(capturedCart);
                if (Array.isArray(items)) {
                  for (const item of items) {
                    const pid = item.product_id || item.id;
                    if (!pid) continue;
                    const productData = await directSelect('products', `product_id=eq.${pid}&select=stock&limit=1`, activeToken);
                    if (productData && productData.length > 0) {
                      const newStock = Math.max(0, (productData[0].stock ?? 0) - (item.quantity || 1));
                      await fetch(`${supabaseUrl}/rest/v1/products?product_id=eq.${pid}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'apikey': supabaseAnonKey,
                          'Authorization': `Bearer ${activeToken}`,
                          'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ stock: newStock })
                      });
                    }
                  }
                }
              } catch (stockErr) {
                console.error('Stock deduction failed (non-critical):', stockErr);
              }

              success = true;
              break; // exit retry loop on success
            } catch (err: any) {
              console.warn(`Payment log/order creation attempt ${attempt} failed:`, err);
              lastError = err;
              if (attempt < 3) {
                // Wait before retrying (exponential backoff)
                await new Promise(res => setTimeout(res, 1000 * attempt));
              }
            }
          }

          if (!success) {
            throw lastError;
          }

          // SUCCESS
          clearCart();
          toast.success('Order placed successfully!');
          window.location.href = '/order-success';

        } catch (err: any) {
          console.error('Payment handler critical error:', err);
          // Debug log to database
          try {
            await directInsert('categories', {
              category_name: 'DEBUG_HANDLER_CRASH',
              image_url: JSON.stringify({ error: err?.message || String(err), payment_id: paymentId })
            }, activeToken);
          } catch (_) {}
          toast.error('Something went wrong. Contact support with Payment ID: ' + paymentId);
          setLoading(false);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '9999999999'
      },
      theme: { color: '#4f46e5' },
      modal: { ondismiss: () => setLoading(false) },
      retry: { enabled: true, max_count: 3 }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', function () {
      toast.error('Payment failed. Please try again.');
      setLoading(false);
    });
    paymentObject.open();
    setLoading(false);
  }, [user, cart, totalPrice, addressParts, saveToProfile, paymentMethod, navigate, clearCart, updateUser]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-20">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 lg:mb-20 text-center lg:text-left"
        >
          <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-600 mb-4">
            <Lock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">SECURE CHECKOUT</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 uppercase">
            Order <span className="text-indigo-600">Details</span>
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Column: Details & Payment */}
          <div className="lg:col-span-8 space-y-8 lg:space-y-12">
            
            {/* Delivery Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden"
            >
              <div className="p-8 lg:p-12 border-b-2 border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-4 text-slate-900">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <MapPin className="w-5 h-5" />
                  </div>
                  Delivery Address
                </h2>
                <button 
                  onClick={fetchLocation}
                  disabled={fetchingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {fetchingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  {fetchingLocation ? 'Fetching...' : 'Fetch Current Location'}
                </button>
              </div>
              
              <div className="p-8 lg:p-12 space-y-10">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Full Name</label>
                      <div className="px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[13px] font-bold text-slate-600 flex items-center gap-3">
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                         {user.name}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Mobile Number</label>
                      <div className="px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[13px] font-bold text-slate-600">
                         {user.phone || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">House No / Area / Landmark</label>
                      <input
                        type="text"
                        required
                        value={addressParts.house}
                        onChange={(e) => setAddressParts({ ...addressParts, house: e.target.value })}
                        placeholder="e.g. 101, Galaxy Tower, Near Park"
                        className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">City / Town Name</label>
                        <input
                          type="text"
                          required
                          value={addressParts.city}
                          onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })}
                          className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">District</label>
                        <input
                          type="text"
                          required
                          value={addressParts.dist}
                          onChange={(e) => setAddressParts({ ...addressParts, dist: e.target.value })}
                          placeholder="Type District..."
                          className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">State</label>
                        <div 
                          onClick={() => setShowStateDropdown(!showStateDropdown)}
                          className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold flex justify-between items-center cursor-pointer hover:border-indigo-200 transition-all"
                        >
                           <span className={addressParts.state ? 'text-slate-900' : 'text-slate-300'}>
                             {addressParts.state || 'Select State'}
                           </span>
                           <ChevronDown className={`w-4 h-4 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <AnimatePresence>
                          {showStateDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border-2 border-slate-100 overflow-hidden"
                            >
                              <div className="p-4 border-b border-slate-100">
                                 <input 
                                   type="text"
                                   autoFocus
                                   value={stateSearch}
                                   onChange={(e) => setStateSearch(e.target.value)}
                                   placeholder="Search State..."
                                   className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-0"
                                   onClick={(e) => e.stopPropagation()}
                                 />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                 {indianStates
                                  .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                                  .map(state => (
                                   <div 
                                     key={state}
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setAddressParts({ ...addressParts, state });
                                       setShowStateDropdown(false);
                                       setStateSearch('');
                                     }}
                                     className="px-6 py-3 text-[13px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                   >
                                     {state}
                                     {addressParts.state === state && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                   </div>
                                 ))}
                                 <div 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (stateSearch) {
                                       setAddressParts({ ...addressParts, state: stateSearch });
                                       setShowStateDropdown(false);
                                       setStateSearch('');
                                     }
                                   }}
                                   className="px-6 py-3 text-[13px] font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer"
                                 >
                                   Manual: "{stateSearch || 'Type here'}"
                                 </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Pincode (6-Digits)</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={addressParts.pincode}
                          onChange={(e) => setAddressParts({ ...addressParts, pincode: e.target.value })}
                          className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4 group cursor-pointer" onClick={() => setSaveToProfile(!saveToProfile)}>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${saveToProfile ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                        {saveToProfile && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Save as permanent address</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden"
            >
              <div className="p-8 lg:p-12 border-b-2 border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-4 text-slate-900">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  Payment Method
                </h2>
              </div>
              
              <div className="p-8 lg:p-12 space-y-6">
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={`group relative p-8 border-2 rounded-4xl flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      paymentMethod === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      <span className="text-[8px] font-black tracking-[0.2em]">PAY</span>
                    </div>
                    <div>
                      <span className="font-black text-sm text-slate-900 block uppercase">Online Payment</span>
                      <div className="flex items-center gap-4 mt-6 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 flex-wrap">
                        <div className="h-10 w-16 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-full w-auto object-contain" alt="UPI" />
                        </div>
                        <div className="h-10 w-16 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0">
                          <img src="https://img.icons8.com/color/48/google-pay.png" className="h-full w-auto object-contain" alt="GPay" />
                        </div>
                        <div className="h-10 w-16 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0">
                          <img src="https://img.icons8.com/color/48/paytm.png" className="h-full w-auto object-contain" alt="Paytm" />
                        </div>
                        <div className="h-10 w-16 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0">
                          <img src="https://img.icons8.com/color/48/visa.png" className="h-full w-auto object-contain" alt="Visa" />
                        </div>
                        <div className="h-10 w-16 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0">
                          <img src="https://img.icons8.com/color/48/mastercard.png" className="h-full w-auto object-contain" alt="Mastercard" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                    paymentMethod === 'online' ? 'border-indigo-600 bg-white' : 'border-slate-300'
                  }`}>
                     {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                </div>

                {totalPrice <= 300 && (
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`group relative p-8 border-2 rounded-4xl flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        paymentMethod === 'cod' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        <span className="text-[8px] font-black tracking-[0.2em]">COD</span>
                      </div>
                      <div>
                        <span className="font-black text-sm text-slate-900 block uppercase">Cash On Delivery</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 block">Valid for small orders</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                      paymentMethod === 'cod' ? 'border-emerald-600 bg-white' : 'border-slate-300'
                    }`}>
                       {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 text-white rounded-[2.5rem] p-8 lg:p-12 sticky top-32 shadow-2xl shadow-indigo-900/20"
            >
              <h2 className="text-xl font-black uppercase tracking-[0.2em] mb-10 pb-6 border-b border-white/10 flex items-center gap-4">
                <ShoppingBag className="w-5 h-5 text-indigo-400" /> Order Summary
              </h2>
              
              <div className="space-y-6 mb-12 max-h-[40vh] overflow-y-auto pr-4 scrollbar-hide">
                {cart.map(item => (
                  <div key={`${item.product_id}-${item.selectedSize || 'default'}`} className="flex gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                      <img src={item.product?.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black uppercase truncate text-indigo-100">{item.product?.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Qty: {item.quantity}</span>
                         {item.selectedSize && (
                           <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">Size: {item.selectedSize}</span>
                         )}
                      </div>
                      <p className="text-xs font-black mt-2 text-white">{formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                   <span className="text-4xl font-black text-white tracking-tighter leading-none">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className={`w-full py-6 rounded-4xl text-[13px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 mt-10 disabled:opacity-50 shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${
                  loading ? 'bg-slate-700 text-slate-400' :
                  paymentMethod === 'cod' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {paymentMethod === 'cod' ? 'Confirm COD Order' : `Pay Securely`}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-8 flex items-center justify-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-500" /> 100% Secure Payment
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
