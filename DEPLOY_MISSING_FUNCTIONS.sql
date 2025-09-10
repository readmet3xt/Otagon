-- Deploy missing database functions that are causing 404 errors
-- These functions are needed for the app to work properly after OAuth login

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
    SELECT jsonb_build_object(
        'tier', COALESCE(tier, 'free'),
        'queries_used', COALESCE(queries_used, 0),
        'queries_limit', COALESCE(queries_limit, 50),
        'last_reset', COALESCE(last_reset, NOW()::text),
        'monthly_queries', COALESCE(monthly_queries, 0),
        'monthly_limit', COALESCE(monthly_limit, 50)
    ) INTO result
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
    user_onboarding_data JSONB;
    last_welcome_time TIMESTAMPTZ;
    time_since_last_welcome INTERVAL;
BEGIN
    SELECT onboarding_data INTO user_onboarding_data
    FROM public.users
    WHERE auth_user_id = p_user_id;
    
    -- If no onboarding data, show welcome message
    IF user_onboarding_data IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- If welcome message was never shown, show it
    IF NOT COALESCE(user_onboarding_data->>'welcome_message_shown', 'false')::BOOLEAN THEN
        RETURN TRUE;
    END IF;
    
    -- Check if it's been 12+ hours since last welcome message
    last_welcome_time := (user_onboarding_data->>'last_welcome_time')::TIMESTAMPTZ;
    
    IF last_welcome_time IS NULL THEN
        RETURN TRUE;
    END IF;
    
    time_since_last_welcome := NOW() - last_welcome_time;
    
    -- Show welcome message if it's been 12+ hours
    RETURN time_since_last_welcome >= INTERVAL '12 hours';
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
    SET 
        queries_used = CASE WHEN p_field = 'queries_used' THEN p_value::INTEGER ELSE queries_used END,
        monthly_queries = CASE WHEN p_field = 'monthly_queries' THEN p_value::INTEGER ELSE monthly_queries END,
        last_reset = CASE WHEN p_field = 'last_reset' THEN p_value::TEXT ELSE last_reset END,
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.migrate_user_usage_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_user_app_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_show_welcome_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_usage(UUID, TEXT, ANYELEMENT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_app_state(UUID, TEXT, JSONB) TO authenticated;
