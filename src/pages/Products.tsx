import React, { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

export const Products = () => {
  const { products: allProducts, isLoading: productsLoading, isError, mutate } = useProducts();
  const { categories: fetchedCategories, isLoading: categoriesLoading } = useCategories();
  const loading = productsLoading || categoriesLoading;

  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });

  const currentCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  const products = useMemo(() => {
    return allProducts.filter((p: any) => !p.sale_type || p.sale_type.toLowerCase() === 'online');
  }, [allProducts]);

  const categories = useMemo(() => {
    if (fetchedCategories && fetchedCategories.length > 0) return fetchedCategories;
    return [
      { category_id: '1', category_name: 'T-Shirts' },
      { category_id: '2', category_name: 'Jeans' },
      { category_id: '3', category_name: 'Hoodies' },
      { category_id: '4', category_name: 'Accessories' }
    ] as Category[];
  }, [fetchedCategories]);

  const { brands, sizes, maxProductPrice } = useMemo(() => {
    const brandsSet = new Set<string>();
    const sizesSet = new Set<string>();
    let maxPrice = 0;

    products.forEach(p => {
      if (p.brand) brandsSet.add(p.brand);
      if (p.size) sizesSet.add(p.size);
      if (p.sizes) p.sizes.forEach(s => sizesSet.add(s));
      if (p.price > maxPrice) maxPrice = p.price;
    });

    return {
      brands: Array.from(brandsSet).sort(),
      sizes: Array.from(sizesSet).sort(),
      maxProductPrice: maxPrice || 20000
    };
  }, [products]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    
    // Check if any selected size matches product.size or is in product.sizes array
    const matchesSize = selectedSizes.length === 0 || 
      selectedSizes.includes(product.size) || 
      (product.sizes && product.sizes.some(s => selectedSizes.includes(s)));
    
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;

    return matchesCategory && matchesSearch && matchesBrand && matchesSize && matchesPrice;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-16">
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

      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
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

            {/* Price Filter */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Price Range</h3>
                <span className="text-[10px] font-mono font-bold text-indigo-600">₹{priceRange.max}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxProductPrice}
                step="100"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                <span>₹0</span>
                <span>₹{maxProductPrice}</span>
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">Brands</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                          else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Size Filter */}
            {sizes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">Sizes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        if (selectedSizes.includes(size)) setSelectedSizes(selectedSizes.filter(s => s !== size));
                        else setSelectedSizes([...selectedSizes, size]);
                      }}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear All */}
            {(selectedBrands.length > 0 || selectedSizes.length > 0 || priceRange.max < maxProductPrice) && (
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedSizes([]);
                  setPriceRange({ min: 0, max: maxProductPrice });
                }}
                className="w-full py-3 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
              >
                Clear Filters
              </button>
            )}

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-32 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Connection Issue</h3>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">We're having trouble reaching our showroom. Please check your connection and try again.</p>
              <button
                onClick={() => mutate()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
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
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-[132px] bottom-0 z-[100] w-[85%] sm:w-80 bg-white p-8 shadow-2xl overflow-y-auto rounded-l-[2.5rem] border-l border-gray-100"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-serif font-bold text-slate-900">Filters</h2>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-12 pb-10">
                {/* Categories */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Categories</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setSearchParams({})}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${currentCategory === 'All' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-slate-600'}`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.category_id}
                        onClick={() => setSearchParams({ category: cat.category_name })}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${currentCategory === cat.category_name ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-slate-600'}`}
                      >
                        {cat.category_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Price Range</h3>
                    <span className="text-sm font-bold text-indigo-600">₹{priceRange.max}</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max={maxProductPrice}
                      step="500"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400">
                      <span>₹0</span>
                      <span>₹{maxProductPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Brands</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => {
                          if (selectedBrands.includes(brand)) setSelectedBrands(selectedBrands.filter(b => b !== brand));
                          else setSelectedBrands([...selectedBrands, brand]);
                        }}
                        className={`py-4 px-2 rounded-2xl text-[11px] font-bold border transition-all ${selectedBrands.includes(brand) ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-white border-gray-100 text-slate-600 hover:border-slate-300'}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Sizes</h3>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          if (selectedSizes.includes(size)) setSelectedSizes(selectedSizes.filter(s => s !== size));
                          else setSelectedSizes([...selectedSizes, size]);
                        }}
                        className={`w-14 h-14 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center ${selectedSizes.includes(size) ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-white border-gray-100 text-slate-600 hover:border-slate-300'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setSelectedSizes([]);
                      setPriceRange({ min: 0, max: maxProductPrice });
                      setSearchParams({});
                      setIsFilterOpen(false);
                    }}
                    className="py-4.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="py-4.5 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
