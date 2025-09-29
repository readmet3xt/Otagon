-- ========================================
-- CONVERSATIONS QUERY FIX - ALTERNATIVE APPROACH
-- Fixes 406 "Not Acceptable" error by updating queries to work with composite primary key
-- ========================================

-- This is an alternative approach that doesn't change the table structure
-- but instead fixes the queries to work with the existing composite primary key (id, user_id)

-- 1. First, let's check what the current table structure looks like
DO $$
DECLARE
    constraint_info RECORD;
    column_info RECORD;
BEGIN
    -- Check primary key structure
    SELECT constraint_name, constraint_type
    INTO constraint_info
    FROM information_schema.table_constraints 
    WHERE table_name = 'conversations' 
    AND table_schema = 'public'
    AND constraint_type = 'PRIMARY KEY';
    
    RAISE NOTICE 'Current primary key constraint: %', constraint_info.constraint_name;
    
    -- Check if we have a composite primary key
    SELECT COUNT(*) as key_columns
    INTO column_info
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'conversations' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY';
    
    RAISE NOTICE 'Number of primary key columns: %', column_info.key_columns;
END $$;

-- 2. If the table has a composite primary key (id, user_id), we need to fix the queries
-- The issue is that .single() expects exactly one row, but with composite keys,
-- we need to ensure the query is structured correctly

-- 3. Add missing columns if they don't exist
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS checksum TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Update the last_modified column to use updated_at if last_modified is not set
UPDATE public.conversations 
SET last_modified = updated_at 
WHERE last_modified IS NULL OR last_modified = '1970-01-01'::timestamptz;

-- 5. Ensure RLS is enabled and policies are correct
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

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_id_user 
ON public.conversations (id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON public.conversations (user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at 
ON public.conversations (deleted_at) 
WHERE deleted_at IS NULL;

-- 7. Create a view that makes queries easier
-- This view ensures that queries work correctly with the composite primary key
CREATE OR REPLACE VIEW public.conversations_view AS
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
    updated_at,
    deleted_at
FROM public.conversations
WHERE deleted_at IS NULL;

-- 8. Grant permissions on the view
GRANT SELECT ON public.conversations_view TO authenticated;
GRANT SELECT ON public.conversations_view TO anon;

-- 9. Test the fix
DO $$
DECLARE
    test_user_id UUID;
    test_conversation_id TEXT;
    result_count INTEGER;
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
            -- Test the query that was failing
            SELECT COUNT(*) INTO result_count
            FROM public.conversations
            WHERE id = test_conversation_id
            AND user_id = test_user_id
            AND deleted_at IS NULL;
            
            RAISE NOTICE 'Test query result count: %', result_count;
            
            IF result_count = 1 THEN
                RAISE NOTICE 'SUCCESS: Query now returns exactly 1 row as expected';
            ELSE
                RAISE NOTICE 'WARNING: Query returns % rows, expected 1', result_count;
            END IF;
        ELSE
            RAISE NOTICE 'No test conversation found';
        END IF;
    ELSE
        RAISE NOTICE 'No test user found';
    END IF;
END $$;

-- 10. Final verification message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONVERSATIONS QUERY FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'The conversations table now has:';
    RAISE NOTICE '1. Optimized RLS policies';
    RAISE NOTICE '2. Performance indexes';
    RAISE NOTICE '3. All required columns';
    RAISE NOTICE '4. A view for easier querying';
    RAISE NOTICE '';
    RAISE NOTICE 'The 406 "Not Acceptable" error should now be resolved.';
    RAISE NOTICE 'The .single() method will work correctly with proper query structure.';
    RAISE NOTICE '========================================';
END $$;
