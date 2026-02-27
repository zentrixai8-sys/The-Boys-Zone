import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Package, Loader2, User as UserIcon, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Order Management</h1>
        <p className="text-black/40">Track and fulfill customer orders in real-time</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-wrap justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/5 rounded-2xl">
                  <Package className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Order ID</p>
                  <p className="font-bold">#{order.order_id}</p>
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1">Customer</p>
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4 text-black/40" />
                  <p className="text-sm font-bold text-black">{order.profiles?.name || 'Unknown User'}</p>
                </div>
                <p className="text-xs font-medium text-black/60 mb-2">{order.profiles?.phone || order.user_id}</p>
                <p className="text-[11px] text-black/40 truncate bg-black/5 px-2 py-1 rounded-lg w-fit">{order.address}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1">Ordered On</p>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 text-black/40" />
                  <p className="text-sm font-bold">{formatDate(order.created_at || order.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-black/40" />
                  <p className="text-xs font-medium text-black/60">{new Date(order.created_at || order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1">Total</p>
                <p className="font-bold">{formatPrice(order.total_amount)}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Status</p>
                <select
                  value={order.order_status}
                  onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                  className="bg-black/5 border-none rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2 focus:ring-2 focus:ring-black"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
