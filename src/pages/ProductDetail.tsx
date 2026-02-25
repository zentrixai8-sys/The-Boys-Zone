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
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const products = await api.request('getProducts');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-black/40 mb-10 uppercase tracking-widest">
        <button onClick={() => navigate('/')} className="hover:text-black transition-colors">Home</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate('/products')} className="hover:text-black transition-colors">Products</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Gallery / Carousel */}
        <div className="space-y-6">
          <div className="relative aspect-[4/5] bg-black/5 rounded-3xl overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
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

            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
                <Heart className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-24 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all shrink-0 ${currentImageIndex === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
          className="flex flex-col"
        >
          <div className="mb-8">
            <p className="text-sm font-bold text-black/40 uppercase tracking-widest mb-2">{product.brand}</p>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-black mb-4">{product.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                ))}
                <span className="text-sm font-bold ml-1">{averageRating}</span>
              </div>
              <span className="text-black/20">|</span>
              <span className="text-sm text-black/40 font-medium">{reviews.length} Reviews</span>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-4xl font-bold text-black">
                {formatPrice(product.discount_price || product.price)}
              </span>
              {product.discount_price && product.discount_price < product.price && (
                <span className="text-xl text-black/40 line-through font-medium">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Inclusive of all taxes</p>
          </div>

          <div className="space-y-8 mb-12">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Select Size</h3>
                <button className="text-xs font-bold underline hover:text-black/60 transition-colors">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <button 
                    key={size}
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold transition-all ${product.size === size ? 'border-black bg-black text-white' : 'border-black/5 hover:border-black/20'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-black/40">Quantity</h3>
              <div className="flex items-center gap-8 bg-black/5 w-fit rounded-2xl px-6 py-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:bg-white rounded-lg transition-all">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:bg-white rounded-lg transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <button 
              onClick={() => addToCart(product, quantity)}
              className="flex-1 bg-black text-white py-6 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10"
            >
              <ShoppingBag className="w-6 h-6" /> Add to Cart
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-black/5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-black" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Free Express<br/>Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">100% Secure<br/>Checkout</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                <RefreshCcw className="w-6 h-6 text-black" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Easy 30-Day<br/>Returns</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Description Section */}
      <section className="mt-32 pt-20 border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-bold mb-4">Product Details</h2>
            <p className="text-black/40 text-sm font-medium leading-relaxed">
              Experience the perfect blend of style and comfort with our premium {product.brand} {product.category}.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-black/5 p-10 rounded-[40px] space-y-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Description</h3>
                <p className="text-black/70 leading-relaxed whitespace-pre-line text-lg italic font-serif">
                  "{product.description || "No description available for this product."}"
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-black/10">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Category</h4>
                  <p className="font-bold">{product.category}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Brand</h4>
                  <p className="font-bold">{product.brand}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Color</h4>
                  <p className="font-bold">{product.color || 'Standard'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Material</h4>
                  <p className="font-bold">Premium Cotton Blend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-32 pt-20 border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          {/* Review List */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Customer Reviews</h2>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">{averageRating}</span>
                <div className="flex flex-col">
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{reviews.length} Verified Reviews</span>
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-40 bg-black/5 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-10">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.review_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-10 border-b border-black/5 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center overflow-hidden text-white font-bold text-lg shadow-lg shadow-black/10">
                          {review.profiles?.avatar_url ? (
                            <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            review.profiles?.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-base">{review.profiles?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold">{new Date(review.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-black/60 text-base leading-relaxed pl-16 italic">"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-black/5 rounded-[40px] border-2 border-dashed border-black/10">
                <MessageSquare className="w-12 h-12 text-black/10 mx-auto mb-6" />
                <p className="text-black/40 font-bold uppercase tracking-widest text-sm">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[40px] border border-black/5 shadow-xl shadow-black/5 sticky top-24">
              <h3 className="text-2xl font-bold mb-8">Share Your Thoughts</h3>
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-8">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4 block">Overall Rating</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="p-1 transition-transform hover:scale-125"
                        >
                          <Star className={`w-8 h-8 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4 block">Your Experience</label>
                    <textarea
                      required
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="What did you like or dislike about this product?"
                      className="w-full px-6 py-5 bg-black/5 border-none rounded-3xl focus:ring-2 focus:ring-black min-h-[160px] text-base placeholder:text-black/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-black text-white py-5 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-black/10"
                  >
                    {submittingReview ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Post Review</>}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <p className="text-black/40 mb-8 font-medium">Please login to share your experience with this product.</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full border-2 border-black py-4 rounded-2xl font-bold hover:bg-black hover:text-white transition-all uppercase tracking-widest text-sm"
                  >
                    Login to Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
