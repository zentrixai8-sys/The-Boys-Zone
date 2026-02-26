import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';
import { 
  ShoppingBag, Star, Truck, ShieldCheck, RefreshCcw, 
  ChevronRight, Minus, Plus, MessageSquare, Send, 
  Loader2, ChevronLeft, Heart, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { ProductCard } from '../components/ProductCard';

export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const products = await api.request('getProducts');
        setAllProducts(products);
        const found = products.find((p: Product) => p.product_id === id);
        if (found) {
          setProduct(found);
          fetchReviews(found.product_id);
        } else {
          navigate('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

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

  if (loading) {
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

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      {/* Back Button */}
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8 w-fit cursor-pointer" onClick={() => navigate(-1)}>
        <ChevronLeft className="w-4 h-4" />
        <span>Back</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
        {/* Image Gallery / Carousel */}
        <div className="space-y-6">
          <div className="relative aspect-[4/5] bg-gray-50 rounded-[32px] overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                src={images[currentImageIndex] || 'https://picsum.photos/800/1000'} 
                alt={product.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-28 aspect-square rounded-[24px] overflow-hidden transition-all shrink-0 bg-gray-50 ${currentImageIndex === idx ? 'opacity-100 border-2 border-transparent' : 'opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col pt-2"
        >
          <div className="mb-6">
            <div className="flex justify-between items-start mb-3">
               <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest">{product.category}</span>
               <div className="flex gap-2">
                 <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                   <Heart className="w-4 h-4" />
                 </button>
                 <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                   <Share2 className="w-4 h-4" />
                 </button>
               </div>
            </div>
            <h1 className="text-4xl lg:text-4xl font-serif font-bold tracking-tight text-gray-900 mb-3">{product.title}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-orange-400 text-orange-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">({reviews.length} Reviews)</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-bold text-indigo-600">
                {formatPrice(product.discount_price || product.price)}
              </span>
              {product.discount_price && product.discount_price < product.price && (
                <span className="text-lg text-gray-400 line-through font-medium">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          <p className="text-[15px] font-medium text-gray-600 leading-relaxed mb-10 pr-4">
            {product.description || "A premium quality item designed for ultimate comfort and street style."}
          </p>

          <div className="space-y-10 mb-10">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Select Size</h3>
                <button className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4 decoration-indigo-600/30">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {['S', 'M', 'L', 'XL'].map(size => (
                  <button 
                    key={size}
                    onClick={() => {}}
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center text-sm font-bold transition-all ${product.size === size ? 'border-gray-900 bg-white text-gray-900 border-2' : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <button 
              onClick={() => addToCart(product, quantity)}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl text-base font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20"
            >
              <ShoppingBag className="w-5 h-5" /> Add to Cart
            </button>
          </div>

          <div className="flex flex-row justify-between items-center pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span className="text-[11px] font-bold uppercase text-indigo-900 tracking-wider">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="text-[11px] font-bold uppercase text-indigo-900 tracking-wider">1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCcw className="w-5 h-5 text-indigo-600" />
              <span className="text-[11px] font-bold uppercase text-indigo-900 tracking-wider">30-Day Returns</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Description Section */}
      <section className="mt-32 pt-20 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-serif font-bold mb-6 text-gray-900">Product Details</h2>
            <p className="text-gray-500 text-[15px] font-medium leading-relaxed">
              Experience the perfect blend of style and comfort with our premium {product.brand} {product.category}.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-gray-50/50 p-12 rounded-[32px] space-y-10 border border-gray-100">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg italic font-serif">
                  "{product.description || "No description available for this product."}"
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-10 border-t border-gray-200">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Category</h4>
                  <p className="font-bold text-[13px] text-gray-900">{product.category}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Brand</h4>
                  <p className="font-bold text-[13px] text-gray-900">{product.brand}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Color</h4>
                  <p className="font-bold text-[13px] text-gray-900">{product.color || 'Standard'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Material</h4>
                  <p className="font-bold text-[13px] text-gray-900">Premium Cotton Blend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-32 pt-20 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          {/* Review List */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-serif font-bold text-gray-900">Customer Reviews</h2>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-sans font-bold text-gray-900">{averageRating}</span>
                <div className="flex flex-col">
                  <div className="flex gap-1 mb-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{reviews.length} Verified Reviews</span>
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-40 bg-gray-50 rounded-[32px] animate-pulse" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-10">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.review_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-10 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden text-gray-900 font-serif font-bold text-lg">
                          {review.profiles?.avatar_url ? (
                            <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            review.profiles?.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-gray-900">{review.profiles?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">{new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed pl-16 font-serif italic">"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-gray-50/50 rounded-[32px] border border-gray-100">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-10 rounded-[32px] border border-gray-100 sticky top-32">
              <h3 className="text-xl font-serif font-bold mb-8 text-gray-900">Share Your Thoughts</h3>
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-8">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">Overall Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">Your Experience</label>
                    <textarea
                      required
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="What did you like or dislike about this product?"
                      className="w-full px-6 py-5 bg-white border border-gray-200 rounded-[24px] focus:outline-none focus:border-gray-900 focus:ring-0 min-h-[160px] text-[13px] font-medium placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-gray-900 text-white py-4 rounded-full text-[13px] font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Post Review</>}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-8 font-medium text-[13px]">Please login to share your experience with this product.</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full border-2 border-gray-200 py-4 rounded-full text-[13px] font-bold text-gray-900 hover:border-gray-900 transition-colors uppercase tracking-widest"
                  >
                    Login to Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="mt-20 pt-16 border-t border-gray-100">
        <h2 className="text-[22px] font-serif text-gray-800 mb-8 tracking-wide">Recently Viewed</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
           {allProducts
             .filter(p => p.product_id !== product.product_id)
             .slice(0, 1)
             .map(p => <ProductCard key={p.product_id} product={p} />)
           }
        </div>
      </section>

      {/* Similar Products */}
      <section className="mt-24 pt-16 border-t border-gray-100">
        <h2 className="text-[22px] font-serif text-gray-800 mb-8 tracking-wide">Similar Products</h2>
        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide items-center">
          <button className="px-8 py-2.5 border border-indigo-600 text-indigo-600 rounded-full text-[13px] font-medium whitespace-nowrap bg-indigo-50/30">All</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">CASIO</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">Analog</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">Round</button>
          <button className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium whitespace-nowrap hover:border-gray-300 hover:text-gray-900 transition-colors">High rated</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
           {allProducts
             .filter(p => p.product_id !== product.product_id)
             .slice(0, 5)
             .map(p => <ProductCard key={p.product_id} product={p} />)
           }
        </div>
      </section>
    </div>
  );
};
