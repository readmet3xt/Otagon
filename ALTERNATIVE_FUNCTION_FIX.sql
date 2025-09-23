-- ========================================
-- 🚀 ALTERNATIVE: CREATE FUNCTION WITH DIFFERENT NAME
-- ========================================
-- This creates a function with a different name to avoid caching issues

-- Drop any existing functions
DROP FUNCTION IF EXISTS public.save_conversation CASCADE;
DROP FUNCTION IF EXISTS public.save_conversation_v2 CASCADE;
DROP FUNCTION IF EXISTS public.save_conversation_new CASCADE;

-- Create function with the exact parameter order your app calls
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.save_conversation TO authenticated;

-- Verify function exists
SELECT 'FUNCTION CREATED SUCCESSFULLY' as status;
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'save_conversation';
