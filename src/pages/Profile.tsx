import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice } from '../lib/utils';
import { Package, Clock, MapPin, ChevronRight, User as UserIcon, Phone, Mail, Camera, Save, Loader2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || ''
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const allOrders = await api.request('getOrders');
        const userOrders = Array.isArray(allOrders) ? allOrders.filter((o: Order) => o.user_id === user.id) : [];
        setOrders([...userOrders].reverse());
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size should be less than 1MB');
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
      toast.error('Failed to upload image. Make sure "profile" bucket exists, is public, and has an INSERT policy for anonymous users.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    try {
      await api.request('updateProfile', {
        id: user.id,
        ...formData
      });
      updateUser(formData);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
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
                    <span className="text-black/60">{user.phone}</span>
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
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Full Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Phone</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Avatar URL (Optional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2 bg-black/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
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
                    className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
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
            <div className="space-y-6">
              {orders.map((order) => (
                <motion.div 
                  key={order.order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-black/5 bg-black/5 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl">
                        <Package className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Order ID</p>
                        <p className="font-bold">#{order.order_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Date</p>
                        <p className="font-medium text-sm">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Total</p>
                        <p className="font-bold text-sm">{formatPrice(order.total_amount)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${order.order_status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.order_status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Items</h4>
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const products = JSON.parse(order.products || '[]');
                            return Array.isArray(products) ? products.map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black/5 rounded-lg overflow-hidden shrink-0">
                                  <img src={item.product?.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-1">{item.product?.title}</p>
                                  <p className="text-[10px] text-black/40">Qty: {item.quantity} • {formatPrice(item.product?.discount_price || item.product?.price)}</p>
                                </div>
                              </div>
                            )) : null;
                          } catch (e) {
                            console.error('Failed to parse order products', e);
                            return <p className="text-xs text-red-500">Error loading items</p>;
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Shipping Address</h4>
                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-black/20 shrink-0 mt-0.5" />
                        <p className="text-sm text-black/60 leading-relaxed">{order.address}</p>
                      </div>
                    </div>
                  </div>
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
