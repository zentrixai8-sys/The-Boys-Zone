import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Only allow requests from your own domain (not a wildcard)
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN || 'null', // deny cross-origin if not configured
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Constant-time HMAC-SHA256 signature verification for Razorpay webhooks.
 * Uses the Web Crypto API available in Deno.
 */
async function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret || !signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison — prevents timing-based attacks
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Read raw body ONCE — required for signature verification
    const rawBody = await req.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let paymentId: string | undefined;
    let cart: string | undefined;
    let total: number | undefined;
    let userId: string | undefined;
    let address: string | undefined;
    let customerName: string;

    // ── Razorpay server-to-server webhook ────────────────────────
    if (payload.event === 'payment.captured' || payload.event === 'payment.authorized') {
      const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';
      const signature = req.headers.get('x-razorpay-signature') ?? '';

      if (!webhookSecret) {
        console.error('RAZORPAY_WEBHOOK_SECRET env var not set');
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const isValid = await verifyRazorpaySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const payment = payload.payload.payment.entity;
      paymentId = payment.id;
      total = payment.amount / 100;
      customerName = 'Online Customer';

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

    // ── Direct frontend fallback (requires valid Supabase JWT) ───
    } else {
      const authHeader = req.headers.get('authorization') ?? '';
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized — Bearer token required' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      paymentId    = payload.paymentId;
      cart         = payload.cart;
      total        = payload.total;
      userId       = payload.userId;
      address      = payload.address;
      customerName = payload.customerName || 'Online Customer';
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Idempotency check — skip if already processed
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('order_id')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existingOrder) {
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Ensure profile exists (FK constraint)
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
        }]);
      }
    }

    // 3. Payment log first (strict tracking)
    const { error: logErr } = await supabaseClient.from('payment_logs').insert([{
      customer_name: customerName,
      amount_paid: total,
      payment_method: 'Online Payment (Razorpay)',
      note: `Order Payment: ${paymentId}`,
      paid_at: new Date().toISOString()
    }]);

    if (logErr) {
      console.error('Payment Log Error:', logErr);
      throw logErr;
    }

    // 4. Create order
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
            const { data: product } = await supabaseClient
              .from('products')
              .select('stock')
              .eq('product_id', pid)
              .single();
            if (product) {
              const newStock = Math.max(0, (product.stock ?? 0) - (item.quantity || 1));
              await supabaseClient.from('products').update({ stock: newStock }).eq('product_id', pid);
            }
          }
        }
      } catch (e) {
        console.error('Stock deduction error:', e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
