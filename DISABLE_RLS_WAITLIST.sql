-- Completely disable RLS on waitlist table to get it working
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Anyone can add to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public waitlist signup" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public email check" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_access_policy" ON public.waitlist;
DROP POLICY IF EXISTS "allow_all_waitlist" ON public.waitlist;

-- Completely disable RLS on the waitlist table
ALTER TABLE public.waitlist DISABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to the anon role
GRANT ALL ON public.waitlist TO anon;
GRANT ALL ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
