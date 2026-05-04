import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../lib/utils';
import { 
  ShoppingBag, Star, Truck, ShieldCheck, RefreshCcw, 
  ChevronRight, Minus, Plus, MessageSquare, Send, 
  Loader2, ChevronLeft, Heart, Share2, ChevronDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProducts } from '../hooks/useProducts';
import toast from 'react-hot-toast';
import { ProductCard } from '../components/ProductCard';

export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { products: allProducts, isLoading: productsLoading, isError, mutate } = useProducts();
  const product = useMemo(() => allProducts.find(p => p.product_id === id) || null, [allProducts, id]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (product) {
      // Redirect if this is a Store-only product (should not be visible online)
      if (product.sale_type === 'Store') {
        navigate('/products');
        return;
      }

      if (product.variants && product.variants.length > 0) {
        if (!selectedColor) setSelectedColor(product.variants[0].color);
        if (!selectedSize && product.variants[0].sizes.length > 0) {
          setSelectedSize(product.variants[0].sizes[0].size);
        }
      } else if (product.sizes && product.sizes.length > 0) {
        if (!selectedSize) setSelectedSize(product.sizes[0]);
      } else if (product.size) {
        if (!selectedSize) setSelectedSize(product.size);
      }
      fetchReviews(product.product_id);
    }
  }, [product, selectedColor, selectedSize, navigate]);



  const currentVariant = product?.variants?.find(v => v.color === selectedColor);
  const availableSizes = currentVariant ? currentVariant.sizes : (product?.sizes?.map(s => ({ size: s, stock: product.stock })) || []);
  const currentStock = currentVariant 
    ? (currentVariant.sizes.find(s => s.size === selectedSize)?.stock || 0)
    : (product?.stock || 0);
  const selectedColorImage = currentVariant?.colorImage;

  // Collect parsed main images
  const parsedImages = useMemo(() => {
    let imgs: string[] = [];
    if (product?.images) {
      if (typeof product.images === 'string') {
        try {
          imgs = JSON.parse(product.images);
        } catch (e) {
          imgs = [product.images];
        }
      } else if (Array.isArray(product.images)) {
        imgs = product.images;
      }
    }
    return imgs;
  }, [product?.images]);

  const galleryImages = useMemo(() => {
    let images: string[] = [];
    // Prioritize current variant images first
    if (currentVariant) {
      if (currentVariant.colorImage) images.push(currentVariant.colorImage);
      if (currentVariant.images && Array.isArray(currentVariant.images)) {
        images.push(...currentVariant.images);
      }
    }
    
    // Append main product images to the gallery
    if (product?.image_url) images.push(product.image_url);
    if (parsedImages.length > 0) images.push(...parsedImages);
    
    // Fallback to all variant images if nothing else exists
    if (images.length === 0) {
      product?.variants?.forEach(v => {
        if (v.colorImage) images.push(v.colorImage);
        if (v.images && Array.isArray(v.images)) images.push(...v.images);
      });
    }
    
    const uniqueImages = [...new Set(images)].filter(Boolean) as string[];
    return uniqueImages.length > 0 ? uniqueImages : (product?.image_url ? [product.image_url] : []);
  }, [currentVariant, product?.image_url, parsedImages, product?.variants]);

  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColor]);

  const fetchReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const data = await api.request('getReviews', { product_id: productId });
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.request('addReview', {
        product_id: product?.product_id,
        user_id: user.id,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString()
      });
      toast.success('Review submitted successfully!');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews(product!.product_id);
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[4/5] bg-black/5 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-4 w-24 bg-black/5 rounded" />
            <div className="h-10 w-full bg-black/5 rounded" />
            <div className="h-6 w-32 bg-black/5 rounded" />
            <div className="h-32 w-full bg-black/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product && !productsLoading && isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-500 mb-10 max-w-sm mx-auto">We couldn't retrieve the details for this creation. It might be a connection issue.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/products')} className="px-8 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold">Back to Shop</button>
          <button onClick={() => mutate()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200">Try Again</button>
        </div>
      </div>
    );
  }

  if (!product && !productsLoading) return null;
  const averageRating = product.rating || 'New';
  const totalReviewCount = product.reviewCount || 0;

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-0">
      {/* Mobile Top Navigation */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-900"><Share2 className="w-5 h-5" /></button>
          <button className="p-2 text-gray-900"><ShoppingBag className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 px-6 lg:px-12 py-4 text-[12px] text-gray-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-indigo-600 transition-colors">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-bold">{product.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-500 line-clamp-1">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 lg:gap-16 px-0 md:px-6 lg:px-12 py-0 md:pt-4">
          
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-7 flex gap-4">
            {/* Vertical Thumbnails (Desktop Only) */}
            <div className="hidden md:flex flex-col gap-3 w-16 shrink-0 h-[600px] sticky top-28 overflow-y-auto scrollbar-hide py-1">
              {galleryImages.map((img, idx) => (
                <button 
                  key={idx}
                  onMouseEnter={() => setCurrentImageIndex(idx)}
                  className={`relative w-full aspect-square rounded-lg overflow-hidden transition-all border-2 shrink-0 ${currentImageIndex === idx ? 'border-indigo-600 shadow-lg' : 'border-gray-100 opacity-70 hover:opacity-100 hover:border-gray-300'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex-1">
              <div className="sticky top-28">
                <div className="relative aspect-[4/5] bg-gray-50 md:rounded-2xl overflow-hidden group border-b md:border border-gray-100 shadow-sm">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentImageIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      src={galleryImages[currentImageIndex] || selectedColorImage || product.image_url} 
                      alt={product.title}
                      className="w-full h-full object-cover touch-pan-y"
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -50) nextImage();
                        if (info.offset.x > 50) prevImage();
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>

                  {/* Image Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {galleryImages.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentImageIndex === i ? 'w-6 bg-indigo-600' : 'w-1.5 bg-gray-300'}`} 
                      />
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all hover:bg-white md:opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all hover:bg-white md:opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Mobile Thumbnails */}
                <div className="flex md:hidden gap-3 px-4 py-4 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
                  {galleryImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${currentImageIndex === idx ? 'border-indigo-600 shadow-md ring-2 ring-indigo-50' : 'border-gray-100 opacity-60'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="md:col-span-6 lg:col-span-5 px-4 md:px-0 pt-6 md:pt-0 pb-12">
            <div className="flex flex-col">
              <div className="mb-2">
                 <p className="text-[11px] font-black tracking-[0.2em] text-indigo-600 uppercase mb-2">{product.brand || 'The Boys Zone'}</p>
                 <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2 uppercase">{product.title}</h1>
                 
                 <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-600 px-2 py-0.5 rounded text-white flex items-center gap-1">
                      <span className="text-xs font-bold">{averageRating}</span>
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                    <span className="text-sm font-bold text-gray-400 tracking-wide">{totalReviewCount} Ratings</span>
                    <div className="w-fit bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                       <ShieldCheck className="w-3 h-3 text-emerald-600" />
                       <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Verified Product</span>
                    </div>
                 </div>
              </div>

              <div className="border-y border-gray-100 py-6 mb-8">
                <div className="mb-2">
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest animate-premium-shine">Hot Deal</span>
                </div>
                <div className="flex items-center gap-4 mb-1">
                  <span className="text-base font-black text-emerald-600">
                    {Math.round(((product.price - product.discount_price!) / product.price) * 100)}% off
                  </span>
                  <span className="text-xl text-gray-400 line-through font-medium">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                    {formatPrice(product.discount_price || product.price)}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inclusive of all taxes</p>
              </div>

              <div className="mb-8 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-3 mb-3">
                    <Truck className="w-5 h-5 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase text-gray-600 tracking-widest leading-none">Free Delivery by Tomorrow</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <RefreshCcw className="w-5 h-5 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase text-gray-600 tracking-widest leading-none">7 Days Replacement Policy</span>
                 </div>
              </div>

              {/* Color Selectors */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-8">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Select Color</p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map(v => (
                      <button 
                        key={v.color}
                        onMouseEnter={() => setSelectedColor(v.color)}
                        onClick={() => {
                          setSelectedColor(v.color);
                          if (v.sizes.length > 0) setSelectedSize(v.sizes[0].size);
                        }}
                        className={`group relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedColor === v.color ? 'border-indigo-600 shadow-md ring-4 ring-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <img src={v.colorImage} alt={v.color} className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity ${selectedColor === v.color ? 'opacity-0' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selectors */}
              {availableSizes.length > 0 && availableSizes.some(s => s.size.trim() !== '') && (
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Select Size</p>
                    <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Size Chart</button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {availableSizes.filter(s => s.size.trim() !== '').map(sz => (
                      <button 
                        key={sz.size}
                        disabled={sz.stock <= 0}
                        onClick={() => setSelectedSize(sz.size)}
                        className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all ${selectedSize === sz.size ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : sz.stock <= 0 ? 'border-gray-50 text-gray-200 cursor-not-allowed bg-gray-50' : 'border-gray-100 text-gray-700 hover:border-indigo-600 bg-white'}`}
                      >
                        {sz.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Desktop Actions */}
              <div className="hidden md:flex gap-4 mb-10">
                <button 
                  onClick={() => {
                    if (currentStock <= 0) {
                      toast.error('Out of stock');
                      return;
                    }
                    addToCart({ ...product, size: selectedSize, color: selectedColor }, quantity);
                  }}
                  disabled={currentStock <= 0}
                  className="flex-1 bg-white border-2 border-slate-200 text-slate-800 py-4 rounded-xl text-[15px] font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                >
                  <ShoppingBag className="w-5 h-5" /> Add to cart
                </button>
                <button 
                  onClick={() => {
                    addToCart({ ...product, size: selectedSize || product.size }, quantity);
                    navigate('/checkout');
                  }}
                  className="flex-1 bg-[#ffc107] text-slate-900 py-4 rounded-xl text-[15px] font-black hover:bg-[#ffb300] transition-all shadow-lg shadow-amber-500/10 uppercase tracking-widest"
                >
                  Buy at {formatPrice(product.discount_price || product.price)}
                </button>
              </div>

              {/* Accordions (Flipkart Style) */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {/* Details Accordion */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                   <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">Product Details</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                   </button>
                   <div className="px-5 pb-5">
                      <div className="grid grid-cols-2 gap-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Category</p>
                          <p className="text-sm font-semibold text-gray-800">{product.category}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Brand</p>
                          <p className="text-sm font-semibold text-gray-800">{product.brand || 'The Boys Zone'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Occasion</p>
                          <p className="text-sm font-semibold text-gray-800">Casual / Festive</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Material</p>
                          <p className="text-sm font-semibold text-gray-800">Premium Fabric</p>
                        </div>
                      </div>
                      <p className="mt-5 text-[13px] text-gray-600 leading-relaxed">
                        {product.description || 'Step up your style game with this premium essential. Perfect for everyday wear, featuring high-quality construction and a modern fit.'}
                      </p>
                   </div>
                </div>

                {/* Highlights Accordion */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                   <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">Highlights & Offers</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                   </button>
                   <div className="px-5 pb-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                        <p className="text-xs font-semibold text-gray-700">Bank Offer: 5% Unlimited Cashback on Card</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                        <p className="text-xs font-semibold text-gray-700">Special Price: Get extra 10% off (price inclusive of discount)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                        <p className="text-xs font-semibold text-gray-700">Partner Offer: Buy this product and get upto ₹250 Off on next purchase</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-[56px] left-0 right-0 z-50 bg-white border-t border-gray-100 p-3 flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => {
            if (currentStock <= 0) {
              toast.error('Out of stock');
              return;
            }
            addToCart({ ...product, size: selectedSize, color: selectedColor }, quantity);
          }}
          disabled={currentStock <= 0}
          className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-3.5 rounded-xl text-[14px] font-black disabled:opacity-50"
        >
          ADD TO CART
        </button>
        <button 
          onClick={() => {
            addToCart({ ...product, size: selectedSize || product.size }, quantity);
            navigate('/checkout');
          }}
          className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl text-[14px] font-black shadow-lg shadow-indigo-600/20"
        >
          BUY NOW
        </button>
      </div>


      {/* Ratings & Reviews */}
      <section className="mt-16 md:mt-32 pt-16 border-t border-gray-100 px-4 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-20">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Ratings & Reviews</h2>
              <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                <span className="text-4xl font-black text-emerald-700">{averageRating}</span>
                <div className="flex flex-col">
                  <div className="flex gap-1 mb-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-emerald-600 text-emerald-600' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">{totalReviewCount} Verified Shoppers</span>
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-6">
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-8">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.review_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pb-8 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm">
                          {review.profiles?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-gray-900">{review.profiles?.name || 'Customer'}</p>
                          <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{formatDate(review.date)}</p>
                        </div>
                      </div>
                      <div className="bg-emerald-600 px-2.5 py-1 rounded flex items-center gap-1 shadow-sm shadow-emerald-600/20">
                         <span className="text-[11px] font-black text-white">{review.rating}</span>
                         <Star className="w-3 h-3 fill-white text-white" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-[14px] leading-relaxed pl-13 font-medium">"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">No reviews yet. Be the first to share!</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#f9fafa] p-8 rounded-[32px] border border-gray-100 sticky top-32">
              <h3 className="text-lg font-black mb-6 text-gray-900 uppercase">Rate Product</h3>
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star className={`w-7 h-7 ${star <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Tell us what you liked..."
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-600 min-h-[140px] text-[13px] font-medium"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[13px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SUBMIT REVIEW'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-6 font-medium text-[13px]">Login to write a review</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full border-2 border-gray-200 py-3.5 rounded-xl text-[12px] font-black text-gray-900 hover:border-black transition-all uppercase tracking-widest"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="mt-20 pt-16 border-t border-gray-100 px-4 sm:px-6 lg:px-12">
        <h2 className="text-[22px] font-serif text-gray-800 mb-8 tracking-wide">Recently Viewed</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           {allProducts
             .filter(p => p.product_id !== product.product_id && p.sale_type !== 'Store')
             .slice(0, 4)
             .map(p => <ProductCard key={p.product_id} product={p} />)
           }
        </div>
      </section>

      {/* Similar Products */}
      <section className="mt-24 pt-16 border-t border-gray-100 px-4 sm:px-6 lg:px-12">
        <h2 className="text-[22px] font-serif text-gray-800 mb-8 tracking-wide">Similar Products</h2>
        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide items-center">
          <button className="px-8 py-2.5 border border-indigo-600 text-indigo-600 rounded-full text-[13px] font-medium whitespace-nowrap bg-indigo-50/30">All</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">CASIO</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">Analog</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">Round</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">High rated</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           {allProducts
             .filter(p => p.product_id !== product.product_id && p.sale_type !== 'Store')
             .slice(0, 5)
             .map(p => <ProductCard key={p.product_id} product={p} />)
           }
        </div>
      </section>
    </div>
  );
};
