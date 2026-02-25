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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black mb-2">
            {currentCategory === 'All' ? 'Shop All' : currentCategory}
          </h1>
          <p className="text-black/40">{filteredProducts.length} products found</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) newParams.set('q', e.target.value);
                else newParams.delete('q');
                setSearchParams(newParams);
              }}
              className="w-full pl-10 pr-4 py-2 bg-black/5 border-none rounded-full text-sm focus:ring-2 focus:ring-black"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="p-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors md:hidden"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-4">Categories</h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('category');
                  setSearchParams(newParams);
                }}
                className={`block w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentCategory === 'All' ? 'bg-black text-white' : 'hover:bg-black/5 text-black/60'}`}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.category_id}
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('category', cat.category_name);
                    setSearchParams(newParams);
                  }}
                  className={`block w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentCategory === cat.category_name ? 'bg-black text-white' : 'hover:bg-black/5 text-black/60'}`}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-black/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-black/40 text-lg">No products found matching your criteria.</p>
              <button 
                onClick={() => setSearchParams({})}
                className="mt-4 text-black font-bold hover:underline"
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
