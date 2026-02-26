import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const currentCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
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
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-slate-900 mb-2">
            Explore Collection
          </h1>
          <p className="text-gray-500 font-medium">Discover our premium range of boys' essentials</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) newParams.set('q', e.target.value);
                else newParams.delete('q');
                setSearchParams(newParams);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors placeholder:text-gray-400 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="flex gap-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-48 shrink-0 space-y-8">
          <div className="sticky top-28 space-y-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">Categories</h3>
              <div className="space-y-1.5 flex flex-col">
                <button 
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('category');
                    setSearchParams(newParams);
                  }}
                  className={`text-left px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentCategory === 'All' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.category_id}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('category', cat.category_name);
                      setSearchParams(newParams);
                    }}
                    className={`text-left px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentCategory === cat.category_name ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    {cat.category_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white text-left">
              <h4 className="font-bold text-lg mb-2">Summer Sale!</h4>
              <p className="text-indigo-100 text-xs leading-relaxed mb-6">
                Get up to 50% off on selected items this summer.
              </p>
              <button className="bg-white text-indigo-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full">
                APPLY NOW
              </button>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-4/5 bg-gray-50 rounded-[32px] animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredProducts.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-32">
              <p className="text-gray-400 text-lg font-serif">No creations found matching your criteria.</p>
              <button 
                onClick={() => setSearchParams({})}
                className="mt-6 text-[13px] font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-80 bg-white p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-4">Categories</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setSearchParams({});
                        setIsFilterOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${currentCategory === 'All' ? 'bg-black text-white' : 'bg-black/5'}`}
                    >
                      All Products
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat.category_id}
                        onClick={() => {
                          setSearchParams({ category: cat.category_name });
                          setIsFilterOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${currentCategory === cat.category_name ? 'bg-black text-white' : 'bg-black/5'}`}
                      >
                        {cat.category_name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
