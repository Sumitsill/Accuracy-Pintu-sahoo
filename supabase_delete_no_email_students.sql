-- Run this script in your Supabase SQL Editor to delete students
-- who do not have an email associated with their profile.

-- 1. Delete users from auth.users whose profile email is NULL or empty
DELETE FROM auth.users 
WHERE id IN (
  SELECT id FROM public.profiles WHERE email IS NULL OR email = ''
);

-- 2. Clean up profiles where email is NULL or empty (in case RLS or cascade leaves orphans)
DELETE FROM public.profiles 
WHERE email IS NULL OR email = '';
