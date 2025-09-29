-- ========================================
-- WAITLIST TEST AND FIX
-- ========================================
-- This addresses potential issues with the waitlist table

-- 1. Ensure RLS is properly configured
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 2. Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Anyone can check waitlist emails" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can update waitlist status" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can delete waitlist entries" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- 3. Recreate policies with explicit permissions
CREATE POLICY "Anyone can check waitlist emails" ON public.waitlist
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update waitlist status" ON public.waitlist
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete waitlist entries" ON public.waitlist
  FOR DELETE USING (true);

-- 4. Grant explicit permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;

-- 5. Test the table access
SELECT 'Test successful' as status, COUNT(*) as entry_count FROM public.waitlist;
