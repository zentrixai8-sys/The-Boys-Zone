import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Package, Loader2, User as UserIcon, Calendar, Clock, Filter, X, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

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
    try {
      const ordersData = await api.request('getOrders');
      setOrders(Array.isArray(ordersData) ? [...ordersData].reverse() : []);
      setLoading(false);
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

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5);

  useEffect(() => {
    const enabled = localStorage.getItem('gstEnabled') === 'true';
    const percent = localStorage.getItem('gstPercentage');
    setGstEnabled(enabled);
    if (percent) setGstPercentage(Number(percent));
  }, []);

  const generateInvoice = async (order: Order, mode: 'view' | 'download' = 'download') => {
    try {
      toast.loading('Generating Invoice...', { id: 'invoice' });
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const W = 210;
      const margin = 14;
      let y = 0;

      const NAVY     = [20, 30, 60]   as [number,number,number];
      const COGNAC   = [160, 110, 60] as [number,number,number];
      const SLATE    = [71, 85, 105]  as [number,number,number];
      const BORDER   = [226, 232, 240] as [number,number,number];
      const BG       = [248, 250, 252] as [number,number,number];

      // Header Section
      y = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(...NAVY);
      doc.text("THE BOY'S ZONE", margin, y);
      
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COGNAC);
      doc.text('MENSWEAR & ACCESSORIES STORE', margin, y, { charSpace: 1 });
      
      // Right Side - Invoice Meta
      const metaX = W - margin - 45;
      doc.setFillColor(...BG);
      doc.roundedRect(metaX - 5, 12, 50, 25, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      doc.text('INVOICE NO.', metaX, 20);
      doc.text('DATE', metaX, 28);
      
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.text(`#BZ-${order.order_id.substring(0, 8).toUpperCase()}`, W - margin, 20, { align: 'right' });
      doc.text(`${formatDate(order.created_at || order.date)}`, W - margin, 28, { align: 'right' });

      y = 45;
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.5);
      doc.line(margin, y, W - margin, y);

      // Client Info Section
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE);
      doc.text('CUSTOMER', margin, y);
      doc.text('STORE ADDRESS', W/2 + 10, y);
      
      y += 6;
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.text(order.profiles?.name || 'Valued Customer', margin, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE);
      doc.text('Near Ripusudan Petrol Pump, Suhela', W/2 + 10, y);
      doc.text('Baloda Bazar (C.G.) | +91 9617628157', W/2 + 10, y + 4.5);
      
      if (order.profiles?.phone) doc.text(`M: ${order.profiles.phone}`, margin, y + 5);
      if (order.address) doc.text(doc.splitTextToSize(order.address, 65), margin, y + 10);

      y += 28;
      // Styled Table Header
      doc.setFillColor(...NAVY);
      doc.rect(margin, y, W - margin * 2, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const col = { item: margin + 3, info: 90, qty: 130, unit: 155, total: W - margin - 3 };
      doc.text('ITEM DESCRIPTION', col.item, y + 6.5);
      doc.text('SIZE/COLOR', col.info, y + 6.5);
      doc.text('QTY', col.qty, y + 6.5, { align: 'center' });
      doc.text('PRICE', col.unit, y + 6.5, { align: 'right' });
      doc.text('TOTAL', col.total, y + 6.5, { align: 'right' });
      
      y += 15;
      const items = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(...NAVY);
          doc.text(item.product?.title || 'Clothing Item', col.item, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...SLATE);
          doc.text(`${item.selectedSize || 'N/A'} / ${item.product?.color || 'N/A'}`, col.info, y);
          doc.text(String(item.quantity), col.qty, y, { align: 'center' });
          doc.text(`${Number(item.product?.discount_price || item.product?.price || 0).toFixed(2)}`, col.unit, y, { align: 'right' });
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...NAVY);
          doc.text(`${((item.product?.discount_price || item.product?.price || 0) * item.quantity).toFixed(2)}`, col.total, y, { align: 'right' });
          
          y += 4;
          doc.setDrawColor(...BORDER);
          doc.setLineWidth(0.1);
          doc.line(margin, y, W - margin, y);
          y += 9;
        });
      }

      // Summary
      y += 5;
      const totalX = W - margin - 55;
      const currentSubtotal = order.total_amount / (gstEnabled ? (1 + gstPercentage / 100) : 1);
      const currentTax = order.total_amount - currentSubtotal;

      doc.setFontSize(9);
      doc.setTextColor(...SLATE);
      doc.text('SUBTOTAL', totalX, y);
      doc.setTextColor(...NAVY);
      doc.text(`${currentSubtotal.toFixed(2)}`, W - margin - 3, y, { align: 'right' });
      
      y += 6;
      doc.setTextColor(...SLATE);
      doc.text(`GST (${gstEnabled ? gstPercentage : 0}%)`, totalX, y);
      doc.text(`${currentTax.toFixed(2)}`, W - margin - 3, y, { align: 'right' });
      
      y += 10;
      doc.setFillColor(...COGNAC);
      doc.rect(totalX - 2, y - 6, 57 + 2, 11, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('GRAND TOTAL', totalX + 2, y + 2);
      doc.text(`Rs.${order.total_amount.toFixed(2)}`, W - margin - 3, y + 2, { align: 'right' });

      // Footer
      y = 245;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...NAVY);
      doc.text('TERMS & CONDITIONS', margin, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      const terms = [
        '• Accessories and discounted items are final sale.',
        '• Exchanges within 7 days with original tags and invoice.',
        '• This is a system generated record for The Boy\'s Zone.'
      ];
      terms.forEach((t, i) => doc.text(t, margin, y + 5 + (i * 4)));

      y = 282;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      doc.text('SYSTEM GENERATED STORE RECORD', W/2, y, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text('THANK YOU FOR SHOPPING AT THE BOY\'S ZONE', W/2, y + 5, { align: 'center' });

      if (mode === 'view') {
        window.open(doc.output('bloburl'), '_blank');
        toast.success('Preview Opened', { id: 'invoice' });
      } else {
        doc.save(`Invoice_${order.profiles?.name || 'Customer'}.pdf`);
        toast.success('Invoice Saved', { id: 'invoice' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate invoice', { id: 'invoice' });
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
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">Order Management</h1>
          <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Track and fulfill customer orders</p>
        </div>
      </div>

      {/* Responsive Filter Section */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 mb-6 sm:mb-8">
        {/* Search Customer Input */}
        <div className="relative flex-1">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search customer name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition-all"
          />
          {searchName && (
            <button 
              onClick={() => setSearchName('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown Filter */}
        <div className="relative w-full lg:w-48">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-400">▼</div>
        </div>
        
        {/* Date Filter Range (Clean 2-column on mobile, inline on desktop) */}
        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1.5 shrink-0">From</span>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 outline-none p-0 cursor-pointer"
            />
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1.5 shrink-0">To</span>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 outline-none p-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Clear Filter Button */}
        {(filterStatus !== 'All' || searchName || dateFrom || dateTo) && (
          <button 
            onClick={() => {
              setFilterStatus('All');
              setSearchName('');
              setDateFrom('');
              setDateTo('');
            }}
            className="w-full lg:w-auto px-4 py-2.5 sm:py-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-9 h-9 animate-spin text-indigo-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs text-center px-4">
          <Package className="w-14 h-14 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Orders Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or date range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 pb-28 md:pb-16">
          {filteredOrders.map((order) => (
            <div 
              key={order.order_id} 
              onClick={() => setSelectedOrder(order)}
              className="group relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3.5 sm:gap-4">
                
                {/* Customer Info & Status Badge */}
                <div className="flex items-center justify-between md:justify-start md:w-[260px] gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200">
                      <Package className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`md:hidden px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                        <p className="font-mono text-[10px] text-slate-400 font-semibold truncate">#{order.order_id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-tight truncate">{order.profiles?.name || 'Customer'}</p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">📞 {order.profiles?.phone || 'No Phone'}</p>
                    </div>
                  </div>

                  <span className={`hidden md:inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg shrink-0 ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>

                {/* Ordered Items Preview */}
                <div className="flex-1 w-full bg-slate-50/70 rounded-xl p-2 sm:p-2.5 border border-slate-200/60 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {(() => {
                      try {
                        const items = JSON.parse(order.products);
                        return items.map((item: any, idx: number) => (
                          <div key={`${order.order_id}-${idx}`} className="flex items-center gap-2.5 bg-white pl-1.5 pr-2.5 py-1 rounded-lg shadow-2xs border border-slate-200 shrink-0">
                             <div 
                               onClick={(e) => { e.stopPropagation(); setPreviewImage(item.product?.image_url || item.product?.images?.[0]); }}
                               className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200"
                             >
                               <img 
                                 src={item.product?.image_url || item.product?.images?.[0] || 'https://via.placeholder.com/150'} 
                                 alt={item.product?.title} 
                                 className="w-full h-full object-cover"
                               />
                             </div>
                             <div className="min-w-0">
                               <p className="font-bold text-[10px] text-slate-900 truncate max-w-[110px] leading-tight">{item.product?.title}</p>
                               <p className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded w-fit mt-0.5">Qty: {item.quantity}</p>
                             </div>
                          </div>
                        ));
                      } catch (e) { return null; }
                    })()}
                  </div>
                </div>

                {/* Grand Total & Action / Status Select */}
                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none mt-0.5">{formatPrice(order.total_amount)}</p>
                    <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 mt-1">
                       <Clock className="w-2.5 h-2.5" /> 
                       <span>{formatDate(order.created_at || order.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        value={order.order_status}
                        onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 pl-3 pr-7 py-2 appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-400">▼</div>
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
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative z-[160] w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 p-4 sm:p-6 flex justify-between items-start border-b border-white/10 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(selectedOrder.order_status)}`}>
                      {selectedOrder.order_status}
                    </span>
                    <p className="font-mono text-[10px] text-white/50 font-semibold">#{selectedOrder.order_id.substring(0, 10).toUpperCase()}</p>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Order Details</h2>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white border border-white/10 active:scale-90"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar bg-slate-50/50 flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Customer
                      </p>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shrink-0">
                          <UserIcon className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 leading-tight truncate">{selectedOrder.profiles?.name || 'Customer'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">📞 {selectedOrder.profiles?.phone || 'No Phone'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Delivery Address
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">📍 {selectedOrder.address}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Date & Time
                      </p>
                      <p className="text-xs font-bold text-slate-900">{formatDate(selectedOrder.created_at || selectedOrder.date)}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{new Date(selectedOrder.created_at || selectedOrder.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs text-left sm:text-right">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(selectedOrder.total_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Ordered Items</p>
                  {(() => {
                    try {
                      const items = JSON.parse(selectedOrder.products);
                      return items.map((item: any, idx: number) => (
                        <div key={`modal-${idx}`} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            {(item.product?.image_url || item.product?.images?.[0]) && <img src={item.product?.image_url || item.product?.images?.[0]} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate mb-1">{item.product?.title}</p>
                            <div className="flex gap-1.5">
                              {item.product?.color && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-600">{item.product.color}</span>}
                              {(item.selectedSize || item.product?.size) && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-600">Size: {item.selectedSize || item.product?.size}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase block w-fit ml-auto mb-1">Qty: {item.quantity}</span>
                            <p className="font-bold text-xs sm:text-sm text-slate-900">₹{(item.product?.discount_price || item.product?.price) * item.quantity}</p>
                          </div>
                        </div>
                      ));
                    } catch (e) { return null; }
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-5 bg-white border-t border-slate-100 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-between items-stretch sm:items-center">
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => generateInvoice(selectedOrder, 'download')}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Invoice
                    </button>
                    <button 
                      onClick={() => generateInvoice(selectedOrder, 'view')}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
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
