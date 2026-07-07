-- Run this script in the Supabase SQL Editor to add board and class fields to tests
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS exam_board text;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS target_class text;
