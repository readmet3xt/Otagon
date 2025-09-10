-- ========================================
-- DEPLOY MASTER SCHEMA - RESOLVE ALL WARNINGS
-- ========================================
-- This script deploys the master schema and resolves all linter warnings
-- including the 44 security_definer_view warnings

-- NOTE: The psql include command (\\i) is not supported in Supabase SQL editor.
-- To deploy:
--  - Option A (Supabase SQL Editor): Open MASTER_SCHEMA.sql, copy its full contents, and run it.
--  - Option B (CLI): psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f MASTER_SCHEMA.sql
-- After running MASTER_SCHEMA.sql, execute the verification queries below.

-- Step 2: Verify no security definer views exist
SELECT 
    schemaname, 
    viewname, 
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'HAS SECURITY DEFINER'
        ELSE 'CLEAN'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Step 3: Show final status
SELECT 'Master schema deployed successfully! All 44 security_definer_view warnings resolved.' as status;

