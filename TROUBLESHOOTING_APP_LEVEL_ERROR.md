# 🛠️ Troubleshooting: App Level Constraint Error

## Error Description
```
ERROR: 23514: new row for relation "app_level" violates check constraint "app_level_value_check"
DETAIL: Failing row contains (8d0659c4-a49d-42b5-a65e-c901a86e777b, app_version, "1.0.0", Current app version, 2025-09-13 10:32:50.999363+00, 2025-09-13 10:32:50.999363+00, null, null).
```

## Root Cause
The error occurred because the `app_level` table had a check constraint that required the `value` field to be a JSONB object, but the INSERT statement was trying to insert string values like `"1.0.0"` and `"false"`.

## Solution Applied

### 1. Removed Problematic Constraint
```sql
-- Removed this constraint from the table definition:
value JSONB NOT NULL CHECK (jsonb_typeof(value) = 'object')
-- Changed to:
value JSONB NOT NULL
```

### 2. Updated INSERT Statement
```sql
-- Changed from simple INSERT to error-handled INSERT with ON CONFLICT
INSERT INTO public.app_level (key, value, description) 
VALUES ('app_version', '"1.0.0"', 'Current app version')
ON CONFLICT (key) DO NOTHING;
```

## Files Updated

### 1. `SECURE_DATABASE_SCHEMA.sql`
- ✅ Removed the `jsonb_typeof(value) = 'object'` constraint
- ✅ Updated INSERT statements to use `ON CONFLICT DO NOTHING`
- ✅ Added error handling with `DO $$ BEGIN ... EXCEPTION ... END $$;`

### 2. `FIX_APP_LEVEL_CONSTRAINT.sql` (New)
- ✅ Standalone fix script for this specific error
- ✅ Can be run independently to fix the issue

## How to Apply the Fix

### Option 1: Run the Fix Script
```bash
psql your_database < FIX_APP_LEVEL_CONSTRAINT.sql
```

### Option 2: Run the Updated Schema
```bash
psql your_database < SECURE_DATABASE_SCHEMA.sql
```

### Option 3: Manual Fix
```sql
-- Drop the problematic constraint
ALTER TABLE public.app_level DROP CONSTRAINT IF EXISTS app_level_value_check;

-- Insert the data with conflict handling
INSERT INTO public.app_level (key, value, description) 
VALUES ('app_version', '"1.0.0"', 'Current app version')
ON CONFLICT (key) DO NOTHING;
```

## Verification
After applying the fix, verify the data was inserted correctly:
```sql
SELECT key, value, description FROM public.app_level ORDER BY key;
```

Expected output:
```
     key      |                    value                     |           description            
--------------+----------------------------------------------+----------------------------------
 ai_models    | {"default": "gemini-2.5-flash", "insights": "gemini-2.5-pro"} | AI model configuration
 app_version  | "1.0.0"                                     | Current app version
 feature_flags| {}                                           | Feature flags configuration
 maintenance_mode | false                                   | Maintenance mode flag
 tier_limits  | {"free": {"text": 55, "image": 25}, "pro": {"text": 1583, "image": 328}, "vanguard_pro": {"text": 1583, "image": 328}} | Tier usage limits
```

## Why This Happened
1. **Constraint Too Restrictive**: The original constraint `jsonb_typeof(value) = 'object'` was too restrictive
2. **Mixed Data Types**: The app_level table needs to store both simple values (strings, booleans) and complex objects
3. **JSONB Flexibility**: JSONB can store any valid JSON value (string, number, boolean, object, array)

## Prevention
- ✅ Use appropriate constraints that match the actual data requirements
- ✅ Test INSERT statements before deploying
- ✅ Use `ON CONFLICT` clauses for idempotent scripts
- ✅ Add error handling to catch and log issues

## Status
✅ **RESOLVED** - The constraint error has been fixed and the schema is now production-ready.
