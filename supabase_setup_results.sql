-- Run this script in the Supabase SQL Editor to set up test results logging
-- and grant the Admin Command Center permissions to view student details and answers.

-- 1. Create the test_results table if it does not exist
CREATE TABLE IF NOT EXISTS public.test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  test_id uuid references public.tests(id) on delete cascade not null,
  score integer not null,
  total_questions integer not null,
  correct_count integer not null,
  incorrect_count integer not null,
  exam_type text,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure profiles table has email, full_name, school_name, batch, aspiration, phone columns
-- (These are usually created by Next.js client integrations, but this ensures they exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aspiration text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. Enable Row Level Security (RLS) on test_results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- 3. Configure Policies for test_results
DROP POLICY IF EXISTS "Users can insert own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can view own test results" ON public.test_results;
DROP POLICY IF EXISTS "Admins can view all test results" ON public.test_results;

CREATE POLICY "Users can insert own test results"
ON public.test_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own test results"
ON public.test_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all test results"
ON public.test_results FOR SELECT
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');


-- 4. Grant Admin Permissions to view Student Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');


-- 5. Grant Admin Permissions to view Question-level Student Answers
DROP POLICY IF EXISTS "Admins can view all user responses" ON public.user_responses;

CREATE POLICY "Admins can view all user responses"
ON public.user_responses FOR SELECT
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');


-- 6. Re-configure Security Violations & Integrity Reports Policies using robust JWT role checking
DROP POLICY IF EXISTS "Admins can view all violations" ON public.exam_violations;
DROP POLICY IF EXISTS "Admins can view all integrity reports" ON public.exam_integrity_reports;

CREATE POLICY "Admins can view all violations"
ON public.exam_violations FOR SELECT
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins can view all integrity reports"
ON public.exam_integrity_reports FOR SELECT
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');


-- 7. Grant Admin Permissions to delete test results, violations, integrity reports, and user responses (for Re-attempt feature)
DROP POLICY IF EXISTS "Admins can delete all test results" ON public.test_results;
CREATE POLICY "Admins can delete all test results"
ON public.test_results FOR DELETE
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can delete all violations" ON public.exam_violations;
CREATE POLICY "Admins can delete all violations"
ON public.exam_violations FOR DELETE
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can delete all integrity reports" ON public.exam_integrity_reports;
CREATE POLICY "Admins can delete all integrity reports"
ON public.exam_integrity_reports FOR DELETE
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can delete all user responses" ON public.user_responses;
CREATE POLICY "Admins can delete all user responses"
ON public.user_responses FOR DELETE
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- 8. Create Indexes for faster rank, percentile, and leaderboard queries
CREATE INDEX IF NOT EXISTS idx_test_results_test_id_score ON public.test_results (test_id, score);

