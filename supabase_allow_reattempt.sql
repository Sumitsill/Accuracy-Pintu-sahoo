-- Run this in your Supabase SQL Editor to enable the Admin Re-attempt feature.
-- This grants Admins the permission to delete test results, user responses,
-- security violations, and session integrity reports (allowing students to take the exam again).

-- 1. Allow Admins to delete test results
DROP POLICY IF EXISTS "Admins can delete all test results" ON public.test_results;
CREATE POLICY "Admins can delete all test results"
ON public.test_results FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- 2. Allow Admins to delete exam violations
DROP POLICY IF EXISTS "Admins can delete all violations" ON public.exam_violations;
CREATE POLICY "Admins can delete all violations"
ON public.exam_violations FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- 3. Allow Admins to delete exam integrity reports
DROP POLICY IF EXISTS "Admins can delete all integrity reports" ON public.exam_integrity_reports;
CREATE POLICY "Admins can delete all integrity reports"
ON public.exam_integrity_reports FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- 4. Allow Admins to delete student responses
DROP POLICY IF EXISTS "Admins can delete all user responses" ON public.user_responses;
CREATE POLICY "Admins can delete all user responses"
ON public.user_responses FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);
