-- Optimize RLS policies to fix performance warnings
-- Run this in your Supabase SQL Editor

-- First, drop ALL existing policies to start clean
-- Users table policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can manage own data" ON public.users;

-- Games table policies
DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;
DROP POLICY IF EXISTS "Users can manage own games" ON public.games;

-- Analytics table policies
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can manage own analytics" ON public.analytics;

-- Conversations table policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.conversations;

-- Tasks table policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;

-- Cache table policies
DROP POLICY IF EXISTS "Public cache access" ON public.cache;
DROP POLICY IF EXISTS "Authenticated users can read cache" ON public.cache;

-- Admin table policies
DROP POLICY IF EXISTS "Admin access only" ON public.admin;
DROP POLICY IF EXISTS "Admins can manage admin data" ON public.admin;

-- App level table policies
DROP POLICY IF EXISTS "Admin app level access only" ON public.app_level;
DROP POLICY IF EXISTS "Authenticated users can read app data" ON public.app_level;

-- Create optimized single policies for each table
-- Users table - single comprehensive policy
CREATE POLICY "users_access_policy" ON public.users
    FOR ALL USING (
        -- Allow all operations for authenticated users on their own data
        (SELECT auth.uid()) = auth_user_id
    ) WITH CHECK (
        -- Allow insert/update for authenticated users on their own data
        (SELECT auth.uid()) = auth_user_id
    );

-- Games table - single comprehensive policy
CREATE POLICY "games_access_policy" ON public.games
    FOR ALL USING (
        -- Allow all operations for users on their own games
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = games.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    ) WITH CHECK (
        -- Allow insert/update for users on their own games
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = games.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    );

-- Analytics table - single comprehensive policy
CREATE POLICY "analytics_access_policy" ON public.analytics
    FOR ALL USING (
        -- Allow all operations for users on their own analytics
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = analytics.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    ) WITH CHECK (
        -- Allow insert/update for users on their own analytics
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = analytics.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    );

-- Conversations table - single comprehensive policy
CREATE POLICY "conversations_access_policy" ON public.conversations
    FOR ALL USING (
        -- Allow all operations for users on their own conversations
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = conversations.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    ) WITH CHECK (
        -- Allow insert/update for users on their own conversations
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = conversations.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    );

-- Tasks table - single comprehensive policy
CREATE POLICY "tasks_access_policy" ON public.tasks
    FOR ALL USING (
        -- Allow all operations for users on their own tasks
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = tasks.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    ) WITH CHECK (
        -- Allow insert/update for users on their own tasks
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = tasks.user_id 
            AND (SELECT auth.uid()) = auth_user_id
        )
    );

-- Cache table - single comprehensive policy (public access)
CREATE POLICY "cache_access_policy" ON public.cache
    FOR ALL USING (true) WITH CHECK (true);

-- Admin table - single comprehensive policy (admin only)
CREATE POLICY "admin_access_policy" ON public.admin
    FOR ALL USING (
        -- Allow all operations for admin users only
        EXISTS (
            SELECT 1 FROM public.users
            WHERE (SELECT auth.uid()) = auth_user_id
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    ) WITH CHECK (
        -- Allow insert/update for admin users only
        EXISTS (
            SELECT 1 FROM public.users
            WHERE (SELECT auth.uid()) = auth_user_id
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    );

-- App level table - single comprehensive policy (admin only)
CREATE POLICY "app_level_access_policy" ON public.app_level
    FOR ALL USING (
        -- Allow all operations for admin users only
        EXISTS (
            SELECT 1 FROM public.users
            WHERE (SELECT auth.uid()) = auth_user_id
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    ) WITH CHECK (
        -- Allow insert/update for admin users only
        EXISTS (
            SELECT 1 FROM public.users
            WHERE (SELECT auth.uid()) = auth_user_id
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    );
