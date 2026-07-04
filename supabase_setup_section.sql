-- Run this script in the Supabase SQL Editor to add section-wise support
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS section text DEFAULT 'Section A';
