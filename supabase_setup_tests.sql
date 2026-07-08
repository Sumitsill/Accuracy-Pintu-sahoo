-- Run this in the Supabase SQL Editor to set up or update the Exam tables

CREATE TABLE IF NOT EXISTS public.tests (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  exam_type text,
  difficulty integer,
  duration integer,
  target_batch text default 'All Students',
  exam_board text,
  target_class text,
  status text default 'live',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure all tests columns exist
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS target_batch text DEFAULT 'All Students';
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS exam_board text;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS target_class text;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS status text DEFAULT 'live';

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid default gen_random_uuid() primary key,
  test_id uuid references public.tests(id) on delete cascade,
  text text not null,
  question_type text default 'MCQ',
  subject text,
  explanation text,
  marks integer default 4,
  negative_marks integer default 1,
  question_number integer,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure all questions columns exist
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'MCQ';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS marks integer DEFAULT 4;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS negative_marks integer DEFAULT 1;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_number integer;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS public.options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade,
  text text not null,
  option_letter text,
  is_correct boolean default false
);

-- Ensure all options columns exist
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS option_letter text;

CREATE TABLE IF NOT EXISTS public.user_responses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  test_id uuid references public.tests(id),
  question_id uuid references public.questions(id),
  selected_option_id uuid references public.options(id),
  text_response text,
  is_correct boolean,
  attempt_number integer default 1,
  answered_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure all user_responses columns exist
ALTER TABLE public.user_responses ADD COLUMN IF NOT EXISTS text_response text;

-- RLS Policies
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "Admins full access tests" ON public.tests;
CREATE POLICY "Admins full access tests" ON public.tests 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  public.is_admin()
);

DROP POLICY IF EXISTS "Admins full access questions" ON public.questions;
CREATE POLICY "Admins full access questions" ON public.questions 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  public.is_admin()
);

DROP POLICY IF EXISTS "Admins full access options" ON public.options;
CREATE POLICY "Admins full access options" ON public.options 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  public.is_admin()
);

-- Students can read exams
DROP POLICY IF EXISTS "Students read tests" ON public.tests;
CREATE POLICY "Students read tests" ON public.tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students read questions" ON public.questions;
CREATE POLICY "Students read questions" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students read options" ON public.options;
CREATE POLICY "Students read options" ON public.options FOR SELECT USING (true);

-- Students can insert/read/update/delete their own responses
DROP POLICY IF EXISTS "Students insert responses" ON public.user_responses;
CREATE POLICY "Students insert responses" ON public.user_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students select responses" ON public.user_responses;
CREATE POLICY "Students select responses" ON public.user_responses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students update responses" ON public.user_responses;
CREATE POLICY "Students update responses" ON public.user_responses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students delete responses" ON public.user_responses;
CREATE POLICY "Students delete responses" ON public.user_responses FOR DELETE USING (auth.uid() = user_id);

-- Create Indexes for faster responses lookup/updates
CREATE INDEX IF NOT EXISTS idx_user_responses_lookup ON public.user_responses (user_id, test_id, attempt_number);

