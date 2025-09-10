-- Fix RLS policies for waitlist table - Single policy approach
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Anyone can add to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public waitlist signup" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public email check" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_access_policy" ON public.waitlist;

-- Create a single comprehensive policy for all operations (optimized)
CREATE POLICY "waitlist_access_policy" ON public.waitlist
    FOR ALL USING (
        -- Allow all operations for unauthenticated users (anon role)
        (select auth.role()) = 'anon' OR
        -- Allow all operations for authenticated users
        (select auth.role()) = 'authenticated' OR
        -- Allow all operations for service role
        (select auth.role()) = 'service_role' OR
        -- Allow all operations for dashboard users
        (select auth.role()) = 'dashboard_user'
    );
