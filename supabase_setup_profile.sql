-- 1. Ensure avatar_url column exists in profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the "profile" storage bucket if it doesn't exist (ensure it is public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile', 'profile', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Drop existing policies to prevent conflicts if they exist
DROP POLICY IF EXISTS "Profile images public read" ON storage.objects;
DROP POLICY IF EXISTS "Profile images insert" ON storage.objects;
DROP POLICY IF EXISTS "Profile images update" ON storage.objects;
DROP POLICY IF EXISTS "Profile images delete" ON storage.objects;

-- 4. Setup storage policies for the "profile" bucket
-- Allow public read access to the images
CREATE POLICY "Profile images public read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile');

-- Allow any user to upload (since the app might not use Supabase Auth directly)
CREATE POLICY "Profile images insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile');

CREATE POLICY "Profile images update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile');

CREATE POLICY "Profile images delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'profile');
