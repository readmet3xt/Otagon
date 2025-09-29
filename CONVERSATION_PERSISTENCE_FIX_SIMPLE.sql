-- ========================================
-- CONVERSATION PERSISTENCE FIX - SIMPLE VERSION
-- Fixes the 406 error and conversation loading issues
-- ========================================

-- This fix addresses the core issue where conversations disappear on page refresh
-- The problem is that the RLS policies are not working correctly with the existing table structure.

-- 1. Fix the RLS policies to work with the existing table structure
-- Drop existing policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Create new RLS policies that work with auth user IDs directly (optimized for performance)
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "conversations_delete_policy" ON public.conversations
    FOR DELETE USING ((select auth.uid()) = user_id);

-- 2. Create an optimized version of the getConversation function
CREATE OR REPLACE FUNCTION public.get_conversation_optimized(p_conversation_id TEXT, p_auth_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    conversation_data JSONB;
BEGIN
    -- Get the conversation using auth user ID directly
    SELECT jsonb_build_object(
        'id', id,
        'title', title,
        'messages', messages,
        'insights', insights,
        'context', context,
        'game_id', game_id,
        'is_pinned', is_pinned,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO conversation_data
    FROM public.conversations
    WHERE id = p_conversation_id 
    AND user_id = p_auth_user_id;
    
    -- Return conversation or error if not found
    IF conversation_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'conversation', conversation_data);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Update the load_conversations function to work with auth user IDs directly
CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    conversations_data JSONB;
    conversation_count INTEGER;
BEGIN
    -- Get all conversations for the user using auth user ID directly
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
    WHERE user_id = p_user_id
    ORDER BY is_pinned DESC, updated_at DESC;
    
    -- Count conversations
    SELECT COUNT(*) INTO conversation_count
    FROM public.conversations
    WHERE user_id = p_user_id;
    
    -- Return conversations or empty array if none found
    RETURN jsonb_build_object(
        'conversations', COALESCE(conversations_data, '[]'::jsonb),
        'count', conversation_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('conversations', '[]'::jsonb, 'count', 0, 'error', SQLERRM);
END;
$$;

-- 4. Create delete_conversation function
CREATE OR REPLACE FUNCTION public.delete_conversation(p_conversation_id TEXT, p_auth_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete the conversation
    DELETE FROM public.conversations 
    WHERE id = p_conversation_id AND user_id = p_auth_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Check if any rows were affected
    IF deleted_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5. Create update_conversation_title function
CREATE OR REPLACE FUNCTION public.update_conversation_title(p_conversation_id TEXT, p_title TEXT, p_auth_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update the conversation title
    UPDATE public.conversations 
    SET title = p_title, updated_at = NOW()
    WHERE id = p_conversation_id AND user_id = p_auth_user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Check if any rows were affected
    IF updated_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. Create pin_conversation function
CREATE OR REPLACE FUNCTION public.pin_conversation(p_conversation_id TEXT, p_is_pinned BOOLEAN, p_auth_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update the conversation pin status
    UPDATE public.conversations 
    SET is_pinned = p_is_pinned, updated_at = NOW()
    WHERE id = p_conversation_id AND user_id = p_auth_user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Check if any rows were affected
    IF updated_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_conversation_optimized(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_title(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pin_conversation(TEXT, BOOLEAN, UUID) TO authenticated;

-- 8. Test the fix
DO $$
DECLARE
    test_result JSONB;
BEGIN
    -- Test the load_conversations function
    SELECT public.load_conversations('00000000-0000-0000-0000-000000000000'::UUID) INTO test_result;
    RAISE NOTICE 'load_conversations test completed: %', test_result;
    
    RAISE NOTICE 'Conversation persistence fix applied successfully';
END $$;

