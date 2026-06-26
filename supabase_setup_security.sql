-- Run this in the Supabase SQL Editor to set up the security tables
-- for the anti-cheat monitor and exam integrity reports.

-- 1. Create the exam_violations table
CREATE TABLE IF NOT EXISTS public.exam_violations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  test_id uuid references public.tests(id) on delete cascade not null,
  violation_type text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()),
  action_taken text not null
);

-- 2. Create the exam_integrity_reports table
CREATE TABLE IF NOT EXISTS public.exam_integrity_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  test_id uuid references public.tests(id) on delete cascade not null,
  total_violations integer default 0,
  violation_summary text,
  status text not null check (status in ('normal', 'warned', 'submitted_due_to_violation')),
  device_info jsonb,
  generated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.exam_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_integrity_reports ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent conflict
DROP POLICY IF EXISTS "Users can insert own violations" ON public.exam_violations;
DROP POLICY IF EXISTS "Users can view own violations" ON public.exam_violations;
DROP POLICY IF EXISTS "Admins can view all violations" ON public.exam_violations;
DROP POLICY IF EXISTS "Users can insert own integrity report" ON public.exam_integrity_reports;
DROP POLICY IF EXISTS "Users can view own integrity report" ON public.exam_integrity_reports;
DROP POLICY IF EXISTS "Admins can view all integrity reports" ON public.exam_integrity_reports;

-- 5. Create Policies for exam_violations
CREATE POLICY "Users can insert own violations" 
ON public.exam_violations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own violations" 
ON public.exam_violations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all violations" 
ON public.exam_violations FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 6. Create Policies for exam_integrity_reports
CREATE POLICY "Users can insert own integrity report" 
ON public.exam_integrity_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own integrity report" 
ON public.exam_integrity_reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all integrity reports" 
ON public.exam_integrity_reports FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can delete violations and integrity reports (for Re-attempt feature)
DROP POLICY IF EXISTS "Admins can delete all violations" ON public.exam_violations;
CREATE POLICY "Admins can delete all violations"
ON public.exam_violations FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete all integrity reports" ON public.exam_integrity_reports;
CREATE POLICY "Admins can delete all integrity reports"
ON public.exam_integrity_reports FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
