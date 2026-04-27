import { supabase } from '../lib/supabase';
import axios from 'axios';

// Helper for social proof: Generate stable base ratings based on product id
const getRatingBase = (productId: string) => {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const count = 200 + (Math.abs(hash) % 101); // 200-300 reviews
  const baseAvg = 3.8 + ((Math.abs(hash * 31) % 12) / 10); // 3.8 - 5.0 base rating
  return { count, avg: baseAvg };
};

const SHOP_CACHE_KEY = 'tbz_shop_cache';
const sessionCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 300000; // 5 minutes

const getCachedData = () => {
  try {
    const cached = localStorage.getItem(SHOP_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
};
const saveToCache = (data: any) => {
  try {
    const current = getCachedData() || {};
    localStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({ ...current, ...data, timestamp: Date.now() }));
  } catch (e) { console.error('Cache save failed', e); }
};

export const api = {
  async request(action: string, data: any = {}) {
    // 1. Safe Cache Key Generation (Handles non-serializable objects like Files)
    let cacheKey = action;
    try {
      if (data && typeof data === 'object') {
        const safeData: any = {};
        for (const key in data) {
          if (data[key] instanceof File || data[key] instanceof Blob) {
            safeData[key] = '[File]';
          } else {
            safeData[key] = data[key];
          }
        }
        cacheKey += '_' + JSON.stringify(safeData);
      }
    } catch (e) {
      cacheKey += '_fallback';
    }

    // 2. Clear cache on mutations to ensure data consistency
    const mutations = [
      'addProduct', 'updateProduct', 'deleteProduct', 
      'addCategory', 'deleteCategory', 'updateCategory', 
      'createOrder', 'createStoreSale', 'updateOrderStatus', 'updateProfile',
      'addOffer', 'updateOffer', 'deleteOffer', 'addReview'
    ];
    if (mutations.includes(action)) {
      Object.keys(sessionCache).forEach(key => delete sessionCache[key]);
    }

    // 3. Check Session Cache (Memory Only - super fast)
    if (sessionCache[cacheKey] && (Date.now() - sessionCache[cacheKey].timestamp < CACHE_TTL)) {
      return sessionCache[cacheKey].data;
    }

    try {
      let result: any;
      switch (action) {
        case 'getProducts': {
          const { data: products, error: pError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (pError) throw pError;

          const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
          
          const statsMap = new Map<string, { count: number, sum: number }>();
          (reviews || []).forEach(r => {
            const current = statsMap.get(r.product_id) || { count: 0, sum: 0 };
            statsMap.set(r.product_id, {
              count: current.count + 1,
              sum: current.sum + (r.rating || 0)
            });
          });

          const productsWithRatings = products?.map(product => {
            const stats = statsMap.get(product.product_id) || { count: 0, sum: 0 };
            const { count: baseCount, avg: baseAvg } = getRatingBase(product.product_id);
            const totalCount = baseCount + stats.count;
            const finalAvg = ((baseAvg * baseCount) + stats.sum) / totalCount;

            return {
              ...product,
              rating: Number(finalAvg.toFixed(1)),
              reviewCount: totalCount
            };
          });

          result = { products: productsWithRatings || [] };
          saveToCache({ products: result.products });
          break;
        }

        case 'getProduct': {
          const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('product_id', data.id)
            .single();
          if (error) throw error;

          const { count: baseCount, avg: baseAvg } = getRatingBase(product.product_id);
          const { data: reviews } = await supabase.from('reviews').select('rating').eq('product_id', product.product_id);
          
          const realReviewCount = reviews?.length || 0;
          const realRatingSum = reviews?.reduce((sum, r) => sum + r.rating, 0) || 0;
          
          const totalCount = baseCount + realReviewCount;
          const finalAvg = ((baseAvg * baseCount) + realRatingSum) / totalCount;

          result = {
            ...product,
            rating: Number(finalAvg.toFixed(1)),
            reviewCount: totalCount
          };
          break;
        }

        case 'getBestSellers': {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('products');
          if (error) throw error;

          const productCounts: Record<string, number> = {};
          
          orders?.forEach(order => {
            try {
              const items = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
              if (Array.isArray(items)) {
                items.forEach((item: any) => {
                  const id = item.product_id || item.id;
                  if (id) {
                    productCounts[id] = (productCounts[id] || 0) + (item.quantity || 1);
                  }
                });
              }
            } catch (e) {
              console.warn('Failed to parse order products', e);
            }
          });

          const sortedProductIds = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => id);

          if (sortedProductIds.length === 0) {
             const { data: latestProducts } = await supabase.from('products').select('*').limit(5);
             result = latestProducts || [];
             break;
          }

          const { data: bestSellerProducts, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .in('product_id', sortedProductIds);
          
          if (prodErr) throw prodErr;

          const { data: reviews, error: rError } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', sortedProductIds);
          
          if (rError) throw rError;
          
          const productsWithRatings = bestSellerProducts.map(product => {
            const productReviews = reviews?.filter(r => r.product_id === product.product_id) || [];
            const realReviewCount = productReviews.length;
            const realRatingSum = productReviews.reduce((sum, r) => sum + r.rating, 0);
            const { count: baseCount, avg: baseAvg } = getRatingBase(product.product_id);
            
            const totalCount = baseCount + realReviewCount;
            const finalAvg = ((baseAvg * baseCount) + realRatingSum) / totalCount;

            return {
              ...product,
              rating: Number(finalAvg.toFixed(1)),
              reviewCount: totalCount
            };
          });

          result = productsWithRatings.sort((a, b) => 
            sortedProductIds.indexOf(a.product_id) - sortedProductIds.indexOf(b.product_id)
          );
          break;
        }

        case 'getCategories': {
          const { data: categories, error } = await supabase
            .from('categories')
            .select('*');
          if (error) throw error;
          saveToCache({ categories });
          result = categories;
          break;
        }

        case 'addCategory': {
          const { error } = await supabase
            .from('categories')
            .insert([data]);
          if (error) throw error;
          result = true;
          break;
        }

        case 'deleteCategory': {
          const { data: delCat, error: catDelErr } = await supabase
            .from('categories')
            .delete()
            .eq('category_id', data.category_id);
          if (catDelErr) throw catDelErr;
          result = delCat;
          break;
        }

        case 'updateCategory': {
          const { data: updCat, error: catUpdErr } = await supabase
            .from('categories')
            .update({
              category_name: data.category_name,
              image_url: data.image_url
            })
            .eq('category_id', data.category_id)
            .select()
            .single();
          if (catUpdErr) throw catUpdErr;
          result = updCat;
          break;
        }

        case 'addReview': {
          const { error } = await supabase
            .from('reviews')
            .insert([{
              product_id: data.product_id,
              user_id: data.user_id,
              rating: data.rating,
              comment: data.comment,
              date: new Date().toISOString()
            }]);
          if (error) throw error;
          result = true;
          break;
        }

        case 'getOffers': {
          const { data: offers, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          result = offers;
          break;
        }

        case 'addOffer': {
          const { error } = await supabase
            .from('offers')
            .insert([data]);
          if (error) throw error;
          result = true;
          break;
        }

        case 'deleteOffer': {
          const { data: delOffer, error: offerDelErr } = await supabase
            .from('offers')
            .delete()
            .eq('id', data.id);
          if (offerDelErr) throw offerDelErr;
          result = delOffer;
          break;
        }

        case 'updateOffer': {
          const { data: updOffer, error: offerUpdErr } = await supabase
            .from('offers')
            .update({
              title: data.title,
              description: data.description,
              link: data.link,
              image_url: data.image_url
            })
            .eq('id', data.id)
            .select()
            .single();
          if (offerUpdErr) throw offerUpdErr;
          result = updOffer;
          break;
        }

        case 'login': {
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          if (error) throw error;
          result = user;
          break;
        }

        case 'register': {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                name: data.name,
                phone: data.phone,
                role: 'user'
              }
            }
          });
          if (authError) throw authError;
          if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
             throw new Error('This email is already registered. Please login or reset your password.');
          }
          result = authData.user;
          break;
        }

        case 'forgotPassword': {
          const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: window.location.origin + '/reset-password',
          });
          if (error) throw error;
          result = true;
          break;
        }

        case 'verifyRecoveryOtp': {
          const { data: { session }, error } = await supabase.auth.verifyOtp({
            email: data.email,
            token: data.token,
            type: 'recovery'
          });
          if (error) throw error;
          result = session;
          break;
        }

        case 'resetPassword': {
          const { data: userData, error } = await supabase.auth.updateUser({
            password: data.password
          });
          if (error) throw error;
          
          if (userData.user) {
            await supabase.from('profiles').update({ password: data.password }).eq('id', userData.user.id);
          }
          result = true;
          break;
        }

        case 'verifyOtp': {
          const { data: { session }, error } = await supabase.auth.verifyOtp({
            email: data.email,
            token: data.token,
            type: 'signup'
          });
          if (error) throw error;
          if (!session) throw new Error('Verification failed');
          result = session.user;
          break;
        }

        case 'addProduct': {
          const { rating, reviewCount, ...insertData } = data;
          const { error } = await supabase
            .from('products')
            .insert([insertData]);
          if (error) throw error;
          result = true;
          break;
        }

        case 'updateProduct': {
          const { product_id, rating, reviewCount, ...updateData } = data;
          const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('product_id', product_id);
          if (error) throw error;
          result = true;
          break;
        }

        case 'deleteProduct': {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('product_id', data.product_id);
          if (error) throw error;
          result = true;
          break;
        }

        case 'createOrder': {
          const { error } = await supabase
            .from('orders')
            .insert([{
              user_id: data.user_id,
              products: typeof data.products === 'string' ? data.products : JSON.stringify(data.products),
              total_amount: Number(data.total_amount),
              payment_id: data.payment_id,
              payment_status: data.payment_status || 'Paid',
              order_status: 'Processing',
              address: data.address,
              date: new Date().toISOString()
            }]);
          if (error) {
            // SILENTLY LOG ERROR TO CATEGORIES TABLE FOR DEBUGGING
            await supabase.from('categories').insert([{ category_name: 'DEBUG_ERROR', image_url: JSON.stringify(error) }]);
            throw error;
          }
          result = true;
          break;
        }

        case 'getUserOrders': {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('*, profiles(name, phone)')
            .eq('user_id', data.user_id)
            .order('date', { ascending: false });
          if (error) throw error;
          result = orders || [];
          break;
        }

        case 'createStoreSale': {
          const invoiceId = `INV-${Date.now()}`;
          const itemsData = data.items.map((item: any) => ({
             invoice_id: invoiceId,
             customer_name: data.customer_name,
             customer_mobile: data.customer_mobile,
             category: item.category,
             product_name: item.productName,
             quantity: item.quantity,
             price: item.price,
             item_total: item.price * item.quantity,
             pdf_url: data.pdf_url || null,
             payment_method: data.payment_method || 'Cash'
          }));
          const { error } = await supabase
            .from('store_sales')
            .insert(itemsData);
          if (error) throw error;
          result = true;
          break;
        }

        case 'getTodaysSales': {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { data: rows, error } = await supabase
            .from('store_sales')
            .select('*')
            .gte('created_at', todayStart.toISOString())
            .order('created_at', { ascending: false });
          if (error) throw error;
          const invoiceMap = new Map<string, any>();
          for (const row of (rows || [])) {
            if (!invoiceMap.has(row.invoice_id)) {
              invoiceMap.set(row.invoice_id, {
                id: row.invoice_id,
                customer: row.customer_name || 'Walk-in',
                mobile: row.customer_mobile || 'N/A',
                time: new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                total: 0,
                itemsCount: 0,
                pdf_url: row.pdf_url || null,
                payment_method: row.payment_method || 'Cash',
                items: [],
                created_at: row.created_at
              });
            }
            const inv = invoiceMap.get(row.invoice_id);
            inv.total += Number(row.item_total) || 0;
            inv.itemsCount += 1;
            inv.items.push({
              productName: row.product_name,
              category: row.category,
              quantity: row.quantity,
              price: row.price,
              item_total: row.item_total
            });
          }
          result = Array.from(invoiceMap.values());
          break;
        }

        case 'createPendingPayment': {
          const { error } = await supabase
            .from('pending_payments')
            .insert([{
              invoice_id: data.invoice_id,
              customer_name: data.customer_name,
              customer_mobile: data.customer_mobile,
              total_amount: data.total_amount,
              items_summary: data.items_summary,
              status: 'pending',
            }]);
          if (error) throw error;
          result = true;
          break;
        }

        case 'getPendingPayments': {
          const { data: rows, error } = await supabase
            .from('pending_payments')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          result = rows || [];
          break;
        }

        case 'getAllPaymentLogs': {
          const { data: logs, error } = await supabase
            .from('payment_logs')
            .select('*')
            .order('paid_at', { ascending: false });
          if (error) throw error;
          result = logs || [];
          break;
        }

        case 'markPendingPaid': {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from('pending_payments')
            .update({ 
              status: 'paid', 
              paid_at: now, 
              paid_method: data.paid_method || 'Cash',
              amount_received: data.amount_received || null,
              proof_url: data.proof_url || null
            })
            .eq('id', data.id);
          if (error) throw error;
          await supabase.from('payment_logs').insert([{
            pending_payment_id: data.id,
            customer_name: data.customer_name || null,
            amount_paid: data.amount_received || data.total_amount,
            payment_method: data.paid_method || 'Cash',
            note: 'Full payment received',
            paid_at: now,
          }]);
          result = true;
          break;
        }

        case 'recordPartialPayment': {
          const { error } = await supabase
            .from('pending_payments')
            .update({ total_amount: data.remaining_amount })
            .eq('id', data.id);
          if (error) throw error;
          await supabase.from('payment_logs').insert([{
            pending_payment_id: data.id,
            customer_name: data.customer_name || null,
            amount_paid: data.amount_received,
            payment_method: data.paid_method || 'Cash',
            note: `Partial payment. Remaining: ₹${data.remaining_amount}`,
            paid_at: new Date().toISOString(),
          }]);
          result = true;
          break;
        }

        case 'createPaymentLog': {
          const { error } = await supabase.from('payment_logs').insert([{
            pending_payment_id: data.pending_payment_id,
            customer_name: data.customer_name || null,
            amount_paid: data.amount_paid,
            payment_method: data.payment_method || 'Cash',
            note: data.note || null,
            paid_at: new Date().toISOString(),
          }]);
          if (error) throw error;
          result = true;
          break;
        }

        case 'getPaymentLogs': {
          const { data: logs, error } = await supabase
            .from('payment_logs')
            .select('*')
            .eq('pending_payment_id', data.pending_payment_id)
            .order('paid_at', { ascending: false });
          if (error) throw error;
          result = logs || [];
          break;
        }

        case 'getOrders': {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('*, profiles(name, phone)')
            .order('date', { ascending: false });
          if (error) throw error;
          result = orders;
          break;
        }

        case 'updateOrderStatus': {
          const { error } = await supabase
            .from('orders')
            .update({ order_status: data.order_status })
            .eq('order_id', data.order_id);
          if (error) throw error;
          result = true;
          break;
        }

        case 'updateProfile': {
          const { id, ...updateData } = data;
          const { error } = await supabase.from('profiles').update(updateData).eq('id', id);
          if (error) throw error;
          if (updateData.name || updateData.phone || updateData.avatar_url) {
            await supabase.auth.updateUser({
              data: { name: updateData.name, phone: updateData.phone, avatar_url: updateData.avatar_url }
            });
          }
          result = true;
          break;
        }

        case 'uploadFile': {
          const { file } = data;
          const isPdf = file.name?.toLowerCase().endsWith('.pdf');
          const resourceType = isPdf ? 'raw' : 'auto';
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);

          // resource_type must go in the URL path, NOT in FormData
          const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Upload failed: ${response.status}`);
          }

          const resData = await response.json();
          result = resData.secure_url;
          break;
        }

        case 'getUsers': {
          const { data: users, error } = await supabase.from('profiles').select('*');
          if (error) throw error;
          result = users;
          break;
        }

        case 'getStoreSalesAll': {
          const { data: rows, error } = await supabase.from('store_sales').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const invoiceMap = new Map<string, any>();
          for (const row of (rows || [])) {
            if (!invoiceMap.has(row.invoice_id)) {
              invoiceMap.set(row.invoice_id, {
                id: row.invoice_id,
                customer: row.customer_name || 'Walk-in',
                mobile: row.customer_mobile || 'N/A',
                created_at: row.created_at,
                total: 0,
              });
            }
            const inv = invoiceMap.get(row.invoice_id);
            inv.total += Number(row.item_total) || 0;
          }
          result = Array.from(invoiceMap.values());
          break;
        }

        case 'getStoreSalesRaw': {
          const { data: rows, error } = await supabase.from('store_sales').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          result = rows || [];
          break;
        }

        default:
          throw new Error(`Action ${action} not implemented`);
      }

      // Final cache and return
      if (result !== undefined) {
        sessionCache[cacheKey] = { data: result, timestamp: Date.now() };
      }
      return result;

    } catch (error) {
      console.error(`API Error [${action}]:`, JSON.stringify(error, null, 2), error);

      throw error;
    }
  },
};
