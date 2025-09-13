-- Create waitlist table for Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'landing_page',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'registered')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own waitlist entries" ON public.waitlist
    FOR SELECT USING (email = (select auth.jwt()) ->> 'email');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT ON public.waitlist TO anon;
GRANT SELECT ON public.waitlist TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_waitlist_updated_at 
    BEFORE UPDATE ON public.waitlist 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table was created
SELECT 'waitlist table created successfully' as status;
