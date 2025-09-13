-- ========================================
-- ANALYTICS EVENTS RLS POLICIES UPDATE
-- ========================================
-- This script updates the existing RLS policies for analytics_events
-- to use the optimized format for better performance

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can update their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can delete their own analytics events" ON analytics_events;

-- Create optimized policies (performance optimized)
CREATE POLICY "Users can insert their own analytics events" ON analytics_events
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own analytics events" ON analytics_events
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own analytics events" ON analytics_events
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own analytics events" ON analytics_events
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Verify policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'analytics_events'
ORDER BY policyname;

-- ========================================
-- UPDATE COMPLETE
-- ========================================
-- The analytics_events RLS policies have been updated
-- to use the optimized format for better performance.
-- 
-- Performance improvements:
-- - auth.uid() is now wrapped in (select auth.uid())
-- - This prevents re-evaluation for each row
-- - Significantly improves query performance at scale
