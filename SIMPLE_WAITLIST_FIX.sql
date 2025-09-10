-- Simple fix for waitlist RLS - Allow all access
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can add to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public waitlist signup" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public email check" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_access_policy" ON public.waitlist;

-- Disable RLS temporarily to test
ALTER TABLE public.waitlist DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with a simple policy
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create a very simple policy that allows everything
CREATE POLICY "allow_all_waitlist" ON public.waitlist
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
