-- Minimal Supabase Schema for Otakon
-- This version only creates the essential tables and policies
-- 
-- IMPORTANT: If you get "policy already exists" errors when running this schema,
-- it means the policies were already created in a previous run. You can safely
-- ignore these errors, or drop the existing policies first if needed.
-- 
-- To drop existing policies (if needed):
-- DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
-- (repeat for other policies as needed)

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER,
    inventory TEXT[],
    last_trailer_timestamp BIGINT,
    last_interaction_timestamp BIGINT,
    genre TEXT,
    insights JSONB,
    insights_order TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    active_objective JSONB,
    UNIQUE(id, user_id)
);

-- Create usage table
CREATE TABLE IF NOT EXISTS usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    text_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    text_limit INTEGER DEFAULT 55,
    image_limit INTEGER DEFAULT 60,
    tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table for AI personalization
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    game_genre TEXT DEFAULT 'rpg' CHECK (game_genre IN ('rpg', 'fps', 'strategy', 'adventure', 'puzzle', 'simulation', 'sports', 'racing', 'fighting', 'mmo')),
    hint_style TEXT DEFAULT 'progressive' CHECK (hint_style IN ('direct', 'subtle', 'progressive', 'socratic', 'story-based')),
    detail_level TEXT DEFAULT 'concise' CHECK (detail_level IN ('minimal', 'concise', 'detailed', 'comprehensive')),
    spoiler_sensitivity TEXT DEFAULT 'moderate' CHECK (spoiler_sensitivity IN ('very_sensitive', 'sensitive', 'moderate', 'low', 'none')),
    ai_personality TEXT DEFAULT 'encouraging' CHECK (ai_personality IN ('casual', 'formal', 'humorous', 'mysterious', 'encouraging', 'analytical')),
    preferred_response_format TEXT DEFAULT 'text_with_bullets' CHECK (preferred_response_format IN ('text_only', 'text_with_bullets', 'step_by_step', 'story_narrative', 'technical')),
    skill_level TEXT DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'casual', 'intermediate', 'advanced', 'expert')),
    gaming_patterns JSONB DEFAULT '{"preferred_play_time": ["evening", "weekends"], "session_duration": "medium", "frequency": "weekly", "multiplayer_preference": false, "completionist_tendency": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'landing_page',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEW: AI Context & Learning Tables

-- Create ai_context table for storing user-specific AI context
CREATE TABLE IF NOT EXISTS ai_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('preferences', 'behavior', 'feedback', 'learning')),
    context_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, context_type)
);

-- Create ai_feedback table for global feedback learning
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
    message_id TEXT,
    insight_id TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down', 'submitted')),
    feedback_text TEXT,
    ai_response_context JSONB DEFAULT '{}',
    user_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_learning table for global AI improvement
CREATE TABLE IF NOT EXISTS ai_learning (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learning_type TEXT NOT NULL CHECK (learning_type IN ('response_pattern', 'user_preference', 'error_correction', 'success_pattern')),
    pattern_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_behavior table for tracking user interactions
CREATE TABLE IF NOT EXISTS user_behavior (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_is_pinned ON conversations(is_pinned);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- NEW: Indexes for AI context tables
CREATE INDEX IF NOT EXISTS idx_ai_context_user_id ON ai_context(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_type ON ai_context(context_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation_id ON ai_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_type ON ai_learning(learning_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_confidence ON ai_learning(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action_type ON user_behavior(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- NEW: Enable RLS for AI context tables
ALTER TABLE ai_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for usage
CREATE POLICY "Users can view their own usage" ON usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for waitlist
CREATE POLICY "Anyone can insert into waitlist" ON waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist entries" ON waitlist
    FOR SELECT USING (true);

-- NEW: RLS policies for AI context tables
CREATE POLICY "Users can view their own AI context" ON ai_context
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI context" ON ai_context
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI context" ON ai_context
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI feedback" ON ai_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI feedback" ON ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own behavior data" ON user_behavior
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior data" ON user_behavior
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI learning table is readable by all authenticated users for global learning
CREATE POLICY "Authenticated users can view AI learning data" ON ai_learning
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update AI learning data" ON ai_learning
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON usage TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON waitlist TO authenticated;

-- NEW: Grant permissions for AI context tables
GRANT ALL ON ai_context TO authenticated;
GRANT ALL ON ai_feedback TO authenticated;
GRANT ALL ON ai_learning TO authenticated;
GRANT ALL ON user_behavior TO authenticated;
GRANT ALL ON waitlist TO anon;
