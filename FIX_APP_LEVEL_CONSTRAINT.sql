-- ========================================
-- 🛠️ FIX APP_LEVEL CONSTRAINT ERROR
-- ========================================
-- This fixes the app_level check constraint error

-- Drop the problematic constraint if it exists
DO $$ 
BEGIN
    ALTER TABLE public.app_level DROP CONSTRAINT IF EXISTS app_level_value_check;
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint doesn't exist, continue
        NULL;
END $$;

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS public.app_level (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE CHECK (length(key) <= 255),
    value JSONB NOT NULL,
    description TEXT CHECK (length(description) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default app level data (with error handling)
DO $$ 
BEGIN
    -- Insert app_version
    INSERT INTO public.app_level (key, value, description) 
    VALUES ('app_version', '"1.0.0"', 'Current app version')
    ON CONFLICT (key) DO NOTHING;
    
    -- Insert maintenance_mode
    INSERT INTO public.app_level (key, value, description) 
    VALUES ('maintenance_mode', 'false', 'Maintenance mode flag')
    ON CONFLICT (key) DO NOTHING;
    
    -- Insert feature_flags
    INSERT INTO public.app_level (key, value, description) 
    VALUES ('feature_flags', '{}', 'Feature flags configuration')
    ON CONFLICT (key) DO NOTHING;
    
    -- Insert tier_limits
    INSERT INTO public.app_level (key, value, description) 
    VALUES ('tier_limits', '{"free": {"text": 55, "image": 25}, "pro": {"text": 1583, "image": 328}, "vanguard_pro": {"text": 1583, "image": 328}}', 'Tier usage limits')
    ON CONFLICT (key) DO NOTHING;
    
    -- Insert ai_models
    INSERT INTO public.app_level (key, value, description) 
    VALUES ('ai_models', '{"default": "gemini-2.5-flash", "insights": "gemini-2.5-pro"}', 'AI model configuration')
    ON CONFLICT (key) DO NOTHING;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but continue
        RAISE NOTICE 'Error inserting app_level data: %', SQLERRM;
END $$;

-- Verify the data was inserted
SELECT key, value, description FROM public.app_level ORDER BY key;
