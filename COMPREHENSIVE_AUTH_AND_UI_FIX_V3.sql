-- COMPREHENSIVE AUTHENTICATION AND UI FIX V3
-- This script fixes all the critical issues based on the ACTUAL Supabase schema
-- Matches the real database structure provided by the user

-- 1. First, ensure the users table exists with proper structure (matching actual schema)
DO $$ 
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN
        -- Create users table matching the actual schema
        CREATE TABLE public.users (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            auth_user_id uuid UNIQUE,
            email text NOT NULL UNIQUE,
            tier text DEFAULT 'free'::text CHECK (tier = ANY (ARRAY['free'::text, 'premium'::text, 'pro'::text])),
            is_active boolean DEFAULT true,
            profile_data jsonb DEFAULT '{}'::jsonb,
            preferences jsonb DEFAULT '{}'::jsonb,
            usage_data jsonb DEFAULT '{}'::jsonb,
            app_state jsonb DEFAULT '{}'::jsonb,
            behavior_data jsonb DEFAULT '{}'::jsonb,
            feedback_data jsonb DEFAULT '{}'::jsonb,
            onboarding_data jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            last_activity timestamp with time zone DEFAULT now(),
            CONSTRAINT users_pkey PRIMARY KEY (id),
            CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
        );
        
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- 2. Ensure games table exists (matching actual schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'games' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.games (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid,
            game_id text NOT NULL,
            game_data jsonb DEFAULT '{}'::jsonb,
            progress_data jsonb DEFAULT '{}'::jsonb,
            session_data jsonb DEFAULT '{}'::jsonb,
            title text NOT NULL,
            genre text,
            platform ARRAY,
            solutions_data jsonb DEFAULT '{}'::jsonb,
            context_data jsonb DEFAULT '{}'::jsonb,
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            last_played timestamp with time zone DEFAULT now(),
            CONSTRAINT games_pkey PRIMARY KEY (id),
            CONSTRAINT games_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
        );
        
        RAISE NOTICE 'Created games table';
    ELSE
        RAISE NOTICE 'Games table already exists';
    END IF;
END $$;

-- 3. Ensure conversations table exists (matching actual schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversations' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.conversations (
            id text NOT NULL,
            user_id uuid,
            game_id uuid,
            title text NOT NULL,
            messages jsonb DEFAULT '[]'::jsonb,
            context jsonb DEFAULT '{}'::jsonb,
            insights jsonb DEFAULT '{}'::jsonb,
            objectives jsonb DEFAULT '{}'::jsonb,
            ai_data jsonb DEFAULT '{}'::jsonb,
            is_active boolean DEFAULT true,
            is_pinned boolean DEFAULT false,
            progress integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            last_interaction timestamp with time zone DEFAULT now(),
            CONSTRAINT conversations_pkey PRIMARY KEY (id),
            CONSTRAINT conversations_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
            CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
        );
        
        RAISE NOTICE 'Created conversations table';
    ELSE
        RAISE NOTICE 'Conversations table already exists';
    END IF;
END $$;

-- 4. Ensure analytics table exists (matching actual schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'analytics' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.analytics (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid,
            game_id uuid,
            conversation_id text,
            event_type text NOT NULL,
            category text NOT NULL,
            event_data jsonb DEFAULT '{}'::jsonb,
            performance_data jsonb DEFAULT '{}'::jsonb,
            cost_data jsonb DEFAULT '{}'::jsonb,
            behavior_data jsonb DEFAULT '{}'::jsonb,
            feedback_data jsonb DEFAULT '{}'::jsonb,
            timestamp timestamp with time zone DEFAULT now(),
            CONSTRAINT analytics_pkey PRIMARY KEY (id),
            CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
            CONSTRAINT analytics_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
            CONSTRAINT analytics_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
        );
        
        RAISE NOTICE 'Created analytics table';
    ELSE
        RAISE NOTICE 'Analytics table already exists';
    END IF;
END $$;

-- 5. Ensure tasks table exists (matching actual schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tasks' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.tasks (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid,
            game_id uuid,
            conversation_id text,
            due_date timestamp with time zone,
            completed_at timestamp with time zone,
            task_data jsonb DEFAULT '{}'::jsonb,
            progress_data jsonb DEFAULT '{}'::jsonb,
            favorites_data jsonb DEFAULT '{}'::jsonb,
            modifications jsonb DEFAULT '{}'::jsonb,
            status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text])),
            priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
            category text DEFAULT 'custom'::text CHECK (category = ANY (ARRAY['custom'::text, 'story'::text, 'exploration'::text, 'combat'::text, 'achievement'::text])),
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT tasks_pkey PRIMARY KEY (id),
            CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
            CONSTRAINT tasks_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
            CONSTRAINT tasks_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
        );
        
        RAISE NOTICE 'Created tasks table';
    ELSE
        RAISE NOTICE 'Tasks table already exists';
    END IF;
END $$;

-- 6. Ensure cache table exists (matching actual schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cache' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.cache (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            cache_key text NOT NULL UNIQUE,
            cache_type text NOT NULL,
            expires_at timestamp with time zone,
            cache_data jsonb NOT NULL DEFAULT '{}'::jsonb,
            metadata jsonb DEFAULT '{}'::jsonb,
            performance_data jsonb DEFAULT '{}'::jsonb,
            access_count integer DEFAULT 0,
            size_bytes bigint DEFAULT 0,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            last_accessed timestamp with time zone DEFAULT now(),
            CONSTRAINT cache_pkey PRIMARY KEY (id)
        );
        
        RAISE NOTICE 'Created cache table';
    ELSE
        RAISE NOTICE 'Cache table already exists';
    END IF;
END $$;

-- 7. Create the user record for the authenticated user
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

-- 8. Drop all existing RLS policies to start fresh (only if tables exist)
DO $$ 
BEGIN
    -- Drop users policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own data" ON public.users;
        DROP POLICY IF EXISTS "Users can update own data" ON public.users;
        DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
        DROP POLICY IF EXISTS "Users can delete own data" ON public.users;
    END IF;

    -- Drop games policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'games' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own games" ON public.games;
        DROP POLICY IF EXISTS "Users can update own games" ON public.games;
        DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
        DROP POLICY IF EXISTS "Users can delete own games" ON public.games;
    END IF;

    -- Drop conversations policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
        DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
        DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
        DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
    END IF;

    -- Drop cache policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cache' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view cache" ON public.cache;
        DROP POLICY IF EXISTS "Users can update cache" ON public.cache;
        DROP POLICY IF EXISTS "Users can insert cache" ON public.cache;
        DROP POLICY IF EXISTS "Users can delete cache" ON public.cache;
    END IF;

    -- Drop analytics policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
        DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;
    END IF;

    -- Drop tasks policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
        DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
        DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
        DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
    END IF;
END $$;

-- 9. Create new RLS policies with proper type casting
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

-- 10. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 11. Test the fixes
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

-- Test analytics access
SELECT 'Analytics access test:' as test;
SELECT * FROM public.analytics WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;

-- Test tasks access
SELECT 'Tasks access test:' as test;
SELECT * FROM public.tasks WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;

-- 12. Show all policies
SELECT 'Current RLS policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'Database fixes completed successfully!' as status;
