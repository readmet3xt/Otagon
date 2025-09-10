-- MANUAL USER CREATION FIX
-- This script manually creates the user record and verifies RLS policies

-- 1. First, let's check if the user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 2. Check if the user exists in public.users
SELECT * FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 3. If the user doesn't exist in public.users, create them manually
INSERT INTO public.users (
    auth_user_id,
    email,
    profile_data,
    preferences,
    usage_data,
    app_state,
    behavior_data,
    feedback_data,
    onboarding_data,
    created_at,
    updated_at
) VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    (SELECT email FROM auth.users WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30'),
    '{}',
    '{}',
    '{"tier": "free", "textCount": 0, "imageCount": 0, "lastMonth": "2025-01", "usageHistory": [], "tierHistory": [], "lastReset": "2025-01-01"}',
    '{"lastVisited": "2025-01-01", "uiPreferences": {}, "featureFlags": {}, "appSettings": {}, "lastInteraction": "2025-01-01"}',
    '{}',
    '{}',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO NOTHING;

-- 4. Verify the user was created
SELECT * FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 5. Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 6. Check RLS policies on games table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'games' AND schemaname = 'public';

-- 7. Test if we can query the user data
SELECT auth_user_id, email FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';

-- 8. Test if we can query games data
SELECT * FROM public.games WHERE user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30' LIMIT 1;
