-- CORRECT DATABASE SCHEMA FIX
-- This script creates the exact database structure the app expects based on your Supabase schema

-- 1. Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.waitlist CASCADE;
DROP TABLE IF EXISTS public.cache CASCADE;
DROP TABLE IF EXISTS public.app_level CASCADE;
DROP TABLE IF EXISTS public.admin CASCADE;

-- 2. Create users table with correct structure
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  email text NOT NULL UNIQUE,
  tier text DEFAULT 'free'::text CHECK (tier = ANY (ARRAY['free'::text, 'premium'::text, 'pro'::text])),
  is_active boolean DEFAULT true,
  profile_data jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  usage_data jsonb DEFAULT '{}'::jsonb,
  app_state jsonb DEFAULT '{}'::jsonb,
  behavior_data jsonb DEFAULT '{}'::jsonb,
  feedback_data jsonb DEFAULT '{}'::jsonb,
  onboarding_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Create games table
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  game_id text NOT NULL,
  title text NOT NULL,
  genre text,
  platform text[],
  game_data jsonb DEFAULT '{}'::jsonb,
  progress_data jsonb DEFAULT '{}'::jsonb,
  session_data jsonb DEFAULT '{}'::jsonb,
  solutions_data jsonb DEFAULT '{}'::jsonb,
  context_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_played timestamp with time zone DEFAULT now(),
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 4. Create conversations table
CREATE TABLE public.conversations (
  id text NOT NULL,
  user_id uuid,
  game_id uuid,
  title text NOT NULL,
  progress integer DEFAULT 0,
  messages jsonb DEFAULT '[]'::jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  insights jsonb DEFAULT '{}'::jsonb,
  objectives jsonb DEFAULT '{}'::jsonb,
  ai_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_interaction timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT conversations_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE
);

-- 5. Create analytics table
CREATE TABLE public.analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  game_id uuid,
  conversation_id text,
  event_type text NOT NULL,
  category text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  performance_data jsonb DEFAULT '{}'::jsonb,
  cost_data jsonb DEFAULT '{}'::jsonb,
  behavior_data jsonb DEFAULT '{}'::jsonb,
  feedback_data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT analytics_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE,
  CONSTRAINT analytics_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- 6. Create tasks table
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  game_id uuid,
  conversation_id text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  category text DEFAULT 'custom'::text CHECK (category = ANY (ARRAY['custom'::text, 'story'::text, 'exploration'::text, 'combat'::text, 'achievement'::text])),
  task_data jsonb DEFAULT '{}'::jsonb,
  progress_data jsonb DEFAULT '{}'::jsonb,
  favorites_data jsonb DEFAULT '{}'::jsonb,
  modifications jsonb DEFAULT '{}'::jsonb,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT tasks_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE,
  CONSTRAINT tasks_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- 7. Create waitlist table
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'landing_page'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);

-- 8. Create cache table
CREATE TABLE public.cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  cache_type text NOT NULL,
  cache_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  performance_data jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  access_count integer DEFAULT 0,
  size_bytes bigint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_accessed timestamp with time zone DEFAULT now(),
  CONSTRAINT cache_pkey PRIMARY KEY (id)
);

-- 9. Create app_level table
CREATE TABLE public.app_level (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_level_pkey PRIMARY KEY (id)
);

-- 10. Create admin table
CREATE TABLE public.admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text, 'resolved'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  system_data jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_pkey PRIMARY KEY (id)
);

-- 11. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- 12. Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 13. Create RLS policies for users table
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK ((select auth.uid()) = auth_user_id);

-- 14. Create RLS policies for games table
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own games" ON public.games
    FOR UPDATE USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- 15. Create RLS policies for conversations table
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- 16. Create RLS policies for analytics table
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own analytics" ON public.analytics
    FOR INSERT WITH CHECK ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- 17. Create RLS policies for tasks table
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING ((select auth.uid()) = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- 18. Create public access policies for waitlist
CREATE POLICY "Public can view waitlist" ON public.waitlist
    FOR SELECT TO public USING (true);

CREATE POLICY "Public can insert waitlist" ON public.waitlist
    FOR INSERT TO public WITH CHECK (true);

-- 19. Create cache policies (admin only for now)
CREATE POLICY "Authenticated users can view cache" ON public.cache
    FOR SELECT TO authenticated USING (true);

-- 20. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_game_id ON public.conversations(game_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(cache_key);

-- 21. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables that have updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON public.waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cache_updated_at ON public.cache;
CREATE TRIGGER update_cache_updated_at
    BEFORE UPDATE ON public.cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_level_updated_at ON public.app_level;
CREATE TRIGGER update_app_level_updated_at
    BEFORE UPDATE ON public.app_level
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_updated_at ON public.admin;
CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON public.admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 22. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Correct database schema created successfully!' as message;
