import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';
import { ShoppingBag, Star, Truck, ShieldCheck, RefreshCcw, ChevronRight, Minus, Plus, MessageSquare, Send, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
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

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-black/40 mb-10 uppercase tracking-widest">
        <button onClick={() => navigate('/')}>Home</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate('/products')}>Products</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="aspect-[4/5] bg-black/5 rounded-3xl overflow-hidden">
            <img 
              src={product.image_url || 'https://picsum.photos/800/1000'} 
              alt={product.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-8">
            <p className="text-sm font-bold text-black/40 uppercase tracking-widest mb-2">{product.brand}</p>
            <h1 className="text-4xl font-bold tracking-tight text-black mb-4">{product.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                ))}
                <span className="text-sm font-bold ml-1">{averageRating}</span>
              </div>
              <span className="text-black/20">|</span>
              <span className="text-sm text-black/40">{reviews.length} Reviews</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold text-black">
                {formatPrice(product.discount_price || product.price)}
              </span>
              {product.discount_price && product.discount_price < product.price && (
                <span className="text-lg text-black/40 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 font-bold">Inclusive of all taxes</p>
          </div>

          <div className="space-y-6 mb-10">
            <div>
              <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-black/40">Select Size</h3>
              <div className="flex gap-3">
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <button 
                    key={size}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${product.size === size ? 'border-black bg-black text-white' : 'border-black/5 hover:border-black/20'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-black/40">Quantity</h3>
              <div className="flex items-center gap-6 bg-black/5 w-fit rounded-2xl px-4 py-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:bg-white rounded-lg transition-all">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:bg-white rounded-lg transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <button 
              onClick={() => addToCart(product, quantity)}
              className="flex-1 bg-black text-white py-5 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag className="w-5 h-5" /> Add to Cart
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-black/5">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-6 h-6 text-black/40" />
              <span className="text-xs font-bold uppercase tracking-tighter">Free Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="w-6 h-6 text-black/40" />
              <span className="text-xs font-bold uppercase tracking-tighter">Secure Checkout</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RefreshCcw className="w-6 h-6 text-black/40" />
              <span className="text-xs font-bold uppercase tracking-tighter">Easy Returns</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Description */}
      <section className="mt-20 pt-20 border-t border-black/5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Product Description</h2>
          <p className="text-black/60 leading-relaxed whitespace-pre-line">
            {product.description || "No description available for this product."}
          </p>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-20 pt-20 border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Review List */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{averageRating}</span>
                <div className="flex flex-col">
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{reviews.length} Reviews</span>
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-black/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-8">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.review_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-8 border-b border-black/5 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center overflow-hidden text-white font-bold text-sm">
                          {review.profiles?.avatar_url ? (
                            <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            review.profiles?.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{review.profiles?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-black/40 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-black/60 text-sm leading-relaxed">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-black/5 rounded-3xl border border-dashed border-black/10">
                <MessageSquare className="w-10 h-10 text-black/10 mx-auto mb-4" />
                <p className="text-black/40">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6">Write a Review</h3>
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-3 block">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/10'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-3 block">Comment</label>
                    <textarea
                      required
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Share your thoughts about this product..."
                      className="w-full px-4 py-3 bg-black/5 border-none rounded-2xl focus:ring-2 focus:ring-black min-h-[120px] text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-black/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Review</>}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-black/40 mb-6">Please login to share your experience with this product.</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full border-2 border-black py-3 rounded-2xl font-bold hover:bg-black hover:text-white transition-all"
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
