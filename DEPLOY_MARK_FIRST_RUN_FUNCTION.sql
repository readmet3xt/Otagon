-- =====================================================
-- DEPLOY MISSING FUNCTION: mark_first_run_completed
-- =====================================================
-- This is the EXACT function from FINAL_WORKING_DATABASE_FUNCTIONS.sql
-- It properly handles the auth_user_id to internal user ID mapping

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.mark_first_run_completed(uuid);

-- Function to mark first run as completed (from FINAL_WORKING_DATABASE_FUNCTIONS.sql)
CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id UUID)
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
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user first run status
    UPDATE public.users 
    SET is_new_user = false, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Verify the function was created successfully
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'mark_first_run_completed';
