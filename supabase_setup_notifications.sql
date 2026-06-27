-- Run this entire script in your Supabase SQL Editor to set up the notifications table and RLS policies

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade, -- specific recipient (optional, e.g. for direct alerts)
  recipient_role text check (recipient_role in ('student', 'admin', 'all')) default 'all',
  title text not null,
  message text not null,
  type text not null, -- 'test_submit', 'dpp_submit', 'new_dpp', 'new_test', 'new_note', etc.
  target_batch text default 'All Students', -- for targeting specific student batches
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Configure Policies for notifications
DROP POLICY IF EXISTS "Allow select based on role and user_id" ON public.notifications;
CREATE POLICY "Allow select based on role and user_id" ON public.notifications
FOR SELECT USING (
  -- If it's explicitly assigned to the user
  user_id = auth.uid()
  OR (
    user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        -- Admins can read admin notifications
        (role = 'admin' AND recipient_role = 'admin')
        -- Students can read student notifications targeting their batch
        OR (role = 'student' AND recipient_role = 'student' AND (target_batch = 'All Students' OR target_batch = batch))
      )
    )
  )
);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.notifications;
CREATE POLICY "Allow insert for authenticated users" ON public.notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow update for users who can read" ON public.notifications;
CREATE POLICY "Allow update for users who can read" ON public.notifications
FOR UPDATE USING (
  user_id = auth.uid()
  OR (
    user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);
