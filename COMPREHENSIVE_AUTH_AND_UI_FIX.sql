-- COMPREHENSIVE AUTHENTICATION AND UI FIX
-- This script fixes all the critical issues reported by the user

-- 1. First, ensure the users table exists with proper structure
DO $$ 
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN
        -- Create users table
        CREATE TABLE public.users (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            auth_user_id uuid NOT NULL UNIQUE,
            email text,
            profile_data jsonb DEFAULT '{}'::jsonb,
            preferences jsonb DEFAULT '{}'::jsonb,
            usage_data jsonb DEFAULT '{"tier": "free", "textCount": 0, "imageCount": 0, "lastMonth": "2025-01", "usageHistory": [], "tierHistory": [], "lastReset": "2025-01-01"}'::jsonb,
            app_state jsonb DEFAULT '{"lastVisited": "2025-01-01", "uiPreferences": {}, "featureFlags": {}, "appSettings": {"firstRunCompleted": false, "profileSetupCompleted": false}, "lastInteraction": "2025-01-01"}'::jsonb,
            behavior_data jsonb DEFAULT '{}'::jsonb,
            feedback_data jsonb DEFAULT '{}'::jsonb,
            onboarding_data jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT users_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- 2. Ensure games table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'games' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.games (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            title text NOT NULL,
            session_data jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT games_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created games table';
    ELSE
        RAISE NOTICE 'Games table already exists';
    END IF;
END $$;

-- 3. Ensure conversations table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversations' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.conversations (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            title text NOT NULL,
            messages jsonb DEFAULT '[]'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT conversations_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created conversations table';
    ELSE
        RAISE NOTICE 'Conversations table already exists';
    END IF;
END $$;

-- 4. Ensure analytics table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'analytics' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.analytics (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid,
            event_type text NOT NULL,
            event_data jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            CONSTRAINT analytics_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created analytics table';
    ELSE
        RAISE NOTICE 'Analytics table already exists';
    END IF;
END $$;

-- 5. Ensure tasks table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tasks' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.tasks (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            title text NOT NULL,
            description text,
            status text DEFAULT 'pending',
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT tasks_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created tasks table';
    ELSE
        RAISE NOTICE 'Tasks table already exists';
    END IF;
END $$;

-- 6. Ensure cache table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cache' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.cache (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            key text NOT NULL UNIQUE,
            value jsonb NOT NULL,
            expires_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT cache_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created cache table';
    ELSE
        RAISE NOTICE 'Cache table already exists';
    END IF;
END $$;

-- 7. Create or update onboarding_funnel table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'onboarding_funnel' AND table_schema = 'public'
    ) THEN
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
        
        RAISE NOTICE 'Created onboarding_funnel table';
    ELSE
        RAISE NOTICE 'Onboarding_funnel table already exists';
    END IF;
END $$;

-- 8. Create the user record for the authenticated user
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
    'mdamkhan@gmail.com',
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

-- 9. Drop all existing RLS policies to start fresh
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

DROP POLICY IF EXISTS "Users can view own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_funnel;

-- 10. Create new RLS policies with proper type casting
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

-- Onboarding funnel policies
CREATE POLICY "Users can view own onboarding" ON public.onboarding_funnel
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.onboarding_funnel
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.onboarding_funnel
    FOR UPDATE USING (auth.uid() = user_id);

-- 11. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_funnel ENABLE ROW LEVEL SECURITY;

-- 12. Test the fixes
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

-- Test onboarding funnel access
SELECT 'Onboarding funnel access test:' as test;
SELECT * FROM public.onboarding_funnel WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;

-- 13. Show all policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'Database fixes completed successfully!' as status;
