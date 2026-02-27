import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const productsData = await api.request('getProducts');
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickUpdateStock = async (productId: string, newStock: number) => {
    try {
      await api.request('updateProduct', { product_id: productId, stock: newStock });
      toast.success('Stock updated');
      setProducts(prev => prev.map(p => p.product_id === productId ? { ...p, stock: newStock } : p));
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Inventory Management</h1>
        <p className="text-black/40">Quickly view and update your product stock levels in real time</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Inventory Levels</h2>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
              <input type="text" placeholder="Search products..." className="pl-12 pr-4 py-3 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black w-64 text-sm font-bold" />
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black/5 text-xs font-bold uppercase tracking-widest text-black/40">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU/ID</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {products.map((product) => (
                  <tr key={product.product_id} className="hover:bg-black/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-black/5" />
                        <span className="font-bold text-sm max-w-[200px] truncate block">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-black/40 font-mono">{product.product_id.substring(0, 8)}</td>
                    <td className="px-6 py-4 text-sm font-bold">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${product.stock > 30 ? 'bg-emerald-50 text-emerald-600' : product.stock > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                        {product.stock > 30 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setProducts(prev => prev.map(p => p.product_id === product.product_id ? { ...p, stock: val } : p));
                        }}
                        className="w-20 px-3 py-2 bg-black/5 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-black"
                      />
                      <button
                        onClick={() => quickUpdateStock(product.product_id, product.stock)}
                        className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/90"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
