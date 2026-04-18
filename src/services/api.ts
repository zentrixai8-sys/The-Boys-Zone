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

// Caching Helpers
const SHOP_CACHE_KEY = 'tbz_shop_cache';
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
    try {
      switch (action) {
        case 'getProducts': {
          const { data: products, error: pError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (pError) throw pError;

          const { data: reviews, error: rError } = await supabase
            .from('review_summaries') // Using a summary view for speed if available, fallback to reviews
            .select('*');
          
          let reviewsData = reviews;
          if (rError) {
             const { data: rawReviews } = await supabase.from('reviews').select('product_id, rating');
             reviewsData = rawReviews;
          }

          const productsWithRatings = products?.map(product => {
            const productReviews = reviewsData?.filter(r => r.product_id === product.product_id) || [];
            const realReviewCount = productReviews.length;
            const realRatingSum = productReviews.reduce((sum, r) => sum + (r.rating || 0), 0);

            const { count: baseCount, avg: baseAvg } = getRatingBase(product.product_id);
            const totalCount = baseCount + realReviewCount;
            const finalAvg = ((baseAvg * baseCount) + realRatingSum) / totalCount;

            return {
              ...product,
              rating: Number(finalAvg.toFixed(1)),
              reviewCount: totalCount
            };
          });

          const result = { products: productsWithRatings || [] };
          saveToCache({ products: result.products });
          return result;
        }

        case 'getBestSellers': {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('products');
          if (error) throw error;

          const productCounts: Record<string, number> = {};
          
          orders?.forEach(order => {
            try {
              // Parse if it's a string, or use directly if Supabase already parsed it
              const items = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
              if (Array.isArray(items)) {
                items.forEach((item: any) => {
                  const id = item.product_id || item.id; // Support both naming conventions
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
             // Fallback to latest products if no orders yet
             const { data: latestProducts } = await supabase.from('products').select('*').limit(5);
             return latestProducts || [];
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

            // Simulation: 200-300 base reviews
            const { count: baseCount, avg: baseAvg } = getRatingBase(product.product_id);
            
            const totalCount = baseCount + realReviewCount;
            const finalAvg = ((baseAvg * baseCount) + realRatingSum) / totalCount;

            return {
              ...product,
              rating: Number(finalAvg.toFixed(1)),
              reviewCount: totalCount
            };
          });

          // Re-sort to maintain the best-seller order
          return productsWithRatings.sort((a, b) => 
            sortedProductIds.indexOf(a.product_id) - sortedProductIds.indexOf(b.product_id)
          );
        }

        case 'getCategories': {
          const { data: categories, error } = await supabase
            .from('categories')
            .select('*');
          if (error) throw error;
          saveToCache({ categories });
          return categories;
        }

        case 'addCategory': {
          const { error } = await supabase
            .from('categories')
            .insert([data]);
          if (error) throw error;
          return true;
        }

        case 'deleteCategory': {
          const { data: delCat, error: catDelErr } = await supabase
            .from('categories')
            .delete()
            .eq('category_id', data.category_id);
          if (catDelErr) throw catDelErr;
          return delCat;
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
          return updCat;
        }

        case 'getOffers': {
          const { data: offers, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return offers;
        }

        case 'addOffer': {
          const { error } = await supabase
            .from('offers')
            .insert([data]);
          if (error) throw error;
          return true;
        }

        case 'deleteOffer': {
          const { data: delOffer, error: offerDelErr } = await supabase
            .from('offers')
            .delete()
            .eq('id', data.id);
          if (offerDelErr) throw offerDelErr;
          return delOffer;
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
          return updOffer;
        }

        case 'login': {
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          
          if (error) throw error;
          if (!user) throw new Error('Login failed');
          
          return user;
        }

        case 'register': {
          // 1. Sign up user in Supabase Auth
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

          // Supabase unique email check: If user exists but identities is empty, it means already registered
          if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
             throw new Error('This email is already registered. Please login or reset your password.');
          }
          
          return authData.user;
        }

        case 'verifyOtp': {
          const { data: { session }, error } = await supabase.auth.verifyOtp({
            email: data.email,
            token: data.token,
            type: 'signup'
          });

          if (error) throw error;
          if (!session) throw new Error('Verification failed');
          
          return session.user;
        }

        case 'addProduct': {
          const { error } = await supabase
            .from('products')
            .insert([data]);
          if (error) throw error;
          return true;
        }

        case 'updateProduct': {
          const { product_id, ...updateData } = data;
          const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('product_id', product_id);
          if (error) throw error;
          return true;
        }

        case 'deleteProduct': {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('product_id', data.product_id);
          if (error) throw error;
          return true;
        }

        case 'createOrder': {
          const { error } = await supabase
            .from('orders')
            .insert([{
              user_id: data.user_id,
              products: data.products,
              total_amount: data.total_amount,
              payment_id: data.payment_id,
              payment_status: data.payment_status,
              order_status: 'Processing',
              address: data.address
            }]);
          if (error) throw error;
          return true;
        }

        case 'createStoreSale': {
          // Generate a single invoice ID for all items in this sale
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
             pdf_url: data.pdf_url || null
          }));
          
          const { error } = await supabase
            .from('store_sales')
            .insert(itemsData);
            
          if (error) throw error;
          return true;
        }

        case 'getOrders': {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('*, profiles(name, phone)')
            .order('date', { ascending: false });
          if (error) throw error;
          return orders;
        }

        case 'updateOrderStatus': {
          const { error } = await supabase
            .from('orders')
            .update({ order_status: data.order_status })
            .eq('order_id', data.order_id);
          if (error) throw error;
          return true;
        }

        case 'updateProfile': {
          const { id, ...updateData } = data;
          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id);
          if (error) throw error;
          
          // Sync DP/name with auth metadata for instant UI hydration on refresh
          if (updateData.avatar_url !== undefined || updateData.name || updateData.phone) {
            await supabase.auth.updateUser({
              data: {
                name: updateData.name,
                phone: updateData.phone,
                avatar_url: updateData.avatar_url
              }
            });
          }
          
          // Sync with customers table
          if (updateData.name || updateData.phone || updateData.address) {
            const customerData: any = {};
            if (updateData.name) customerData.name = updateData.name;
            if (updateData.phone) customerData.mobile = updateData.phone;
            if (updateData.address !== undefined) customerData.address = updateData.address;
            customerData.user_id = id;

            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('id')
              .eq('user_id', id)
              .maybeSingle();

            if (existingCustomer) {
              await supabase.from('customers').update(customerData).eq('id', existingCustomer.id);
            } else {
              await supabase.from('customers').insert([customerData]);
            }
          }
          
          return true;
        }

        case 'forgotPassword': {
          // This triggers the Reset Password email (using {{ .Token }} for OTP)
          const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${window.location.origin}/forgot-password?step=reset`,
          });
          if (error) throw error;
          return true;
        }

        case 'verifyRecoveryOtp': {
          const { data: { session }, error } = await supabase.auth.verifyOtp({
            email: data.email,
            token: data.token,
            type: 'recovery'
          });
          if (error) throw error;
          return session;
        }

        case 'resetPassword': {
          const { error } = await supabase.auth.updateUser({
            password: data.password
          });
          if (error) throw error;
          return true;
        }

        case 'uploadFile': {
          const { file } = data;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

          const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData
          );

          return response.data.secure_url;
        }

        case 'getReviews': {
          const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*, profiles(name, avatar_url)')
            .eq('product_id', data.product_id)
            .order('date', { ascending: false });
          if (error) throw error;
          return reviews;
        }

        case 'addReview': {
          const { error } = await supabase
            .from('reviews')
            .insert([data]);
          if (error) throw error;
          return true;
        }

        case 'createCustomer': {
          const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert([{
              name: data.name,
              mobile: data.mobile,
              address: data.address
            }])
            .select()
            .single();
          if (error) throw error;
          return newCustomer;
        }

        case 'getUsers': {
          const { data: users, error } = await supabase
            .from('profiles')
            .select('*');
          if (error) throw error;
          return users;
        }

        case 'getCustomers': {
          const { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .order('name', { ascending: true });
          if (error) throw error;
          return customers;
        }

        case 'getStoreSalesRaw': {
          // Returns individual item rows for category/chart analysis
          const { data: rows, error } = await supabase
            .from('store_sales')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return rows || [];
        }

        case 'getStoreSalesAll': {
          // Fetch all store sales and group by invoice_id for dashboard stats
          const { data: rows, error } = await supabase
            .from('store_sales')
            .select('*')
            .order('created_at', { ascending: false });
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
                itemsCount: 0,
              });
            }
            const inv = invoiceMap.get(row.invoice_id);
            inv.total += Number(row.item_total) || 0;
            inv.itemsCount += 1;
          }
          return Array.from(invoiceMap.values());
        }

        default:
          throw new Error(`Action ${action} not implemented for Supabase`);
      }
    } catch (error: any) {
      console.error(`Supabase Error (${action}):`, error);
      throw error;
    }
  }
};
