import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Package, Loader2, User as UserIcon, Calendar, Clock, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchName, setSearchName] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersData = await api.request('getOrders');
      setOrders(Array.isArray(ordersData) ? [...ordersData].reverse() : []);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.request('updateOrderStatus', { order_id: orderId, order_status: status });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
      case 'Shipped': return 'bg-blue-500 text-white shadow-sm shadow-blue-500/20';
      case 'Processing': return 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20';
      case 'Cancelled': return 'bg-red-500 text-white shadow-sm shadow-red-500/20';
      default: return 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'; // Pending
    }
  };

  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    if (filterStatus !== 'All' && order.order_status !== filterStatus) return false;
    
    // 2. Date Range Filter
    const orderDate = new Date(order.created_at || order.date);
    orderDate.setHours(0, 0, 0, 0); // normalize time
    
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (orderDate < from) return false;
    }
    
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (orderDate > to) return false;
    }
    
    // 3. Name Search Filter
    if (searchName) {
      const name = order.profiles?.name?.toLowerCase() || '';
      if (!name.includes(searchName.toLowerCase())) return false;
    }
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">Order Management</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Track and fulfill customer orders</p>
        </div>
      </div>

      
      {/* Premium Split Filter Section */}
      <div className="flex flex-wrap items-center gap-4 mb-12">
        <div className="flex-1 min-w-[280px]">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text"
                placeholder="Search Customer..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-300 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 shadow-[0_4px_12px_rgba(0,0,0,0.02)] outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[240px]">
          <div className="relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors pointer-events-none" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-white border-2 border-slate-300 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 shadow-[0_4px_12px_rgba(0,0,0,0.02)] appearance-none cursor-pointer outline-none transition-all text-slate-800"
            >
              <option value="All">ALL ORDERS</option>
              <option value="Pending">PENDING</option>
              <option value="Processing">PROCESSING</option>
              <option value="Shipped">SHIPPED</option>
              <option value="Delivered">DELIVERED</option>
              <option value="Cancelled">CANCELLED</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-[1.5rem] border-2 border-slate-300 shadow-inner">
          <div className="flex items-center gap-2 px-3">
             <Calendar className="w-3.5 h-3.5 text-slate-500" />
             <input 
               type="date"
               value={dateFrom}
               onChange={(e) => setDateFrom(e.target.value)}
               className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none text-slate-800 font-bold"
             />
          </div>
          <div className="w-px h-4 bg-slate-400" />
          <div className="flex items-center gap-2 px-3">
             <input 
               type="date"
               value={dateTo}
               onChange={(e) => setDateTo(e.target.value)}
               className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none text-slate-800 font-bold"
             />
          </div>
        </div>

        {(filterStatus !== 'All' || searchName || dateFrom || dateTo) && (
          <button 
            onClick={() => {
              setFilterStatus('All');
              setSearchName('');
              setDateFrom('');
              setDateTo('');
            }}
            className="w-12 h-12 bg-rose-500 text-white rounded-[1.2rem] font-black hover:bg-rose-600 transition-all active:scale-90 shadow-xl shadow-rose-500/20 flex items-center justify-center group/btn"
          >
            <X className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
          </button>
        )}
      </div>



      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm text-center">
          <Package className="w-16 h-16 text-black/10 mb-4" />
          <h3 className="text-xl font-black text-black">No Orders Found</h3>
          <p className="text-black/40 font-medium">Try adjusting your filters or date range.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.order_id} 
              onClick={() => setSelectedOrder(order)}
              className="group relative bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 border-b-[8px] border-b-slate-300 shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col xl:flex-row items-center gap-6">
                
                {/* 1. Customer Info (Left) */}
                <div className="w-full xl:w-[280px] flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-200">
                    <Package className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                      <p className="font-black text-[9px] text-slate-400 uppercase tracking-widest truncate">#{order.order_id.substring(0, 8)}</p>
                    </div>
                    <p className="text-sm font-black text-slate-900 leading-none truncate mb-1">{order.profiles?.name || 'Customer'}</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">📞 {order.profiles?.phone || 'No Phone'}</p>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter mt-1 truncate max-w-[180px]">📍 {order.address}</p>
                  </div>
                </div>

                {/* 2. Items (Center) - Compact Horizontal Scroll or Small List */}
                <div className="flex-1 w-full bg-slate-50 rounded-2xl p-3 border-2 border-slate-200 flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {(() => {
                      try {
                        const items = JSON.parse(order.products);
                        return items.map((item: any, idx: number) => (
                          <div key={`${order.order_id}-${idx}`} className="flex items-center gap-3 bg-white pl-2 pr-3 py-1.5 rounded-xl shadow-sm border-2 border-slate-200 shrink-0">
                             <div 
                               onClick={() => setPreviewImage(item.product?.image_url || item.product?.images?.[0])}
                               className="w-10 h-10 rounded-lg overflow-hidden bg-black/[0.02] shrink-0 border-2 border-slate-200 cursor-zoom-in hover:scale-105 transition-transform"
                             >
                               <img 
                                 src={item.product?.image_url || item.product?.images?.[0] || 'https://via.placeholder.com/150'} 
                                 alt={item.product?.title} 
                                 className="w-full h-full object-cover"
                               />
                             </div>
                             <div className="min-w-0">
                               <p className="font-black text-[9px] text-black uppercase tracking-tighter truncate w-24 leading-none mb-1">{item.product?.title}</p>
                               <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter leading-none w-fit">Qty: {item.quantity}</p>
                             </div>
                          </div>

                        ));
                      } catch (e) {
                         return <p className="text-[8px] font-black text-red-500">Error</p>;
                      }
                    })()}
                  </div>
                </div>

                {/* 3. Total & Status (Right) */}
                <div className="w-full xl:w-auto flex items-center gap-6 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200 pt-4 xl:pt-0 xl:pl-6">
                  <div className="text-left xl:text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Total</p>
                    <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(order.total_amount)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        value={order.order_status}
                        onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                        className="w-full bg-white border-2 border-black/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] pl-4 pr-10 py-3.5 shadow-md appearance-none cursor-pointer hover:bg-black/5 transition-all focus:ring-2 focus:ring-black/5"
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="Processing">⚙️ Processing</option>
                        <option value="Shipped">🚚 Shipped</option>
                        <option value="Delivered">✅ Delivered</option>
                        <option value="Cancelled">❌ Cancelled</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 text-[8px]">
                        ▼
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                       <Calendar className="w-3 h-3 text-slate-500" />
                       {formatDate(order.created_at || order.date)}
                       <span className="text-slate-300">|</span>
                       <Clock className="w-3 h-3 text-slate-500" />
                       {new Date(order.created_at || order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      )}
      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-[160] w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-black/5"
            >
              {/* Modal Header - Stylish Gradient */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex justify-between items-start border-b border-white/10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg ring-1 ring-white/20 ${getStatusColor(selectedOrder.order_status)}`}>
                      {selectedOrder.order_status}
                    </span>
                    <p className="font-black text-[9px] text-white/40 uppercase tracking-widest">#{selectedOrder.order_id.substring(0, 10)}</p>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Order Details</h2>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white border border-white/10 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[65vh] overflow-y-auto no-scrollbar bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-black/5 shadow-sm">
                      <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Customer
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                          <UserIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-black text-base text-slate-900 leading-none mb-1">{selectedOrder.profiles?.name || 'Customer'}</p>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">📞 {selectedOrder.profiles?.phone || 'No Phone'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border-2 border-black/5 shadow-sm">
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Address
                      </p>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">📍 {selectedOrder.address}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-black/5 shadow-sm">
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Date & Time
                      </p>
                      <p className="text-[11px] font-black text-slate-900 mb-0.5">{formatDate(selectedOrder.created_at || selectedOrder.date)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(selectedOrder.created_at || selectedOrder.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border-2 border-black/5 shadow-sm text-right">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatPrice(selectedOrder.total_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">Ordered Items</p>
                  {(() => {
                    try {
                      const items = JSON.parse(selectedOrder.products);
                      return items.map((item: any, idx: number) => (
                        <div key={`modal-${idx}`} className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border-2 border-black/5 hover:border-indigo-100 transition-all shadow-sm group/item">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/[0.02] shrink-0 border border-black/5 group-hover/item:scale-105 transition-transform">
                            <img src={item.product?.image_url || item.product?.images?.[0]} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[11px] text-slate-900 uppercase tracking-wider mb-1.5">{item.product?.title}</p>
                            <div className="flex gap-1.5">
                              {item.product?.color && <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[7px] font-black uppercase text-slate-400">{item.product.color}</span>}
                              {(item.selectedSize || item.product?.size) && <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[7px] font-black uppercase text-slate-400">Size: {item.selectedSize || item.product?.size}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter mb-1 block w-fit ml-auto">Qty: {item.quantity}</span>
                            <p className="font-black text-sm text-slate-900 tracking-tight">₹{(item.product?.discount_price || item.product?.price) * item.quantity}</p>
                          </div>
                        </div>
                      ));
                    } catch (e) { return null; }
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white flex justify-end border-t border-black/5">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-6 right-6 z-[210] p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={previewImage}
              alt="Preview"
              className="relative z-[210] max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
