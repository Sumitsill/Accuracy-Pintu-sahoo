-- 1. Add attempt_number column to user_responses table
ALTER TABLE public.user_responses ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;

-- 2. Add UPDATE and DELETE policies for students on user_responses
DROP POLICY IF EXISTS "Students update responses" ON public.user_responses;
DROP POLICY IF EXISTS "Students delete responses" ON public.user_responses;

CREATE POLICY "Students update responses"
ON public.user_responses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Students delete responses"
ON public.user_responses FOR DELETE
USING (auth.uid() = user_id);
