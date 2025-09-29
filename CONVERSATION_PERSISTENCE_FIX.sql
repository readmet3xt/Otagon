-- ========================================
-- CONVERSATION PERSISTENCE FIX
-- Fixes the 406 error and conversation loading issues
-- ========================================

-- This fix addresses the core issue where conversations disappear on page refresh
-- The problem is that RLS policies are checking auth.uid() against user_id,
-- but user_id stores the internal user ID, not the auth user ID.

-- 1. First, let's create a function to get the internal user ID from auth user ID
CREATE OR REPLACE FUNCTION public.get_internal_user_id(p_auth_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_id UUID;
BEGIN
    SELECT id INTO internal_id 
    FROM public.users 
    WHERE auth_user_id = p_auth_user_id;
    
    RETURN internal_id;
END;
$$;

-- 2. Fix the RLS policies to use the internal user ID mapping
-- Drop existing policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Create new RLS policies that properly map auth user ID to internal user ID
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING (
        user_id = public.get_internal_user_id(auth.uid())
    );

CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK (
        user_id = public.get_internal_user_id(auth.uid())
    );

CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE USING (
        user_id = public.get_internal_user_id(auth.uid())
    );

CREATE POLICY "conversations_delete_policy" ON public.conversations
    FOR DELETE USING (
        user_id = public.get_internal_user_id(auth.uid())
    );

-- 3. Create an optimized version of the getConversation function
-- This function will handle the user ID mapping properly
CREATE OR REPLACE FUNCTION public.get_conversation_optimized(p_conversation_id TEXT, p_auth_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    conversation_data JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_auth_user_id;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get the conversation
    SELECT jsonb_build_object(
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
    ) INTO conversation_data
    FROM public.conversations
    WHERE id = p_conversation_id 
    AND user_id = internal_user_id;
    
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

-- 4. Update the load_conversations function to be more robust
CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    conversations_data JSONB;
    conversation_count INTEGER;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id;
    
    -- If user not found, return empty array
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('conversations', '[]'::jsonb, 'count', 0);
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
    WHERE user_id = internal_user_id
    ORDER BY is_pinned DESC, updated_at DESC;
    
    -- Count conversations
    SELECT COUNT(*) INTO conversation_count
    FROM public.conversations
    WHERE user_id = internal_user_id;
    
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

-- 5. Create a function to ensure user exists in public.users table
CREATE OR REPLACE FUNCTION public.ensure_user_exists(p_auth_user_id UUID, p_email TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_auth_user_id;
    
    -- If user exists, return the ID
    IF internal_user_id IS NOT NULL THEN
        RETURN internal_user_id;
    END IF;
    
    -- Create new user if doesn't exist
    INSERT INTO public.users (auth_user_id, email, created_at, updated_at)
    VALUES (p_auth_user_id, p_email, NOW(), NOW())
    RETURNING id INTO internal_user_id;
    
    RETURN internal_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error, try to get existing user again
        SELECT id INTO internal_user_id 
        FROM public.users 
        WHERE auth_user_id = p_auth_user_id;
        
        RETURN internal_user_id;
END;
$$;

-- 6. Update the save_conversation function to ensure user exists
CREATE OR REPLACE FUNCTION public.save_conversation(
    p_user_id UUID,
    p_conversation_id TEXT,
    p_title TEXT,
    p_messages JSONB,
    p_insights JSONB DEFAULT '{}'::jsonb,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_game_id TEXT DEFAULT NULL,
    p_is_pinned BOOLEAN DEFAULT FALSE,
    p_force_overwrite BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    existing_conversation RECORD;
BEGIN
    -- Ensure user exists in public.users table
    internal_user_id := public.ensure_user_exists(p_user_id);
    
    -- If we couldn't get/create user, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Failed to create or find user');
    END IF;
    
    -- Check if conversation already exists
    SELECT * INTO existing_conversation
    FROM public.conversations
    WHERE id = p_conversation_id AND user_id = internal_user_id;
    
    -- If conversation exists and we're not forcing overwrite, return error
    IF existing_conversation.id IS NOT NULL AND NOT p_force_overwrite THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation already exists');
    END IF;
    
    -- Insert or update conversation
    INSERT INTO public.conversations (
        id, user_id, title, messages, insights, context, 
        game_id, is_pinned, created_at, updated_at
    ) VALUES (
        p_conversation_id, internal_user_id, p_title, p_messages, p_insights, p_context,
        p_game_id, p_is_pinned, NOW(), NOW()
    )
    ON CONFLICT (id, user_id) 
    DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        insights = EXCLUDED.insights,
        context = EXCLUDED.context,
        game_id = EXCLUDED.game_id,
        is_pinned = EXCLUDED.is_pinned,
        updated_at = NOW();
    
    RETURN jsonb_build_object('success', true, 'conversation_id', p_conversation_id);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON public.conversations (user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_id_user 
ON public.conversations (id, user_id);

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_internal_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_optimized(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID, TEXT) TO authenticated;

-- 8. Create delete_conversation function
CREATE OR REPLACE FUNCTION public.delete_conversation(p_conversation_id TEXT, p_auth_user_id UUID)
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
    WHERE auth_user_id = p_auth_user_id;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Delete the conversation
    DELETE FROM public.conversations 
    WHERE id = p_conversation_id AND user_id = internal_user_id;
    
    -- Check if any rows were affected
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 9. Create update_conversation_title function
CREATE OR REPLACE FUNCTION public.update_conversation_title(p_conversation_id TEXT, p_title TEXT, p_auth_user_id UUID)
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
    WHERE auth_user_id = p_auth_user_id;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update the conversation title
    UPDATE public.conversations 
    SET title = p_title, updated_at = NOW()
    WHERE id = p_conversation_id AND user_id = internal_user_id;
    
    -- Check if any rows were affected
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 10. Create pin_conversation function
CREATE OR REPLACE FUNCTION public.pin_conversation(p_conversation_id TEXT, p_is_pinned BOOLEAN, p_auth_user_id UUID)
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
    WHERE auth_user_id = p_auth_user_id;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update the conversation pin status
    UPDATE public.conversations 
    SET is_pinned = p_is_pinned, updated_at = NOW()
    WHERE id = p_conversation_id AND user_id = internal_user_id;
    
    -- Check if any rows were affected
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 11. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_internal_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_optimized(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_title(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pin_conversation(TEXT, BOOLEAN, UUID) TO authenticated;

-- 12. Test the fix
DO $$
DECLARE
    test_result JSONB;
BEGIN
    -- Test the get_internal_user_id function
    SELECT public.get_internal_user_id('00000000-0000-0000-0000-000000000000'::UUID) INTO test_result;
    RAISE NOTICE 'get_internal_user_id test completed';
    
    -- Test the load_conversations function
    SELECT public.load_conversations('00000000-0000-0000-0000-000000000000'::UUID) INTO test_result;
    RAISE NOTICE 'load_conversations test completed: %', test_result;
    
    RAISE NOTICE 'Conversation persistence fix applied successfully';
END $$;
