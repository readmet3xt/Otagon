-- ========================================
-- 🚀 OTAKON AGGRESSIVE FUNCTION CLEANUP
-- ========================================
-- This script aggressively removes ALL function definitions to prevent conflicts
-- Run this FIRST before applying any schema
-- Generated: January 2025 - AGGRESSIVE CLEANUP VERSION

-- ========================================
-- 1. AGGRESSIVE FUNCTION CLEANUP
-- ========================================

-- Drop ALL functions with CASCADE to remove dependencies
DROP FUNCTION IF EXISTS public.save_conversation CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations CASCADE;
DROP FUNCTION IF EXISTS public.save_wishlist CASCADE;
DROP FUNCTION IF EXISTS public.load_wishlist CASCADE;
DROP FUNCTION IF EXISTS public.update_welcome_message_shown CASCADE;
DROP FUNCTION IF EXISTS public.should_show_welcome_message CASCADE;
DROP FUNCTION IF EXISTS public.get_complete_user_data CASCADE;
DROP FUNCTION IF EXISTS public.get_welcome_message_state CASCADE;
DROP FUNCTION IF EXISTS public.mark_first_run_completed CASCADE;
DROP FUNCTION IF EXISTS public.reset_welcome_message_tracking CASCADE;
DROP FUNCTION IF EXISTS public.save_app_state CASCADE;
DROP FUNCTION IF EXISTS public.get_app_state CASCADE;
DROP FUNCTION IF EXISTS public.get_user_preferences CASCADE;
DROP FUNCTION IF EXISTS public.update_user_preferences CASCADE;
DROP FUNCTION IF EXISTS public.migrate_user_usage_data CASCADE;
DROP FUNCTION IF EXISTS public.update_user_usage CASCADE;
DROP FUNCTION IF EXISTS public.migrate_user_app_state CASCADE;
DROP FUNCTION IF EXISTS public.update_user_app_state CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_engagement CASCADE;
DROP FUNCTION IF EXISTS public.update_daily_engagement CASCADE;
DROP FUNCTION IF EXISTS public.get_app_cache CASCADE;
DROP FUNCTION IF EXISTS public.set_app_cache CASCADE;
DROP FUNCTION IF EXISTS public.clear_expired_app_cache CASCADE;

-- Drop ALL triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations CASCADE;
DROP TRIGGER IF EXISTS update_cache_updated_at ON public.cache CASCADE;
DROP TRIGGER IF EXISTS update_waitlist_updated_at ON public.waitlist CASCADE;
DROP TRIGGER IF EXISTS update_app_level_updated_at ON public.app_level CASCADE;

-- Drop ALL trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ========================================
-- 2. VERIFY CLEANUP
-- ========================================

-- Check if any functions still exist
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'save_conversation', 'load_conversations', 'save_wishlist', 'load_wishlist',
    'update_welcome_message_shown', 'should_show_welcome_message', 'get_complete_user_data',
    'get_welcome_message_state', 'mark_first_run_completed', 'reset_welcome_message_tracking',
    'save_app_state', 'get_app_state', 'get_user_preferences', 'update_user_preferences',
    'migrate_user_usage_data', 'update_user_usage', 'migrate_user_app_state', 'update_user_app_state',
    'get_daily_engagement', 'update_daily_engagement', 'get_app_cache', 'set_app_cache',
    'clear_expired_app_cache'
)
ORDER BY p.proname;

-- ========================================
-- 3. CREATE ESSENTIAL FUNCTIONS ONLY
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, usage_data, app_state, behavior_data, feedback_data, onboarding_data)
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        '{}',
        '{}',
        '{"textCount": 0, "imageCount": 0, "textLimit": 55, "imageLimit": 25, "totalRequests": 0, "lastReset": 0}',
        '{"onboardingComplete": false, "profileSetupCompleted": false, "hasSeenSplashScreens": false, "welcomeMessageShown": false, "firstWelcomeShown": false, "hasConversations": false, "hasInteractedWithChat": false, "lastSessionDate": "", "lastWelcomeTime": "", "appClosedTime": "", "firstRunCompleted": false, "hasConnectedBefore": false, "installDismissed": false, "showSplashAfterLogin": false, "lastSuggestedPromptsShown": ""}',
        '{"sessionCount": 0, "totalTimeSpent": 0, "lastActivity": 0, "featureUsage": {}}',
        '{"ratings": [], "suggestions": [], "bugReports": []}',
        '{"stepsCompleted": [], "currentStep": "initial", "completedAt": null}'
    );
    RETURN NEW;
END;
$$;

