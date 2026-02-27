import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Product, Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import {
  Package, ShoppingCart, Users, TrendingUp, Loader2, DollarSign, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      try {
        const productsData = await api.request('getProducts');
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }

      // Fetch Orders
      try {
        const ordersData = await api.request('getOrders');
        setOrders(Array.isArray(ordersData) ? [...ordersData].reverse() : []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }

      // Fetch Users
      try {
        const usersData = await api.request('getUsers');
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }

    } catch (error) {
      console.error("Dashboard general fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Safe date parsing helper
  const parseSafeDate = (dString: string) => {
    const d = new Date(dString);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  // Filter Orders by Month
  const filteredOrders = useMemo(() => {
    if (selectedMonth === 'All') return orders;
    return orders.filter(o => {
      const d = parseSafeDate(o.created_at || o.date);
      if (!d) return false;
      const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      return m === selectedMonth;
    });
  }, [orders, selectedMonth]);

  // Months available in orders
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    orders.forEach(o => {
      const d = parseSafeDate(o.created_at || o.date);
      if (d) {
        months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
      }
    });
    // Sort reverse chronological
    return Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [orders]);

  // Calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrders = filteredOrders.length;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.user_id)).size;

  // Category Revenue calculation for Pie Chart
  const categoryRevenueData = useMemo(() => {
    const rev: Record<string, { value: number, count: number }> = {};
    
    // Default categories from products mapping
    const productMap = new Map();
    products.forEach(p => productMap.set(p.product_id, p));

    filteredOrders.forEach(o => {
      try {
        const items = typeof o.products === 'string' ? JSON.parse(o.products) : o.products;
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const product = productMap.get(item.product_id);
            const cat = product?.category || 'Uncategorized';
            const price = product?.discount_price || product?.price || 0;
            const itemTotal = price * (item.quantity || 1);
            
            if (!rev[cat]) rev[cat] = { value: 0, count: 0 };
            rev[cat].value += itemTotal;
            rev[cat].count += (item.quantity || 1);
          });
        }
      } catch (e) {
        // Safe fail for invalid JSON
      }
    });

    // Create array for Recharts
    const data = Object.entries(rev)
      .map(([name, stats]) => ({ name, value: stats.value, count: stats.count }))
      .sort((a, b) => b.value - a.value);

    // Calculate percentages
    const grandTotal = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(d => ({
      ...d,
      percentage: grandTotal > 0 ? ((d.value / grandTotal) * 100).toFixed(1) : 0
    }));
  }, [filteredOrders, products]);

  // Daily Revenue calculation for Area Chart
  const dailyRevenueData = useMemo(() => {
    const daysMap = new Map<string, number>();

    // Sort chronologically (oldest to newest)
    const validOrders = [...filteredOrders]
      .map(o => ({ ...o, parsedDate: parseSafeDate(o.created_at || o.date) }))
      .filter(o => o.parsedDate !== null)
      // @ts-ignore
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    validOrders.forEach(o => {
      // @ts-ignore
      const dayStr = formatDate(o.parsedDate);
      daysMap.set(dayStr, (daysMap.get(dayStr) || 0) + o.total_amount);
    });

    let data = Array.from(daysMap.entries()).map(([date, revenue]) => ({
      date,
      revenue
    }));

    // If viewing 'All' and we have lots of data, just take the last 14 days for the chart
    if (selectedMonth === 'All' && data.length > 14) {
      data = data.slice(-14);
    }
    return data;
  }, [filteredOrders, selectedMonth]);

  // Top Customer calculation
  const topCustomer = useMemo(() => {
    if (filteredOrders.length === 0) return null;
    const spending: Record<string, number> = {};
    filteredOrders.forEach(o => {
      spending[o.user_id] = (spending[o.user_id] || 0) + o.total_amount;
    });
    
    let maxUserId = Object.keys(spending)[0];
    let maxSpent = spending[maxUserId];
    
    for (const [userId, amount] of Object.entries(spending)) {
      if (amount > maxSpent) {
        maxSpent = amount;
        maxUserId = userId;
      }
    }
    
    // Find user details
    const userDetails = users.find(u => u.id === maxUserId);
    
    return { 
      id: maxUserId, 
      spent: maxSpent,
      name: userDetails?.name || 'Unknown User',
      phone: userDetails?.phone || 'N/A',
      avatar: userDetails?.avatar_url || null
    };
  }, [filteredOrders, users]);

  const stats = [
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Sales', value: totalOrders, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Customers', value: uniqueCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Products', value: products.length, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-500 font-medium">Advanced analytics and store performance</p>
        </div>
        
        {/* Colorful Month Filter */}
        <div className="flex items-center gap-3 bg-white px-5 py-3 border border-gray-200 rounded-2xl shadow-xs transition-all hover:shadow-md">
          <span className="text-sm font-bold text-indigo-600">Period:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-gray-800 pr-8"
          >
            <option value="All">All Time</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
          <p className="text-gray-500 font-medium animate-pulse">Computing your analytics...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${stat.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trend Area Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xs"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-gray-900">Revenue Trend</h3>
                  <p className="text-sm text-gray-400 font-medium">Daily revenue breakdown over time</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <Activity className="w-6 h-6 text-indigo-500" />
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                {dailyRevenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                        dx={-10}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value: number) => [formatPrice(value), "Revenue"]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 font-medium">No revenue data for this period</div>
                )}
              </div>
            </motion.div>

            {/* Top Customer Hero Widget */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 mb-10">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-8 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-fuchsia-300" /> Top Spender
                  </h3>
                </div>
                {topCustomer ? (
                  <div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 flex items-center justify-center mb-6 shadow-2xl overflow-hidden">
                      {topCustomer.avatar ? (
                        <img src={topCustomer.avatar} alt={topCustomer.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-white drop-shadow-md" />
                      )}
                    </div>
                    
                    <p className="text-sm font-medium text-indigo-100 mb-1">Customer Details</p>
                    <div className="bg-black/30 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 inline-block mb-6 shadow-inner w-full">
                      <p className="font-bold text-lg text-white mb-0.5 truncate">{topCustomer.name}</p>
                      <p className="text-indigo-200 text-sm font-medium mb-1 truncate">{topCustomer.phone}</p>
                      <p className="font-mono text-[10px] text-white/50 tracking-wider">ID: {topCustomer.id.substring(0,8)}...</p>
                    </div>

                    <p className="text-sm font-medium text-indigo-100 mb-2">Total Contribution</p>
                    <p className="text-4xl lg:text-5xl font-black tracking-tight drop-shadow-lg">{formatPrice(topCustomer.spent)}</p>
                  </div>
                ) : (
                  <div className="text-white/60 font-medium h-40 flex items-center">No sales data recorded yet.</div>
                )}
              </div>
              
              <div className="relative z-10 w-full bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner mt-auto">
                 <p className="text-xs text-white/80 font-medium text-center leading-relaxed">
                   Identifying and rewarding top spenders helps build long-term loyalty and recurring revenue.
                 </p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Revenue Pie Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xs flex flex-col"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1 text-gray-900">Revenue by Category</h3>
                <p className="text-sm text-gray-400 font-medium">Which categories drive the most sales</p>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[300px]">
                {categoryRevenueData.length > 0 ? (
                  <>
                    <div className="w-64 h-64 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryRevenueData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {categoryRevenueData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => formatPrice(value)}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {categoryRevenueData.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <div>
                               <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                               <p className="text-xs text-gray-400">{cat.count} items sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-gray-900">{formatPrice(cat.value)}</p>
                             <p className="text-xs text-gray-500 font-medium">{cat.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 font-medium w-full">No category data available</div>
                )}
              </div>
            </motion.div>

             {/* Recent Quick Actions or Extra Widget */}
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-linear-to-bl from-slate-900 via-slate-800 to-black p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden"
            >
               {/* Ambient background decoration */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
               
               <div className="relative z-10 h-full flex flex-col">
                 <div className="mb-8">
                   <h3 className="text-xl font-bold mb-1 text-white">Quick Insights</h3>
                   <p className="text-sm text-slate-400 font-medium">Snapshot of your business health</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-center">
                       <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">AOV (Avg Order)</p>
                       <p className="text-2xl font-black text-emerald-400 tracking-tight">
                         {totalOrders > 0 ? formatPrice(totalRevenue / totalOrders) : '₹0'}
                       </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-center">
                       <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Total Products</p>
                       <p className="text-2xl font-black text-indigo-400 tracking-tight">
                         {products.length}
                       </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-center col-span-2">
                       <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Top Selling Category</p>
                       <p className="text-xl font-bold text-white flex items-center gap-3 mt-1">
                         <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                           <Package className="w-5 h-5" />
                         </span>
                         {categoryRevenueData.length > 0 ? categoryRevenueData[0].name : 'N/A'}
                       </p>
                    </div>
                 </div>
               </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
