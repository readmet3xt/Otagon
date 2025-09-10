-- Fix function security warnings by setting proper search_path
-- Run this in your Supabase SQL Editor

-- Drop the trigger first, then the function, then recreate both
DROP TRIGGER IF EXISTS update_cache_updated_at ON public.cache;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_cache_updated_at
    BEFORE UPDATE ON public.cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop and recreate the get_onboarding_funnel_stats function with proper security
DROP FUNCTION IF EXISTS get_onboarding_funnel_stats(UUID);

CREATE OR REPLACE FUNCTION get_onboarding_funnel_stats(
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    step TEXT,
    total_users BIGINT,
    completed_users BIGINT,
    completion_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        of.step,
        COUNT(DISTINCT of.user_id) as total_users,
        COUNT(DISTINCT CASE WHEN of.completed_at IS NOT NULL THEN of.user_id END) as completed_users,
        CASE 
            WHEN COUNT(DISTINCT of.user_id) > 0 
            THEN ROUND(
                (COUNT(DISTINCT CASE WHEN of.completed_at IS NOT NULL THEN of.user_id END)::NUMERIC / 
                 COUNT(DISTINCT of.user_id)::NUMERIC) * 100, 2
            )
            ELSE 0
        END as completion_rate
    FROM public.onboarding_funnel of
    WHERE (p_user_id IS NULL OR of.user_id = p_user_id)
    GROUP BY of.step
    ORDER BY of.step;
END;
$$;
