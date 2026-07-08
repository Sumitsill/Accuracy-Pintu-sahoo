-- Run this script in your Supabase SQL Editor to create the resources table

-- 1. Create the resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subject text default 'Physics',
  topic text default 'General',
  type text not null check (type in ('note', 'dpp', 'test')),
  link text not null,
  target_batch text default 'All Students',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to read resources (We will filter on the frontend for now)
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
CREATE POLICY "Anyone can view resources" 
ON public.resources FOR SELECT 
USING (true);

-- Allow ONLY admins to insert/update/delete resources
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
CREATE POLICY "Admins can insert resources" 
ON public.resources FOR INSERT 
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
CREATE POLICY "Admins can update resources" 
ON public.resources FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;
CREATE POLICY "Admins can delete resources" 
ON public.resources FOR DELETE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
