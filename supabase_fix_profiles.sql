-- Run this script in your Supabase SQL Editor to populate missing student profiles
-- and backfill emails/roles for existing accounts.

-- 1. Insert missing profiles for users in auth.users and fix null emails/roles
INSERT INTO public.profiles (id, email, role, is_initialized)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'student'), 
  CASE WHEN raw_user_meta_data->>'role' IS NOT NULL THEN true ELSE false END
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
  email = COALESCE(public.profiles.email, EXCLUDED.email),
  role = COALESCE(public.profiles.role, EXCLUDED.role);
