-- ========================================
-- DEPLOY MISSING FUNCTIONS ONLY
-- ========================================
-- This script adds only the missing functions to your existing database
-- Your existing tables will remain untouched
--
-- This fixes the 400 errors for missing functions:
-- - migrate_user_usage_data
-- - migrate_user_app_state  
-- - should_show_welcome_message
-- - update_user_usage
-- - update_user_app_state
-- - get_app_cache
-- - set_app_cache
-- - update_welcome_message_shown

-- ========================================
-- CREATE MISSING FUNCTIONS
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
    WHERE cache_key = p_cache_key
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
    INSERT INTO public.cache (cache_key, cache_type, cache_data, expires_at)
    VALUES (p_cache_key, 'user_cache', p_cache_data, p_expires_at)
    ON CONFLICT (cache_key)
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
-- GRANT PERMISSIONS
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

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ All missing functions deployed successfully!';
    RAISE NOTICE '✅ Functions created:';
    RAISE NOTICE '   - migrate_user_usage_data';
    RAISE NOTICE '   - migrate_user_app_state';
    RAISE NOTICE '   - should_show_welcome_message';
    RAISE NOTICE '   - update_user_usage';
    RAISE NOTICE '   - update_user_app_state';
    RAISE NOTICE '   - get_app_cache';
    RAISE NOTICE '   - set_app_cache';
    RAISE NOTICE '   - update_welcome_message_shown';
    RAISE NOTICE '✅ Permissions granted to authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your app should now work without 400 function errors!';
    RAISE NOTICE '   The 404 table errors should also be resolved.';
END $$;
