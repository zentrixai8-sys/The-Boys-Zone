import { supabase } from '../lib/supabase';

export const api = {
  async request(action: string, data: any = {}) {
    try {
      switch (action) {
        case 'getProducts': {
          const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return products;
        }

        case 'getCategories': {
          const { data: categories, error } = await supabase
            .from('categories')
            .select('*');
          if (error) throw error;
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
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('category_id', data.category_id);
          if (error) throw error;
          return true;
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
          const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', data.id);
          if (error) throw error;
          return true;
        }

        case 'login': {
          // Note: In a real app, you'd use supabase.auth.signInWithPassword
          // For this migration, we'll check the 'profiles' table to match existing logic
          const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', data.email)
            .eq('password', data.password)
            .single();
          
          if (error || !user) throw new Error('Invalid email or password');
          return user;
        }

        case 'register': {
          const { data: newUser, error } = await supabase
            .from('profiles')
            .insert([{
              name: data.name,
              email: data.email,
              phone: data.phone,
              password: data.password,
              role: 'user'
            }])
            .select()
            .single();
          
          if (error) throw error;
          return newUser;
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

        case 'uploadFile': {
          const { file, bucket, path } = data;
          const { data: uploadData, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(uploadData.path);
            
          return publicUrl;
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

        default:
          throw new Error(`Action ${action} not implemented for Supabase`);
      }
    } catch (error: any) {
      console.error(`Supabase Error (${action}):`, error);
      throw error;
    }
  }
};
