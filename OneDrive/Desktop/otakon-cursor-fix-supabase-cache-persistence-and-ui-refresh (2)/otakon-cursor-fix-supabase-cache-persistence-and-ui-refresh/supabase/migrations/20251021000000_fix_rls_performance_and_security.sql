-- =====================================================
-- Fix RLS Performance Issues & Function Security
-- Date: 2025-10-21
-- Purpose: Address Supabase linter warnings
--   1. RLS InitPlan optimization (auth.uid() → (select auth.uid()))
--   2. Function search_path security
-- =====================================================

-- =====================================================
-- PART 1: Fix RLS Performance Issues
-- Replace auth.uid() with (select auth.uid()) for better query performance
-- This prevents re-evaluation of auth.uid() for each row
-- =====================================================

-- Drop existing policies for messages table
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON public.messages;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view messages from their conversations" 
ON public.messages FOR SELECT 
USING (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert messages to their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update messages in their conversations" 
ON public.messages FOR UPDATE 
USING (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete messages from their conversations" 
ON public.messages FOR DELETE 
USING (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

-- Drop existing policies for subtabs table
DROP POLICY IF EXISTS "Users can view subtabs from their games" ON public.subtabs;
DROP POLICY IF EXISTS "Users can insert subtabs to their games" ON public.subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their games" ON public.subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their games" ON public.subtabs;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view subtabs from their games" 
ON public.subtabs FOR SELECT 
USING (
  game_id IN (
    SELECT g.id
    FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert subtabs to their games" 
ON public.subtabs FOR INSERT 
WITH CHECK (
  game_id IN (
    SELECT g.id
    FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update subtabs in their games" 
ON public.subtabs FOR UPDATE 
USING (
  game_id IN (
    SELECT g.id
    FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete subtabs from their games" 
ON public.subtabs FOR DELETE 
USING (
  game_id IN (
    SELECT g.id
    FROM games g
    JOIN users u ON g.user_id = u.id
    WHERE u.auth_user_id = (SELECT auth.uid())
  )
);

-- =====================================================
-- PART 2: Fix Function Security Issues
-- Add search_path to SECURITY DEFINER functions
-- This prevents search_path hijacking attacks
-- =====================================================

-- Fix get_user_onboarding_status
CREATE OR REPLACE FUNCTION public.get_user_onboarding_status(p_user_id uuid)
RETURNS TABLE(
  is_new_user boolean,
  has_seen_splash_screens boolean,
  has_profile_setup boolean,
  has_welcome_message boolean,
  has_seen_how_to_use boolean,
  has_seen_features_connected boolean,
  has_seen_pro_features boolean,
  pc_connected boolean,
  pc_connection_skipped boolean,
  onboarding_completed boolean,
  tier text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.is_new_user,
    u.has_seen_splash_screens,
    u.has_profile_setup,
    u.has_welcome_message,
    u.has_seen_how_to_use,
    u.has_seen_features_connected,
    u.has_seen_pro_features,
    u.pc_connected,
    u.pc_connection_skipped,
    u.onboarding_completed,
    u.tier
  FROM users u
  WHERE u.auth_user_id = p_user_id;
END;
$$;

-- Fix update_user_onboarding_status (the overloaded version)
CREATE OR REPLACE FUNCTION public.update_user_onboarding_status(
  p_user_id uuid,
  p_step text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update the specific step in users table
  CASE p_step
    WHEN 'initial' THEN
      UPDATE users 
      SET has_seen_splash_screens = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'how-to-use' THEN
      UPDATE users 
      SET has_seen_how_to_use = true,
          pc_connected = COALESCE((p_data->>'pc_connected')::boolean, pc_connected),
          pc_connection_skipped = COALESCE((p_data->>'pc_connection_skipped')::boolean, pc_connection_skipped),
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'features-connected' THEN
      UPDATE users 
      SET has_seen_features_connected = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'pro-features' THEN
      UPDATE users 
      SET has_seen_pro_features = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'profile-setup' THEN
      UPDATE users 
      SET has_profile_setup = true,
          profile_data = COALESCE(p_data, profile_data),
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'complete' THEN
      UPDATE users 
      SET onboarding_completed = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    ELSE
      RAISE EXCEPTION 'Unknown onboarding step: %', p_step;
  END CASE;
END;
$$;

-- Fix get_or_create_game_hub
CREATE OR REPLACE FUNCTION public.get_or_create_game_hub(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user_id = p_user_id AND is_game_hub = TRUE
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, title, is_game_hub)
    VALUES (p_user_id, 'Game Hub', TRUE)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- Fix migrate_messages_to_conversation
CREATE OR REPLACE FUNCTION public.migrate_messages_to_conversation(
  p_message_ids uuid[],
  p_target_conversation_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  UPDATE messages
  SET conversation_id = p_target_conversation_id
  WHERE id = ANY(p_message_ids);
  
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  
  RETURN v_migrated_count;
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES (comment out after running)
-- =====================================================

-- Check RLS policies are updated
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename IN ('messages', 'subtabs')
-- ORDER BY tablename, policyname;

-- Check functions have search_path set
-- SELECT 
--   n.nspname as schema,
--   p.proname as function_name,
--   pg_get_function_result(p.oid) as return_type,
--   CASE 
--     WHEN prosecdef THEN 'SECURITY DEFINER'
--     ELSE 'SECURITY INVOKER'
--   END as security,
--   proconfig as config
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_user_onboarding_status',
--     'update_user_onboarding_status',
--     'get_or_create_game_hub',
--     'migrate_messages_to_conversation'
--   )
-- ORDER BY p.proname;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view messages from their conversations" ON public.messages 
IS 'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "Users can view subtabs from their games" ON public.subtabs
IS 'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON FUNCTION public.get_user_onboarding_status(uuid)
IS 'Gets user onboarding status. SECURITY DEFINER with search_path protection.';

COMMENT ON FUNCTION public.update_user_onboarding_status(uuid, text, jsonb)
IS 'Updates user onboarding progress. SECURITY DEFINER with search_path protection.';

COMMENT ON FUNCTION public.get_or_create_game_hub(uuid)
IS 'Gets or creates game hub conversation. SECURITY DEFINER with search_path protection.';

COMMENT ON FUNCTION public.migrate_messages_to_conversation(uuid[], uuid)
IS 'Migrates messages to a different conversation. SECURITY DEFINER with search_path protection.';
