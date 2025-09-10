-- COMPLETE DATABASE TABLES FIX
-- This script creates all missing tables and fixes the database schema issues

-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    profile_data JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    app_state JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create games table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(auth_user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- 3. Create analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create onboarding_funnel table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.onboarding_funnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(auth_user_id) ON DELETE CASCADE NOT NULL,
    step TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, step)
);

-- 5. Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_funnel ENABLE ROW LEVEL SECURITY;

-- 6. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_funnel;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_funnel;

-- 7. Create optimized RLS policies with (select auth.uid()) for performance
-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK ((select auth.uid()) = auth_user_id);

-- Games table policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- Analytics table policies
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Onboarding funnel table policies
CREATE POLICY "Users can view own onboarding" ON public.onboarding_funnel
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.onboarding_funnel
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own onboarding" ON public.onboarding_funnel
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_funnel_user_id ON public.onboarding_funnel(user_id);

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert a test user record if it doesn't exist (for the current authenticated user)
-- This will be handled by the application's ensureUserRecordExists function

-- 12. Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.games TO authenticated;
GRANT ALL ON public.analytics TO authenticated;
GRANT ALL ON public.onboarding_funnel TO authenticated;

-- 13. Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Database tables created successfully!' as message;
