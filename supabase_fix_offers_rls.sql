-- First, disable row level security on the offers table to allow public access
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;

-- Grant permissions to public and authenticated users just in case
GRANT ALL ON TABLE public.offers TO anon;
GRANT ALL ON TABLE public.offers TO authenticated;
GRANT ALL ON TABLE public.offers TO service_role;
