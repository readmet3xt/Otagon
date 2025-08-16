-- Helper script to drop existing policies before running the main schema
-- Run this if you get "policy already exists" errors

-- Drop conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Drop usage policies
DROP POLICY IF EXISTS "Users can view their own usage" ON usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON usage;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Drop user_preferences policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Drop waitlist policies
DROP POLICY IF EXISTS "Anyone can insert into waitlist" ON waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist entries" ON waitlist;

-- Drop AI context policies
DROP POLICY IF EXISTS "Users can view their own AI context" ON ai_context;
DROP POLICY IF EXISTS "Users can insert their own AI context" ON ai_context;
DROP POLICY IF EXISTS "Users can update their own AI context" ON ai_context;

-- Drop AI feedback policies
DROP POLICY IF EXISTS "Users can view their own AI feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Users can insert their own AI feedback" ON ai_feedback;

-- Drop user behavior policies
DROP POLICY IF EXISTS "Users can view their own behavior data" ON user_behavior;
DROP POLICY IF EXISTS "Users can insert their own behavior data" ON user_behavior;

-- Drop AI learning policies
DROP POLICY IF EXISTS "Authenticated users can view AI learning data" ON ai_learning;
DROP POLICY IF EXISTS "Authenticated users can update AI learning data" ON ai_learning;

-- Note: This script is safe to run multiple times due to IF EXISTS clauses
