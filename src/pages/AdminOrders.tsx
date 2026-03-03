import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Package, Loader2, User as UserIcon, Calendar, Clock, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('All');
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
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20';
      case 'Shipped': return 'bg-blue-100 text-blue-800 ring-blue-600/20';
      case 'Processing': return 'bg-indigo-100 text-indigo-800 ring-indigo-600/20';
      case 'Cancelled': return 'bg-red-100 text-red-800 ring-red-600/20';
      default: return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'; // Pending
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
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Order Management</h1>
          <p className="text-black/40">Track and fulfill customer orders in real-time</p>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-auto flex-1">
          <label className="text-[11px] font-bold uppercase tracking-widest text-black/40 mb-1.5 block">Status</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/5 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/10"
            >
              <option value="All">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="w-full md:w-auto">
          <label className="text-[11px] font-bold uppercase tracking-widest text-black/40 mb-1.5 block">From Date</label>
          <input 
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/5 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/10"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label className="text-[11px] font-bold uppercase tracking-widest text-black/40 mb-1.5 block">To Date</label>
          <input 
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/5 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/10"
          />
        </div>

        {(filterStatus !== 'All' || dateFrom || dateTo) && (
          <button 
            onClick={() => {
              setFilterStatus('All');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 h-[44px]"
          >
            <X className="w-4 h-4" /> Clear
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
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.order_id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
              
              {/* Top Header Row */}
              <div className="flex flex-wrap justify-between items-start gap-6 border-b border-black/5 pb-6">
                
                {/* Order ID & User */}
                <div className="flex items-start gap-4 flex-1 min-w-[280px]">
                  <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-black/60" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-black text-lg">#{order.order_id.substring(0, 8).toUpperCase()}</p>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ring-1 ring-inset ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-black/60 font-medium">
                      <UserIcon className="w-4 h-4" />
                      <span>{order.profiles?.name || 'Unknown'}</span>
                      <span className="text-black/20">•</span>
                      <span>{order.profiles?.phone || order.user_id}</span>
                    </div>
                    <p className="text-xs text-black/40 mt-1.5">{order.address}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-black/60 font-medium text-sm">
                     <Calendar className="w-4 h-4" />
                     {formatDate(order.created_at || order.date)}
                  </div>
                  <div className="flex items-center gap-2 text-black/40 text-xs">
                     <Clock className="w-3 h-3" />
                     {new Date(order.created_at || order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

              </div>

              {/* Middle Row: Content & Actions */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                
                {/* Detailed Ordered Products Section */}
                <div className="w-full lg:flex-1 bg-black/5 rounded-2xl p-4 lg:p-5 border border-black/5">
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4">Ordered Items</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      try {
                        const items = JSON.parse(order.products);
                        return items.map((item: any, idx: number) => (
                          <div key={`${order.order_id}-${idx}`} className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-black/5 hover:border-black/10 transition-colors">
                             <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-black/5">
                               <img 
                                 src={item.product?.image_url || item.product?.images?.[0] || 'https://via.placeholder.com/150'} 
                                 alt={item.product?.title || 'Product'} 
                                 className="w-full h-full object-cover"
                               />
                             </div>
                             <div className="flex-1 min-w-0 flex flex-col justify-center">
                               <p className="font-bold text-sm text-black truncate leading-tight mb-1" title={item.product?.title}>{item.product?.title || 'Unknown Product'}</p>
                               <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                 {item.product?.color && (
                                   <span className="text-[9px] font-bold text-black/50 bg-black/5 px-2 py-0.5 rounded uppercase">{item.product.color}</span>
                                 )}
                                 {(item.selectedSize || item.product?.size) && (
                                   <span className="text-[9px] font-bold text-black/50 bg-black/5 px-2 py-0.5 rounded uppercase">Size: {item.selectedSize || item.product?.size}</span>
                                 )}
                                 <span className="text-[9px] font-bold text-black/50 bg-black/5 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                               </div>
                             </div>
                             <div className="text-right shrink-0 pr-1">
                               <p className="font-bold text-sm">₹{(item.product?.discount_price || item.product?.price || 0) * item.quantity}</p>
                             </div>
                          </div>
                        ));
                      } catch (e) {
                         return <p className="text-sm font-medium text-red-500">Failed to load items</p>;
                      }
                    })()}
                  </div>
                </div>

                {/* Status Update & Total */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 p-4 lg:p-0 bg-black/5 lg:bg-transparent rounded-2xl">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5">Order Total</p>
                    <p className="text-2xl font-black">{formatPrice(order.total_amount)}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Update Status</p>
                    <select
                      value={order.order_status}
                      onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2.5 focus:ring-2 focus:ring-black/20 hover:border-black/20 transition-colors shadow-sm cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
