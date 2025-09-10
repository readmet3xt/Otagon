-- OPTIMIZED RLS AND USER FIX
-- This script fixes RLS policies with performance optimizations and removes duplicates
-- Uses (select auth.uid()) for better performance and removes old policies

-- 1. Create the user record for the authenticated user
INSERT INTO public.users (
    auth_user_id,
    email,
    tier,
    is_active,
    profile_data,
    preferences,
    usage_data,
    app_state,
    behavior_data,
    feedback_data,
    onboarding_data,
    created_at,
    updated_at,
    last_activity
) VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    'mdamkhan@gmail.com',
    'free',
    true,
    '{}',
    '{}',
    '{"tier": "free", "textCount": 0, "imageCount": 0, "lastMonth": "2025-01", "usageHistory": [], "tierHistory": [], "lastReset": "2025-01-01"}',
    '{"lastVisited": "2025-01-01", "uiPreferences": {}, "featureFlags": {}, "appSettings": {"firstRunCompleted": false, "profileSetupCompleted": false}, "lastInteraction": "2025-01-01"}',
    '{}',
    '{}',
    '{}',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW(),
    last_activity = NOW();

-- 2. Drop ALL existing RLS policies (including old ones)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;
DROP POLICY IF EXISTS "users_access_policy" ON public.users;

DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;
DROP POLICY IF EXISTS "games_access_policy" ON public.games;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_access_policy" ON public.conversations;

DROP POLICY IF EXISTS "Users can view cache" ON public.cache;
DROP POLICY IF EXISTS "Users can update cache" ON public.cache;
DROP POLICY IF EXISTS "Users can insert cache" ON public.cache;
DROP POLICY IF EXISTS "Users can delete cache" ON public.cache;
DROP POLICY IF EXISTS "cache_access_policy" ON public.cache;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;
DROP POLICY IF EXISTS "analytics_access_policy" ON public.analytics;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_access_policy" ON public.tasks;

-- Drop onboarding_funnel policies if they exist
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_funnel;

-- Drop waitlist duplicate policies
DROP POLICY IF EXISTS "Users can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_public_access" ON public.waitlist;
DROP POLICY IF EXISTS "Waitlist public access" ON public.waitlist;
DROP POLICY IF EXISTS "Waitlist public insert" ON public.waitlist;

-- 3. Create optimized RLS policies with (select auth.uid()) for performance
-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING ((select auth.uid()) = auth_user_id);

-- Games table policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Conversations table policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Cache table policies (global access)
CREATE POLICY "Users can view cache" ON public.cache
    FOR SELECT USING (true);

CREATE POLICY "Users can update cache" ON public.cache
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert cache" ON public.cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete cache" ON public.cache
    FOR DELETE USING (true);

-- Analytics table policies
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Tasks table policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Waitlist table policies (public access)
CREATE POLICY "Waitlist public access" ON public.waitlist
    FOR SELECT USING (true);

CREATE POLICY "Waitlist public insert" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- 4. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 5. Test the fixes
SELECT 'Testing database access...' as status;

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

-- 6. Show all policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'Database fixes completed successfully!' as status;
