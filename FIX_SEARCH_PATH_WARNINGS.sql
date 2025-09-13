-- ========================================
-- 🛠️ FIX SEARCH PATH WARNINGS
-- ========================================
-- This fixes all function search path mutable warnings by adding
-- SET search_path = '' to all functions

-- Update all functions with proper search_path setting
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, usage_data, app_state, behavior_data, feedback_data, onboarding_data, created_by)
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        '{}',
        '{}',
        '{"textCount": 0, "imageCount": 0, "textLimit": 55, "imageLimit": 25, "totalRequests": 0, "lastReset": 0}',
        '{"onboardingComplete": false, "profileSetupCompleted": false, "hasSeenSplashScreens": false, "welcomeMessageShown": false, "firstWelcomeShown": false, "hasConversations": false, "hasInteractedWithChat": false, "lastSessionDate": "", "lastWelcomeTime": "", "appClosedTime": "", "firstRunCompleted": false, "hasConnectedBefore": false, "installDismissed": false, "showSplashAfterLogin": false, "lastSuggestedPromptsShown": "", "conversations": [], "conversationsOrder": [], "activeConversation": ""}',
        '{"sessionCount": 0, "totalTimeSpent": 0, "lastActivity": 0, "featureUsage": {}}',
        '{"ratings": [], "suggestions": [], "bugReports": []}',
        '{"stepsCompleted": [], "currentStep": "initial", "completedAt": null}',
        NEW.id
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_preferences(user_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Validate input
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    -- Check if user exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User not found or deleted';
    END IF;
    
    RETURN (
        SELECT preferences FROM public.users 
        WHERE auth_user_id = user_id AND deleted_at IS NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_preferences(user_id UUID, new_preferences JSONB)
RETURNS JSONB 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Validate input
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    IF new_preferences IS NULL OR jsonb_typeof(new_preferences) != 'object' THEN
        RAISE EXCEPTION 'Preferences must be a valid JSON object';
    END IF;
    
    -- Check if user exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User not found or deleted';
    END IF;
    
    UPDATE public.users 
    SET preferences = new_preferences, updated_at = NOW(), updated_by = auth.uid()
    WHERE auth_user_id = user_id AND deleted_at IS NULL;
    
    RETURN new_preferences;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_conversation(
    p_user_id UUID,
    p_conversation_id TEXT,
    p_title TEXT,
    p_messages JSONB,
    p_insights JSONB DEFAULT '[]',
    p_context JSONB DEFAULT '{}',
    p_game_id TEXT DEFAULT NULL,
    p_is_pinned BOOLEAN DEFAULT false,
    p_force_overwrite BOOLEAN DEFAULT false
) RETURNS JSONB 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_existing_version INTEGER;
    v_new_version INTEGER;
    v_checksum TEXT;
    v_result JSONB;
BEGIN
    -- Input validation
    IF p_user_id IS NULL OR p_conversation_id IS NULL OR p_title IS NULL THEN
        RAISE EXCEPTION 'Invalid input parameters';
    END IF;
    
    IF length(p_conversation_id) > 255 OR length(p_title) > 255 THEN
        RAISE EXCEPTION 'Input too long';
    END IF;
    
    IF jsonb_typeof(p_messages) != 'array' THEN
        RAISE EXCEPTION 'Messages must be a JSON array';
    END IF;
    
    IF jsonb_typeof(p_insights) != 'array' THEN
        RAISE EXCEPTION 'Insights must be a JSON array';
    END IF;
    
    IF jsonb_typeof(p_context) != 'object' THEN
        RAISE EXCEPTION 'Context must be a JSON object';
    END IF;
    
    -- Verify user exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User not found or deleted';
    END IF;
    
    -- Get existing version if conversation exists
    SELECT version INTO v_existing_version
    FROM public.conversations
    WHERE user_id = p_user_id AND id = p_conversation_id AND deleted_at IS NULL;
    
    -- Calculate new version
    v_new_version := COALESCE(v_existing_version, 0) + 1;
    
    -- Generate checksum for conflict detection
    v_checksum := md5(p_messages::text || p_insights::text || p_context::text);
    
    -- Insert or update conversation
    INSERT INTO public.conversations (
        id, user_id, game_id, title, messages, insights, context,
        is_pinned, version, checksum, last_modified, updated_at, created_by, updated_by
    ) VALUES (
        p_conversation_id, p_user_id, p_game_id, p_title, p_messages, p_insights, p_context,
        p_is_pinned, v_new_version, v_checksum, NOW(), NOW(), auth.uid(), auth.uid()
    )
    ON CONFLICT (user_id, id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        insights = EXCLUDED.insights,
        context = EXCLUDED.context,
        game_id = EXCLUDED.game_id,
        is_pinned = EXCLUDED.is_pinned,
        version = EXCLUDED.version,
        checksum = EXCLUDED.checksum,
        last_modified = NOW(),
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE p_force_overwrite OR conversations.version < EXCLUDED.version;
    
    -- Return result with metadata
    v_result := jsonb_build_object(
        'success', true,
        'conversation_id', p_conversation_id,
        'version', v_new_version,
        'checksum', v_checksum,
        'conflict_resolved', v_existing_version IS NOT NULL AND NOT p_force_overwrite
    );
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_conversations JSONB;
    v_result JSONB;
BEGIN
    -- Input validation
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid user ID';
    END IF;
    
    -- Verify user exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User not found or deleted';
    END IF;
    
    -- Load all conversations for user (excluding soft deleted)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'messages', messages,
            'insights', insights,
            'context', context,
            'game_id', game_id,
            'is_pinned', is_pinned,
            'version', version,
            'checksum', checksum,
            'last_modified', last_modified,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) INTO v_conversations
    FROM public.conversations
    WHERE user_id = p_user_id AND is_active = true AND deleted_at IS NULL
    ORDER BY last_modified DESC;
    
    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'conversations', COALESCE(v_conversations, '[]'::jsonb),
        'count', jsonb_array_length(COALESCE(v_conversations, '[]'::jsonb))
    );
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS INTEGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete analytics older than 1 year
    DELETE FROM public.analytics WHERE created_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Verify all functions now have proper search_path setting
SELECT 
    routine_name,
    routine_type,
    data_type,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' THEN '✅ SECURE'
        ELSE '❌ NEEDS FIX'
    END as security_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_updated_at_column',
    'handle_new_user', 
    'get_user_preferences',
    'update_user_preferences',
    'save_conversation',
    'load_conversations',
    'cleanup_old_analytics',
    'cleanup_expired_cache'
)
ORDER BY routine_name;