-- Save conversation function
CREATE OR REPLACE FUNCTION public.save_conversation(
    p_user_id UUID,
    p_conversation_id TEXT,
    p_title TEXT,
    p_messages JSONB,
    p_insights JSONB DEFAULT '[]'::jsonb,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_game_id TEXT DEFAULT NULL,
    p_is_pinned BOOLEAN DEFAULT false,
    p_force_overwrite BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    INSERT INTO public.conversations (
        id, user_id, title, messages, insights, context, game_id, is_pinned, 
        created_at, updated_at, last_interaction
    ) VALUES (
        p_conversation_id, internal_user_id, p_title, p_messages, p_insights, p_context, p_game_id, p_is_pinned,
        NOW(), NOW(), NOW()
    )
    ON CONFLICT (id, user_id) 
    DO UPDATE SET
        title = p_title,
        messages = p_messages,
        insights = p_insights,
        context = p_context,
        game_id = p_game_id,
        is_pinned = p_is_pinned,
        updated_at = NOW(),
        last_interaction = NOW()
    WHERE p_force_overwrite = TRUE OR conversations.updated_at < NOW() - INTERVAL '1 second';
    
    result := jsonb_build_object('success', true, 'conversation_id', p_conversation_id);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Load conversations function
CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSONB;
    conversations_array JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'conversations', '[]'::jsonb, 'count', 0);
    END IF;
    
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'messages', COALESCE(messages, '[]'::jsonb),
            'insights', COALESCE(insights, '[]'::jsonb),
            'context', COALESCE(context, '{}'::jsonb),
            'game_id', game_id,
            'is_pinned', COALESCE(is_pinned, false),
            'createdAt', created_at,
            'updatedAt', updated_at,
            'lastInteraction', last_interaction
        )
    ), '[]'::jsonb) INTO conversations_array
    FROM public.conversations
    WHERE user_id = internal_user_id AND deleted_at IS NULL
    ORDER BY updated_at DESC;
    
    result := jsonb_build_object(
        'success', true,
        'conversations', conversations_array,
        'count', jsonb_array_length(conversations_array)
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'conversations', '[]'::jsonb, 'count', 0);
END;
$$;

