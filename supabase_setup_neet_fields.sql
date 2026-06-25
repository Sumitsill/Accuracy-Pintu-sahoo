-- Run this script in the Supabase SQL Editor to update the database schema
-- for the NEET Mock Test parser and dynamic marking features.

-- 1. Update tests table
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- 2. Update questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS marks integer DEFAULT 4;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS negative_marks integer DEFAULT 1;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_number integer;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Update options table
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS option_letter text;

-- 4. Enable any missing storage permissions (if required)
-- If the resources bucket is not public, this ensures we can access question images.
UPDATE storage.buckets SET public = true WHERE id = 'resources';
