-- ========================================
-- COMPLETE DATABASE DEPLOYMENT SCRIPT
-- ========================================
-- This script deploys the complete database schema and all functions
-- to fix all 404 and 400 errors in the console
--
-- CRITICAL: This will reset your entire database!
-- Make sure to backup any important data before running this.

-- ========================================
-- STEP 1: NUCLEAR DROP - DESTROY EVERYTHING
-- ========================================

-- Drop ALL views and tables
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ========================================
-- STEP 2: CREATE CONSOLIDATED TABLES
-- ========================================

-- ========================================
-- 1. APP_LEVEL (Parent) - System & Global Data
-- ========================================

CREATE TABLE public.app_level (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL, -- 'system', 'cache', 'knowledge', 'admin'
    key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, key)
);

-- ========================================
-- 2. USERS (Parent) - All User-Related Data
-- ========================================

CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL UNIQUE,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro')),
    is_active BOOLEAN DEFAULT true,
    
    -- Consolidated user data (was 15+ separate tables)
    profile_data JSONB DEFAULT '{}',     -- user_profiles, player_profiles
    preferences JSONB DEFAULT '{}',      -- user_preferences, app preferences
    usage_data JSONB DEFAULT '{}',       -- usage tracking, tier limits
    app_state JSONB DEFAULT '{}',        -- app state, UI preferences
    behavior_data JSONB DEFAULT '{}',    -- user_behavior, analytics
    feedback_data JSONB DEFAULT '{}',    -- user_feedback, ai_feedback
    onboarding_data JSONB DEFAULT '{}',  -- onboarding_funnel, first_run
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. GAMES (Parent) - All Game-Related Data
-- ========================================

CREATE TABLE public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL, -- External game identifier
    title TEXT NOT NULL,
    genre TEXT,
    platform TEXT[],
    
    -- Consolidated game data (was 10+ separate tables)
    game_data JSONB DEFAULT '{}',        -- game metadata, objectives
    progress_data JSONB DEFAULT '{}',    -- player_progress, game_contexts
    session_data JSONB DEFAULT '{}',     -- session summaries, activities
    solutions_data JSONB DEFAULT '{}',   -- game_solutions, knowledge
    context_data JSONB DEFAULT '{}',     -- game contexts, progress events
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, game_id)
);

-- ========================================
-- 4. CONVERSATIONS (Parent) - All Chat & AI Data
-- ========================================

CREATE TABLE public.conversations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    
    -- Consolidated conversation data
    conversation_data JSONB DEFAULT '{}', -- messages, context, metadata
    ai_data JSONB DEFAULT '{}',           -- AI responses, analysis
    context_data JSONB DEFAULT '{}',      -- game context, user context
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. CACHE (Parent) - All Caching Data
-- ========================================

CREATE TABLE public.cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    cache_data JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, cache_key)
);

-- ========================================
-- STEP 3: CREATE ALL REQUIRED FUNCTIONS
-- ========================================

-- Function to migrate user usage data
CREATE OR REPLACE FUNCTION public.migrate_user_usage_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Get user data from users table
    SELECT usage_data INTO result
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    -- If no user found, return default values
    IF result IS NULL THEN
        result := jsonb_build_object(
            'tier', 'free',
            'queries_used', 0,
            'queries_limit', 50,
            'last_reset', NOW()::text,
            'monthly_queries', 0,
            'monthly_limit', 50
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to migrate user app state
CREATE OR REPLACE FUNCTION public.migrate_user_app_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT app_state INTO result
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to check if welcome message should be shown
CREATE OR REPLACE FUNCTION public.should_show_welcome_message(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    -- Check if user has seen welcome message
    SELECT (app_state->>'welcomeMessageShown')::boolean INTO result
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    -- Return false if user has seen it, true if not
    RETURN COALESCE(result, true);
END;
$$;

-- Function to update user usage
CREATE OR REPLACE FUNCTION public.update_user_usage(p_user_id UUID, p_field TEXT, p_value ANYELEMENT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET usage_data = COALESCE(usage_data, '{}'::jsonb) || jsonb_build_object(p_field, p_value),
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Function to update user app state
CREATE OR REPLACE FUNCTION public.update_user_app_state(p_user_id UUID, p_field TEXT, p_value JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET app_state = COALESCE(app_state, '{}'::jsonb) || jsonb_build_object(p_field, p_value),
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- Function to get app cache
CREATE OR REPLACE FUNCTION public.get_app_cache(p_user_id UUID, p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT cache_data INTO result
    FROM public.cache
    WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = p_user_id)
    AND cache_key = p_cache_key
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN result;
END;
$$;

-- Function to set app cache
CREATE OR REPLACE FUNCTION public.set_app_cache(p_user_id UUID, p_cache_key TEXT, p_cache_data JSONB, p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.cache (user_id, cache_key, cache_data, expires_at)
    VALUES (
        (SELECT id FROM public.users WHERE auth_user_id = p_user_id),
        p_cache_key,
        p_cache_data,
        p_expires_at
    )
    ON CONFLICT (user_id, cache_key)
    DO UPDATE SET
        cache_data = p_cache_data,
        expires_at = p_expires_at,
        updated_at = NOW();
END;
$$;

-- Function to update welcome message shown
CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET app_state = COALESCE(app_state, '{}'::jsonb) || '{"welcomeMessageShown": true}'::jsonb,
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;
END;
$$;

-- ========================================
-- STEP 4: SET UP ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_level ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Games table policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Conversations table policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Cache table policies
CREATE POLICY "Users can view own cache" ON public.cache
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own cache" ON public.cache
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own cache" ON public.cache
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- ========================================
-- STEP 5: GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.migrate_user_usage_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_user_app_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_show_welcome_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_usage(UUID, TEXT, ANYELEMENT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_app_state(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_cache(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_cache(UUID, TEXT, JSONB, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_welcome_message_shown(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_level TO authenticated;

-- ========================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_games_user_id ON public.games(user_id);
CREATE INDEX idx_games_user_game ON public.games(user_id, game_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_cache_user_key ON public.cache(user_id, cache_key);
CREATE INDEX idx_cache_expires ON public.cache(expires_at);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Complete database schema deployed successfully!';
    RAISE NOTICE '✅ All tables created: users, games, conversations, cache, app_level';
    RAISE NOTICE '✅ All functions created: migrate_user_usage_data, migrate_user_app_state, should_show_welcome_message, update_user_usage, update_user_app_state, get_app_cache, set_app_cache, update_welcome_message_shown';
    RAISE NOTICE '✅ RLS policies configured for security';
    RAISE NOTICE '✅ Permissions granted to authenticated users';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your app should now work without 404 and 400 errors!';
END $$;
