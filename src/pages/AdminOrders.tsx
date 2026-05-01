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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">Order Management</h1>
          <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Track and fulfill customer orders</p>
        </div>
      </div>

      
      {/* Premium Split Filter Section */}
      <div className="flex flex-wrap items-center gap-3 mb-8 md:mb-12">
        <div className="flex-1 min-w-full md:min-w-[280px]">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text"
                placeholder="Search Customer..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-5 py-3 md:py-4 bg-white border-2 border-slate-200 md:border-slate-300 rounded-2xl md:rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 shadow-[0_4px_12px_rgba(0,0,0,0.02)] outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-[200px]">
          <div className="relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors pointer-events-none" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-10 py-3 md:py-4 bg-white border-2 border-slate-200 md:border-slate-300 rounded-2xl md:rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 shadow-[0_4px_12px_rgba(0,0,0,0.02)] appearance-none cursor-pointer outline-none transition-all text-slate-800"
            >
              <option value="All">ALL ORDERS</option>
              <option value="Pending">PENDING</option>
              <option value="Processing">PROCESSING</option>
              <option value="Shipped">SHIPPED</option>
              <option value="Delivered">DELIVERED</option>
              <option value="Cancelled">CANCELLED</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-1 md:flex-none items-center gap-2 bg-slate-100 p-1 md:p-1.5 rounded-2xl md:rounded-[1.5rem] border-2 border-slate-200 md:border-slate-300 shadow-inner overflow-hidden min-w-full md:min-w-0">
          <div className="flex-1 flex items-center gap-2 px-3">
             <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
             <input 
               type="date"
               value={dateFrom}
               onChange={(e) => setDateFrom(e.target.value)}
               className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none text-slate-800 w-full"
             />
          </div>
          <div className="w-px h-4 bg-slate-300 shrink-0" />
          <div className="flex-1 flex items-center gap-2 px-3">
             <input 
               type="date"
               value={dateTo}
               onChange={(e) => setDateTo(e.target.value)}
               className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none text-slate-800 w-full"
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
            className="w-full md:w-12 h-12 bg-rose-500 text-white rounded-[1.2rem] font-black hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-500/20 flex items-center justify-center group/btn"
          >
            <X className="w-5 h-5 md:group-hover/btn:rotate-90 transition-transform duration-300 mr-2 md:mr-0" />
            <span className="md:hidden uppercase tracking-widest text-[10px] font-black">Clear Filters</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm text-center px-6">
          <Package className="w-16 h-16 text-black/10 mb-4" />
          <h3 className="text-xl font-black text-black">No Orders Found</h3>
          <p className="text-black/40 font-medium">Try adjusting your filters or date range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20">
          {filteredOrders.map((order) => (
            <div 
              key={order.order_id} 
              onClick={() => setSelectedOrder(order)}
              className="group relative bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-200 border-b-[6px] md:border-b-[8px] border-b-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                
                <div className="w-full md:w-[280px] flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-200">
                    <Package className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                      <p className="font-black text-[9px] text-slate-400 uppercase tracking-widest truncate">#{order.order_id.substring(0, 8)}</p>
                    </div>
                    <p className="text-sm font-black text-slate-900 leading-none truncate mb-1">{order.profiles?.name || 'Customer'}</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">📞 {order.profiles?.phone || 'No Phone'}</p>
                  </div>
                </div>

                <div className="flex-1 w-full bg-slate-50/50 rounded-2xl p-3 border border-slate-200 flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {(() => {
                      try {
                        const items = JSON.parse(order.products);
                        return items.map((item: any, idx: number) => (
                          <div key={`${order.order_id}-${idx}`} className="flex items-center gap-3 bg-white pl-1.5 pr-3 py-1.5 rounded-xl shadow-xs border border-slate-200 shrink-0">
                             <div 
                               onClick={(e) => { e.stopPropagation(); setPreviewImage(item.product?.image_url || item.product?.images?.[0]); }}
                               className="w-10 h-10 rounded-lg overflow-hidden bg-black/[0.02] shrink-0 border border-slate-200"
                             >
                               <img 
                                 src={item.product?.image_url || item.product?.images?.[0] || 'https://via.placeholder.com/150'} 
                                 alt={item.product?.title} 
                                 className="w-full h-full object-cover"
                               />
                             </div>
                             <div className="min-w-0">
                               <p className="font-black text-[9px] text-black uppercase tracking-tighter truncate w-24 leading-none mb-1">{item.product?.title}</p>
                               <p className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter leading-none w-fit">Qty: {item.quantity}</p>
                             </div>
                          </div>
                        ));
                      } catch (e) { return null; }
                    })()}
                  </div>
                </div>

                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 md:gap-6 shrink-0 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-200">
                  <div className="text-left md:text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Grand Total</p>
                    <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(order.total_amount)}</p>
                    <div className="md:hidden mt-2 flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                       <Clock className="w-3 h-3" /> {formatDate(order.created_at || order.date)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        value={order.order_status}
                        onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                        className="bg-white border-2 border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest pl-4 pr-8 py-3 shadow-sm appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-30">▼</div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
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

              {/* Modal Footer - Optimized for Mobile & Desktop */}
              <div className="p-4 md:p-6 bg-slate-50 border-t border-black/5 rounded-b-[2.5rem]">
                <div className="flex flex-col md:flex-row gap-3 md:justify-between items-stretch md:items-center">
                  <div className="flex flex-row gap-3">
                    <button 
                      onClick={() => generateInvoice(selectedOrder, 'download')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3.5 md:py-3 bg-emerald-600 text-white rounded-2xl md:rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                    >
                      <Download className="w-4 h-4" /> <span className="hidden xs:inline">Download</span> Invoice
                    </button>
                    <button 
                      onClick={() => generateInvoice(selectedOrder, 'view')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3.5 md:py-3 bg-indigo-600 text-white rounded-2xl md:rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-full md:w-auto px-8 py-3.5 md:py-3 bg-slate-900 text-white rounded-2xl md:rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
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
