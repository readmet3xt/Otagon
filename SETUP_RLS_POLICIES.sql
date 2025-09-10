-- Setup RLS policies for existing tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_level ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Create policies for games table
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = games.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = games.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = games.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own games" ON public.games
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = games.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Create policies for analytics table
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = analytics.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = analytics.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Create policies for conversations table
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = conversations.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = conversations.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = conversations.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = conversations.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Create policies for tasks table
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = tasks.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = tasks.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = tasks.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = tasks.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Create policies for cache table (allow public access for caching)
CREATE POLICY "Public cache access" ON public.cache
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for admin table (admin only)
CREATE POLICY "Admin access only" ON public.admin
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid()
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    );

-- Create policies for app_level table (admin only)
CREATE POLICY "Admin app level access only" ON public.app_level
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid()
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    );
