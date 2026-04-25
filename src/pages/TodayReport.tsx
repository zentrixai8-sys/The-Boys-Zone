import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Loader2, Calendar, TrendingUp, Search, Banknote, Smartphone, Shuffle, Clock, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export const TodayReport = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSales, setStoreSales] = useState<{ id: string, total: number, payment_method: string, pdf_url?: string, customer?: string, mobile?: string, created_at?: string, items?: any[] }[]>([]);
  
  // Filters
  const [filterType, setFilterType] = useState<'today' | 'month' | 'range'>('today');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchData();
    fetchStoreSales();
  }, []);

  const fetchStoreSales = async () => {
    try {
      const data = await api.request('getTodaysSales');
      setStoreSales(data || []);
    } catch (e) {
      console.error('Store sales fetch failed', e);
    }
  };

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
      
      let logoDataUrl: string | null = null;
      try {
        const resp = await fetch('https://i.ibb.co/Pvj8V4T7/Whats-App-Image-2026-02-26-at-2-40-25-PM.jpg');
        const blob = await resp.blob();
        logoDataUrl = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (_) {}
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

  const generateStoreInvoice = async (sale: any, mode: 'view' | 'download' = 'download') => {
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

      y = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(...NAVY);
      doc.text("THE BOY'S ZONE", margin, y);
      y += 7;
      doc.setFontSize(8.5);
      doc.setTextColor(...COGNAC);
      doc.text('MENSWEAR & ACCESSORIES STORE', margin, y, { charSpace: 1 });

      const metaX = W - margin - 45;
      doc.setFillColor(...BG);
      doc.roundedRect(metaX - 5, 12, 50, 25, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      doc.text('INVOICE NO.', metaX, 20);
      doc.text('DATE', metaX, 28);
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.text(`#BZ-ST-${sale.id.toUpperCase()}`, W - margin, 20, { align: 'right' });
      doc.text(`${formatDate(sale.date)}`, W - margin, 28, { align: 'right' });

      y = 55;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE);
      doc.text('CUSTOMER', margin, y);
      doc.text('STORE ADDRESS', W/2 + 10, y);
      y += 6;
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.text(sale.customer || 'Walk-in Customer', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE);
      doc.text('Near Ripusudan Petrol Pump, Suhela', W/2 + 10, y);
      doc.text('Baloda Bazar (C.G.) | +91 9617628157', W/2 + 10, y + 4.5);
      doc.text(`M: ${sale.mobile}`, margin, y + 5);

      y += 28;
      doc.setFillColor(...NAVY);
      doc.rect(margin, y, W - margin * 2, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const col = { item: margin + 3, cat: 95, qty: 135, unit: 160, total: W - margin - 3 };
      doc.text('ITEM DESCRIPTION', col.item, y + 6.5);
      doc.text('CATEGORY', col.cat, y + 6.5);
      doc.text('QTY', col.qty, y + 6.5, { align: 'center' });
      doc.text('PRICE', col.unit, y + 6.5, { align: 'right' });
      doc.text('TOTAL', col.total, y + 6.5, { align: 'right' });
      
      y += 15;
      const items = sale.items || [];
      items.forEach((item: any) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...NAVY);
        doc.text(item.productName || 'Store Item', col.item, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE);
        doc.text(item.category || '', col.cat, y);
        doc.text(String(item.quantity), col.qty, y, { align: 'center' });
        doc.text(`${Number(item.price).toFixed(2)}`, col.unit, y, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(`${Number(item.item_total).toFixed(2)}`, col.total, y, { align: 'right' });
        y += 4;
        doc.line(margin, y, W - margin, y);
        y += 9;
      });

      y += 5;
      const totalX = W - margin - 55;
      const currentSubtotal = Number(sale.amount) / (gstEnabled ? (1 + gstPercentage / 100) : 1);
      const currentTax = Number(sale.amount) - currentSubtotal;

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
      doc.text(`Rs.${Number(sale.amount).toFixed(2)}`, W - margin - 3, y + 2, { align: 'right' });

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
        doc.save(`Invoice_${sale.customer}.pdf`);
        toast.success('Invoice Saved', { id: 'invoice' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate invoice', { id: 'invoice' });
    }
  };

  // Extract available months for dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    orders.forEach(o => {
      const d = new Date(o.created_at || o.date || Date.now());
      if (!isNaN(d.getTime())) {
        months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
      }
    });
    return Array.from(months);
  }, [orders]);

  // Unified Sales List (Online Orders + Store Sales)
  const allSales = useMemo(() => {
    const unified = [
      ...orders.map(o => ({
        id: o.order_id,
        date: o.created_at || o.date,
        customer: o.profiles?.name || 'Customer',
        mobile: o.profiles?.phone || 'N/A',
        amount: o.total_amount,
        status: o.order_status,
        type: 'Online' as const,
        raw: o
      })),
      ...storeSales.map(s => ({
        id: s.id,
        date: s.created_at || Date.now(), // Fallback if missing
        customer: s.customer || 'Walk-in',
        mobile: s.mobile || 'N/A',
        amount: s.total,
        status: s.payment_method === 'Pending' ? 'Pending' : 'Delivered',
        type: 'Store' as const,
        pdf_url: s.pdf_url,
        items: s.items
      }))
    ];
    return unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, storeSales]);

  // Apply filters
  const filteredSales = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();

    return allSales.filter(s => {
      const saleDate = new Date(s.date);
      if (isNaN(saleDate.getTime())) return false;
      
      if (filterType === 'today') {
        return saleDate.toDateString() === todayStr;
      }
      
      if (filterType === 'month' && selectedMonth !== 'All') {
        const m = saleDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return m === selectedMonth;
      }

      if (filterType === 'range') {
        if (!startDate && !endDate) return true;
        const sTime = saleDate.getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() : Infinity;
        const endAdjusted = end !== Infinity ? end + (24 * 60 * 60 * 1000) - 1 : Infinity;
        return sTime >= start && sTime <= endAdjusted;
      }

      return true;
    });
  }, [allSales, filterType, selectedMonth, startDate, endDate]);

  // Online-only stats for the revenue cards
  const onlineRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => new Date(o.created_at || o.date).toDateString() === today)
      .reduce((sum, o) => sum + o.total_amount, 0);
  }, [orders]);

  const onlineOrdersCount = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.created_at || o.date).toDateString() === today).length;
  }, [orders]);


  // Payment breakdown from today's store (walk-in) sales
  const paymentBreakdown = useMemo(() => {
    const result: Record<string, number> = { Cash: 0, UPI: 0, Mixed: 0, Pending: 0 };
    storeSales.forEach(s => {
      const m = s.payment_method || 'Cash';
      result[m] = (result[m] || 0) + (s.total || 0);
    });
    return result;
  }, [storeSales]);

  const totalStoreSales = storeSales.reduce((sum, s) => sum + (s.total || 0), 0);

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
                 <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-1">Online Revenue Today</p>
                 <p className="text-3xl font-black text-emerald-900">{formatPrice(onlineRevenue)}</p>
               </div>
               <div className="p-4 bg-emerald-100/50 rounded-2xl">
                 <TrendingUp className="w-8 h-8 text-emerald-600" />
               </div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-indigo-800 uppercase tracking-widest mb-1">Online Orders Today</p>
                 <p className="text-3xl font-black text-indigo-900">{onlineOrdersCount}</p>
               </div>
               <div className="p-4 bg-indigo-100/50 rounded-2xl">
                 <Calendar className="w-8 h-8 text-indigo-600" />
               </div>
            </div>
         </div>

        {/* Store (Walk-in) Payment Breakdown — Today */}
        <div className="mt-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-3">💳 Today's Walk-in Sales — Payment Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Cash</span>
              </div>
              <p className="text-2xl font-black text-emerald-900">{formatPrice(paymentBreakdown.Cash)}</p>
              <p className="text-[11px] text-emerald-600 font-medium">{storeSales.filter(s => (s.payment_method || 'Cash') === 'Cash').length} bills</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">UPI</span>
              </div>
              <p className="text-2xl font-black text-blue-900">{formatPrice(paymentBreakdown.UPI)}</p>
              <p className="text-[11px] text-blue-600 font-medium">{storeSales.filter(s => s.payment_method === 'UPI').length} bills</p>
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-violet-700">
                <Shuffle className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Mixed</span>
              </div>
              <p className="text-2xl font-black text-violet-900">{formatPrice(paymentBreakdown.Mixed)}</p>
              <p className="text-[11px] text-violet-600 font-medium">{storeSales.filter(s => s.payment_method === 'Mixed').length} bills</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-2xl font-black text-amber-900">{formatPrice(paymentBreakdown.Pending)}</p>
              <p className="text-[11px] text-amber-600 font-medium">{storeSales.filter(s => s.payment_method === 'Pending').length} bills</p>
            </div>
          </div>
          <div className="mt-3 px-4 py-3 bg-black/5 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold text-black/60">Total Walk-in Revenue Today</span>
            <span className="text-lg font-black text-black">{formatPrice(totalStoreSales)}</span>
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
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-black/5">
                {filteredSales.length > 0 ? filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-black/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-900">#{sale.id.substring(0,8)}</span>
                        <span className={`w-fit mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${sale.type === 'Online' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {sale.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {formatDate(sale.date)} <br/>
                      <span className="text-slate-300 font-normal">{new Date(sale.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-sm text-slate-900 leading-none mb-1">{sale.customer}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider">{sale.mobile}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">{formatPrice(sale.amount)}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border
                        ${sale.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          sale.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 
                          sale.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'}
                       `}>
                          {sale.status}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {sale.type === 'Online' ? (
                          <>
                            <button
                              onClick={() => generateInvoice(sale.raw, 'view')}
                              className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                              title="View Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => generateInvoice(sale.raw, 'download')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => generateStoreInvoice(sale, 'view')}
                              className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                              title="View Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => generateStoreInvoice(sale, 'download')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
                      No sales records found for this period
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
