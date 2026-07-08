-- Run this script in your Supabase SQL Editor to enable PDF file storage

-- 1. Create a public storage bucket named 'resources' (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Admins to upload files to this bucket
DROP POLICY IF EXISTS "Admins can upload PDFs" ON storage.objects;
CREATE POLICY "Admins can upload PDFs" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'resources' AND 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);

-- 3. Allow Admins to update/delete their files
DROP POLICY IF EXISTS "Admins can update PDFs" ON storage.objects;
CREATE POLICY "Admins can update PDFs" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'resources' AND 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete PDFs" ON storage.objects;
CREATE POLICY "Admins can delete PDFs" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'resources' AND 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);

-- 4. Allow Everyone (Students) to read and download the PDFs
CREATE POLICY "Anyone can download PDFs" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'resources'
);
