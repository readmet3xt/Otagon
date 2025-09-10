-- NAVIGATION FLOW FIX
-- This script fixes the navigation flow issues by simplifying the onboarding logic

-- 1. Check if onboarding_funnel exists and what type it is
DO $$ 
BEGIN
    -- Check if onboarding_funnel exists as a view
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'onboarding_funnel' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'onboarding_funnel exists as a view - skipping table creation';
    -- Check if onboarding_funnel exists as a table
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'onboarding_funnel' AND table_schema = 'public' AND table_type = 'BASE TABLE'
    ) THEN
        RAISE NOTICE 'onboarding_funnel exists as a table - skipping creation';
    -- Create as table if it doesn't exist
    ELSE
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
        
        -- Add foreign key constraint only if it's a table
        ALTER TABLE public.onboarding_funnel 
        ADD CONSTRAINT onboarding_funnel_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id);
        
        RAISE NOTICE 'Created onboarding_funnel as table with foreign key constraint';
    END IF;
END $$;

-- 3. Create the missing user record for the authenticated user
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

-- 4. Fix RLS policies for all tables
-- Drop existing policies
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

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_funnel;

-- Create new policies
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

-- Onboarding funnel policies (only if it's a table, not a view)
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

-- 5. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
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

-- 6. Test the fixes
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

SELECT 'Database fixes completed successfully!' as status;
