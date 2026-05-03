import React, { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Package, Clock, MapPin, ChevronRight, User as UserIcon, Phone, Mail, Camera, Save, Loader2, Upload, ChevronDown, Star, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

import { indianStates } from '../data/indian_states';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewingProduct, setReviewingProduct] = useState<{order_id: string, product_id: string, rating: number, comment: string} | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for search/dropdown
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const [formData, setFormData] = useState(() => {
    return {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar_url: user?.avatar_url || '',
      house: user?.address?.split(' | ')[0] || '',
      city: user?.address?.split(' | ')[1] || '',
      dist: user?.district || user?.address?.split(' | ')[2] || '',
      state: user?.state || user?.address?.split(' | ')[3] || '',
      pincode: user?.pincode || user?.address?.split(' | ')[4] || ''
    };
  });

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
          setFormData(prev => ({
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

  // Auto-open edit mode if ?edit=true is in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true') {
      setEditMode(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.search]);

  const { data: userOrders, isLoading: ordersLoading, mutate: mutateOrders } = useSWR(
    user ? `orders_${user.id}` : null,
    async () => {
      const res = await api.request('getUserOrders', { user_id: user?.id });
      return Array.isArray(res) ? res : [];
    },
    { revalidateOnFocus: true, revalidateOnMount: true, dedupingInterval: 3000, keepPreviousData: true }
  );

  const orders = userOrders || [];
  const loading = ordersLoading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const publicUrl = await api.request('uploadFile', {
        file,
        bucket: 'profile',
        path: filePath
      });

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Image uploaded! Click Save to apply changes.');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    try {
      const joinedAddress = [
        formData.house,
        formData.city,
        formData.dist,
        formData.state,
        formData.pincode
      ].filter(Boolean).join(' | ');

      const submitData = {
        name: formData.name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
        address: joinedAddress,
        district: formData.dist,
        state: formData.state,
        pincode: formData.pincode
      };

      await api.request('updateProfile', {
        id: user.id,
        ...submitData
      });
      updateUser(submitData);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewingProduct || !user) return;
    if (reviewingProduct.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setSubmittingReview(true);
    try {
      await api.request('addReview', {
        product_id: reviewingProduct.product_id,
        user_id: user.id,
        rating: reviewingProduct.rating,
        comment: reviewingProduct.comment
      });
      toast.success('Review submitted successfully!');
      setReviewingProduct(null);
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm text-center">
            <div className="relative w-32 h-32 mx-auto mb-6 group">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : formData.avatar_url ? (
                  <img src={formData.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{user.name[0]}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-black/5 hover:bg-black hover:text-white transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            {!editMode ? (
              <>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-black/40 mb-6">{user.role.toUpperCase()}</p>

                <div className="space-y-4 text-left pt-6 border-t border-black/5">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-black/20" />
                    <span className="text-black/60 truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-black/20" />
                    <span className="text-black/60">{user.phone || 'No phone saved'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-black/20 mt-1" />
                    <div className="flex-1 min-w-0">
                       <p className="text-black/60 leading-relaxed">
                         {user.address ? user.address.replace(/ \| /g, ', ') : 'No address saved'}
                       </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full mt-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border border-black/5 hover:bg-black hover:text-white transition-all"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-sm">Edit Profile</h3>
                   <button 
                    type="button"
                    onClick={fetchLocation}
                    disabled={fetchingLocation}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                   >
                     {fetchingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                     {fetchingLocation ? 'Fetching...' : 'Auto-Fill Location'}
                   </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                  />
                </div>
                
                <div className="space-y-4 pt-2 border-t border-black/5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">House No / Street</label>
                    <input
                      type="text"
                      value={formData.house}
                      onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                      className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                      placeholder="e.g. 123, Luxury Apartments"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* State Dropdown with Search */}
                    <div className="relative">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">State</label>
                      <div 
                        onClick={() => setShowStateDropdown(!showStateDropdown)}
                        className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm flex justify-between items-center cursor-pointer hover:bg-black/10 transition-all"
                      >
                         <span className={formData.state ? 'text-black' : 'text-black/30'}>
                           {formData.state || 'Select State'}
                         </span>
                         <ChevronDown className={`w-3 h-3 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                      </div>
                      
                      <AnimatePresence>
                        {showStateDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden"
                          >
                            <div className="p-2 border-b border-black/5">
                               <input 
                                 type="text"
                                 autoFocus
                                 value={stateSearch}
                                 onChange={(e) => setStateSearch(e.target.value)}
                                 placeholder="Search State..."
                                 className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs focus:ring-0"
                               />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                               {indianStates
                                .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                                .map(state => (
                                 <div 
                                   key={state}
                                   onClick={() => {
                                     setFormData({ ...formData, state });
                                     setShowStateDropdown(false);
                                     setStateSearch('');
                                   }}
                                   className="px-4 py-2.5 text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                 >
                                   {state}
                                   {formData.state === state && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                 </div>
                               ))}
                               <div 
                                 onClick={() => {
                                   if (stateSearch) {
                                     setFormData({ ...formData, state: stateSearch });
                                     setShowStateDropdown(false);
                                     setStateSearch('');
                                   }
                                 }}
                                 className="px-4 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer"
                               >
                                 Manual Entry: "{stateSearch || 'Type here'}"
                               </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">District</label>
                      <input
                        type="text"
                        value={formData.dist}
                        onChange={(e) => setFormData({ ...formData, dist: e.target.value })}
                        className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                        placeholder="Type District Name..."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-black/5 pt-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Avatar URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-black/5 hover:bg-black/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating || uploading}
                    className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                  >
                    {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Info
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Order History</h1>
            <p className="text-black/40">Manage and track your recent orders</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-40 bg-black/5 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-3xl border transition-all duration-300 ${
                    expandedOrder === order.order_id 
                      ? 'border-indigo-500/20 shadow-xl shadow-indigo-500/5' 
                      : 'border-black/5 shadow-sm hover:border-black/10'
                  } overflow-hidden`}
                >
                  {/* Order Summary / Clickable Header */}
                  <div 
                    onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                    className="p-5 md:p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      {/* Product Visual */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                          {(() => {
                            try {
                              const products = JSON.parse(order.products || '[]');
                              return products[0]?.product?.image_url ? (
                                <img 
                                  src={products[0].product.image_url} 
                                  alt="" 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                              ) : <Package className="w-full h-full p-4 text-black/10" />;
                            } catch { return <Package className="w-full h-full p-4 text-black/10" />; }
                          })()}
                        </div>
                        {(() => {
                           try {
                             const count = JSON.parse(order.products || '[]').length;
                             return count > 1 && (
                               <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                 +{count - 1}
                               </div>
                             );
                           } catch { return null; }
                        })()}
                      </div>

                      {/* Summary Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate mb-1">
                          {(() => {
                            try {
                              const products = JSON.parse(order.products || '[]');
                              return products[0]?.product?.title || 'Order Summary';
                            } catch { return 'Order Summary'; }
                          })()}
                        </p>
                        <div className="flex items-center gap-3">
                           <p className="text-lg font-black text-indigo-600">{formatPrice(order.total_amount)}</p>
                           <span className="w-1 h-1 bg-slate-300 rounded-full" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             {order.order_status === 'Delivered' ? 'Received' : 'In Transit'}
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm transition-all ${
                        order.order_status === 'Delivered' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {order.order_status}
                      </div>
                      <motion.div
                        animate={{ rotate: expandedOrder === order.order_id ? 180 : 0 }}
                        className={`p-2 rounded-xl transition-colors ${
                          expandedOrder === order.order_id ? 'bg-indigo-50 text-indigo-500' : 'text-slate-300'
                        }`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  <AnimatePresence>
                    {expandedOrder === order.order_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-slate-50 border-t border-slate-100 overflow-hidden"
                      >
                        <div className="p-6 md:p-8 space-y-10">
                          {/* Top Row: IDs & Meta */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-dashed border-slate-200">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Order ID</p>
                                <p className="text-xs font-bold text-slate-700 font-mono">#{order.order_id.toUpperCase()}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Order Date</p>
                                <p className="text-xs font-bold text-slate-700">{formatDate(order.date)}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Status</p>
                                <p className="text-xs font-bold text-emerald-600">{order.payment_status || 'Paid'}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Amount</p>
                                <p className="text-xs font-black text-indigo-600">{formatPrice(order.total_amount)}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Items Section */}
                            <div>
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Items Checklist</h4>
                              {(() => {
                                try {
                                  const products = JSON.parse(order.products || '[]');
                                  return Array.isArray(products) ? products.map((item: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-3 group/item p-4 -mx-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                      <div className="flex items-center gap-4">
                                        <Link to={`/product/${item.product?.product_id}`} className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 group-hover/item:border-indigo-200 transition-colors">
                                          <img src={item.product?.image_url} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                          <Link to={`/product/${item.product?.product_id}`} className="block">
                                            <p className="text-sm font-black text-slate-800 line-clamp-1 mb-1 group-hover/item:text-indigo-600 transition-colors">{item.product?.title}</p>
                                          </Link>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QTY: {item.quantity}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-[10px] font-black text-indigo-500">{formatPrice(item.product?.discount_price || item.product?.price)}</span>
                                          </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                           <p className="text-sm font-black text-slate-900">{formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}</p>
                                           {order.order_status === 'Delivered' && (
                                             <button 
                                               onClick={(e) => {
                                                 e.preventDefault();
                                                 setReviewingProduct(reviewingProduct?.product_id === item.product?.product_id 
                                                   ? null 
                                                   : { order_id: order.order_id, product_id: item.product?.product_id, rating: 0, comment: '' }
                                                 );
                                               }}
                                               className="text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                             >
                                               {reviewingProduct?.product_id === item.product?.product_id ? 'Cancel' : 'Rate Product'}
                                             </button>
                                           )}
                                        </div>
                                      </div>
                                      
                                      {/* Review Form */}
                                      <AnimatePresence>
                                        {reviewingProduct?.order_id === order.order_id && reviewingProduct?.product_id === item.product?.product_id && (
                                          <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="mt-2 p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-500/5 space-y-4">
                                              <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rate this item</p>
                                                <div className="flex gap-1">
                                                  {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                      key={star}
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        setReviewingProduct({ ...reviewingProduct, rating: star });
                                                      }}
                                                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                                    >
                                                      <Star className={`w-6 h-6 ${reviewingProduct.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                              <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Share your experience</p>
                                                <textarea
                                                  value={reviewingProduct.comment}
                                                  onChange={(e) => setReviewingProduct({ ...reviewingProduct, comment: e.target.value })}
                                                  placeholder="What did you like about it?"
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24"
                                                />
                                              </div>
                                              <div className="flex justify-end">
                                                <button
                                                  onClick={(e) => { e.preventDefault(); handleSubmitReview(); }}
                                                  disabled={submittingReview || reviewingProduct.rating === 0}
                                                  className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )) : null;
                                } catch (e) {
                                  return <p className="text-xs text-red-500">Error loading items</p>;
                                }
                              })()}
                            </div>
                          </div>

                          {/* Shipping Info Section */}
                          <div className="flex flex-col gap-8">
                             <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Delivery To</h4>
                                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-4 transition-all hover:border-indigo-100">
                                  <div className="p-3 bg-indigo-50 rounded-2xl h-fit">
                                    <MapPin className="w-6 h-6 text-indigo-500" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-slate-900 mb-2 uppercase tracking-widest">Shipping Address</p>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{order.address}"</p>
                                  </div>
                                </div>
                             </div>

                             <div className="mt-auto pt-8 border-t border-dashed border-slate-200 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Secure Transaction</p>
                                   <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                      Razorpay SSL Encrypted
                                   </p>
                                </div>
                                <button className="px-8 py-3 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                                   Re-Order Package
                                </button>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-black/5 rounded-3xl border border-dashed border-black/10">
              <Package className="w-12 h-12 text-black/10 mx-auto mb-4" />
              <p className="text-black/40">You haven't placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
