-- ========================================
-- CONVERSATIONS COMPREHENSIVE FIX
-- Fixes 406 "Not Acceptable" error for conversation queries
-- Addresses both schema and query issues
-- ========================================

-- This fix addresses the root cause of the 406 error:
-- 1. Ensures proper table structure
-- 2. Fixes RLS policies
-- 3. Provides fallback query methods
-- 4. Adds proper error handling

-- 1. First, let's check the current table structure
DO $$
DECLARE
    constraint_info RECORD;
    column_count INTEGER;
BEGIN
    -- Check if conversations table exists and get its structure
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND table_schema = 'public';
    
    IF column_count = 0 THEN
        RAISE NOTICE 'conversations table does not exist - creating it';
    ELSE
        RAISE NOTICE 'conversations table exists with % columns', column_count;
    END IF;
    
    -- Check primary key structure
    SELECT constraint_name, constraint_type
    INTO constraint_info
    FROM information_schema.table_constraints 
    WHERE table_name = 'conversations' 
    AND table_schema = 'public'
    AND constraint_type = 'PRIMARY KEY';
    
    IF constraint_info.constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Primary key constraint: %', constraint_info.constraint_name;
    ELSE
        RAISE NOTICE 'No primary key constraint found';
    END IF;
END $$;

-- 2. Ensure the conversations table exists with proper structure
CREATE TABLE IF NOT EXISTS public.conversations (
    id text NOT NULL,
    user_id uuid NOT NULL,
    game_id text,
    title text NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb,
    context jsonb DEFAULT '{}'::jsonb,
    insights jsonb DEFAULT '{}'::jsonb,
    is_pinned boolean DEFAULT false,
    version integer DEFAULT 1,
    checksum text DEFAULT '',
    last_modified timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- 3. Add missing columns if they don't exist
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS checksum TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Fix the primary key structure
-- Drop existing primary key if it exists
DO $$
BEGIN
    -- Check if there's a composite primary key
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'conversations' 
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name IN ('id', 'user_id')
        GROUP BY tc.constraint_name
        HAVING COUNT(DISTINCT kcu.column_name) = 2
    ) THEN
        -- Drop the composite primary key
        ALTER TABLE public.conversations DROP CONSTRAINT conversations_pkey;
        RAISE NOTICE 'Dropped composite primary key constraint';
    END IF;
END $$;

-- 5. Create a single-column primary key using a generated UUID
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS internal_id UUID DEFAULT gen_random_uuid();

-- Make it the primary key
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_pkey PRIMARY KEY (internal_id);

-- 6. Add unique constraint on (id, user_id) for data integrity
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_id_user_unique UNIQUE (id, user_id);

-- 7. Update the last_modified column to use updated_at if last_modified is not set
UPDATE public.conversations 
SET last_modified = updated_at 
WHERE last_modified IS NULL OR last_modified = '1970-01-01'::timestamptz;

-- 8. Ensure RLS is enabled and policies are correct
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Create optimized RLS policies
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversations_delete_policy" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_id_user 
ON public.conversations (id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON public.conversations (user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at 
ON public.conversations (deleted_at) 
WHERE deleted_at IS NULL;

-- 10. Create a function to safely get a conversation
-- This function handles the case where multiple rows might exist
CREATE OR REPLACE FUNCTION public.get_conversation_safe(
    p_conversation_id TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSONB;
    conversation_record RECORD;
BEGIN
    -- Get the conversation with proper filtering
    SELECT 
        id,
        user_id,
        game_id,
        title,
        messages,
        insights,
        context,
        is_pinned,
        version,
        checksum,
        last_modified,
        created_at,
        updated_at
    INTO conversation_record
    FROM public.conversations
    WHERE id = p_conversation_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no conversation found, return error
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conversation not found'
        );
    END IF;
    
    -- Build the result
    result := jsonb_build_object(
        'success', true,
        'conversation', jsonb_build_object(
            'id', conversation_record.id,
            'user_id', conversation_record.user_id,
            'game_id', conversation_record.game_id,
            'title', conversation_record.title,
            'messages', COALESCE(conversation_record.messages, '[]'::jsonb),
            'insights', COALESCE(conversation_record.insights, '{}'::jsonb),
            'context', COALESCE(conversation_record.context, '{}'::jsonb),
            'is_pinned', COALESCE(conversation_record.is_pinned, false),
            'version', COALESCE(conversation_record.version, 1),
            'checksum', COALESCE(conversation_record.checksum, ''),
            'last_modified', conversation_record.last_modified,
            'created_at', conversation_record.created_at,
            'updated_at', conversation_record.updated_at
        )
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 11. Grant permissions on the function
GRANT EXECUTE ON FUNCTION public.get_conversation_safe(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_safe(TEXT, UUID) TO anon;

-- 12. Test the fix
DO $$
DECLARE
    test_user_id UUID;
    test_conversation_id TEXT;
    result_count INTEGER;
    test_result JSONB;
BEGIN
    -- Get a test user ID (first user in the table)
    SELECT user_id INTO test_user_id 
    FROM public.conversations 
    WHERE deleted_at IS NULL 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Get a test conversation ID
        SELECT id INTO test_conversation_id 
        FROM public.conversations 
        WHERE user_id = test_user_id 
        AND deleted_at IS NULL 
        LIMIT 1;
        
        IF test_conversation_id IS NOT NULL THEN
            -- Test the original query that was failing
            SELECT COUNT(*) INTO result_count
            FROM public.conversations
            WHERE id = test_conversation_id
            AND user_id = test_user_id
            AND deleted_at IS NULL;
            
            RAISE NOTICE 'Original query result count: %', result_count;
            
            -- Test the new safe function
            SELECT public.get_conversation_safe(test_conversation_id, test_user_id) INTO test_result;
            RAISE NOTICE 'Safe function result: %', test_result;
            
            IF result_count = 1 THEN
                RAISE NOTICE 'SUCCESS: Original query now returns exactly 1 row as expected';
            ELSE
                RAISE NOTICE 'WARNING: Original query returns % rows, expected 1', result_count;
            END IF;
        ELSE
            RAISE NOTICE 'No test conversation found';
        END IF;
    ELSE
        RAISE NOTICE 'No test user found';
    END IF;
END $$;

-- 13. Final verification message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONVERSATIONS COMPREHENSIVE FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'The conversations table now has:';
    RAISE NOTICE '1. Single-column primary key (internal_id)';
    RAISE NOTICE '2. Unique constraint on (id, user_id) for data integrity';
    RAISE NOTICE '3. Optimized RLS policies';
    RAISE NOTICE '4. Performance indexes';
    RAISE NOTICE '5. All required columns';
    RAISE NOTICE '6. Safe get_conversation_safe() function';
    RAISE NOTICE '';
    RAISE NOTICE 'The 406 "Not Acceptable" error should now be resolved.';
    RAISE NOTICE 'The .single() method will work correctly.';
    RAISE NOTICE 'You can also use the get_conversation_safe() function as a fallback.';
    RAISE NOTICE '========================================';
END $$;
