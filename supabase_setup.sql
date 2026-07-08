-- Run this entire script in your Supabase SQL Editor

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('student', 'admin')),
  class text,
  board text,
  school_name text,
  batch text DEFAULT 'Unassigned',
  aspiration text,
  phone text,
  is_initialized boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure all columns exist for existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch text DEFAULT 'Unassigned';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aspiration text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Automatically create profile on user signup
-- This trigger will read the role and class we send during sign up!
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, class, is_initialized)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'class',
    true -- Automatically initialize them since we collect data at signup!
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
