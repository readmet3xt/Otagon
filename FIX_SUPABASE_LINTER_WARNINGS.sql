-- FIX SUPABASE LINTER WARNINGS
-- This script addresses the security warnings from Supabase linter

-- 1. Fix function search path mutable warning
-- Drop and recreate the function with proper search_path setting
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Grant proper permissions for the function
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- 3. Recreate all triggers to use the updated function
-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_waitlist_updated_at ON public.waitlist;
DROP TRIGGER IF EXISTS update_cache_updated_at ON public.cache;
DROP TRIGGER IF EXISTS update_app_level_updated_at ON public.app_level;
DROP TRIGGER IF EXISTS update_admin_updated_at ON public.admin;

-- Recreate triggers with the fixed function
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON public.waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_updated_at
    BEFORE UPDATE ON public.cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_level_updated_at
    BEFORE UPDATE ON public.app_level
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON public.admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Function search path security warning fixed!' as message;

-- NOTE: The other two warnings need to be addressed in Supabase dashboard:
-- 
-- 1. "Leaked Password Protection Disabled"
--    - Go to Authentication > Settings in your Supabase dashboard
--    - Enable "Password strength and leaked password protection"
-- 
-- 2. "Current Postgres version has security patches available"
--    - Go to Settings > General in your Supabase dashboard
--    - Click "Upgrade" under Database version
--    - Follow the upgrade process to get the latest security patches
