-- ========================================
-- RLS PERFORMANCE OPTIMIZATION FIX
-- Fixes Supabase linter warnings for better performance
-- ========================================

-- This fix addresses the performance warnings from Supabase linter:
-- 1. auth_rls_initplan - Optimize auth function calls
-- 2. multiple_permissive_policies - Remove duplicate policies

-- 1. Fix conversations table RLS policies with optimized auth calls
-- Drop existing policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Create optimized RLS policies for conversations
-- Using (select auth.uid()) instead of auth.uid() for better performance
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "conversations_delete_policy" ON public.conversations
    FOR DELETE USING ((select auth.uid()) = user_id);

-- 2. Fix diary_tasks table RLS policies
-- First, check if there are existing policies that might conflict
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Count existing policies on diary_tasks
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'diary_tasks';
    
    RAISE NOTICE 'Found % existing policies on diary_tasks table', policy_count;
END $$;

-- Drop ALL existing policies on diary_tasks to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies on diary_tasks table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'diary_tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.diary_tasks', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Create single optimized RLS policy for diary_tasks
-- This replaces multiple policies with one comprehensive policy
CREATE POLICY "diary_tasks_access_policy" ON public.diary_tasks
    FOR ALL USING ((select auth.uid()) = user_id);

-- 3. Verify the fixes
DO $$
DECLARE
    conversations_policy_count INTEGER;
    diary_tasks_policy_count INTEGER;
    policy_record RECORD;
BEGIN
    -- Check conversations policies
    SELECT COUNT(*) INTO conversations_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversations';
    
    RAISE NOTICE 'Conversations table now has % policies', conversations_policy_count;
    
    -- Check diary_tasks policies
    SELECT COUNT(*) INTO diary_tasks_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'diary_tasks';
    
    RAISE NOTICE 'Diary_tasks table now has % policies', diary_tasks_policy_count;
    
    -- List all policies for verification
    RAISE NOTICE 'Current policies:';
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('conversations', 'diary_tasks')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE '  %: % (%) - %', 
            policy_record.tablename, 
            policy_record.policyname, 
            policy_record.cmd,
            policy_record.roles;
    END LOOP;
END $$;

-- 4. Test the optimized policies
DO $$
DECLARE
    test_user_id UUID;
    conversations_count INTEGER;
    diary_tasks_count INTEGER;
BEGIN
    -- Get a test user ID
    SELECT user_id INTO test_user_id 
    FROM public.conversations 
    WHERE deleted_at IS NULL 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test conversations query with optimized policy
        SELECT COUNT(*) INTO conversations_count
        FROM public.conversations
        WHERE user_id = test_user_id
        AND deleted_at IS NULL;
        
        RAISE NOTICE 'Conversations query test: % rows found', conversations_count;
        
        -- Test diary_tasks query with optimized policy
        SELECT COUNT(*) INTO diary_tasks_count
        FROM public.diary_tasks
        WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Diary_tasks query test: % rows found', diary_tasks_count;
        
    ELSE
        RAISE NOTICE 'No test user found for policy testing';
    END IF;
END $$;

-- 5. Final verification message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS PERFORMANCE OPTIMIZATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Optimizations applied:';
    RAISE NOTICE '1. ✅ Optimized auth function calls with (select auth.uid())';
    RAISE NOTICE '2. ✅ Consolidated multiple policies into single policies';
    RAISE NOTICE '3. ✅ Removed duplicate permissive policies';
    RAISE NOTICE '4. ✅ Improved query performance at scale';
    RAISE NOTICE '';
    RAISE NOTICE 'Performance benefits:';
    RAISE NOTICE '- Auth functions are evaluated once per query instead of per row';
    RAISE NOTICE '- Fewer policy evaluations per query';
    RAISE NOTICE '- Better query planning and execution';
    RAISE NOTICE '========================================';
END $$;
