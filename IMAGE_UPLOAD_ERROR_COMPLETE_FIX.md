# Image Upload Error Complete Fix

## Problem Summary
When uploading images for AI responses, you're getting "An error occurred. Please try again." due to multiple critical issues.

## Issues Identified

### 1. 406 Error (Conversations Table)
```
GET https://qajcxgkqloumogioomiz.supabase.co/rest/v1/conversations?select=*&id=eq.everything-else&user_id=eq.4cf8a5dd-6e50-4a36-ae0d-67eb7252db04&deleted_at=is.null 406 (Not Acceptable)
```
**Cause**: Composite primary key `(id, user_id)` conflicts with `.single()` method
**Fix**: Apply `COMPREHENSIVE_IMAGE_UPLOAD_FIX.sql`

### 2. 404 Errors (Missing Database Functions)
```
POST https://qajcxgkqloumogioomiz.supabase.co/rest/v1/rpc/update_user_usage 404 (Not Found)
POST https://qajcxgkqloumogioomiz.supabase.co/rest/v1/rpc/get_knowledge_match_score 404 (Not Found)
```
**Cause**: Database functions don't exist or have wrong signatures
**Fix**: Apply `COMPREHENSIVE_IMAGE_UPLOAD_FIX.sql`

### 3. Missing Table
```
Could not find the table 'public.diary_tasks' in the schema cache
```
**Cause**: `diary_tasks` table doesn't exist
**Fix**: Apply `COMPREHENSIVE_IMAGE_UPLOAD_FIX.sql`

### 4. Invalid API Key
```
API key not valid. Please pass a valid API key.
```
**Cause**: `VITE_GEMINI_API_KEY` not configured
**Fix**: Follow `API_KEY_CONFIGURATION_FIX.md`

## Complete Solution

### Step 1: Fix Database Issues
Run the comprehensive database fix:
```sql
-- Execute COMPREHENSIVE_IMAGE_UPLOAD_FIX.sql in your Supabase database
```

This will fix:
- ✅ Conversations table 406 error
- ✅ Missing `update_user_usage` function
- ✅ Missing `get_knowledge_match_score` function
- ✅ Missing `diary_tasks` table
- ✅ RLS policies optimization
- ✅ Performance indexes

### Step 2: Configure API Key
Create `.env.local` file in your project root:
```bash
# .env.local
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
VITE_SUPABASE_URL=https://qajcxgkqloumogioomiz.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key-here
```

Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Step 3: Restart Development Server
```bash
npm run dev
```

## Files Created

1. **`COMPREHENSIVE_IMAGE_UPLOAD_FIX.sql`** - Database fixes
2. **`API_KEY_CONFIGURATION_FIX.md`** - API key setup guide
3. **`IMAGE_UPLOAD_ERROR_COMPLETE_FIX.md`** - This summary

## Expected Results

After applying both fixes:
- ✅ No more 406 errors
- ✅ No more 404 errors
- ✅ Image uploads work properly
- ✅ AI responses generate successfully
- ✅ All database functions work
- ✅ Proper error handling

## Verification Steps

1. **Check Database**: Run the SQL fix and verify no errors
2. **Check API Key**: Look for "✅ Set" in console debug logs
3. **Test Image Upload**: Try uploading an image and sending a message
4. **Monitor Logs**: Check browser console for any remaining errors

## Troubleshooting

### If API Key Still Not Working:
1. Verify `.env.local` is in project root
2. Check no spaces around `=` in environment file
3. Restart development server completely
4. Check console for debug logs

### If Database Errors Persist:
1. Verify SQL script ran without errors
2. Check Supabase logs for any issues
3. Verify RLS policies are correct
4. Test functions manually in Supabase SQL editor

### If Image Upload Still Fails:
1. Check network tab for specific error codes
2. Verify all database functions exist
3. Check RLS policies allow your user
4. Monitor console for detailed error messages

## Next Steps

1. **Apply the database fix** (COMPREHENSIVE_IMAGE_UPLOAD_FIX.sql)
2. **Configure the API key** (follow API_KEY_CONFIGURATION_FIX.md)
3. **Test image upload functionality**
4. **Monitor for any remaining issues**

This comprehensive fix should resolve all the issues causing your image upload failures.
