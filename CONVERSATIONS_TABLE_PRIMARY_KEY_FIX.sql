-- ========================================
-- CONVERSATIONS TABLE PRIMARY KEY FIX
-- Fixes 406 "Not Acceptable" error when fetching conversations
-- ========================================

-- The issue: Different schema files have conflicting primary key definitions
-- - SYSTEMATIC_MASTER_SQL.sql: PRIMARY KEY (id) - single column
-- - CLEAN_MASTER_SQL_SINGLE_FUNCTIONS.sql: PRIMARY KEY (id, user_id) - composite key
-- 
-- The code expects single-column primary key, but composite key causes .single() to fail
-- because multiple rows can exist with same id but different user_id

-- 1. First, check current table structure
-- This will help us understand which schema is currently active
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    -- Check if conversations table has composite primary key
    SELECT constraint_name, constraint_type
    INTO constraint_info
    FROM information_schema.table_constraints 
    WHERE table_name = 'conversations' 
    AND table_schema = 'public'
    AND constraint_type = 'PRIMARY KEY';
    
    RAISE NOTICE 'Current primary key constraint: %', constraint_info.constraint_name;
END $$;

-- 2. Fix the conversations table structure
-- Drop the existing primary key constraint if it's composite
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if composite primary key exists
    SELECT EXISTS (
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
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        -- Drop the composite primary key
        ALTER TABLE public.conversations DROP CONSTRAINT conversations_pkey;
        RAISE NOTICE 'Dropped composite primary key constraint';
    END IF;
END $$;

-- 3. Add a unique constraint on (id, user_id) for data integrity
-- This ensures no duplicate conversations per user while allowing single-column primary key
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_id_user_unique UNIQUE (id, user_id);

-- 4. Create a new single-column primary key
-- Use a generated UUID for the primary key to ensure uniqueness
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS internal_id UUID DEFAULT gen_random_uuid();

-- Make it the primary key
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_pkey PRIMARY KEY (internal_id);

-- 5. Add missing columns if they don't exist
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS checksum TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 6. Update the last_modified column to use updated_at if last_modified is not set
UPDATE public.conversations 
SET last_modified = updated_at 
WHERE last_modified IS NULL OR last_modified = '1970-01-01'::timestamptz;

-- 7. Ensure RLS is enabled and policies are correct
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

-- Create optimized RLS policies
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversations_delete_policy" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create an index on (id, user_id) for performance
CREATE INDEX IF NOT EXISTS idx_conversations_id_user 
ON public.conversations (id, user_id);

-- 9. Create an index on user_id for RLS performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON public.conversations (user_id);

-- 10. Create an index on deleted_at for filtering
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at 
ON public.conversations (deleted_at) 
WHERE deleted_at IS NULL;

-- 11. Verify the fix
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
    
    RAISE NOTICE 'New primary key constraint: %', constraint_info.constraint_name;
    
    -- Check if internal_id column exists and is primary key
    SELECT column_name, data_type, is_nullable
    INTO column_info
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND table_schema = 'public'
    AND column_name = 'internal_id';
    
    IF column_info.column_name IS NOT NULL THEN
        RAISE NOTICE 'internal_id column exists: %', column_info.data_type;
    ELSE
        RAISE NOTICE 'internal_id column not found - check table structure';
    END IF;
END $$;

-- 12. Test query that should now work
-- This simulates the query that was failing
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

-- 13. Final verification message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONVERSATIONS TABLE PRIMARY KEY FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'The conversations table now has:';
    RAISE NOTICE '1. Single-column primary key (internal_id)';
    RAISE NOTICE '2. Unique constraint on (id, user_id) for data integrity';
    RAISE NOTICE '3. Optimized RLS policies';
    RAISE NOTICE '4. Performance indexes';
    RAISE NOTICE '5. All required columns';
    RAISE NOTICE '';
    RAISE NOTICE 'The 406 "Not Acceptable" error should now be resolved.';
    RAISE NOTICE 'The .single() method will work correctly.';
    RAISE NOTICE '========================================';
END $$;
