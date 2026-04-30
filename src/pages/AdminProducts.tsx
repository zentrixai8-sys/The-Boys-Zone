import React, { useEffect, useState, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { formatPrice } from '../lib/utils';
import {
  Plus, Edit2, Trash2, Loader2, X, DollarSign, Package, Save, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

/* ─── 3D Tilt Card ──────────────────────────────────────────── */
const Card3D = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const tiltRef = React.useRef<HTMLDivElement>(null);
  const [rot, setRot] = React.useState({ x: 0, y: 0 });
  const [glare, setGlare] = React.useState({ x: 50, y: 50 });
  const [hovering, setHovering] = React.useState(false);

  const onMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltRef.current) return;
    const r = tiltRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setRot({ x: ((r.height / 2 - y) / r.height) * 14, y: ((x - r.width / 2) / r.width) * 14 });
    setGlare({ x: (x / r.width) * 100, y: (y / r.height) * 100 });
  }, []);

  return (
    <div style={{ perspective: '900px' }}>
      <motion.div
        ref={tiltRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setRot({ x: 0, y: 0 }); }}
        animate={{ rotateX: rot.x, rotateY: rot.y, scale: hovering ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
        className={className}
      >
        {children}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovering ? 1 : 0,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.2) 0%, transparent 65%)`,
          }}
        />
      </motion.div>
    </div>
  );
};
/* ──────────────────────────────────────────────────────────── */

const subCategoryMap: Record<string, string[]> = {
  'Shirt': ['Casual', 'Formal', 'Denim', 'Checkered', 'Printed', 'Party Wear'],
  'Shirts': ['Casual', 'Formal', 'Denim', 'Checkered', 'Printed', 'Party Wear'],
  'T-Shirt': ['Round Neck', 'Polo', 'Oversized', 'Graphic', 'Full Sleeve'],
  'T-Shirts': ['Round Neck', 'Polo', 'Oversized', 'Graphic', 'Full Sleeve'],
  'Jeans': ['Skinny', 'Slim', 'Straight', 'Relaxed', 'Baggy', 'Distressed'],
  'Pant': ['Chinos', 'Formal', 'Cargo', 'Joggers', 'Cotton Pants'],
  'Pants': ['Chinos', 'Formal', 'Cargo', 'Joggers', 'Cotton Pants'],
  'Accessories': ['Belts', 'Wallets', 'Watches', 'Sunglasses', 'Perfumes', 'Caps', 'Undergarments', 'Socks', 'Bracelets', 'Key Rings'],
  'Footwear': ['Sneakers', 'Formal Shoes', 'Sandals', 'Loafers', 'Boots', 'Flip-Flops'],
  'Shoes': ['Sneakers', 'Formal Shoes', 'Sandals', 'Loafers', 'Boots', 'Flip-Flops'],
};

const categorySizes: Record<string, string[]> = {
  'Shirt': ['S', 'M', 'L', 'XL', 'XXL'],
  'Shirts': ['S', 'M', 'L', 'XL', 'XXL'],
  'T-Shirt': ['S', 'M', 'L', 'XL', 'XXL'],
  'T-Shirts': ['S', 'M', 'L', 'XL', 'XXL'],
  'Jeans': ['28', '30', '32', '34', '36', '38', '40'],
  'Pant': ['28', '30', '32', '34', '36', '38', '40'],
  'Pants': ['28', '30', '32', '34', '36', '38', '40'],
  'Footwear': ['6', '7', '8', '9', '10', '11'],
  'Shoes': ['6', '7', '8', '9', '10', '11'],
};

export const AdminProducts = () => {
  const { products, isLoading: productsLoading, mutate: mutateProducts } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const loading = productsLoading || categoriesLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editingProduct?.images && editingProduct.images.length >= 4) {
      toast.error('Maximum 4 images allowed per product');
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please upload an image or video file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size should be less than 20MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      const publicUrl = await api.request('uploadFile', {
        file,
        bucket: 'product',
        path: filePath
      });

      setEditingProduct(prev => {
        if (!prev) return null;
        const currentImages = prev.images || [];
        const updates: any = { images: [...currentImages, publicUrl] };
        if (!prev.image_url) {
          updates.image_url = publicUrl;
        }
        return { ...prev, ...updates };
      });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleVariantImageUpload = async (vIdx: number, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const currentVariants = [...(editingProduct?.variants || [])];
    const targetVariant = currentVariants[vIdx];
    const currentImages = targetVariant.images || (targetVariant.colorImage ? [targetVariant.colorImage] : []);

    if (currentImages.length >= 3) {
      toast.error('Maximum 3 photos allowed per variant');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `variant-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const publicUrl = await api.request('uploadFile', {
        file,
        bucket: 'product',
        path: fileName
      });

      targetVariant.images = [...currentImages, publicUrl];
      targetVariant.colorImage = targetVariant.images[0];
      
      setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
      toast.success('Variant photo uploaded!');
    } catch (error) {
      console.error('Variant photo upload failed:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setEditingProduct(prev => {
      if (!prev || !prev.images) return prev;
      const newImages = prev.images.filter((_, i) => i !== index);
      const updates: any = { images: newImages };
      if (prev.image_url === prev.images[index]) {
        updates.image_url = newImages[0] || '';
      }
      return { ...prev, ...updates };
    });
  };

  const addVariant = () => {
    const currentVariants = editingProduct?.variants || [];
    setEditingProduct({
      ...editingProduct,
      variants: [...currentVariants, { color: '', sizes: [{ size: '', stock: 0 }] }]
    } as any);
  };

  const removeVariant = (idx: number) => {
    const currentVariants = [...(editingProduct?.variants || [])];
    currentVariants.splice(idx, 1);
    setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
  };

  const updateVariantColor = (idx: number, color: string) => {
    const currentVariants = [...(editingProduct?.variants || [])];
    currentVariants[idx].color = color;
    setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
  };

  const addSizeToVariant = (vIdx: number) => {
    const currentVariants = [...(editingProduct?.variants || [])];
    currentVariants[vIdx].sizes.push({ size: '', stock: 0 });
    setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
  };

  const updateVariantSize = (vIdx: number, sIdx: number, field: 'size' | 'stock', value: any) => {
    const currentVariants = [...(editingProduct?.variants || [])];
    if (field === 'stock') value = Number(value);
    currentVariants[vIdx].sizes[sIdx][field] = value;
    setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
  };

  const removeSizeFromVariant = (vIdx: number, sIdx: number) => {
    const currentVariants = [...(editingProduct?.variants || [])];
    currentVariants[vIdx].sizes.splice(sIdx, 1);
    setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
  };

  const handleVariantFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeVariantIdx === null) return;

    const currentVariants = [...(editingProduct?.variants || [])];
    const targetVariant = currentVariants[activeVariantIdx];
    const currentImages = targetVariant.images || (targetVariant.colorImage ? [targetVariant.colorImage] : []);

    if (currentImages.length >= 3) {
      toast.error('Maximum 3 photos allowed per variant');
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please upload an image or video file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size should be less than 20MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `variant-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const publicUrl = await api.request('uploadFile', {
        file,
        bucket: 'product',
        path: fileName
      });

      targetVariant.images = [...currentImages, publicUrl];
      // Keep colorImage updated with the first image for backward compatibility
      targetVariant.colorImage = targetVariant.images[0];
      
      setEditingProduct({ ...editingProduct, variants: currentVariants } as any);
      toast.success('Variant photo uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload variant image.');
    } finally {
      setUploading(false);
      setActiveVariantIdx(null);
    }
  };


  const handleQuickSizeStockChange = (vIdx: number, size: string, value: string, type: 'store' | 'online' = 'store') => {
    const v = [...(editingProduct?.variants || [])];
    const sizes = [...(v[vIdx].sizes || [])];
    const sIdx = sizes.findIndex(s => s.size === size);
    const numVal = value === '' ? 0 : Number(value);

    if (sIdx > -1) {
      if (type === 'store') sizes[sIdx].store_stock = numVal;
      else sizes[sIdx].online_stock = numVal;
      // Maintain total stock for compatibility
      sizes[sIdx].stock = (sizes[sIdx].store_stock || 0) + (sizes[sIdx].online_stock || 0);
    } else {
      sizes.push({ 
        size, 
        stock: numVal,
        store_stock: type === 'store' ? numVal : 0,
        online_stock: type === 'online' ? numVal : 0
      });
    }

    v[vIdx].sizes = sizes;
    setEditingProduct({ ...editingProduct, variants: v } as any);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingProduct?.product_id ? 'updateProduct' : 'addProduct';
    try {
      const { sizes: _sizes, ...rest } = editingProduct as any;
      const payload = { ...rest };
      
      // Calculate total stock and set main image from variants if they exist
      if (payload.variants && payload.variants.length > 0) {
        payload.stock = payload.variants.reduce((total: number, v: any) => 
          total + v.sizes.reduce((sTotal: number, s: any) => sTotal + Number(s.stock || 0), 0), 0
        );
        
        // Use the first variant's image as the main image_url if not set
        const firstVariantImage = payload.variants.find((v: any) => v.colorImage)?.colorImage;
        if (firstVariantImage && !payload.image_url) {
          payload.image_url = firstVariantImage;
        }
      }

      // Auto-generate title for Store Products if missing
      if (payload.is_store_only) {
        payload.title = `${payload.category} - ${payload.sub_category}`;
        payload.description = payload.description || 'Showroom stock item';
        if (payload.variants) {
          payload.variants = payload.variants.map((v: any) => ({
            ...v,
            color: v.color || 'Standard'
          }));
        }
      }

      if (action === 'addProduct') {
        delete payload.product_id;
      }

      // Clean payload: Remove internal-only fields that don't exist in Supabase table
      const finalPayload = { 
        ...payload,
        sale_type: payload.is_store_only === true ? 'Store' : 'Online'
      };
      delete finalPayload.is_store_only;
      delete finalPayload.store_stock;
      delete finalPayload.online_stock;

      await api.request(action, finalPayload);
      
      // Close modal and reset state immediately
      setIsModalOpen(false);
      setEditingProduct(null);
      
      toast.success(`Product ${editingProduct?.product_id ? 'updated' : 'added'} successfully`);
      
      // Refresh data using SWR mutation for immediate UI update
      mutateProducts();
    } catch (error) {
      console.error('Save Product Error:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.request('deleteProduct', { product_id: id });
      toast.success('Product deleted');
      mutateProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory);
  const totalValue = filteredProducts.reduce((sum, p) => sum + ((p.discount_price || p.price) * (p.stock || 0)), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Products Management</h1>
          <p className="text-black/40">Add, edit, and organize your store's products</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setEditingProduct({
                title: '',
                description: '',
                category: categories[0]?.category_name || '',
                brand: '',
                size: '',
                sizes: [],
                color: '',
                sub_category: '',
                variants: [],
                price: 0,
                discount_price: 0,
                stock: 0,
                image_url: '',
                is_store_only: false // Default to Online Product
              });
              setIsModalOpen(true);
            }}
            className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      {/* Stats & Filters */}
      <motion.div
        className="flex flex-col md:flex-row gap-5 mb-8"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        initial="hidden"
        animate="show"
      >
        {/* Total Inventory Value */}
        <motion.div
          className="flex-1"
          variants={{
            hidden: { opacity: 0, x: -60, scale: 0.92 },
            show:   { opacity: 1, x: 0,   scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
          }}
        >
          <Card3D className="bg-gradient-to-br from-[#040d10] via-[#0a1a20] to-[#0f2430] border border-teal-900/60 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            <div className="p-3 rounded-xl bg-white/15 border border-white/10 flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white drop-shadow" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-300 uppercase tracking-[0.2em] mb-1">Total Inventory Value</p>
              <p className="text-2xl font-black text-white drop-shadow-sm">{formatPrice(totalValue)}</p>
            </div>
          </Card3D>
        </motion.div>

        {/* Active Products */}
        <motion.div
          className="flex-1"
          variants={{
            hidden: { opacity: 0, y: -50, scale: 0.92 },
            show:   { opacity: 1, y: 0,   scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
          }}
        >
          <Card3D className="bg-gradient-to-br from-[#080812] via-[#0c1228] to-[#0a1845] border border-indigo-900/60 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            <div className="p-3 rounded-xl bg-white/15 border border-white/10 flex-shrink-0">
              <Package className="w-6 h-6 text-white drop-shadow" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mb-1">Active Products</p>
              <p className="text-2xl font-black text-white drop-shadow-sm">{filteredProducts.length}</p>
            </div>
          </Card3D>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex-1"
          variants={{
            hidden: { opacity: 0, x: 60, scale: 0.92 },
            show:   { opacity: 1, x: 0,  scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
          }}
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex items-center gap-3 h-full">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black cursor-pointer text-slate-800 px-4 py-2 transition-all shadow-sm"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-md overflow-hidden w-full">
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Variants</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.product_id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setStockProduct(product);
                      setIsStockModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{product.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-600 border border-slate-200">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map((v, i) => (
                            <span key={i} className="text-[10px] font-bold bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 shadow-xs">
                              {v.color}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic">No variants</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm">{formatPrice(product.discount_price || product.price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${product.stock <= 30 && product.stock > 0 ? 'text-orange-500' : product.stock === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{product.stock}</p>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-black transition-colors" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const isStoreOnly = product.sale_type === 'Store' || (!product.image_url && (!product.variants || product.variants.length === 0 || product.variants.every(v => !v.colorImage)));
                            setEditingProduct({ ...product, is_store_only: isStoreOnly } as any);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-black/40" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.product_id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 px-4 pb-20">
            {filteredProducts.map((product) => (
              <div 
                key={product.product_id}
                className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden"
                onClick={() => {
                  setStockProduct(product);
                  setIsStockModalOpen(true);
                }}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 mb-2 inline-block">
                        {product.category}
                      </span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const isStoreOnly = product.sale_type === 'Store' || (!product.image_url && (!product.variants || product.variants.length === 0 || product.variants.every(v => !v.colorImage)));
                            setEditingProduct({ ...product, is_store_only: isStoreOnly } as any);
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.product_id)}
                          className="p-2.5 bg-red-50 rounded-2xl border border-red-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-black text-slate-800 truncate text-lg">{product.title}</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{product.brand}</p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                        <span className="font-black text-slate-900 text-base">{formatPrice(product.discount_price || product.price)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Stock Status</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${product.stock <= 30 && product.stock > 0 ? 'text-orange-500' : product.stock === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {product.stock} Units
                          </span>
                          <div className="p-1 bg-slate-100 rounded-lg">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Package className="w-10 h-10 text-slate-200" />
                </div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No products found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-110 md:w-[600px] max-h-[92vh] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col border border-white overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">{editingProduct?.product_id ? 'Edit Product' : 'Add New Product'}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, is_store_only: false } as any)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${editingProduct?.is_store_only === false ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}
                    >
                      Online Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, is_store_only: true } as any)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${editingProduct?.is_store_only ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}
                    >
                      Store Product
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-all duration-300 group"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  {!editingProduct?.is_store_only && (
                    <div className="space-y-2.5 col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Product Title</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter product title..."
                        value={editingProduct?.title}
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value } as any)}
                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold placeholder:text-slate-400 shadow-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
                    <select
                      value={editingProduct?.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold appearance-none shadow-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Brand</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Boys Zone"
                      value={editingProduct?.brand}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Sub Category</label>
                    <select
                      value={editingProduct?.sub_category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sub_category: e.target.value })}
                      className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold appearance-none shadow-sm"
                    >
                      <option value="">Select Sub Category</option>
                      {(Object.entries(subCategoryMap).find(([key]) => key.toLowerCase() === (editingProduct?.category || '').toLowerCase())?.[1] || []).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={editingProduct?.price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Discount Price (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editingProduct?.discount_price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, discount_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold placeholder:text-slate-300"
                    />
                  </div>
                  {!editingProduct?.is_store_only && (
                    <div className="space-y-2.5 col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                      <textarea
                        placeholder="Write product description..."
                        value={editingProduct?.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold min-h-[120px] placeholder:text-slate-400 resize-none shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Variants Section */}
                <div className="space-y-8 border-t border-slate-100 pt-10 mt-6">
                   <div className="flex justify-between items-end px-1">
                     <div>
                       <h3 className="text-lg font-black tracking-tight text-slate-900">Product Variants</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Colors, Sizes & Photography</p>
                     </div>
                     <button
                       type="button"
                       onClick={addVariant}
                       className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                     >
                       <Plus className="w-4 h-4" /> Add Variant
                     </button>
                   </div>

                   <div className="space-y-4">
                     {editingProduct?.variants?.map((variant, vIdx) => (
                       <div key={vIdx} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-300 space-y-6 relative group shadow-sm">
                         <button
                           type="button"
                           onClick={() => removeVariant(vIdx)}
                           className="absolute top-6 right-6 p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>

                         <div className="grid grid-cols-2 gap-6 pr-12">
                            {!editingProduct?.is_store_only && (
                              <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Color Theme</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Midnight Black"
                                  value={variant.color}
                                  onChange={(e) => updateVariantColor(vIdx, e.target.value)}
                                  className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all outline-none font-bold placeholder:text-slate-400 shadow-sm"
                                />
                              </div>
                            )}
                            <div className="space-y-2 col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Entry {categorySizes[editingProduct?.category || ''] ? '(Store / Online Stock)' : '(Direct Stock)'}</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 bg-white rounded-[1.5rem] border border-slate-300 shadow-inner">
                                {categorySizes[editingProduct?.category || ''] ? (
                                  categorySizes[editingProduct?.category || ''].map(s => {
                                    const activeSize = variant.sizes.find(sz => sz.size === s);
                                    return (
                                      <div key={s} className="bg-slate-50 p-2 rounded-2xl border border-slate-200 space-y-2">
                                        <div className="text-[9px] font-black text-center text-slate-400 uppercase tracking-tighter">Size {s}</div>
                                        <div className="grid grid-cols-1 gap-1">
                                          {!editingProduct?.is_store_only ? (
                                            <div className="space-y-1">
                                               <div className="text-[7px] font-black text-center text-blue-600 uppercase">Online</div>
                                               <input 
                                                 type="number"
                                                 placeholder="0"
                                                 value={activeSize?.online_stock || ''}
                                                 onChange={(e) => handleQuickSizeStockChange(vIdx, s, e.target.value, 'online')}
                                                 className="w-full h-8 text-center text-xs font-black rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                               />
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                               <div className="text-[7px] font-black text-center text-emerald-600 uppercase">Store</div>
                                               <input 
                                                 type="number"
                                                 placeholder="0"
                                                 value={activeSize?.store_stock || ''}
                                                 onChange={(e) => handleQuickSizeStockChange(vIdx, s, e.target.value, 'store')}
                                                 className="w-full h-8 text-center text-xs font-black rounded-lg border border-slate-200 bg-white focus:border-emerald-500 focus:ring-0 outline-none transition-all"
                                               />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="col-span-full space-y-3">
                                     <div className="grid grid-cols-1 gap-3">
                                       {!editingProduct?.is_store_only ? (
                                         <div className="space-y-2">
                                           <label className="text-[9px] font-black text-blue-600 uppercase px-1">Online Stock</label>
                                           <input 
                                             type="number"
                                             placeholder="0"
                                             value={variant.sizes[0]?.online_stock || ''}
                                             onChange={(e) => {
                                               const v = [...(editingProduct?.variants || [])];
                                               const val = e.target.value === '' ? 0 : Number(e.target.value);
                                               const store = variant.sizes[0]?.store_stock || 0;
                                               v[vIdx].sizes = [{ size: 'One Size', store_stock: store, online_stock: val, stock: store + val }];
                                               setEditingProduct({ ...editingProduct, variants: v } as any);
                                             }}
                                             className="w-full h-12 px-6 text-sm font-black rounded-2xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-0 outline-none shadow-sm"
                                           />
                                         </div>
                                       ) : (
                                         <div className="space-y-2">
                                           <label className="text-[9px] font-black text-emerald-600 uppercase px-1">Store Stock</label>
                                           <input 
                                             type="number"
                                             placeholder="0"
                                             value={variant.sizes[0]?.store_stock || ''}
                                             onChange={(e) => {
                                               const v = [...(editingProduct?.variants || [])];
                                               const val = e.target.value === '' ? 0 : Number(e.target.value);
                                               const online = variant.sizes[0]?.online_stock || 0;
                                               v[vIdx].sizes = [{ size: 'One Size', store_stock: val, online_stock: online, stock: val + online }];
                                               setEditingProduct({ ...editingProduct, variants: v } as any);
                                             }}
                                             className="w-full h-12 px-6 text-sm font-black rounded-2xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-0 outline-none shadow-sm"
                                           />
                                         </div>
                                       )}
                                     </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {!editingProduct?.is_store_only && (
                              <div className="space-y-2 col-span-2 border-t border-slate-300 pt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variant Photos (Max 3)</label>
                                <div className="flex flex-wrap gap-3">
                                  {variant.images?.map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative group/img">
                                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const v = [...(editingProduct?.variants || [])];
                                          const newImgs = (v[vIdx].images || []).filter((_, i) => i !== imgIdx);
                                          v[vIdx].images = newImgs;
                                          v[vIdx].colorImage = newImgs[0] || '';
                                          setEditingProduct({ ...editingProduct, variants: v } as any);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-all shadow-lg"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {(variant.images?.length || 0) < 3 && (
                                    <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group">
                                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                                      <span className="text-[8px] font-black text-slate-300 group-hover:text-slate-600 uppercase mt-1">Add</span>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleVariantImageUpload(vIdx, e.target.files)}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}

                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <input
                  type="file"
                  ref={variantFileInputRef}
                  onChange={handleVariantFileChange}
                  className="hidden"
                  accept="image/*,video/*"
                />

                <button
                  type="submit"
                  disabled={uploading || editingProduct?.is_store_only === null}
                  className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-black hover:shadow-xl hover:shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingProduct?.product_id ? 'Update Product Details' : (editingProduct?.is_store_only === null ? 'Select Channel to Launch' : 'Launch New Product')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Stock Details Modal */}
      <AnimatePresence>
        {isStockModalOpen && stockProduct && (
          <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsStockModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                       <img src={stockProduct.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">{stockProduct.title}</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stockProduct.category} • {stockProduct.brand}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsStockModalOpen(false)}
                   className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors border border-slate-100 shadow-sm"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stockProduct.variants && stockProduct.variants.length > 0 ? (
                      stockProduct.variants.map((v, vIdx) => (
                        <div key={vIdx} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: v.color?.toLowerCase() }} />
                                 <span className="font-black text-sm uppercase text-slate-800">{v.color}</span>
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variant #{vIdx + 1}</span>
                           </div>

                           <div className="space-y-2">
                              {v.sizes.map((s: any, sIdx: number) => (
                                <div key={sIdx} className="bg-white px-4 py-3 rounded-xl border border-slate-100 flex items-center justify-between group/size hover:border-slate-300 transition-all">
                                   <span className="text-xs font-black text-slate-400 group-hover/size:text-slate-900 transition-colors">SIZE {s.size}</span>
                                   <div className="flex items-center gap-4">
                                      <div className="text-right">
                                         <p className="text-[10px] font-black text-emerald-500 uppercase leading-none mb-0.5">Store</p>
                                         <p className="text-sm font-black text-slate-700">{s.store_stock || 0}</p>
                                      </div>
                                      <div className="w-px h-6 bg-slate-100" />
                                      <div className="text-right">
                                         <p className="text-[10px] font-black text-blue-500 uppercase leading-none mb-0.5">Online</p>
                                         <p className="text-sm font-black text-slate-700">{s.online_stock || 0}</p>
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center space-y-3">
                         <Package className="w-12 h-12 text-slate-200 mx-auto" />
                         <p className="text-sm font-bold text-slate-400 italic">No detailed variant breakdown available.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase">Total Unit Stock:</span>
                    <span className="text-lg font-black text-slate-900">{stockProduct.stock} Pcs</span>
                 </div>
                 <button 
                   onClick={() => {
                     setIsStockModalOpen(false);
                     const isStoreOnly = stockProduct.sale_type === 'Store' || (!stockProduct.image_url && (!stockProduct.variants || stockProduct.variants.length === 0 || stockProduct.variants.every(v => !v.colorImage)));
                     setEditingProduct({ ...stockProduct, is_store_only: isStoreOnly } as any);
                     setIsModalOpen(true);
                   }}
                   className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                 >
                   <Edit2 className="w-4 h-4" /> Edit Inventory
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
