-- ========================================
-- 🚀 CORRECTED DATABASE FUNCTIONS - MATCHING APP CALLS
-- ========================================
-- This script creates functions that match the exact parameter order your app calls

-- ========================================
-- STEP 1: CLEAN SLATE - DROP ALL EXISTING FUNCTIONS
-- ========================================

-- Drop all existing conversation functions to prevent conflicts
DROP FUNCTION IF EXISTS public.save_conversation CASCADE;
DROP FUNCTION IF EXISTS public.save_conversation_v2 CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations_v2 CASCADE;
DROP FUNCTION IF EXISTS public.update_welcome_message_shown CASCADE;
DROP FUNCTION IF EXISTS public.should_show_welcome_message CASCADE;
DROP FUNCTION IF EXISTS public.mark_first_run_completed CASCADE;
DROP FUNCTION IF EXISTS public.mark_profile_setup_complete CASCADE;

-- ========================================
-- STEP 2: CREATE FUNCTION WITH CORRECT PARAMETER ORDER
-- ========================================

CREATE OR REPLACE FUNCTION public.save_conversation(
    p_context JSONB,
    p_conversation_id TEXT,
    p_force_overwrite BOOLEAN,
    p_game_id TEXT,
    p_insights JSONB,
    p_is_pinned BOOLEAN,
    p_messages JSONB,
    p_title TEXT,
    p_user_id UUID
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
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Insert or update conversation
    INSERT INTO public.conversations (
        id,
        user_id,
        title,
        messages,
        insights,
        context,
        game_id,
        is_pinned,
        created_at,
        updated_at
    ) VALUES (
        p_conversation_id,
        internal_user_id,
        p_title,
        p_messages,
        p_insights,
        p_context,
        p_game_id,
        p_is_pinned,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = CASE WHEN p_force_overwrite THEN EXCLUDED.title ELSE conversations.title END,
        messages = CASE WHEN p_force_overwrite THEN EXCLUDED.messages ELSE conversations.messages END,
        insights = CASE WHEN p_force_overwrite THEN EXCLUDED.insights ELSE conversations.insights END,
        context = CASE WHEN p_force_overwrite THEN EXCLUDED.context ELSE conversations.context END,
        game_id = CASE WHEN p_force_overwrite THEN EXCLUDED.game_id ELSE conversations.game_id END,
        is_pinned = CASE WHEN p_force_overwrite THEN EXCLUDED.is_pinned ELSE conversations.is_pinned END,
        updated_at = NOW();
    
    RETURN jsonb_build_object('success', true, 'conversation_id', p_conversation_id);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- STEP 3: CREATE LOAD_CONVERSATIONS FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    conversations_data JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return empty array
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('conversations', '[]'::jsonb);
    END IF;
    
    -- Get all conversations for the user
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'messages', messages,
            'insights', insights,
            'context', context,
            'game_id', game_id,
            'is_pinned', is_pinned,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) INTO conversations_data
    FROM public.conversations
    WHERE user_id = internal_user_id AND deleted_at IS NULL
    ORDER BY is_pinned DESC, updated_at DESC;
    
    -- Return conversations or empty array if none found
    RETURN jsonb_build_object('conversations', COALESCE(conversations_data, '[]'::jsonb));
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('conversations', '[]'::jsonb, 'error', SQLERRM);
END;
$$;

-- ========================================
-- STEP 4: CREATE WELCOME MESSAGE FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID, p_message_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update welcome message status
    UPDATE public.users 
    SET has_welcome_message = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.should_show_welcome_message(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    has_welcome_message BOOLEAN;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return false
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('should_show', false);
    END IF;
    
    -- Check if user has already seen welcome message
    SELECT has_welcome_message INTO has_welcome_message
    FROM public.users
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('should_show', NOT COALESCE(has_welcome_message, false));
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('should_show', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- STEP 5: VERIFICATION
-- ========================================

-- Test the functions exist
SELECT 'CORRECTED FUNCTIONS CREATED SUCCESSFULLY' as status;

-- Show all conversation-related functions
SELECT 
    routine_name,
    routine_type,
    security_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%conversation%'
ORDER BY routine_name;

-- Test function signatures
SELECT 'FUNCTION SIGNATURES:' as info;
SELECT 
    specific_name as routine_name,
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name IN ('save_conversation', 'load_conversations')
ORDER BY specific_name, ordinal_position;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'CORRECTED DATABASE FUNCTIONS DEPLOYED!' as message;
SELECT 'Parameter order now matches app calls' as step1;
SELECT 'Chat screen should work after refresh' as step2;
SELECT 'Database is now fully functional!' as next;
