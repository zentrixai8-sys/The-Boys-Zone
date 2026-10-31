-- ============================================================
-- SECURITY FIXES — Run these in Supabase SQL Editor
-- Generated: 2026-10-31
-- ============================================================

-- ── FIX H3: Re-enable RLS on offers table ──────────────────
-- The previous migration (supabase_fix_offers_rls.sql) disabled
-- RLS and granted ALL privileges to anon, allowing unauthenticated
-- users to add/delete offers. This reverses that.

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Revoke the blanket grant given to anon
REVOKE ALL ON TABLE public.offers FROM anon;
GRANT SELECT ON TABLE public.offers TO anon;
GRANT ALL   ON TABLE public.offers TO authenticated;
GRANT ALL   ON TABLE public.offers TO service_role;

-- Drop any old policies first to avoid conflicts
DROP POLICY IF EXISTS "Public can view offers"   ON public.offers;
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;

-- Allow anyone to read offers (for the storefront banner)
CREATE POLICY "Public can view offers"
ON public.offers FOR SELECT
USING (true);

-- Only admins can insert / update / delete offers
-- This checks the role stored in Supabase Auth JWT metadata
CREATE POLICY "Admins can manage offers"
ON public.offers FOR ALL
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);


-- ── FIX H2: RLS on sensitive admin tables ──────────────────
-- orders, store_sales, payment_logs, pending_payments should
-- only be fully accessible by admins. Users can only see their own orders.

-- ORDERS: users see their own, admins see all
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own orders"  ON public.orders;
DROP POLICY IF EXISTS "Admins manage orders"  ON public.orders;

CREATE POLICY "Users see own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage orders"
ON public.orders FOR ALL
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- SERVICE ROLE bypasses RLS automatically — no policy needed for the webhook.


-- ── FIX M4: Secure the profile storage bucket ──────────────
-- Previously any request (no auth required) could upload or delete files.

-- Drop the overly-permissive policies
DROP POLICY IF EXISTS "Profile images insert" ON storage.objects;
DROP POLICY IF EXISTS "Profile images update" ON storage.objects;
DROP POLICY IF EXISTS "Profile images delete" ON storage.objects;

-- Users can only upload files into their own folder (profile/<their-uid>/*)
CREATE POLICY "Profile images insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update their own files
CREATE POLICY "Profile images update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own files
CREATE POLICY "Profile images delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ── FIX H1: Remove password column from profiles ───────────
-- Passwords were being stored in plaintext. Supabase Auth handles
-- hashed credentials. This column is both redundant and dangerous.
-- NOTE: Run only after confirming no app code reads this column.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS password;


-- ── FIX L2: Server-side COD limit enforcement ──────────────
-- Enforce the ₹300 Cash-on-Delivery limit at the database level
-- so it cannot be bypassed from the frontend.

CREATE OR REPLACE FUNCTION check_cod_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'Pending (COD)' AND NEW.total_amount > 300 THEN
    RAISE EXCEPTION 'Cash on Delivery is only available for orders up to ₹300.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_cod_limit ON public.orders;

CREATE TRIGGER enforce_cod_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION check_cod_limit();


-- ── REMINDER: Set these Supabase Edge Function secrets ─────
-- In your Supabase dashboard → Edge Functions → Secrets, add:
--
--   RAZORPAY_WEBHOOK_SECRET  = <your Razorpay webhook secret>
--   ALLOWED_ORIGIN           = https://your-production-domain.com
--
-- Without RAZORPAY_WEBHOOK_SECRET the webhook will reject all
-- Razorpay events with a 500 error.
-- ============================================================
