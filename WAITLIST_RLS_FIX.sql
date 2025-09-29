-- ========================================
-- WAITLIST RLS PERMISSIONS FIX
-- ========================================
-- This fixes the 401 Unauthorized error when checking existing emails
-- and improves duplicate email handling

-- Add missing SELECT policy for waitlist table
-- This allows checking if an email already exists without authentication
CREATE POLICY "Anyone can check waitlist emails" ON public.waitlist
  FOR SELECT USING (true);

-- Add UPDATE policy for waitlist status changes (for admin use)
CREATE POLICY "Anyone can update waitlist status" ON public.waitlist
  FOR UPDATE USING (true);

-- Add DELETE policy for waitlist cleanup (for admin use)
CREATE POLICY "Anyone can delete waitlist entries" ON public.waitlist
  FOR DELETE USING (true);

-- ========================================
-- IMPROVED WAITLIST SERVICE FUNCTIONS
-- ========================================

-- Function to safely check if email exists in waitlist
CREATE OR REPLACE FUNCTION public.check_waitlist_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if email exists in waitlist
  RETURN EXISTS (
    SELECT 1 FROM public.waitlist 
    WHERE email = p_email
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but return false to allow signup attempt
    RAISE WARNING 'Error checking waitlist email: %', SQLERRM;
    RETURN false;
END;
$$;

-- Function to safely add email to waitlist with duplicate handling
CREATE OR REPLACE FUNCTION public.add_to_waitlist(
  p_email TEXT,
  p_source TEXT DEFAULT 'landing_page'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  existing_entry RECORD;
  result JSONB;
BEGIN
  -- Check if email already exists
  SELECT * INTO existing_entry 
  FROM public.waitlist 
  WHERE email = p_email;
  
  IF existing_entry IS NOT NULL THEN
    -- Email already exists, return success with existing status
    result := jsonb_build_object(
      'success', true,
      'already_exists', true,
      'status', existing_entry.status,
      'created_at', existing_entry.created_at,
      'message', 'Email already registered for waitlist'
    );
  ELSE
    -- Insert new email
    INSERT INTO public.waitlist (email, source, status)
    VALUES (p_email, p_source, 'pending');
    
    result := jsonb_build_object(
      'success', true,
      'already_exists', false,
      'status', 'pending',
      'created_at', now(),
      'message', 'Successfully added to waitlist'
    );
  END IF;
  
  RETURN result;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition where email was added between check and insert
    SELECT * INTO existing_entry 
    FROM public.waitlist 
    WHERE email = p_email;
    
    RETURN jsonb_build_object(
      'success', true,
      'already_exists', true,
      'status', existing_entry.status,
      'created_at', existing_entry.created_at,
      'message', 'Email already registered for waitlist'
    );
    
  WHEN OTHERS THEN
    -- Log error and return failure
    RAISE WARNING 'Error adding to waitlist: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to add to waitlist: ' || SQLERRM
    );
END;
$$;

-- Function to get waitlist count (for display purposes)
CREATE OR REPLACE FUNCTION public.get_waitlist_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result FROM public.waitlist;
  RETURN COALESCE(count_result, 0);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error getting waitlist count: %', SQLERRM;
    RETURN 0;
END;
$$;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on waitlist functions
GRANT EXECUTE ON FUNCTION public.check_waitlist_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_waitlist(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Test the functions (uncomment to test)
-- SELECT public.check_waitlist_email('test@example.com');
-- SELECT public.add_to_waitlist('test@example.com', 'test_source');
-- SELECT public.get_waitlist_count();
