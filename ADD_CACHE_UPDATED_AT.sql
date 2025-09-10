-- Add updated_at column to cache table
-- Run this in your Supabase SQL Editor

-- Add the updated_at column to cache table
ALTER TABLE public.cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to cache table
DROP TRIGGER IF EXISTS update_cache_updated_at ON public.cache;
CREATE TRIGGER update_cache_updated_at
    BEFORE UPDATE ON public.cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
