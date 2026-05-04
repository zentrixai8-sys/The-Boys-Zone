import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    
    let paymentId, cart, total, userId, address, customerName;
    
    // Check if called from Razorpay Webhook
    if (payload.event === 'payment.captured' || payload.event === 'payment.authorized') {
       const payment = payload.payload.payment.entity;
       paymentId = payment.id;
       total = payment.amount / 100;
       
       if (payment.notes) {
          userId = payment.notes.userId;
          address = payment.notes.address;
          customerName = payment.notes.customerName || 'Online Customer';
          
          let cartStr = '';
          for (let i = 0; i < 15; i++) {
             if (payment.notes[`c${i}`]) {
                 cartStr += payment.notes[`c${i}`];
             }
          }
          if (cartStr) cart = cartStr;
       }
    } else {
       // Called directly from frontend
       paymentId = payload.paymentId;
       cart = payload.cart;
       total = payload.total;
       userId = payload.userId;
       address = payload.address;
       customerName = payload.customerName || 'Online Customer';
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "No payment ID" }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Check if already processed
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('order_id')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existingOrder) {
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), { 
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Ensure profile exists
    if (userId) {
        const { error: profileErr } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (profileErr && profileErr.code === 'PGRST116') {
          await supabaseClient.from('profiles').upsert([{
            id: userId,
            name: customerName,
            email: `customer_${Date.now()}@temp.com`,
            password: 'auto_generated'
          }]);
        }
    }

    // 3. Payment Log FIRST (Strict requirement)
    const { error: logErr } = await supabaseClient.from('payment_logs').insert([{
      customer_name: customerName,
      amount_paid: total,
      payment_method: 'Online Payment (Razorpay)',
      note: `Order Payment: ${paymentId}`,
      paid_at: new Date().toISOString()
    }]);

    if (logErr) {
       console.error("Payment Log Error:", logErr);
       throw logErr;
    }

    // 4. Create Order server-side
    if (userId && cart && address) {
        const { error: orderErr } = await supabaseClient.from('orders').insert([{
          user_id: userId,
          products: cart, 
          total_amount: total,
          payment_id: paymentId,
          payment_status: 'Paid',
          order_status: 'Processing',
          address: address,
          date: new Date().toISOString()
        }]);
        if (orderErr) throw orderErr;
        
        // Non-blocking stock deduction
        try {
            const items = JSON.parse(cart);
            if (Array.isArray(items)) {
              for (const item of items) {
                const pid = item.product_id || item.id;
                if (!pid) continue;
                const { data: product } = await supabaseClient.from('products').select('*').eq('product_id', pid).single();
                if (product) {
                  const newStock = Math.max(0, (product.stock ?? 0) - (item.quantity || 1));
                  await supabaseClient.from('products').update({ stock: newStock }).eq('product_id', pid);
                }
              }
            }
        } catch (e) {
            console.error("Stock deduction error:", e);
        }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
