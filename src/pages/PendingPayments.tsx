import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { formatPrice, formatDate } from '../lib/utils';
import {
  Loader2, CheckCircle, Trash2, Phone,
  IndianRupee, AlertCircle, RefreshCw, Upload, Wallet,
  ChevronDown, ChevronUp, History, Calendar, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentLog {
  id: string;
  pending_payment_id: string;
  customer_name: string;
  amount_paid: number;
  payment_method: string;
  note: string;
  proof_url?: string;
  paid_at: string;
}

interface PendingPayment {
  id: string;
  invoice_id: string;
  customer_name: string;
  customer_mobile: string;
  total_amount: number;
  items_summary: string;
  status: 'pending' | 'paid';
  paid_at?: string;
  paid_method?: string;
  amount_received?: number;
  proof_url?: string;
  created_at: string;
}

export const PendingPayments = () => {
  const [records, setRecords] = useState<PendingPayment[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending');
  const [dateRange, setDateRange] = useState<'today' | 'month' | 'all' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Modal state
  const [showMarkModal, setShowMarkModal] = useState<PendingPayment | null>(null);
  const [paidMethod, setPaidMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, logs] = await Promise.all([
        api.request('getPendingPayments'),
        api.request('getAllPaymentLogs').catch(() => []),
      ]);
      setRecords(data || []);
      setPaymentLogs(logs || []);
    } catch (e) {
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const isWithinRange = (dateStr: string) => {
    if (dateRange === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (dateRange === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (dateRange === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const d = date.getTime();
      
      let start = 0;
      if (customStartDate) {
        const s = new Date(customStartDate);
        s.setHours(0, 0, 0, 0);
        start = s.getTime();
      }
      
      let end = Infinity;
      if (customEndDate) {
        const e = new Date(customEndDate);
        e.setHours(23, 59, 59, 999);
        end = e.getTime();
      }
      
      return d >= start && d <= end;
    }
    return true;
  };

  const openModal = (record: PendingPayment) => {
    setShowMarkModal(record);
    setPaidMethod('Cash');
    setAmountReceived(String(record.total_amount));
    setProofFile(null);
    setProofPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleMarkPaid = async () => {
    if (!showMarkModal) return;
    const received = parseFloat(amountReceived) || 0;
    if (received <= 0) { toast.error('Enter a valid amount'); return; }

    const isFullPayment = received >= showMarkModal.total_amount;
    const remaining = showMarkModal.total_amount - received;

    setMarkingId(showMarkModal.id);
    setIsUploading(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        proofUrl = await api.request('uploadFile', { file: proofFile });
      }

      if (isFullPayment) {
        await api.request('markPendingPaid', {
          id: showMarkModal.id,
          customer_name: showMarkModal.customer_name,
          paid_method: paidMethod,
          amount_received: received,
          proof_url: proofUrl,
        });
        const newLog: PaymentLog = {
          id: Math.random().toString(),
          pending_payment_id: showMarkModal.id,
          customer_name: showMarkModal.customer_name,
          amount_paid: received,
          payment_method: paidMethod,
          note: 'Full payment received',
          proof_url: proofUrl || undefined,
          paid_at: new Date().toISOString(),
        };
        setPaymentLogs(prev => [newLog, ...prev]);
        setRecords(prev => prev.map(r => r.id === showMarkModal.id
          ? { ...r, status: 'paid', paid_at: new Date().toISOString(), paid_method: paidMethod, amount_received: received, proof_url: proofUrl || undefined }
          : r
        ));
        toast.success(`✅ Full payment of ${formatPrice(received)} received!`);
      } else {
        await api.request('recordPartialPayment', {
          id: showMarkModal.id,
          customer_name: showMarkModal.customer_name,
          paid_method: paidMethod,
          amount_received: received,
          remaining_amount: remaining,
          proof_url: proofUrl,
        });
        const newLog: PaymentLog = {
          id: Math.random().toString(),
          pending_payment_id: showMarkModal.id,
          customer_name: showMarkModal.customer_name,
          amount_paid: received,
          payment_method: paidMethod,
          note: `Partial payment. Remaining: ₹${remaining.toFixed(2)}`,
          proof_url: proofUrl || undefined,
          paid_at: new Date().toISOString(),
        };
        setPaymentLogs(prev => [newLog, ...prev]);
        setRecords(prev => prev.map(r => r.id === showMarkModal.id
          ? { ...r, total_amount: remaining, items_summary: `${r.items_summary} [Partial: ₹${received} paid via ${paidMethod}]` }
          : r
        ));
        toast(`⚠️ ₹${received} received. ₹${remaining.toFixed(2)} still pending`, { duration: 5000 });
      }

      setShowMarkModal(null);
    } catch (e) {
      toast.error('Failed to record payment');
    } finally {
      setMarkingId(null);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.request('deletePendingPayment', { id });
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Record deleted');
    } catch (e: any) {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    const matchesDate = isWithinRange(r.created_at);
    const matchesSearch = r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.customer_mobile.includes(searchQuery);
    return matchesFilter && matchesDate && matchesSearch;
  });

  const filteredLogs = paymentLogs.filter(l => {
    const matchesDate = isWithinRange(l.paid_at);
    const matchesSearch = l.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const totalPending = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.total_amount, 0);
  const totalCollected = paymentLogs.reduce((s, l) => s + (l.amount_paid || 0), 0);
  
  const modeColors: Record<string, string> = {
    Cash: 'bg-emerald-500 text-white border-emerald-500',
    UPI:  'bg-blue-500 text-white border-blue-500',
    Card: 'bg-indigo-500 text-white border-indigo-500',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black mb-1">Payment Follow-up</h1>
          <p className="text-black/40 text-sm font-medium tracking-wide">Premium collection dashboard for The Boys Zone</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
            <input 
              type="text"
              placeholder="Search customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-black/5 border-0 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-black/10 transition-all w-56"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-black/5 hover:bg-black/10 rounded-2xl transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>


      {/* 3D Premium Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="group relative overflow-hidden bg-white border-2 border-amber-100 border-b-4 border-b-amber-500 rounded-[2rem] p-6 shadow-[0_10px_30px_-10px_rgba(251,191,36,0.3)] hover:shadow-[0_20px_50px_-12px_rgba(251,191,36,0.4)] hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-1">Pending Dues</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(totalPending)}</h3>
              <p className="text-amber-500/60 text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                <AlertCircle className="w-3 h-3" /> {records.filter(r => r.status === 'pending').length} Unpaid bills
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-amber-100">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white border-2 border-emerald-100 border-b-4 border-b-emerald-500 rounded-[2rem] p-6 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.4)] hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Total Collected</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(totalCollected)}</h3>
              <p className="text-emerald-500/60 text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle className="w-3 h-3" /> {paymentLogs.length} Transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-emerald-100">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white border-2 border-slate-200 border-b-4 border-b-slate-600 rounded-[2rem] p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Total Invoices</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{records.length}</h3>
              <p className="text-slate-400 text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                <History className="w-3 h-3" /> All-time records
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200">
              <Search className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>



      {/* Filter Tabs and Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex gap-2 p-2 bg-black/[0.04] backdrop-blur-md rounded-2xl w-fit border-2 border-black/[0.03]">
          {(['pending', 'paid', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-7 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all ${
                filter === f ? 'bg-white text-black shadow-lg shadow-black/10 ring-2 ring-black/5' : 'text-black/40 hover:text-black'
              }`}
            >
              {f === 'pending' ? '⏳ Pending' : f === 'paid' ? '✅ Collected' : '📋 All'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-black/40 mr-1" />
            <div className="flex gap-1.5 p-1.5 bg-black/[0.04] rounded-xl border-2 border-black/[0.03]">
              {(['today', 'month', 'all', 'custom'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    dateRange === r ? 'bg-black text-white shadow-lg' : 'text-black/40 hover:text-black'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 p-2 bg-black/5 rounded-xl border-2 border-black/5 animate-in fade-in slide-in-from-top-2">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-black text-slate-700 outline-none border border-black/5"
              />
              <span className="text-black/30 font-black text-[10px]">-</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-black text-slate-700 outline-none border border-black/5"
              />
            </div>
          )}
        </div>
      </div>


      {/* Main List - Responsive Table/Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-black/10" />
          <p className="text-black/20 font-black tracking-widest text-xs uppercase">Loading premium dashboard...</p>
        </div>
      ) : (filter === 'paid' ? filteredLogs : filteredRecords).length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-black/5 py-32 text-center shadow-sm">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-black/5" />
          <h4 className="text-xl font-black text-black/20 uppercase tracking-widest">No matching records</h4>
          <p className="text-black/10 text-xs font-bold mt-2 uppercase tracking-wider">Try adjusting filters or searching</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-[3rem] border-2 border-black/[0.08] shadow-2xl shadow-black/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-black/[0.02] border-b-2 border-black/[0.08]">
                  <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-black/40">Customer</th>
                  <th className="text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-black/40">Date</th>
                  <th className="text-right px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-black/40">Amount</th>
                  <th className="text-center px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-black/40">Details</th>
                  <th className="text-right px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-black/40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/[0.05]">
                {filter === 'paid' ? (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="group hover:bg-black/[0.01] transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-base">
                            {(log.customer_name || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base leading-none mb-1">{log.customer_name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{log.note || 'Payment Received'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-600">
                        {formatDate(log.paid_at)}
                        <p className="text-[9px] text-slate-300 font-black uppercase mt-0.5">
                          {new Date(log.paid_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-xl font-black text-emerald-600 tracking-tight">{formatPrice(log.amount_paid)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-sm ${
                            log.payment_method === 'Cash' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                            log.payment_method === 'UPI' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'
                          }`}>
                            {log.payment_method === 'Cash' ? '💵' : log.payment_method === 'UPI' ? '📱' : '💳'} {log.payment_method}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {log.proof_url && (
                          <a href={log.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex p-2.5 bg-black/5 text-black/30 rounded-xl hover:bg-black/10 transition-all">
                            <Upload className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredRecords.map(record => (
                    <React.Fragment key={record.id}>
                      <tr className={`group hover:bg-black/[0.01] transition-colors ${record.status === 'paid' ? 'opacity-60' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                              record.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {(record.customer_name || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base leading-none mb-1.5">{record.customer_name}</p>
                              <div className="flex items-center gap-2.5">
                                {record.customer_mobile !== 'N/A' && (
                                  <a href={`tel:${record.customer_mobile}`} className="flex items-center gap-1 text-black/30 text-[9px] font-black hover:text-black transition-colors uppercase tracking-widest">
                                    <Phone className="w-2 h-2" /> {record.customer_mobile}
                                  </a>
                                )}
                                <span className="text-[9px] text-black/20 font-black uppercase tracking-widest truncate max-w-[120px]">{record.items_summary}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-600">
                          {formatDate(record.created_at)}
                          {record.status === 'pending' && (
                            <p className="text-[9px] text-amber-500 font-black uppercase tracking-wider mt-0.5">
                              {Math.floor((Date.now() - new Date(record.created_at).getTime()) / 86400000)} Days Overdue
                            </p>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className={`text-xl font-black tracking-tight ${record.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatPrice(record.total_amount)}
                          </p>
                          {record.amount_received ? (
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Collected: {formatPrice(record.amount_received)}</p>
                          ) : null}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            {record.status === 'pending' ? (
                              <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-sm shadow-amber-100 flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                                Pending
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-sm shadow-emerald-100">
                                ✅ Paid
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {record.status === 'pending' && (
                              <button onClick={() => openModal(record)} className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-black/80 active:scale-95 transition-all shadow-xl shadow-black/10">Collect</button>
                            )}
                            <button onClick={() => setExpandedLogId(expandedLogId === record.id ? null : record.id)} className={`p-2.5 rounded-xl transition-all ${expandedLogId === record.id ? 'bg-black text-white' : 'bg-black/5 text-black/20 hover:bg-black/10 hover:text-black'}`}>
                              <History className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              {confirmDeleteId === record.id ? (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-red-100 p-1 rounded-xl shadow-2xl z-10 whitespace-nowrap">
                                  <span className="text-[9px] font-black uppercase text-red-500 ml-1.5">Delete?</span>
                                  <button onClick={() => handleDelete(record.id)} className="px-2.5 py-1 bg-red-500 text-white text-[9px] font-black rounded-lg">Yes</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(record.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all active:scale-95">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {expandedLogId === record.id && (
                        <tr className="bg-black/[0.01]">
                          <td colSpan={5} className="px-10 py-6">
                            <div className="bg-white border border-black/5 rounded-[2rem] p-6 space-y-4">
                              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 mb-2 px-2 flex items-center gap-2">
                                <History className="w-4 h-4" /> Transaction History
                              </h5>
                              {paymentLogs.filter(l => l.pending_payment_id === record.id).length === 0 ? (
                                <p className="text-center py-6 text-[10px] text-black/20 font-black uppercase tracking-widest italic">No payments recorded yet</p>
                              ) : (
                                paymentLogs.filter(l => l.pending_payment_id === record.id).map(log => (
                                  <div key={log.id} className="flex items-center justify-between p-4 bg-black/[0.01] rounded-3xl border border-black/[0.02]">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-inner ${
                                        log.payment_method === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                                        log.payment_method === 'UPI' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                                      }`}>
                                        {log.payment_method === 'Cash' ? '💵' : log.payment_method === 'UPI' ? '📱' : '💳'}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-slate-900">{formatPrice(log.amount_paid)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.payment_method} · {formatDate(log.paid_at)}</p>
                                      </div>
                                    </div>
                                    {log.proof_url && (
                                      <a href={log.proof_url} target="_blank" rel="noopener noreferrer" className="p-3 text-black/20 hover:text-black transition-colors">
                                        <Upload className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-based List */}
          <div className="md:hidden space-y-4 px-2 pb-24">
            {(filter === 'paid' ? filteredLogs : filteredRecords).map((item: any) => {
              const isLog = filter === 'paid';
              const status = isLog ? null : (item.status === 'pending' ? { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' } : { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' });
              
              return (
                <div key={item.id} className="bg-white rounded-[2rem] border border-black/5 shadow-lg overflow-hidden transition-all active:scale-[0.98]">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${isLog ? 'bg-emerald-100 text-emerald-700' : (item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}`}>
                          {(item.customer_name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-base leading-tight mb-1 truncate max-w-[140px]">{item.customer_name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {formatDate(isLog ? item.paid_at : item.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black tracking-tighter ${isLog ? 'text-emerald-600' : (item.status === 'pending' ? 'text-amber-600' : 'text-emerald-600')}`}>
                          {formatPrice(isLog ? item.amount_paid : item.total_amount)}
                        </p>
                        {!isLog && item.status === 'pending' && (
                           <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                             {Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000)}d Overdue
                           </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 mb-4">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Details</p>
                       <p className="text-xs font-bold text-slate-700 leading-relaxed truncate">
                         {isLog ? (item.note || 'Regular payment received') : (item.items_summary || 'Manual entry')}
                       </p>
                    </div>

                    <div className="flex items-center gap-2">
                       {!isLog && item.status === 'pending' ? (
                         <>
                           <button onClick={() => openModal(item)} className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:bg-black">
                             Collect
                           </button>
                           {item.customer_mobile !== 'N/A' && (
                             <a href={`tel:${item.customer_mobile}`} className="p-3.5 bg-emerald-100 text-emerald-600 rounded-xl active:bg-emerald-200">
                               <Phone className="w-4 h-4" />
                             </a>
                           )}
                         </>
                       ) : (
                         <div className="flex-1 py-3 bg-emerald-50 rounded-xl text-center">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                              {isLog ? `💰 ${item.payment_method}` : '✅ Fully Paid'}
                            </span>
                         </div>
                       )}
                       
                       <button 
                         onClick={() => setExpandedLogId(expandedLogId === item.id ? null : item.id)}
                         className={`p-3.5 rounded-xl border transition-all ${expandedLogId === item.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                       >
                         <History className="w-4 h-4" />
                       </button>

                       {!isLog && (
                          <button onClick={() => setConfirmDeleteId(item.id)} className="p-3.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       )}
                    </div>

                    {/* Mobile History Expanded */}
                    <AnimatePresence>
                      {expandedLogId === item.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Logs</p>
                            {paymentLogs.filter(l => l.pending_payment_id === item.id).length === 0 ? (
                              <p className="text-[10px] font-bold text-slate-300 py-2 italic">No history found</p>
                            ) : (
                              paymentLogs.filter(l => l.pending_payment_id === item.id).map(log => (
                                <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <div>
                                    <p className="text-xs font-black text-slate-800">{formatPrice(log.amount_paid)}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{log.payment_method} · {formatDate(log.paid_at)}</p>
                                  </div>
                                  {log.proof_url && <Upload className="w-3 h-3 text-slate-300" />}
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {confirmDeleteId === item.id && (
                    <div className="bg-rose-600 p-4 flex items-center justify-between">
                       <span className="text-white text-[10px] font-black uppercase tracking-widest">Confirm permanent delete?</span>
                       <div className="flex gap-2">
                          <button onClick={() => handleDelete(item.id)} className="px-4 py-1.5 bg-white text-rose-600 rounded-lg text-[10px] font-black uppercase">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-1.5 bg-black/20 text-white rounded-lg text-[10px] font-black uppercase">No</button>
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Premium Record Payment Modal ─── */}
      {showMarkModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowMarkModal(null)}
        >
          <div
            className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-10 pt-10 pb-8 bg-black text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <button onClick={() => setShowMarkModal(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                  <ChevronDown className="w-7 h-7" />
                </button>
              </div>
              <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Collect Payment</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{showMarkModal.customer_name}</p>
            </div>

            <div className="p-10 space-y-8">
              {/* Amount Received Input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 block mb-4">Amount Received</label>
                <div className="flex items-center gap-4 bg-black/5 rounded-[2rem] px-7 py-6 focus-within:ring-4 focus-within:ring-black/5 transition-all">
                  <span className="text-black/20 font-black text-3xl">₹</span>
                  <input
                    type="number"
                    autoFocus
                    value={amountReceived}
                    onChange={e => setAmountReceived(e.target.value)}
                    placeholder={String(showMarkModal.total_amount)}
                    className="flex-1 bg-transparent text-black font-black text-4xl focus:outline-none placeholder:text-black/5"
                  />
                </div>
                {parseFloat(amountReceived) < showMarkModal.total_amount && parseFloat(amountReceived) > 0 && (
                  <p className="text-[11px] text-amber-600 font-black mt-4 flex items-center gap-2 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" /> Remaining: {formatPrice(showMarkModal.total_amount - parseFloat(amountReceived))}
                  </p>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 block mb-4">Payment Method</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['Cash', 'UPI', 'Card'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaidMethod(m)}
                      className={`flex flex-col items-center gap-3 py-6 rounded-3xl border-2 transition-all duration-300 ${
                        paidMethod === m 
                          ? 'border-black bg-black text-white shadow-2xl shadow-black/20 scale-105' 
                          : 'border-black/5 text-black/20 hover:border-black/20 hover:text-black'
                      }`}
                    >
                      <span className="text-2xl">{m === 'Cash' ? '💵' : m === 'UPI' ? '📱' : '💳'}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleMarkPaid}
                  disabled={markingId !== null || !amountReceived}
                  className="w-full py-5 bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] hover:bg-black/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-black/20 flex items-center justify-center gap-3"
                >
                  {isUploading || markingId ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>Confirm Payment</>
                  )}
                </button>
                <button
                  onClick={() => setShowMarkModal(null)}
                  className="w-full py-4 text-black/30 font-black text-[10px] uppercase tracking-[0.2em] hover:text-black transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
