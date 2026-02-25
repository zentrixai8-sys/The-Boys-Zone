import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { ArrowRight, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.request('getProducts'),
          api.request('getCategories')
        ]);
        setFeaturedProducts(Array.isArray(productsData) ? productsData.slice(0, 8) : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?grayscale" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none mb-6">
              BOY'S <br /> <span className="text-black bg-white px-2">ZONE.</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-md italic">
              "Your Choice Here"
            </p>
            <div className="flex gap-4">
              <Link to="/products" className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-white/90 transition-all flex items-center gap-2">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/categories" className="border border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all">
                Categories
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On all orders over ₹999" },
            { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure payment processing" },
            { icon: RefreshCcw, title: "Easy Returns", desc: "30-day hassle-free return policy" }
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4 p-6 bg-black/5 rounded-2xl">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <feature.icon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-black">{feature.title}</h3>
                <p className="text-sm text-black/40">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-black">Shop by Category</h2>
            <p className="text-black/40">Explore our curated collections</p>
          </div>
          <Link to="/categories" className="text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-square bg-black/5 rounded-2xl animate-pulse" />
            ))
          ) : (
            categories.slice(0, 4).map((category) => (
              <Link 
                key={category.category_id} 
                to={`/products?category=${category.category_name}`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-black/5"
              >
                <img 
                  src={category.image_url || `https://picsum.photos/seed/${category.category_id}/400/400`} 
                  alt={category.category_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <h3 className="text-white font-bold text-xl">{category.category_name}</h3>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-black">New Arrivals</h2>
            <p className="text-black/40">The latest trends in men's fashion</p>
          </div>
          <Link to="/products" className="text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Shop All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-black/5 rounded-2xl animate-pulse" />
            ))
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
