-- Run this in the Supabase SQL Editor to set up or update the Exam tables

CREATE TABLE IF NOT EXISTS public.tests (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  exam_type text,
  difficulty integer,
  duration integer,
  target_batch text default 'All Students',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- If the table already exists, just add the target_batch column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tests' AND column_name='target_batch') THEN
    ALTER TABLE public.tests ADD COLUMN target_batch text DEFAULT 'All Students';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid default gen_random_uuid() primary key,
  test_id uuid references public.tests(id) on delete cascade,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean default false
);

CREATE TABLE IF NOT EXISTS public.user_responses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  test_id uuid references public.tests(id),
  question_id uuid references public.questions(id),
  selected_option_id uuid references public.options(id),
  is_correct boolean,
  attempt_number integer default 1,
  answered_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access tests" ON public.tests USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "Admins full access questions" ON public.questions USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "Admins full access options" ON public.options USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Students can read exams
CREATE POLICY "Students read tests" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Students read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Students read options" ON public.options FOR SELECT USING (true);

-- Students can insert/read/update/delete their own responses
CREATE POLICY "Students insert responses" ON public.user_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students select responses" ON public.user_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students update responses" ON public.user_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Students delete responses" ON public.user_responses FOR DELETE USING (auth.uid() = user_id);

-- Create Indexes for faster responses lookup/updates
CREATE INDEX IF NOT EXISTS idx_user_responses_lookup ON public.user_responses (user_id, test_id, attempt_number);

