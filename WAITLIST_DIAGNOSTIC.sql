-- ========================================
-- WAITLIST DIAGNOSTIC QUERIES
-- ========================================
-- Run these queries to diagnose the waitlist issues

-- 1. Check if RLS is enabled on waitlist table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'waitlist';

-- 2. Check existing policies on waitlist table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'waitlist';

-- 3. Check if waitlist table exists and has data
SELECT COUNT(*) as total_entries FROM public.waitlist;

-- 4. Test a simple SELECT query (this should work if policies are correct)
SELECT email, status, created_at 
FROM public.waitlist 
LIMIT 5;

-- 5. Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'waitlist' 
AND table_schema = 'public';

-- 6. Check if there are any constraints or issues
SELECT conname, contype, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'public.waitlist'::regclass;
