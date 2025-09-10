-- Create onboarding_funnel table for Otakon app
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.onboarding_funnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    step TEXT NOT NULL,
    step_data JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.onboarding_funnel ENABLE ROW LEVEL SECURITY;

-- Create policies for onboarding_funnel
CREATE POLICY "Users can view own onboarding data" ON public.onboarding_funnel
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = onboarding_funnel.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own onboarding data" ON public.onboarding_funnel
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = onboarding_funnel.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own onboarding data" ON public.onboarding_funnel
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = onboarding_funnel.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_funnel_user_id ON public.onboarding_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_funnel_step ON public.onboarding_funnel(step);
CREATE INDEX IF NOT EXISTS idx_onboarding_funnel_created_at ON public.onboarding_funnel(created_at);
