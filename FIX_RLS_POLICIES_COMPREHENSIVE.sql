-- COMPREHENSIVE RLS POLICY FIX
-- This script ensures all RLS policies are properly configured

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view own cache" ON public.cache;
DROP POLICY IF EXISTS "Users can update own cache" ON public.cache;
DROP POLICY IF EXISTS "Users can insert own cache" ON public.cache;
DROP POLICY IF EXISTS "Users can delete own cache" ON public.cache;

-- 2. Create comprehensive RLS policies for users table
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (auth.uid() = auth_user_id::uuid);

-- 3. Create comprehensive RLS policies for games table
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- 4. Create comprehensive RLS policies for conversations table
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- 5. Create comprehensive RLS policies for cache table (global cache, no user_id)
CREATE POLICY "Users can view cache" ON public.cache
    FOR SELECT USING (true);

CREATE POLICY "Users can update cache" ON public.cache
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert cache" ON public.cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete cache" ON public.cache
    FOR DELETE USING (true);

-- 6. Create RLS policies for analytics table
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Create RLS policies for tasks table
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 9. Test the policies
SELECT 'Testing RLS policies...' as status;

-- Test user access
SELECT 'User record access test:' as test;
SELECT auth_user_id, email FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- Test games access
SELECT 'Games access test:' as test;
SELECT * FROM public.games WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;

-- Test conversations access
SELECT 'Conversations access test:' as test;
SELECT * FROM public.conversations WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;

-- Test cache access
SELECT 'Cache access test:' as test;
SELECT * FROM public.cache LIMIT 1;

-- 8. Show all policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
