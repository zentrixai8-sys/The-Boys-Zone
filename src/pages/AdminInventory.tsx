import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { Search, Loader2, Package, AlertTriangle, CheckCircle, XCircle, RefreshCw, BarChart3, History, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Stock Log Types ─────────────────────────────────────────── */
export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  addedQty: number;
  previousStock: number;
  newStock: number;
  timestamp: string;
  note?: string;
}

const STOCK_LOG_KEY = 'tbz_stock_in_logs';

const getStockLogs = (): StockLog[] => {
  try { return JSON.parse(localStorage.getItem(STOCK_LOG_KEY) || '[]'); } catch { return []; }
};

const addStockLog = (log: Omit<StockLog, 'id'>) => {
  const logs = getStockLogs();
  const newLog: StockLog = { ...log, id: Date.now().toString() };
  localStorage.setItem(STOCK_LOG_KEY, JSON.stringify([newLog, ...logs]));
};

/* ─── 3D Tilt Card ──────────────────────────────────────────── */
const Card3D = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const tiltRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltRef.current || window.innerWidth < 768) return;
    const r = tiltRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    setRot({ x: ((r.height / 2 - y) / r.height) * 12, y: ((x - r.width / 2) / r.width) * 12 });
    setGlare({ x: (x / r.width) * 100, y: (y / r.height) * 100 });
  }, []);
  return (
    <div style={{ perspective: '900px' }}>
      <motion.div ref={tiltRef} onMouseMove={onMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setRot({ x: 0, y: 0 }); }}
        animate={{ rotateX: rot.x, rotateY: rot.y, scale: hovering ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
        className={className}
      >
        {children}
        <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{ opacity: hovering ? 1 : 0, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)` }} />
      </motion.div>
    </div>
  );
};
/* ──────────────────────────────────────────────────────────── */

export const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'online' | 'store'>('all');
  const [viewMode, setViewMode] = useState<'store' | 'online'>('store');

  // "Add Stock" input per product
  const [addQtyMap, setAddQtyMap] = useState<Record<string, string>>({});
  const [selectedSizeMap, setSelectedSizeMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  // History modal
  const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.request('getProducts');
      setProducts(res.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (product: Product) => {
    const qty = parseInt(addQtyMap[product.product_id] || '0');
    if (!qty || qty <= 0) { toast.error('Please enter a valid quantity to add'); return; }

    const newStock = (product.stock || 0) + qty;
    setUpdatingId(product.product_id);
    try {
      const updateData: any = { product_id: product.product_id, stock: newStock };
      
      // Also update variants if they exist for consistency
      if (product.variants && product.variants.length > 0) {
        const v = JSON.parse(JSON.stringify(product.variants)); // Deep copy to avoid reference issues
        const selectedSize = selectedSizeMap[product.product_id];
        let sizeFound = false;

        // Try to find the specific size in any variant
        v.forEach((variant: any) => {
          if (variant.sizes) {
            const targetSize = variant.sizes.find((s: any) => 
              selectedSize ? String(s.size) === String(selectedSize) : true
            );
            
            if (targetSize && !sizeFound) {
              if (product.sale_type === 'Store') {
                targetSize.store_stock = (targetSize.store_stock || 0) + qty;
              } else {
                targetSize.online_stock = (targetSize.online_stock || 0) + qty;
              }
              targetSize.stock = (targetSize.store_stock || 0) + (targetSize.online_stock || 0);
              sizeFound = true;
            }
          }
        });

        // Fallback to first size if none specified or found
        if (!sizeFound && v[0].sizes && v[0].sizes.length > 0) {
          const s = v[0].sizes[0];
          if (product.sale_type === 'Store') {
            s.store_stock = (s.store_stock || 0) + qty;
          } else {
            s.online_stock = (s.online_stock || 0) + qty;
          }
          s.stock = (s.store_stock || 0) + (s.online_stock || 0);
        }
        
        updateData.variants = v;
      }

      await api.request('updateProduct', updateData);

      // Save log to localStorage
      addStockLog({
        productId: product.product_id,
        productName: product.title,
        addedQty: qty,
        previousStock: product.stock || 0,
        newStock,
        timestamp: new Date().toISOString(),
        note: noteMap[product.product_id] || '',
      });

      setProducts(prev => prev.map(p => p.product_id === product.product_id ? { ...p, stock: newStock } : p));
      setAddQtyMap(prev => ({ ...prev, [product.product_id]: '' }));
      setNoteMap(prev => ({ ...prev, [product.product_id]: '' }));
      toast.success(`✅ Stock updated: ${product.stock} → ${newStock} (+${qty})`);
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setUpdatingId(null);
    }
  };

  const openHistory = (product: Product) => {
    setHistoryProduct({ id: product.product_id, name: product.title });
    setStockLogs(getStockLogs().filter(l => l.productId === product.product_id));
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        activeFilter === 'all' ? true :
        activeFilter === 'in'  ? p.stock > 30 :
        activeFilter === 'low' ? p.stock > 0 && p.stock <= 30 :
        p.stock === 0;
      const matchesCat = categoryFilter === 'All' || p.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSub = subCategoryFilter === 'All' || p.sub_category?.toLowerCase() === subCategoryFilter.toLowerCase();
      
      const isStoreProduct = p.sale_type === 'Store';
      
      const matchesSource = 
        sourceFilter === 'all' ? true :
        sourceFilter === 'online' ? !isStoreProduct :
        isStoreProduct;
      return matchesSearch && matchesFilter && matchesCat && matchesSub && matchesSource;
    });
  }, [products, search, activeFilter, categoryFilter, subCategoryFilter, viewMode, sourceFilter]);

  // Derived filter options
  const allCategories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const allSubCategories = useMemo(() => {
    const base = products.filter(p => categoryFilter === 'All' || p.category === categoryFilter);
    return ['All', ...Array.from(new Set(base.map(p => p.sub_category).filter(Boolean)))];
  }, [products, categoryFilter]);

  const totalStock   = products.reduce((s, p) => s + (p.stock || 0), 0);
  const inStock      = products.filter(p => p.stock > 30).length;
  const lowStock     = products.filter(p => p.stock > 0 && p.stock <= 30).length;
  const outOfStock   = products.filter(p => p.stock === 0).length;

  const getStatus = (stock: number) => {
    if (stock > 30) return { label: 'In Stock',     color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400', bar: 'bg-emerald-500' };
    if (stock > 0)  return { label: 'Low Stock',    color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',     dot: 'bg-amber-400',   bar: 'bg-amber-500' };
    return             { label: 'Out of Stock', color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30',         dot: 'bg-red-500',     bar: 'bg-red-500' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-black mb-2">Inventory Management</h1>
        <p className="text-black/40 text-sm">Add stock (additive), view history & monitor levels in real-time</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden" animate="show"
      >
        {[
          { label: 'Total Stock',  value: totalStock, icon: BarChart3,     bg: 'from-[#040d10] via-[#0a1a20] to-[#0f2430]', border: 'border-teal-900/60',   sub: 'text-teal-300',    iconC: 'text-teal-400',    ring: 'ring-teal-500/60',    filter: 'all' as const },
          { label: 'In Stock',     value: inStock,    icon: CheckCircle,   bg: 'from-[#052e1c] to-[#0a4f2e]',               border: 'border-emerald-900/50', sub: 'text-emerald-300', iconC: 'text-emerald-400', ring: 'ring-emerald-500/60', filter: 'in'  as const },
          { label: 'Low Stock',    value: lowStock,   icon: AlertTriangle, bg: 'from-[#3d2000] to-[#5c3000]',               border: 'border-amber-900/50',   sub: 'text-amber-300',   iconC: 'text-amber-400',   ring: 'ring-amber-500/60',   filter: 'low' as const },
          { label: 'Out of Stock', value: outOfStock, icon: XCircle,       bg: 'from-[#2a0505] to-[#4a0a0a]',               border: 'border-red-900/50',     sub: 'text-red-300',     iconC: 'text-red-400',     ring: 'ring-red-500/60',     filter: 'out' as const },
        ].map((card) => (
          <motion.div key={card.label}
            onClick={() => setActiveFilter(prev => prev === card.filter ? 'all' : card.filter)}
            style={{ cursor: 'pointer' }}
            variants={{
              hidden: { opacity: 0, y: 30, scale: 0.9 },
              show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 220, damping: 18 } }
            }}
          >
            <Card3D className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-4 relative overflow-hidden shadow-lg transition-all duration-200 ${activeFilter === card.filter ? `ring-2 ${card.ring} shadow-2xl` : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <card.icon className={`w-4 h-4 ${card.iconC}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${card.sub}`}>{card.label}</span>
              </div>
              <p className="text-2xl font-black text-white drop-shadow">{card.value}</p>
            </Card3D>
          </motion.div>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden"
        >
          {/* Toolbar - Mobile Optimized */}
          <div className="p-4 md:p-6 flex flex-col gap-5 border-b border-slate-200 bg-slate-50/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Stock Levels</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{filtered.length} products • Additive Entry Mode</p>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search inventory..."
                    className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 w-full lg:w-64 text-sm font-bold shadow-sm outline-none transition-all"
                  />
                </div>
                <button onClick={fetchData} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all flex-shrink-0 shadow-sm active:scale-95">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Product Type Tabs */}
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit shrink-0">
                  <button
                    onClick={() => setSourceFilter('all')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sourceFilter === 'all' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSourceFilter('online')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sourceFilter === 'online' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}
                  >
                    Online
                  </button>
                  <button
                    onClick={() => setSourceFilter('store')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sourceFilter === 'store' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
                  >
                    Store
                  </button>
                </div>
              </div>

              {/* Dynamic Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
                <div className="flex flex-col gap-1.5">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Category</span>
                   <select 
                    value={categoryFilter}
                    onChange={e => { setCategoryFilter(e.target.value); setSubCategoryFilter('All'); }}
                    className="w-full md:w-48 px-4 py-2.5 bg-slate-100/50 text-[11px] font-black text-slate-700 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest appearance-none"
                  >
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Sub-Category</span>
                   <select
                    value={subCategoryFilter}
                    onChange={e => setSubCategoryFilter(e.target.value)}
                    className="w-full md:w-48 px-4 py-2.5 bg-slate-100/50 text-[11px] font-black text-slate-700 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest appearance-none"
                  >
                    {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Reset Controls */}
              <AnimatePresence>
                {(categoryFilter !== 'All' || subCategoryFilter !== 'All' || activeFilter !== 'all' || search !== '') && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => { setCategoryFilter('All'); setSubCategoryFilter('All'); setActiveFilter('all'); setSearch(''); }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-rose-100 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5" /> Reset Filters
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Table */}
          <div className="w-full">
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 border-b border-slate-200">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Add Stock (+)</th>
                    <th className="px-6 py-4">History</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((product, idx) => {
                      const status = getStatus(product.stock);
                      const barWidth = Math.min(100, (product.stock / 100) * 100);
                      return (
                        <motion.tr
                          key={product.product_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200">
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800 leading-tight max-w-[160px] truncate">{product.title}</p>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">#{product.product_id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 border border-slate-200">
                              {product.category || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 min-w-[80px]">
                              <span className={`text-lg font-black ${product.stock === 0 ? 'text-red-500' : product.stock <= 30 ? 'text-amber-500' : 'text-black'}`}>
                                {product.stock}
                              </span>
                              <div className="h-1.5 w-20 bg-black/8 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${status.bar}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.6, delay: idx * 0.03 + 0.2 }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${status.bg} ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  {/* Size Selector */}
                                  {product.variants && product.variants.length > 0 && (
                                    <select
                                      value={selectedSizeMap[product.product_id] || ''}
                                      onChange={e => setSelectedSizeMap(prev => ({ ...prev, [product.product_id]: e.target.value }))}
                                      className="px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-[10px] font-black focus:ring-2 focus:ring-black/20 focus:outline-none"
                                    >
                                      <option value="">Select Size</option>
                                      {Array.from(new Set(product.variants.flatMap(v => v.sizes?.map(s => String(s.size)) || []))).map(size => (
                                        <option key={size} value={size}>{size}</option>
                                      ))}
                                    </select>
                                  )}

                                  <span className="text-[11px] text-slate-400 font-bold">{product.stock} +</span>
                                  <input
                                    type="number" min="1"
                                    value={addQtyMap[product.product_id] || ''}
                                    onChange={e => setAddQtyMap(prev => ({ ...prev, [product.product_id]: e.target.value }))}
                                    placeholder="qty"
                                    className="w-16 px-2 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-black/20 focus:outline-none text-center shadow-sm"
                                  />
                                  {addQtyMap[product.product_id] && parseInt(addQtyMap[product.product_id]) > 0 && (
                                    <span className="text-[11px] text-emerald-600 font-black">
                                      = {product.stock + (parseInt(addQtyMap[product.product_id]) || 0)}
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={noteMap[product.product_id] || ''}
                                  onChange={e => setNoteMap(prev => ({ ...prev, [product.product_id]: e.target.value }))}
                                  placeholder="Note (optional)"
                                  className="w-full px-2 py-1 bg-white rounded-lg border border-slate-200 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-black/20"
                                />
                              </div>
                              <button
                                onClick={() => handleAddStock(product)}
                                disabled={updatingId === product.product_id || !addQtyMap[product.product_id] || (product.variants && product.variants.length > 0 && !selectedSizeMap[product.product_id])}
                                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-1 whitespace-nowrap"
                              >
                                {updatingId === product.product_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                {updatingId === product.product_id ? 'Saving…' : 'Add Stock'}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openHistory(product)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                              <History className="w-3.5 h-3.5" />
                              History
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100 px-4 pb-20">
              {filtered.map((product) => {
                const status = getStatus(product.stock);
                return (
                  <div key={product.product_id} className="py-6 space-y-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                          <button onClick={() => openHistory(product)} className="text-indigo-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                             <History className="w-3 h-3" /> History
                          </button>
                        </div>
                        <h3 className="font-black text-slate-800 text-sm truncate">{product.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                          <p className={`text-xl font-black ${product.stock === 0 ? 'text-red-500' : product.stock <= 30 ? 'text-amber-500' : 'text-slate-900'}`}>{product.stock}</p>
                       </div>
                       <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/50">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Update Status</p>
                          <p className="text-xs font-bold text-indigo-600">Additive Entry</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-200 space-y-3">
                       <div className="flex items-center gap-3">
                          <div className="flex-1">
                             <input 
                                type="number" min="1"
                                value={addQtyMap[product.product_id] || ''}
                                onChange={e => setAddQtyMap(prev => ({ ...prev, [product.product_id]: e.target.value }))}
                                placeholder="Enter Qty to ADD..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none shadow-sm"
                             />
                          </div>
                          <button
                            onClick={() => handleAddStock(product)}
                            disabled={updatingId === product.product_id || !addQtyMap[product.product_id]}
                            className="bg-slate-900 text-white p-3 rounded-xl disabled:opacity-40"
                          >
                             {updatingId === product.product_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                          </button>
                       </div>
                       <input
                          type="text"
                          value={noteMap[product.product_id] || ''}
                          onChange={e => setNoteMap(prev => ({ ...prev, [product.product_id]: e.target.value }))}
                          placeholder="Internal note (optional)"
                          className="w-full px-3 py-2 bg-transparent border-b border-slate-200 text-xs font-medium focus:border-black outline-none transition-colors"
                       />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stock History Modal */}
      <AnimatePresence>
        {historyProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setHistoryProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-[560px] max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-slate-900">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" />
                    Stock In History
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[340px]">{historyProduct.name}</p>
                </div>
                <button onClick={() => setHistoryProduct(null)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Logs */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {stockLogs.length === 0 ? (
                  <div className="py-16 text-center">
                    <History className="w-10 h-10 mx-auto mb-3 text-black/10" />
                    <p className="text-sm font-bold text-black/30">No stock-in records yet</p>
                    <p className="text-[11px] text-black/20 mt-1">Records will appear here once you add stock</p>
                  </div>
                ) : (
                  stockLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-4 p-4 bg-black/[0.02] rounded-2xl border border-black/5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-black">+{log.addedQty} units added</span>
                          <span className="text-[10px] font-bold text-black/30 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/40 mt-1">
                          Stock: <span className="font-bold text-red-400">{log.previousStock}</span>
                          <span className="mx-1 text-black/20">→</span>
                          <span className="font-bold text-emerald-500">{log.newStock}</span>
                        </p>
                        {log.note && (
                          <p className="text-[11px] text-indigo-500 font-medium mt-1 italic">📝 {log.note}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-black/5 flex justify-between items-center">
                <span className="text-[11px] text-black/30">{stockLogs.length} record{stockLogs.length !== 1 ? 's' : ''}</span>
                <button onClick={() => setHistoryProduct(null)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-black transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
