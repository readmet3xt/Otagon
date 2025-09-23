-- =====================================================
-- MISSING FUNCTION: mark_first_run_completed
-- =====================================================
-- This function is called after profile setup completion
-- but was missing from the database, causing 404 errors

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.mark_first_run_completed(uuid);

-- Create the mark_first_run_completed function
CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update the user record to mark first run as completed
  UPDATE public.users
  SET has_seen_splash_screens = true,
      is_new_user = false,
      updated_at = now()
  WHERE auth_user_id = p_user_id;

  -- Check if any rows were affected
  IF FOUND THEN
    result := jsonb_build_object(
      'success', true,
      'message', 'First run marked as completed'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
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

-- Test the function (optional - remove this in production)
-- SELECT public.mark_first_run_completed('00000000-0000-0000-0000-000000000000'::uuid);