-- Save wishlist function
CREATE OR REPLACE FUNCTION public.save_wishlist(
    p_user_id UUID,
    p_wishlist JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET app_state = jsonb_set(COALESCE(app_state, '{}'), ARRAY['wishlist'], p_wishlist),
        updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Load wishlist function
CREATE OR REPLACE FUNCTION public.load_wishlist(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    wishlist_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;
    
    SELECT COALESCE(app_state->'wishlist', '[]'::jsonb) INTO wishlist_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN COALESCE(wishlist_data, '[]'::jsonb);
EXCEPTION
    WHEN OTHERS THEN
        RETURN '[]'::jsonb;
END;
$$;

-- Update welcome message shown function
CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(
    p_user_id UUID,
    p_message_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET app_state = jsonb_set(
        jsonb_set(
            COALESCE(app_state, '{}'), 
            ARRAY['welcomeMessageShown'], 
            'true'::jsonb
        ),
        ARRAY['lastWelcomeTime'],
        to_jsonb(NOW())
    ),
    updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Should show welcome message function
CREATE OR REPLACE FUNCTION public.should_show_welcome_message(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    welcome_shown BOOLEAN;
    last_welcome_time TIMESTAMP WITH TIME ZONE;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('shouldShow', true, 'reason', 'User not found');
    END IF;
    
    SELECT 
        COALESCE((app_state->>'welcomeMessageShown')::boolean, false),
        COALESCE((app_state->>'lastWelcomeTime')::timestamp with time zone, '1970-01-01'::timestamp with time zone)
    INTO welcome_shown, last_welcome_time
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    IF NOT welcome_shown OR last_welcome_time < NOW() - INTERVAL '24 hours' THEN
        result := jsonb_build_object('shouldShow', true, 'reason', 'Welcome not shown or expired');
    ELSE
        result := jsonb_build_object('shouldShow', false, 'reason', 'Welcome recently shown');
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('shouldShow', true, 'reason', 'Error occurred');
END;
$$;

-- Get complete user data function
CREATE OR REPLACE FUNCTION public.get_complete_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'tier', tier,
        'profile_data', COALESCE(profile_data, '{}'),
        'preferences', COALESCE(preferences, '{}'),
        'usage_data', COALESCE(usage_data, '{}'),
        'app_state', COALESCE(app_state, '{}'),
        'behavior_data', COALESCE(behavior_data, '{}'),
        'feedback_data', COALESCE(feedback_data, '{}'),
        'onboarding_data', COALESCE(onboarding_data, '{}'),
        'created_at', created_at,
        'updated_at', updated_at,
        'last_activity', last_activity
    ) INTO user_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object('success', true, 'user', user_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Mark first run completed function
CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET app_state = jsonb_set(
        COALESCE(app_state, '{}'), 
        ARRAY['firstRunCompleted'], 
        'true'::jsonb
    ),
    updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Reset welcome message tracking function
CREATE OR REPLACE FUNCTION public.reset_welcome_message_tracking(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET app_state = jsonb_set(
        jsonb_set(
            COALESCE(app_state, '{}'), 
            ARRAY['welcomeMessageShown'], 
            'false'::jsonb
        ),
        ARRAY['lastWelcomeTime'],
        'null'::jsonb
    ),
    updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Save app state function
CREATE OR REPLACE FUNCTION public.save_app_state(
    p_user_id UUID,
    p_app_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET app_state = p_app_state,
        updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Get app state function
CREATE OR REPLACE FUNCTION public.get_app_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    app_state_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT COALESCE(app_state, '{}') INTO app_state_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object('success', true, 'app_state', app_state_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Get user preferences function
CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    preferences_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT COALESCE(preferences, '{}') INTO preferences_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object('success', true, 'preferences', preferences_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update user preferences function
CREATE OR REPLACE FUNCTION public.update_user_preferences(
    p_user_id UUID,
    p_preferences JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET preferences = p_preferences,
        updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Migrate user usage data function
CREATE OR REPLACE FUNCTION public.migrate_user_usage_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    usage_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT COALESCE(usage_data, '{"textCount": 0, "imageCount": 0, "textLimit": 55, "imageLimit": 25, "totalRequests": 0, "lastReset": 0}') INTO usage_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object('success', true, 'usage_data', usage_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update user usage function
CREATE OR REPLACE FUNCTION public.update_user_usage(
    p_user_id UUID,
    p_field TEXT,
    p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET usage_data = jsonb_set(COALESCE(usage_data, '{}'), ARRAY[p_field], p_value),
        updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Migrate user app state function
CREATE OR REPLACE FUNCTION public.migrate_user_app_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    app_state_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT COALESCE(app_state, '{}') INTO app_state_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object('success', true, 'app_state', app_state_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update user app state function
CREATE OR REPLACE FUNCTION public.update_user_app_state(
    p_user_id UUID,
    p_field TEXT,
    p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET app_state = jsonb_set(COALESCE(app_state, '{}'), ARRAY[p_field], p_value),
        updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Get daily engagement function
CREATE OR REPLACE FUNCTION public.get_daily_engagement(
    p_user_id UUID,
    p_date TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    engagement_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT COALESCE(behavior_data->'dailyEngagement'->p_date, '{}') INTO engagement_data
    FROM public.users
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    RETURN jsonb_build_object('success', true, 'engagement', engagement_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update daily engagement function (THE PROBLEMATIC ONE)
CREATE OR REPLACE FUNCTION public.update_daily_engagement(
    p_user_id UUID,
    p_date TEXT,
    p_engagement JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    UPDATE public.users
    SET behavior_data = jsonb_set(
        COALESCE(behavior_data, '{}'), 
        ARRAY['dailyEngagement', p_date], 
        p_engagement
    ),
    updated_at = NOW()
    WHERE id = internal_user_id AND deleted_at IS NULL;
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Get app cache function
CREATE OR REPLACE FUNCTION public.get_app_cache(
    p_user_id UUID,
    p_cache_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    cache_data JSONB;
    internal_user_id UUID;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    SELECT COALESCE(cache_data, '{}') INTO cache_data
    FROM public.cache
    WHERE user_id = internal_user_id AND cache_key = p_cache_key AND expires_at > NOW();
    
    RETURN jsonb_build_object('success', true, 'cacheData', cache_data);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Set app cache function
CREATE OR REPLACE FUNCTION public.set_app_cache(
    p_user_id UUID,
    p_cache_key TEXT,
    p_cache_data JSONB,
    p_ttl_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO internal_user_id
    FROM public.users
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    INSERT INTO public.cache (user_id, cache_key, cache_data, expires_at)
    VALUES (internal_user_id, p_cache_key, p_cache_data, NOW() + INTERVAL '1 minute' * p_ttl_minutes)
    ON CONFLICT (user_id, cache_key)
    DO UPDATE SET
        cache_data = p_cache_data,
        expires_at = NOW() + INTERVAL '1 minute' * p_ttl_minutes,
        updated_at = NOW();
    
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Clear expired app cache function
CREATE OR REPLACE FUNCTION public.clear_expired_app_cache()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER;
    result JSONB;
BEGIN
    DELETE FROM public.cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    result := jsonb_build_object('success', true, 'deletedCount', deleted_count);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- 4. VERIFY FUNCTIONS CREATED
-- ========================================

-- Check that all functions were created successfully
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'save_conversation', 'load_conversations', 'save_wishlist', 'load_wishlist',
    'update_welcome_message_shown', 'should_show_welcome_message', 'get_complete_user_data',
    'mark_first_run_completed', 'reset_welcome_message_tracking',
    'save_app_state', 'get_app_state', 'get_user_preferences', 'update_user_preferences',
    'migrate_user_usage_data', 'update_user_usage', 'migrate_user_app_state', 'update_user_app_state',
    'get_daily_engagement', 'update_daily_engagement', 'get_app_cache', 'set_app_cache',
    'clear_expired_app_cache'
)
ORDER BY p.proname;

-- ========================================
-- ✅ AGGRESSIVE CLEANUP COMPLETE
-- ========================================
-- All functions have been aggressively cleaned and recreated
-- No more duplicate function errors
-- All essential functions are now properly defined
