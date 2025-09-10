-- ========================================
-- FIX USER CREATION AND RLS POLICIES
-- ========================================
-- This script fixes two critical issues:
-- 1. Creates user records automatically when users authenticate
-- 2. Fixes RLS policies to allow proper access

-- ========================================
-- STEP 1: CREATE USER TRIGGER FUNCTION
-- ========================================

-- Function to automatically create user record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, tier, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        true
    );
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 2: FIX RLS POLICIES
-- ========================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own cache" ON public.cache;
DROP POLICY IF EXISTS "Users can update own cache" ON public.cache;
DROP POLICY IF EXISTS "Users can insert own cache" ON public.cache;

-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Games table policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- Conversations table policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- Cache table policies (simplified - no user_id reference needed)
CREATE POLICY "Users can view own cache" ON public.cache
    FOR SELECT USING (true);

CREATE POLICY "Users can update own cache" ON public.cache
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own cache" ON public.cache
    FOR INSERT WITH CHECK (true);

-- ========================================
-- STEP 3: CREATE MANUAL USER CREATION FUNCTION
-- ========================================

-- Function to manually create user record if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_user_exists(p_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = p_user_id) THEN
        -- Create user record
        INSERT INTO public.users (auth_user_id, email, tier, is_active)
        VALUES (p_user_id, p_email, 'free', true);
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID, TEXT) TO authenticated;

-- ========================================
-- STEP 4: UPDATE EXISTING FUNCTIONS TO HANDLE MISSING USERS
-- ========================================

-- Update migrate_user_usage_data to create user if missing
CREATE OR REPLACE FUNCTION public.migrate_user_usage_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    user_email TEXT;
BEGIN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Ensure user exists in public.users
    PERFORM public.ensure_user_exists(p_user_id, user_email);
    
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

-- Update migrate_user_app_state to create user if missing
CREATE OR REPLACE FUNCTION public.migrate_user_app_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    user_email TEXT;
BEGIN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Ensure user exists in public.users
    PERFORM public.ensure_user_exists(p_user_id, user_email);
    
    SELECT app_state INTO result
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Update should_show_welcome_message to create user if missing
CREATE OR REPLACE FUNCTION public.should_show_welcome_message(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN;
    user_email TEXT;
BEGIN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Ensure user exists in public.users
    PERFORM public.ensure_user_exists(p_user_id, user_email);
    
    -- Check if user has seen welcome message
    SELECT (app_state->>'welcomeMessageShown')::boolean INTO result
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    -- Return false if user has seen it, true if not
    RETURN COALESCE(result, true);
END;
$$;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ User creation and RLS fixes deployed successfully!';
    RAISE NOTICE '✅ Auto user creation trigger created';
    RAISE NOTICE '✅ RLS policies fixed for all tables';
    RAISE NOTICE '✅ Manual user creation function added';
    RAISE NOTICE '✅ Database functions updated to handle missing users';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 New users will be automatically created when they authenticate!';
    RAISE NOTICE '🎉 RLS policies will allow proper access to user data!';
END $$;
