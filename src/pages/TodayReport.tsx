import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Loader2, Calendar, TrendingUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const TodayReport = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState<'today' | 'month' | 'range'>('today');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersData = await api.request('getOrders');
      setOrders(Array.isArray(ordersData) ? [...ordersData].reverse() : []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Extract available months for dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    orders.forEach(o => {
      const d = new Date(o.created_at);
      months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    });
    return Array.from(months);
  }, [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      
      if (filterType === 'today') {
        const orderDay = new Date(orderDate);
        orderDay.setHours(0, 0, 0, 0);
        return orderDay.getTime() === today.getTime();
      }
      
      if (filterType === 'month' && selectedMonth !== 'All') {
        const m = orderDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return m === selectedMonth;
      }

      if (filterType === 'range') {
        if (!startDate && !endDate) return true;
        const oTime = orderDate.getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() : Infinity;
        // Adjust end date to include the whole day
        const endAdjusted = end !== Infinity ? end + (24 * 60 * 60 * 1000) - 1 : Infinity;
        return oTime >= start && oTime <= endAdjusted;
      }

      return true; // default / 'All'
    });
  }, [orders, filterType, selectedMonth, startDate, endDate]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Reports</h1>
        <p className="text-black/40">Analyze sales and monitor daily performance</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex gap-2 p-1 bg-black/5 rounded-2xl w-full md:w-auto">
             <button
                onClick={() => setFilterType('today')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${filterType === 'today' ? 'bg-white text-black shadow-sm' : 'text-black/50 hover:text-black'}`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterType('month')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${filterType === 'month' ? 'bg-white text-black shadow-sm' : 'text-black/50 hover:text-black'}`}
              >
                By Month
              </button>
              <button
                onClick={() => setFilterType('range')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${filterType === 'range' ? 'bg-white text-black shadow-sm' : 'text-black/50 hover:text-black'}`}
              >
                Date Range
              </button>
          </div>

          <div className="flex gap-4 items-center w-full md:w-auto">
            {filterType === 'month' && (
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full md:w-48 px-4 py-2.5 bg-black/5 text-black border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black"
              >
                <option value="All">All Months</option>
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}

            {filterType === 'range' && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 bg-black/5 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black"
                />
                <span className="text-black/40 font-bold">to</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 bg-black/5 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black"
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-1">Total Revenue</p>
                <p className="text-3xl font-black text-emerald-900">{formatPrice(totalRevenue)}</p>
              </div>
              <div className="p-4 bg-emerald-100/50 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
           </div>
           <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-indigo-800 uppercase tracking-widest mb-1">Total Orders</p>
                <p className="text-3xl font-black text-indigo-900">{filteredOrders.length}</p>
              </div>
              <div className="p-4 bg-indigo-100/50 rounded-2xl">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black/5 text-xs font-bold uppercase tracking-widest text-black/40">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-black/2 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold">#{order.order_id.substring(0,8)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatDate(order.created_at || order.date)} {new Date(order.created_at || order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-black">{order.profiles?.name || 'Unknown User'}</p>
                      <p className="text-xs text-black/60 truncate max-w-[150px]">{order.profiles?.phone || order.user_id}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatPrice(order.total_amount)}</td>
                    <td className="px-6 py-4">
                       <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border
                        ${order.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          order.order_status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 
                          'bg-indigo-50 text-indigo-600 border-indigo-200'}
                       `}>
                          {order.order_status}
                       </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-black/40 font-medium">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No orders found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
