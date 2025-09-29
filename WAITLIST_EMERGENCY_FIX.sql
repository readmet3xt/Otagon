-- ========================================
-- WAITLIST EMERGENCY FIX
-- ========================================
-- This fixes the 401 Unauthorized error by ensuring proper permissions

-- 1. First, let's check what we have
SELECT 'Current policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'waitlist';

-- 2. Ensure the table has proper permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 3. Grant table permissions explicitly
GRANT ALL ON public.waitlist TO anon;
GRANT ALL ON public.waitlist TO authenticated;

-- 4. Ensure RLS is enabled but policies allow public access
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 5. Create a simple policy that definitely works
DROP POLICY IF EXISTS "Public access to waitlist" ON public.waitlist;
CREATE POLICY "Public access to waitlist" ON public.waitlist
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Test access
SELECT 'Test query result:' as info, COUNT(*) as count FROM public.waitlist;
