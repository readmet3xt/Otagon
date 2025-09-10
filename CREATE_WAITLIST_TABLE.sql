-- Create a simple waitlist table for the Otakon app
-- Run this in your Supabase SQL Editor

-- First, check if waitlist exists and drop it (whether it's a view or table)
DO $$ 
BEGIN
    -- Drop if it's a view
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'waitlist') THEN
        DROP VIEW public.waitlist;
    END IF;
    
    -- Drop if it's a table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waitlist') THEN
        DROP TABLE public.waitlist;
    END IF;
END $$;

-- Create the waitlist table
CREATE TABLE public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'landing_page',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for the waitlist signup)
CREATE POLICY "Anyone can add to waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Create policy for reading waitlist (only admins can read)
CREATE POLICY "Admins can read waitlist" ON public.waitlist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = (select auth.uid()) 
            AND (email LIKE '%@otakon.app' OR email LIKE '%dev%' OR email LIKE '%admin%')
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);

-- Add a comment to the table
COMMENT ON TABLE public.waitlist IS 'Simple waitlist table for user email signups';
