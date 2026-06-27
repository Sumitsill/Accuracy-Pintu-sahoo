-- Run this entire script in your Supabase SQL Editor to configure leaderboard permissions

-- 1. Allow all authenticated users (including students) to view student profiles for leaderboard display names
DROP POLICY IF EXISTS "Allow select profiles for authenticated users" ON public.profiles;
CREATE POLICY "Allow select profiles for authenticated users"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Allow all authenticated users to view test results for leaderboard ranks and scores
DROP POLICY IF EXISTS "Allow select test results for authenticated users" ON public.test_results;
CREATE POLICY "Allow select test results for authenticated users"
ON public.test_results FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. Allow all authenticated users to view question-level user responses for subject-wise scoring breakdowns
DROP POLICY IF EXISTS "Allow select user responses for authenticated users" ON public.user_responses;
CREATE POLICY "Allow select user responses for authenticated users"
ON public.user_responses FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. Allow all authenticated users to view exam integrity reports for security compliance display
DROP POLICY IF EXISTS "Allow select integrity reports for authenticated users" ON public.exam_integrity_reports;
CREATE POLICY "Allow select integrity reports for authenticated users"
ON public.exam_integrity_reports FOR SELECT
USING (auth.role() = 'authenticated');
