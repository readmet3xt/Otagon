-- Create get_onboarding_funnel_stats function
-- Run this in your Supabase SQL Editor

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
