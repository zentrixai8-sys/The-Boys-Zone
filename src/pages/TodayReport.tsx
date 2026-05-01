import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { Loader2, Calendar, TrendingUp, Search, Banknote, Smartphone, Shuffle, Clock, Download, Printer, Trash2, Edit, X, Save, Eye, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

/* ─── 3D Tilt Card ──────────────────────────────────────────── */
const Card3D = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setRot({ x: ((r.height / 2 - y) / r.height) * 15, y: ((x - r.width / 2) / r.width) * 15 });
    setGlare({ x: (x / r.width) * 100, y: (y / r.height) * 100 });
  }, []);

  return (
    <div style={{ perspective: '900px' }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setRot({ x: 0, y: 0 }); }}
        animate={{ rotateX: rot.x, rotateY: rot.y, scale: hovering ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
        className={className}
      >
        {children}
        {/* Glare highlight */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovering ? 1 : 0,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.22) 0%, transparent 65%)`,
          }}
        />
      </motion.div>
    </div>
  );
};
/* ──────────────────────────────────────────────────────────── */


export const TodayReport = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSales, setStoreSales] = useState<{ id: string, total: number, payment_method: string, pdf_url?: string, customer?: string, mobile?: string, created_at?: string, items?: any[] }[]>([]);
  
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editForm, setEditForm] = useState({ customer: '', mobile: '', payment_method: 'Cash' });

  const handleDeleteSale = async (id: string, type: 'Store' | 'Online') => {
    if (type !== 'Store') return;
    if (!confirm('Are you sure you want to delete this bill? This cannot be undone.')) return;
    try {
      await api.request('deleteStoreSale', { invoice_id: id });
      toast.success('Bill deleted successfully');
      fetchStoreSales();
    } catch (e) {
      toast.error('Failed to delete bill');
    }
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      await api.request('updateStoreSale', {
        invoice_id: editingSale.id,
        customer_name: editForm.customer,
        customer_mobile: editForm.mobile,
        payment_method: editForm.payment_method
      });
      toast.success('Bill updated successfully');
      setEditingSale(null);
      fetchStoreSales();
    } catch (err) {
      toast.error('Failed to update bill');
    }
  };
  
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
        // On mobile browsers, window.open with a blob URL often fails or shows a blank screen
        // Better to save directly on mobile.
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          doc.save(`Invoice_${order.profiles?.name || 'Customer'}.pdf`);
          toast.success('Invoice Downloaded', { id: 'invoice' });
        } else {
          window.open(doc.output('bloburl'), '_blank');
          toast.success('Preview Opened', { id: 'invoice' });
        }
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
      doc.text(`#BZ-ST-${String(sale.id).toUpperCase().substring(0, 10)}`, W - margin, 20, { align: 'right' });
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
      if (sale.mobile) doc.text(`M: ${sale.mobile}`, margin, y + 5);

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
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          doc.save(`Invoice_${sale.customer || 'Customer'}.pdf`);
          toast.success('Invoice Downloaded', { id: 'invoice' });
        } else {
          window.open(doc.output('bloburl'), '_blank');
          toast.success('Preview Opened', { id: 'invoice' });
        }
      } else {
        doc.save(`Invoice_${sale.customer || 'Customer'}.pdf`);
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
        items: s.items,
        payment_method: s.payment_method
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
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-black mb-2">Reports</h1>
        <p className="text-xs md:text-base text-black/40">Analyze sales and monitor daily performance</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md mb-8"
      >
        {/* Filter Tabs */}
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
                className="w-full md:w-48 px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black"
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
                  className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black"
                />
                <span className="text-black/40 font-bold">to</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black"
                />
              </div>
            )}
          </div>
        </div>

        {/* Premium Summary Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6"
          variants={{ show: { transition: { staggerChildren: 0.15 } } }}
          initial="hidden"
          animate="show"
        >
          {[
            {
              label: 'Online Revenue Today',
              value: formatPrice(onlineRevenue),
              icon: TrendingUp,
              bg: 'from-[#040d10] via-[#0a1a20] to-[#0f2430]',
              border: 'border-teal-900/60',
              glow: 'shadow-teal-950/70',
              textColor: 'text-white',
              subtextColor: 'text-teal-300',
              iconBg: 'from-teal-400/30 to-cyan-500/20',
              x: 0,
            },
            {
              label: 'Online Orders Today',
              value: String(onlineOrdersCount),
              icon: Calendar,
              bg: 'from-[#080812] via-[#0c1228] to-[#0a1845]',
              border: 'border-indigo-900/60',
              glow: 'shadow-indigo-950/70',
              textColor: 'text-white',
              subtextColor: 'text-indigo-300',
              iconBg: 'from-indigo-400/30 to-violet-500/20',
              x: 0,
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={{
                hidden: { opacity: 0, y: 50, x: card.x, scale: 0.92 },
                show:   { opacity: 1, y: 0,  x: 0,      scale: 1,
                  transition: { type: 'spring', stiffness: 200, damping: 20 }
                }
              }}
            >
              <Card3D
                className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-6 flex items-center justify-between shadow-xl ${card.glow} cursor-default relative overflow-hidden`}
              >
                {/* Subtle shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                <div>
                  <p className={`text-[10px] font-bold ${card.subtextColor} uppercase tracking-[0.2em] mb-2`}>{card.label}</p>
                  <motion.p
                    key={card.value}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className={`text-3xl font-black ${card.textColor} drop-shadow-sm`}
                  >
                    {card.value}
                  </motion.p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.iconBg} backdrop-blur-sm border border-white/10 shadow-inner`}>
                  <card.icon className="w-8 h-8 text-white drop-shadow" />
                </div>
              </Card3D>
            </motion.div>
          ))}
        </motion.div>

        {/* Payment Breakdown */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-4">💳 Today's Walk-in Sales — Payment Breakdown</h3>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="show"
          >
            {[
              { label: 'Cash',    icon: Banknote,   method: 'Cash',    bg: 'from-[#052e1c] to-[#0a4f2e]', border: 'border-emerald-900/50', sub: 'text-emerald-300', iconBg: 'bg-white/10' },
              { label: 'UPI',     icon: Smartphone, method: 'UPI',     bg: 'from-[#0d1545] to-[#1a2570]', border: 'border-indigo-900/50',  sub: 'text-indigo-300',  iconBg: 'bg-white/10' },
              { label: 'Mixed',   icon: Shuffle,    method: 'Mixed',   bg: 'from-[#3a0550] to-[#6b0f35]', border: 'border-pink-900/50',    sub: 'text-pink-300',    iconBg: 'bg-white/10' },
              { label: 'Pending', icon: Clock,      method: 'Pending', bg: 'from-[#3d2000] to-[#5c3000]', border: 'border-amber-900/50',   sub: 'text-amber-300',   iconBg: 'bg-white/10' },
            ].map((pm) => {
              const amount = paymentBreakdown[pm.method] || 0;
              const count = storeSales.filter(s => (s.payment_method || 'Cash') === pm.method).length;
              return (
                <motion.div
                  key={pm.label}
                  variants={{
                    hidden: { opacity: 0, y: 40, scale: 0.88 },
                    show:   { opacity: 1, y: 0,  scale: 1,
                      transition: { type: 'spring', stiffness: 220, damping: 18 }
                    }
                  }}
                >
                  <Card3D
                    className={`bg-gradient-to-br ${pm.bg} border ${pm.border} rounded-2xl p-4 flex flex-col gap-3 cursor-default relative overflow-hidden h-full`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${pm.iconBg} border border-white/10`}>
                        <pm.icon className="w-4 h-4 text-white drop-shadow" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${pm.sub}`}>{pm.label}</span>
                    </div>
                    <div>
                      <p className={`text-xl font-black text-white drop-shadow`}>{formatPrice(amount)}</p>
                      <p className={`text-[10px] ${pm.sub} font-semibold mt-0.5 opacity-80`}>{count} bill{count !== 1 ? 's' : ''}</p>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 180, damping: 18 }}
            className="mt-4 px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl flex justify-between items-center border border-slate-700/50 shadow-lg"
          >
            <span className="text-sm font-bold text-slate-300">Total Walk-in Revenue Today</span>
            <span className="text-xl font-black text-white">{formatPrice(totalStoreSales)}</span>
          </motion.div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
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
                  {filteredSales.map((sale) => (
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
                        <span className="text-[9px] opacity-60">{new Date(sale.date).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 leading-none mb-1">{sale.customer}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sale.mobile}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">{formatPrice(sale.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                          sale.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          sale.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => sale.type === 'Online' ? generateInvoice(sale.raw, 'view') : generateStoreInvoice(sale, 'view')}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => sale.type === 'Online' ? generateInvoice(sale.raw, 'download') : generateStoreInvoice(sale, 'download')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {sale.type === 'Store' && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingSale(sale);
                                  setEditForm({ customer: sale.customer, mobile: sale.mobile, payment_method: sale.payment_method || 'Cash' });
                                }}
                                className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors border border-amber-100 shadow-sm"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSale(sale.id, sale.type)}
                                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100 shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredSales.map((sale) => (
              <div 
                key={sale.id}
                className="bg-white p-5 rounded-[2rem] border-2 border-slate-200 border-b-[6px] md:border-b-[8px] border-b-slate-300 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">#{sale.id.substring(0,8)}</span>
                    <span className={`w-fit mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${sale.type === 'Online' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                      {sale.type}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${
                    sale.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 
                    sale.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {sale.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200">
                    <Users className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate leading-none mb-1">{sale.customer}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{sale.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{formatPrice(sale.amount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3 inline-block mr-1 mb-0.5" />
                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => sale.type === 'Online' ? generateInvoice(sale.raw, 'view') : generateStoreInvoice(sale, 'view')}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 active:scale-95 transition-transform"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => sale.type === 'Online' ? generateInvoice(sale.raw, 'download') : generateStoreInvoice(sale, 'download')}
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 active:scale-95 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {sale.type === 'Store' && (
                      <button 
                        onClick={() => {
                          setEditingSale(sale);
                          setEditForm({ customer: sale.customer, mobile: sale.mobile, payment_method: sale.payment_method || 'Cash' });
                        }}
                        className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 active:scale-95 transition-transform"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {sale.type === 'Store' && (
                      <button 
                        onClick={() => handleDeleteSale(sale.id, sale.type)}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
              <Search className="w-16 h-16 text-black/5 mx-auto mb-4" />
              <p className="text-black/40 font-black uppercase tracking-widest text-sm">No sales found for this period</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setEditingSale(null)} className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 text-slate-800">Edit Bill Details</h3>
            <form onSubmit={handleUpdateSale} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Customer Name</label>
                <input required type="text" value={editForm.customer} onChange={(e) => setEditForm({...editForm, customer: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Mobile</label>
                <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Payment Method</label>
                <select value={editForm.payment_method} onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black">
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <button type="submit" className="mt-4 bg-black text-white rounded-xl py-3.5 font-bold hover:bg-black/90 flex justify-center items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
