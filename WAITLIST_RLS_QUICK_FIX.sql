-- ========================================
-- WAITLIST RLS QUICK FIX - ESSENTIAL POLICIES ONLY
-- ========================================
-- This fixes the 401 Unauthorized error immediately
-- Run this in your Supabase SQL Editor

-- Add missing SELECT policy for waitlist table
-- This allows checking if an email already exists without authentication
CREATE POLICY "Anyone can check waitlist emails" ON public.waitlist
  FOR SELECT USING (true);

-- Add UPDATE policy for waitlist status changes (for admin use)
CREATE POLICY "Anyone can update waitlist status" ON public.waitlist
  FOR UPDATE USING (true);

-- Add DELETE policy for waitlist cleanup (for admin use)
CREATE POLICY "Anyone can delete waitlist entries" ON public.waitlist
  FOR DELETE USING (true);

-- ========================================
-- VERIFICATION
-- ========================================
-- After running this, test with:
-- SELECT * FROM public.waitlist LIMIT 5;
