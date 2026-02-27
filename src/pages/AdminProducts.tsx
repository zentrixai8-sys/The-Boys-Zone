import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { formatPrice } from '../lib/utils';
import {
  Plus, Edit2, Trash2, Loader2, X, DollarSign, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        api.request('getProducts'),
        api.request('getCategories')
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editingProduct?.images && editingProduct.images.length >= 4) {
      toast.error('Maximum 4 images allowed per product');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size should be less than 1MB');
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingProduct?.product_id ? 'updateProduct' : 'addProduct';
    try {
      const payload = { ...editingProduct };
      if (action === 'addProduct') {
        delete payload.product_id;
      }
      await api.request(action, payload);
      toast.success(`Product ${editingProduct?.product_id ? 'updated' : 'added'} successfully`);
      setIsModalOpen(false);
      fetchData();
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
      fetchData();
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
                size: 'M',
                color: '',
                price: 0,
                discount_price: 0,
                stock: 0,
                image_url: ''
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
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm flex-1 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Total Inventory Value</p>
            <p className="text-2xl font-black text-black">{formatPrice(totalValue)}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm flex-1 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Active Products</p>
            <p className="text-2xl font-black text-black">{filteredProducts.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm flex-1 flex items-center gap-4">
          <span className="text-sm font-bold text-black/60">Category:</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 text-sm font-bold bg-black/5 rounded-xl border-none focus:ring-0 cursor-pointer text-black px-4 py-2"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-black/5 text-xs font-bold uppercase tracking-widest text-black/40">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-black/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/5 overflow-hidden shrink-0">
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{product.title}</p>
                          <p className="text-xs text-black/40">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-black/5 px-2 py-1 rounded-lg">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm">{formatPrice(product.discount_price || product.price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-bold ${product.stock <= 30 && product.stock > 0 ? 'text-orange-500' : product.stock === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{product.stock}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-110 md:w-[600px] max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-black/5 flex justify-between items-center">
                <h2 className="text-xl font-bold">{editingProduct?.product_id ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Product Title</label>
                    <input
                      type="text"
                      required
                      value={editingProduct?.title}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Category</label>
                    <select
                      value={editingProduct?.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black"
                    >
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Brand</label>
                    <input
                      type="text"
                      required
                      value={editingProduct?.brand}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={editingProduct?.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Discount Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct?.discount_price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, discount_price: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Stock</label>
                    <input
                      type="number"
                      required
                      value={editingProduct?.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Product Images</label>
                    <div className="grid grid-cols-4 gap-4">
                      {editingProduct?.images?.map((img, idx) => (
                        <div key={idx} className="relative aspect-square bg-black/5 rounded-2xl overflow-hidden border border-black/5 group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {editingProduct.image_url === img && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold uppercase py-1 text-center">Main</div>
                          )}
                        </div>
                      ))}
                      {editingProduct?.images && editingProduct.images.length >= 4 ? null : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="aspect-square bg-black/5 hover:bg-black/10 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-black/20" /> : <Plus className="w-5 h-5 text-black/20" />}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Add</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Description</label>
                    <textarea
                      value={editingProduct?.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black min-h-[100px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-black/90 transition-all disabled:opacity-50"
                >
                  Save Product
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
