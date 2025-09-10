-- COMPLETE DATABASE FIX
-- This script fixes all the remaining database issues

-- 1. First, let's check if the user exists in auth.users
SELECT 'Checking auth.users...' as status;
SELECT id, email, created_at FROM auth.users WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 2. Check if the user exists in public.users
SELECT 'Checking public.users...' as status;
SELECT * FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 3. Check if onboarding_funnel exists and what type it is
SELECT 'Checking onboarding_funnel...' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'onboarding_funnel' AND table_schema = 'public';

-- If it's a view, we'll skip table creation and just work with it as-is
-- If it doesn't exist, we'll create it as a table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'onboarding_funnel' AND table_schema = 'public'
    ) THEN
        -- Create as table if it doesn't exist
        CREATE TABLE public.onboarding_funnel (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid,
            step text NOT NULL,
            status text DEFAULT 'started'::text,
            started_at timestamp with time zone DEFAULT now(),
            completed_at timestamp with time zone,
            duration_ms integer,
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT onboarding_funnel_pkey PRIMARY KEY (id)
        );
        
        -- Add foreign key constraint
        ALTER TABLE public.onboarding_funnel 
        ADD CONSTRAINT onboarding_funnel_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id);
        
        RAISE NOTICE 'Created onboarding_funnel as table';
    ELSE
        RAISE NOTICE 'onboarding_funnel already exists, skipping creation';
    END IF;
END $$;

-- 4. If the user doesn't exist in public.users, create them manually
INSERT INTO public.users (
    auth_user_id,
    email,
    profile_data,
    preferences,
    usage_data,
    app_state,
    behavior_data,
    feedback_data,
    onboarding_data,
    created_at,
    updated_at
) VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    (SELECT email FROM auth.users WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30'),
    '{}',
    '{}',
    '{"tier": "free", "textCount": 0, "imageCount": 0, "lastMonth": "2025-01", "usageHistory": [], "tierHistory": [], "lastReset": "2025-01-01"}',
    '{"lastVisited": "2025-01-01", "uiPreferences": {}, "featureFlags": {}, "appSettings": {"firstRunCompleted": false, "profileSetupCompleted": false}, "lastInteraction": "2025-01-01"}',
    '{}',
    '{}',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- 5. Drop all existing RLS policies to start fresh
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

-- 6. Create new RLS policies with proper type casting
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

-- Onboarding funnel policies (only if it exists and is a table, not a view)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'onboarding_funnel' 
        AND table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    ) THEN
        CREATE POLICY "Users can view own onboarding" ON public.onboarding_funnel
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own onboarding" ON public.onboarding_funnel
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own onboarding" ON public.onboarding_funnel
            FOR UPDATE USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Created RLS policies for onboarding_funnel table';
    ELSE
        RAISE NOTICE 'onboarding_funnel is a view or does not exist, skipping RLS policies';
    END IF;
END $$;

-- 7. Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on onboarding_funnel only if it's a table (not a view)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'onboarding_funnel' 
        AND table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE public.onboarding_funnel ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on onboarding_funnel table';
    ELSE
        RAISE NOTICE 'onboarding_funnel is a view or does not exist, skipping RLS enablement';
    END IF;
END $$;

-- 8. Test the policies
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

-- 9. Show all policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
