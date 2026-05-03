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



/**
 * Compresses an image File using Canvas API.
 * Resizes to max 1280px dimension and encodes at fixed 85% JPEG quality.
 * Quality never drops — only dimensions are reduced if needed.
 */
const compressImage = (file: File, maxDimension = 1280): Promise<File> => {
  return new Promise((resolve) => {
    // Only compress image types (not PDF, video, etc.)
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // High-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Fixed 85% quality — looks sharp, still much smaller than original
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
};

export const api = {
  async request(action: string, data: any = {}) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out. Please check your connection.')), 15000)
    );

    const requestLogic = async () => {
      let result: any;
      switch (action) {
        case 'getProducts': {
          const limit = data.limit || 1000;
          const { data: products, error: pError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
            
          if (pError) throw pError;

          // Fetch only necessary reviews in one go
          const productIds = products.map(p => p.product_id);
          const { data: reviews } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', productIds);
          
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
            .select('products')
            .order('date', { ascending: false })
            .limit(50);
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
          if (!data.user_id) throw new Error('User ID is required to create an order');
          
          // --- PRE-FLIGHT CHECK: Ensure Profile Exists to prevent FK constraint error ---
          const { error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user_id)
            .single();
            
          if (profileCheckError && profileCheckError.code === 'PGRST116') {
            // Profile missing, auto-create a basic one to satisfy FK constraint
            await supabase.from('profiles').upsert([{
              id: data.user_id,
              name: 'Customer',
              email: `customer_${Date.now()}@temp.com`, // Dummy email to satisfy NOT NULL constraint
              password: 'auto_generated'
            }]);
          }

          const orderData = {
            user_id: data.user_id,
            products: typeof data.products === 'string' ? data.products : JSON.stringify(data.products),
            total_amount: Number(data.total_amount) || 0,
            payment_id: data.payment_id || `INTERNAL_${Date.now()}`,
            payment_status: data.payment_status || 'Paid',
            order_status: data.order_status || 'Processing',
            address: data.address || '',
            date: new Date().toISOString()
          };

          const { data: newOrder, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
            
          if (error) {
            console.error('Critical Order Creation Error:', error);
            throw error;
          }
          
          // --- AUTO STOCK DEDUCTION (Online) ---
          try {
            const orderItems = typeof data.products === 'string' ? JSON.parse(data.products) : data.products;
            if (Array.isArray(orderItems)) {
              for (const item of orderItems) {
                const pid = item.product_id || item.id;
                if (!pid) continue;

                // 1. Get current product state
                const { data: product } = await supabase.from('products').select('*').eq('product_id', pid).single();
                if (!product) continue;

                const qty = Number(item.quantity || 1);
                const v = product.variants ? (typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants) : [];
                
                let sizeFound = false;
                if (v && v.length > 0) {
                  v.forEach((variant: any) => {
                    if (variant.sizes) {
                      const targetSize = variant.sizes.find((s: any) => String(s.size) === String(item.selectedSize || item.size));
                      if (targetSize) {
                        targetSize.online_stock = Math.max(0, (targetSize.online_stock || 0) - qty);
                        targetSize.stock = (targetSize.store_stock || 0) + (targetSize.online_stock || 0);
                        sizeFound = true;
                      }
                    }
                  });

                  // Fallback to first size if not found
                  if (!sizeFound && v[0].sizes && v[0].sizes.length > 0) {
                    const s = v[0].sizes[0];
                    s.online_stock = Math.max(0, (s.online_stock || 0) - qty);
                    s.stock = (s.store_stock || 0) + (s.online_stock || 0);
                  }
                }

                // 2. Update stock
                const newTotalStock = Math.max(0, (product.stock || 0) - qty);
                await supabase.from('products')
                  .update({ 
                    stock: newTotalStock, 
                    variants: v 
                  })
                  .eq('product_id', pid);
              }
            }
          } catch (stockErr) {
            console.error('Online stock deduction failed:', stockErr);
            // Don't throw, we don't want to break the success message for the user if only stock sync failed
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
          
          const { error } = await supabase.from('store_sales').insert(itemsData);
          if (error) throw error;

          // --- AUTO STOCK DEDUCTION (Store) ---
          try {
            for (const item of data.items) {
              const pid = item.productId;
              if (!pid) continue;

              const { data: product } = await supabase.from('products').select('*').eq('product_id', pid).single();
              if (!product) continue;

              const qty = Number(item.quantity || 1);
              const v = product.variants ? (typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants) : [];
              
              let sizeFound = false;
              if (v && v.length > 0) {
                v.forEach((variant: any) => {
                  if (variant.sizes) {
                    const targetSize = variant.sizes.find((s: any) => String(s.size) === String(item.size));
                    if (targetSize) {
                      targetSize.store_stock = Math.max(0, (targetSize.store_stock || 0) - qty);
                      targetSize.stock = (targetSize.store_stock || 0) + (targetSize.online_stock || 0);
                      sizeFound = true;
                    }
                  }
                });

                if (!sizeFound && v[0].sizes && v[0].sizes.length > 0) {
                  const s = v[0].sizes[0];
                  s.store_stock = Math.max(0, (s.store_stock || 0) - qty);
                  s.stock = (s.store_stock || 0) + (s.online_stock || 0);
                }
              }

              const newTotalStock = Math.max(0, (product.stock || 0) - qty);
              await supabase.from('products').update({ stock: newTotalStock, variants: v }).eq('product_id', pid);
            }
          } catch (stockErr) {
            console.error('Store stock deduction failed:', stockErr);
          }

          result = true;
          break;
        }

        case 'deleteStoreSale': {
          const { error } = await supabase
            .from('store_sales')
            .delete()
            .eq('invoice_id', data.invoice_id);
          if (error) throw error;
          result = true;
          break;
        }

        case 'updateStoreSale': {
          const { invoice_id, customer_name, customer_mobile, payment_method } = data;
          const { error } = await supabase
            .from('store_sales')
            .update({ customer_name, customer_mobile, payment_method })
            .eq('invoice_id', invoice_id);
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
          
          // 1. Update Profiles table only for existing columns
          const profileFields = ['name', 'phone', 'avatar_url', 'password'];
          const profileUpdates: any = {};
          profileFields.forEach(f => {
            if (updateData[f] !== undefined) profileUpdates[f] = updateData[f];
          });

          if (Object.keys(profileUpdates).length > 0) {
            const { error: pError } = await supabase.from('profiles').update(profileUpdates).eq('id', id);
            if (pError) throw pError;
          }

          // 2. Update Auth User Metadata for all fields (including address fields)
          const authUpdates: any = {};
          const allFields = ['name', 'phone', 'avatar_url', 'address', 'district', 'state', 'pincode'];
          allFields.forEach(f => {
            if (updateData[f] !== undefined) authUpdates[f] = updateData[f];
          });

          if (Object.keys(authUpdates).length > 0) {
            const { error: aError } = await supabase.auth.updateUser({
              data: authUpdates
            });
            if (aError) throw aError;
          }

          result = true;
          break;
        }

        case 'uploadFile': {
          const { file, bucket, path } = data;
          
          if (bucket) {
             // Upload to Supabase Storage
             const { data: uploadData, error } = await supabase.storage
               .from(bucket)
               .upload(path || `uploads/${Date.now()}_${file.name}`, file, {
                 cacheControl: '3600',
                 upsert: false
               });
             if (error) throw error;
             
             const { data: { publicUrl } } = supabase.storage
               .from(bucket)
               .getPublicUrl(uploadData.path);
               
             result = publicUrl;
             break;
          }

          const isPdf = file.name?.toLowerCase().endsWith('.pdf');
          const isVideo = file.type?.startsWith('video/');
          const resourceType = isPdf ? 'image' : isVideo ? 'video' : 'auto';
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

          // Compress image before upload (non-destructive — PDF/video skip compression)
          const fileToUpload = (!isPdf && !isVideo) ? await compressImage(file, 1280) : file;

          const formData = new FormData();
          formData.append('file', fileToUpload);
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

        case 'getCustomers': {
          const { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .order('name', { ascending: true });
          if (error) throw error;
          result = customers || [];
          break;
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
          result = newCustomer;
          break;
        }

        default:
          throw new Error(`Action ${action} not implemented`);
      }
      return result;
    };

    try {
      return await Promise.race([requestLogic(), timeoutPromise]);
    } catch (error) {
      console.error(`API Error [${action}]:`, error);
      throw error;
    }
  },

  // Real-time helper methods
  subscribe(table: string, callback: (payload: any) => void) {
    const channel = supabase.channel(`realtime_${table}_${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => callback(payload)
      )
      .subscribe();
    return channel;
  },

  unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};
