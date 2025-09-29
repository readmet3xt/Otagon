-- ========================================
-- RLS PERFORMANCE OPTIMIZATION FIX
-- ========================================
-- This fixes the Supabase linter performance warnings

-- ========================================
-- PART 1: CLEAN UP WAITLIST POLICIES
-- ========================================
-- Remove all duplicate policies and keep only the optimized one

-- Drop all existing waitlist policies
DROP POLICY IF EXISTS "Anyone can check waitlist emails" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can update waitlist status" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can delete waitlist entries" ON public.waitlist;
DROP POLICY IF EXISTS "Public access to waitlist" ON public.waitlist;

-- Create single optimized policy for all operations
CREATE POLICY "waitlist_public_access" ON public.waitlist
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- PART 2: OPTIMIZE CONVERSATIONS POLICIES
-- ========================================
-- Fix the auth function calls to use (select auth.uid()) for better performance

-- Drop existing conversations policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Create optimized conversations policies using (select auth.uid())
CREATE POLICY "conversations_select_policy" ON public.conversations
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "conversations_insert_policy" ON public.conversations
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "conversations_update_policy" ON public.conversations
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "conversations_delete_policy" ON public.conversations
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ========================================
-- PART 3: VERIFY OPTIMIZATIONS
-- ========================================

-- Check waitlist policies (should only have one)
SELECT 'Waitlist policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Check conversations policies (should use optimized syntax)
SELECT 'Conversations policies:' as info;
SELECT policyname, cmd, permissive, qual
FROM pg_policies 
WHERE tablename = 'conversations';

-- Test waitlist access
SELECT 'Waitlist test:' as info, COUNT(*) as count FROM public.waitlist;

-- ========================================
-- PART 4: ADDITIONAL PERFORMANCE OPTIMIZATIONS
-- ========================================

-- Ensure proper indexing for conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);

-- Ensure proper indexing for waitlist table
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);

-- ========================================
-- SUMMARY
-- ========================================
-- This fix addresses:
-- ✅ Multiple permissive policies on waitlist (performance issue)
-- ✅ Auth RLS initialization plan issues on conversations
-- ✅ Proper indexing for better query performance
-- ✅ Single, optimized policies for each table
