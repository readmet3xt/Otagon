-- SIMPLE RLS AND USER FIX
-- This script only fixes RLS policies and creates the user record
-- Assumes all tables already exist in your Supabase

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

-- 2. Drop existing RLS policies (only if they exist)
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

DROP POLICY IF EXISTS "Users can view cache" ON public.cache;
DROP POLICY IF EXISTS "Users can update cache" ON public.cache;
DROP POLICY IF EXISTS "Users can insert cache" ON public.cache;
DROP POLICY IF EXISTS "Users can delete cache" ON public.cache;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- Drop onboarding_funnel policies if the table exists
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_funnel;

-- 3. Create new RLS policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (auth.uid() = auth_user_id);

-- Games table policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (auth.uid() = user_id);

-- Conversations table policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

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
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks table policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Onboarding funnel policies (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_funnel' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own onboarding" ON public.onboarding_funnel
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own onboarding" ON public.onboarding_funnel
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own onboarding" ON public.onboarding_funnel
            FOR UPDATE USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Created RLS policies for onboarding_funnel table';
    ELSE
        RAISE NOTICE 'onboarding_funnel table does not exist, skipping policies';
    END IF;
END $$;

-- 4. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on onboarding_funnel only if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_funnel' AND table_schema = 'public') THEN
        ALTER TABLE public.onboarding_funnel ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on onboarding_funnel table';
    ELSE
        RAISE NOTICE 'onboarding_funnel table does not exist, skipping RLS enablement';
    END IF;
END $$;

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

-- Test onboarding funnel access (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_funnel' AND table_schema = 'public') THEN
        RAISE NOTICE 'Onboarding funnel access test:';
        PERFORM * FROM public.onboarding_funnel WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;
    ELSE
        RAISE NOTICE 'Onboarding funnel does not exist, skipping test';
    END IF;
END $$;

-- 6. Show all policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'Database fixes completed successfully!' as status;
